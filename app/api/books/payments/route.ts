import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const orgId = req.nextUrl.searchParams.get('org_id');
  if (!orgId) {
    return NextResponse.json({ error: 'org_id is required' }, { status: 400 });
  }

  const statusFilter = req.nextUrl.searchParams.get('status') || '';
  const search = req.nextUrl.searchParams.get('search') || '';
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') || '1'));
  const perPage = Math.min(100, Math.max(1, parseInt(req.nextUrl.searchParams.get('per_page') || '25')));

  try {
    const supabase = createServerClient();

    let query = supabase
      .from('payments')
      .select('id, application_id, amount, type, status, payment_method, description, due_date, paid_at, created_at', { count: 'exact' })
      .eq('org_id', orgId);

    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }

    query = query.order('due_date', { ascending: false, nullsFirst: false });

    const from = (page - 1) * perPage;
    query = query.range(from, from + perPage - 1);

    const { data: payments, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get defendant names
    const appIds = [...new Set((payments || []).map((p) => p.application_id))];
    let appMap = new Map<string, string>();

    if (appIds.length > 0) {
      const { data: apps } = await supabase
        .from('applications')
        .select('id, defendant_first, defendant_last')
        .in('id', appIds);

      for (const a of apps || []) {
        appMap.set(a.id, `${a.defendant_first} ${a.defendant_last}`);
      }
    }

    // If search is provided, filter by defendant name in-memory
    let result = (payments || []).map((p) => ({
      ...p,
      defendant_name: appMap.get(p.application_id) || 'Unknown',
      days_overdue:
        p.status === 'pending' && p.due_date
          ? Math.max(0, Math.floor((Date.now() - new Date(p.due_date).getTime()) / (1000 * 60 * 60 * 24)))
          : 0,
    }));

    if (search) {
      const lower = search.toLowerCase();
      result = result.filter((p) => p.defendant_name.toLowerCase().includes(lower));
    }

    return NextResponse.json({
      data: result,
      total: search ? result.length : (count || 0),
      page,
      per_page: perPage,
      total_pages: Math.ceil((search ? result.length : (count || 0)) / perPage),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch payments';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
