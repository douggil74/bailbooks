import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const orgId = req.nextUrl.searchParams.get('org_id');
  if (!orgId) {
    return NextResponse.json({ error: 'org_id is required' }, { status: 400 });
  }

  const accountType = req.nextUrl.searchParams.get('account_type') || '';

  try {
    const supabase = createServerClient();

    let query = supabase
      .from('chart_of_accounts')
      .select('*')
      .eq('org_id', orgId)
      .eq('is_active', true);

    if (accountType) query = query.eq('account_type', accountType);

    query = query.order('account_number');

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ accounts: data || [] });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch chart of accounts';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { org_id, account_number, account_name, account_type, sub_type, description } = body;

    if (!org_id || !account_number || !account_name || !account_type) {
      return NextResponse.json({ error: 'org_id, account_number, account_name, and account_type are required' }, { status: 400 });
    }

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('chart_of_accounts')
      .insert({
        org_id,
        account_number,
        account_name,
        account_type,
        sub_type: sub_type || null,
        description: description || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ account: data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create account';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
