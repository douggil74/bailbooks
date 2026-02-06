import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const orgId = req.nextUrl.searchParams.get('org_id');
  if (!orgId) {
    return NextResponse.json({ error: 'org_id is required' }, { status: 400 });
  }

  try {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('org_id', orgId)
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('account_name');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ accounts: data || [] });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch bank accounts';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { org_id, account_name, account_type, bank_name, routing_number, account_number_last4, current_balance, is_default, opened_date, notes } = body;

    if (!org_id || !account_name || !account_type || !bank_name) {
      return NextResponse.json({ error: 'org_id, account_name, account_type, and bank_name are required' }, { status: 400 });
    }

    const supabase = createServerClient();

    // If setting as default, unset other defaults
    if (is_default) {
      await supabase
        .from('bank_accounts')
        .update({ is_default: false })
        .eq('org_id', org_id);
    }

    const { data, error } = await supabase
      .from('bank_accounts')
      .insert({
        org_id,
        account_name,
        account_type,
        bank_name,
        routing_number: routing_number || null,
        account_number_last4: account_number_last4 || null,
        current_balance: current_balance || 0,
        is_default: is_default || false,
        opened_date: opened_date || null,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ account: data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create bank account';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
