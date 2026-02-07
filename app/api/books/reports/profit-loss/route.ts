import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const orgId = req.nextUrl.searchParams.get('org_id');
  if (!orgId) {
    return NextResponse.json({ error: 'org_id is required' }, { status: 400 });
  }

  const now = new Date();
  const startDate = req.nextUrl.searchParams.get('start_date') || `${now.getFullYear()}-01-01`;
  const endDate = req.nextUrl.searchParams.get('end_date') || now.toISOString().split('T')[0];

  try {
    const supabase = createServerClient();
    const orgFilter = `org_id.eq.${orgId},org_id.is.null`;

    // Premiums earned: from bonds created in the period (informational — accrual basis)
    const { data: bonds } = await supabase
      .from('applications')
      .select('premium')
      .or(orgFilter)
      .in('status', ['active', 'approved', 'completed'])
      .gte('created_at', startDate)
      .lte('created_at', endDate + 'T23:59:59');

    const premiumsEarned = (bonds || []).reduce((sum, b) => sum + (Number(b.premium) || 0), 0);

    // Payments collected (from payments table — for reference)
    const { data: payments } = await supabase
      .from('payments')
      .select('amount, paid_at')
      .or(orgFilter)
      .eq('status', 'paid')
      .gte('paid_at', startDate)
      .lte('paid_at', endDate + 'T23:59:59');

    const paymentsCollected = (payments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    // Bank deposits (from transactions table — cash basis revenue)
    const { data: deposits } = await supabase
      .from('transactions')
      .select('amount')
      .or(orgFilter)
      .eq('transaction_type', 'deposit')
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate);

    const depositsTotal = (deposits || []).reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

    // Withdrawals from transactions (cash out)
    const { data: withdrawals } = await supabase
      .from('transactions')
      .select('amount')
      .or(orgFilter)
      .eq('transaction_type', 'withdrawal')
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate);

    const withdrawalsTotal = (withdrawals || []).reduce((sum, w) => sum + (Number(w.amount) || 0), 0);

    // Expenses by category
    const { data: expenses } = await supabase
      .from('expenses')
      .select('amount, category_id, expense_categories(name)')
      .or(orgFilter)
      .gte('expense_date', startDate)
      .lte('expense_date', endDate);

    const categoryTotals = new Map<string, number>();
    let totalExpenses = 0;
    for (const e of expenses || []) {
      const cats = e.expense_categories as unknown as { name: string } | { name: string }[] | null;
      const catName = (Array.isArray(cats) ? cats[0]?.name : cats?.name) || 'Uncategorized';
      const amt = Number(e.amount) || 0;
      categoryTotals.set(catName, (categoryTotals.get(catName) || 0) + amt);
      totalExpenses += amt;
    }

    if (withdrawalsTotal > 0) {
      categoryTotals.set('Withdrawals', (categoryTotals.get('Withdrawals') || 0) + withdrawalsTotal);
      totalExpenses += withdrawalsTotal;
    }

    const expensesByCategory = Array.from(categoryTotals.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);

    // Revenue = whichever is greater: deposits or payments collected
    // This prevents double-counting while ensuring all revenue is captured
    const totalRevenue = Math.max(depositsTotal, paymentsCollected);

    return NextResponse.json({
      period_start: startDate,
      period_end: endDate,
      revenue: {
        premiums_earned: premiumsEarned,
        payments_collected: paymentsCollected,
        deposits: depositsTotal,
        total_revenue: totalRevenue,
      },
      expenses_by_category: expensesByCategory,
      total_expenses: totalExpenses,
      net_income: totalRevenue - totalExpenses,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to generate P&L report';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
