import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const orgId = req.nextUrl.searchParams.get('org_id');
  if (!orgId) {
    return NextResponse.json({ error: 'org_id is required' }, { status: 400 });
  }

  const search = req.nextUrl.searchParams.get('search') || '';
  const statusFilter = req.nextUrl.searchParams.get('status') || '';
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') || '1'));
  const perPage = Math.min(100, Math.max(1, parseInt(req.nextUrl.searchParams.get('per_page') || '25')));
  const sortBy = req.nextUrl.searchParams.get('sort_by') || 'bond_date';
  const sortDir = req.nextUrl.searchParams.get('sort_dir') === 'asc' ? 'asc' : 'desc';

  try {
    const supabase = createServerClient();

    // Fetch applications with bond info
    let query = supabase
      .from('applications')
      .select('id, defendant_first, defendant_last, bond_amount, premium, down_payment, status, bond_date, court_date, next_payment_date, power_number, forfeiture_status, created_at', { count: 'exact' })
      .eq('org_id', orgId)
      .in('status', ['active', 'approved', 'completed']);

    if (search) {
      query = query.or(`defendant_first.ilike.%${search}%,defendant_last.ilike.%${search}%,power_number.ilike.%${search}%,case_number.ilike.%${search}%`);
    }

    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }

    // Apply sort
    const sortColumn = ['bond_amount', 'premium', 'bond_date', 'court_date', 'created_at', 'status'].includes(sortBy)
      ? sortBy
      : 'created_at';
    query = query.order(sortColumn, { ascending: sortDir === 'asc' });

    // Pagination
    const from = (page - 1) * perPage;
    query = query.range(from, from + perPage - 1);

    const { data: applications, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch payment totals for each application
    const appIds = (applications || []).map((a) => a.id);
    let paymentMap = new Map<string, { total_paid: number; payment_count: number; overdue_count: number }>();

    if (appIds.length > 0) {
      const { data: payments } = await supabase
        .from('payments')
        .select('application_id, amount, status, due_date')
        .in('application_id', appIds);

      const todayStr = new Date().toISOString().split('T')[0];
      type PaymentRow = { application_id: string; amount: number; status: string; due_date: string | null };
      const grouped = new Map<string, PaymentRow[]>();
      for (const p of (payments || []) as PaymentRow[]) {
        const arr = grouped.get(p.application_id) || [];
        arr.push(p);
        grouped.set(p.application_id, arr);
      }

      for (const [appId, pList] of grouped) {
        const totalPaid = pList
          .filter((p) => p.status === 'paid')
          .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        const paymentCount = pList.filter((p) => p.status === 'paid').length;
        const overdueCount = pList.filter(
          (p) => p.status === 'pending' && p.due_date && p.due_date < todayStr
        ).length;
        paymentMap.set(appId, { total_paid: totalPaid, payment_count: paymentCount, overdue_count: overdueCount });
      }
    }

    const ledger = (applications || []).map((app) => {
      const premium = Number(app.premium) || 0;
      const payInfo = paymentMap.get(app.id) || { total_paid: 0, payment_count: 0, overdue_count: 0 };
      return {
        id: app.id,
        defendant_name: `${app.defendant_first} ${app.defendant_last}`,
        bond_amount: Number(app.bond_amount) || 0,
        premium,
        down_payment: Number(app.down_payment) || 0,
        total_paid: payInfo.total_paid,
        balance_due: Math.max(0, premium - payInfo.total_paid),
        status: app.status,
        bond_date: app.bond_date,
        court_date: app.court_date,
        next_payment_date: app.next_payment_date,
        power_number: app.power_number,
        forfeiture_status: app.forfeiture_status,
        payment_count: payInfo.payment_count,
        overdue_count: payInfo.overdue_count,
      };
    });

    return NextResponse.json({
      data: ledger,
      total: count || 0,
      page,
      per_page: perPage,
      total_pages: Math.ceil((count || 0) / perPage),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch ledger';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
