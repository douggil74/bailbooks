import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const orgId = req.nextUrl.searchParams.get('org_id');
  if (!orgId) {
    return NextResponse.json({ error: 'org_id is required' }, { status: 400 });
  }

  const bankAccountId = req.nextUrl.searchParams.get('bank_account_id') || '';
  const startDate = req.nextUrl.searchParams.get('start_date') || '';
  const endDate = req.nextUrl.searchParams.get('end_date') || '';
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') || '1'));
  const perPage = Math.min(100, Math.max(1, parseInt(req.nextUrl.searchParams.get('per_page') || '25')));

  try {
    const supabase = createServerClient();

    const orgFilter = `org_id.eq.${orgId},org_id.is.null`;

    let query = supabase
      .from('transactions')
      .select('*, bank_accounts(account_name), chart_of_accounts(account_name)', { count: 'exact' })
      .or(orgFilter);

    if (bankAccountId) query = query.eq('bank_account_id', bankAccountId);
    if (startDate) query = query.gte('transaction_date', startDate);
    if (endDate) query = query.lte('transaction_date', endDate);

    query = query.order('transaction_date', { ascending: false }).order('created_at', { ascending: false });

    const from = (page - 1) * perPage;
    query = query.range(from, from + perPage - 1);

    const { data: transactions, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Compute running balance: fetch all transactions sorted oldest-first
    let balQuery = supabase
      .from('transactions')
      .select('id, amount, transaction_type')
      .or(orgFilter);
    if (bankAccountId) balQuery = balQuery.eq('bank_account_id', bankAccountId);
    balQuery = balQuery.order('transaction_date', { ascending: true }).order('created_at', { ascending: true });

    const { data: allForBalance } = await balQuery;
    const balanceMap = new Map<string, number>();
    let runningBal = 0;
    for (const t of allForBalance || []) {
      const amt = Number(t.amount) || 0;
      // Deposits add, withdrawals/transfers subtract, adjustments can be either
      const signed = (t.transaction_type === 'withdrawal' || t.transaction_type === 'transfer')
        ? -amt : amt;
      runningBal += signed;
      balanceMap.set(t.id, runningBal);
    }

    const result = (transactions || []).map((t) => ({
      ...t,
      bank_account_name: (t.bank_accounts as unknown as { account_name: string } | null)?.account_name || null,
      chart_account_name: (t.chart_of_accounts as unknown as { account_name: string } | null)?.account_name || null,
      balance: balanceMap.get(t.id) ?? null,
      bank_accounts: undefined,
      chart_of_accounts: undefined,
    }));

    return NextResponse.json({
      data: result,
      total: count || 0,
      page,
      per_page: perPage,
      total_pages: Math.ceil((count || 0) / perPage),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch transactions';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { org_id, bank_account_id, chart_account_id, transaction_type, amount, description, payee, reference_number, transaction_date, notes } = body;

    if (!org_id || !transaction_type || !amount || !description) {
      return NextResponse.json({ error: 'org_id, transaction_type, amount, and description are required' }, { status: 400 });
    }

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        org_id,
        bank_account_id: bank_account_id || null,
        chart_account_id: chart_account_id || null,
        transaction_type,
        amount,
        description,
        payee: payee || null,
        reference_number: reference_number || null,
        transaction_date: transaction_date || new Date().toISOString().split('T')[0],
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update bank account balance
    if (bank_account_id) {
      const balanceChange = (transaction_type === 'deposit' || transaction_type === 'adjustment')
        ? amount : -amount;
      try {
        await supabase.rpc('increment_balance', { account_id: bank_account_id, delta: balanceChange });
      } catch {
        // Fallback: manual balance update
        const { data: acct } = await supabase
          .from('bank_accounts')
          .select('current_balance')
          .eq('id', bank_account_id)
          .single();
        if (acct) {
          await supabase
            .from('bank_accounts')
            .update({ current_balance: (Number(acct.current_balance) || 0) + balanceChange })
            .eq('id', bank_account_id);
        }
      }
    }

    return NextResponse.json({ transaction: data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create transaction';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
