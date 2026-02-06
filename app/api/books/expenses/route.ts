import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const orgId = req.nextUrl.searchParams.get('org_id');
  if (!orgId) {
    return NextResponse.json({ error: 'org_id is required' }, { status: 400 });
  }

  const categoryId = req.nextUrl.searchParams.get('category_id') || '';
  const startDate = req.nextUrl.searchParams.get('start_date') || '';
  const endDate = req.nextUrl.searchParams.get('end_date') || '';
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') || '1'));
  const perPage = Math.min(100, Math.max(1, parseInt(req.nextUrl.searchParams.get('per_page') || '25')));

  try {
    const supabase = createServerClient();

    let query = supabase
      .from('expenses')
      .select('*, expense_categories(name)', { count: 'exact' })
      .eq('org_id', orgId);

    if (categoryId) query = query.eq('category_id', categoryId);
    if (startDate) query = query.gte('expense_date', startDate);
    if (endDate) query = query.lte('expense_date', endDate);

    query = query.order('expense_date', { ascending: false });

    const from = (page - 1) * perPage;
    query = query.range(from, from + perPage - 1);

    const { data: expenses, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Resolve defendant names for linked expenses
    const appIds = [...new Set((expenses || []).filter((e) => e.application_id).map((e) => e.application_id!))];
    const appMap = new Map<string, string>();
    if (appIds.length > 0) {
      const { data: apps } = await supabase
        .from('applications')
        .select('id, defendant_first, defendant_last')
        .in('id', appIds);
      for (const a of apps || []) {
        appMap.set(a.id, `${a.defendant_first} ${a.defendant_last}`);
      }
    }

    const result = (expenses || []).map((e) => ({
      ...e,
      category_name: (e.expense_categories as { name: string } | null)?.name || null,
      defendant_name: e.application_id ? appMap.get(e.application_id) || null : null,
      expense_categories: undefined,
    }));

    return NextResponse.json({
      data: result,
      total: count || 0,
      page,
      per_page: perPage,
      total_pages: Math.ceil((count || 0) / perPage),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch expenses';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { org_id, category_id, application_id, description, amount, expense_date, vendor, payment_method, reference_number, notes } = body;

    if (!org_id || !description || !amount) {
      return NextResponse.json({ error: 'org_id, description, and amount are required' }, { status: 400 });
    }

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('expenses')
      .insert({
        org_id,
        category_id: category_id || null,
        application_id: application_id || null,
        description,
        amount,
        expense_date: expense_date || new Date().toISOString().split('T')[0],
        vendor: vendor || null,
        payment_method: payment_method || null,
        reference_number: reference_number || null,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ expense: data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create expense';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
