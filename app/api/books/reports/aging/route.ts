import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const orgId = req.nextUrl.searchParams.get('org_id');
  if (!orgId) {
    return NextResponse.json({ error: 'org_id is required' }, { status: 400 });
  }

  try {
    const supabase = createServerClient();
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Get all pending payments with due dates in the past
    const { data: overduePayments } = await supabase
      .from('payments')
      .select('id, application_id, amount, due_date')
      .eq('org_id', orgId)
      .eq('status', 'pending')
      .not('due_date', 'is', null)
      .lt('due_date', todayStr);

    if (!overduePayments || overduePayments.length === 0) {
      return NextResponse.json({
        as_of: todayStr,
        total_outstanding: 0,
        buckets: [
          { label: '1-30 days', min_days: 1, max_days: 30, count: 0, total: 0, payments: [] },
          { label: '31-60 days', min_days: 31, max_days: 60, count: 0, total: 0, payments: [] },
          { label: '61-90 days', min_days: 61, max_days: 90, count: 0, total: 0, payments: [] },
          { label: '90+ days', min_days: 91, max_days: null, count: 0, total: 0, payments: [] },
        ],
      });
    }

    // Get defendant names
    const appIds = [...new Set(overduePayments.map((p) => p.application_id))];
    const { data: apps } = await supabase
      .from('applications')
      .select('id, defendant_first, defendant_last')
      .in('id', appIds);

    const appMap = new Map<string, string>();
    for (const a of apps || []) {
      appMap.set(a.id, `${a.defendant_first} ${a.defendant_last}`);
    }

    // Build aging buckets
    const bucketDefs = [
      { label: '1-30 days', min_days: 1, max_days: 30 },
      { label: '31-60 days', min_days: 31, max_days: 60 },
      { label: '61-90 days', min_days: 61, max_days: 90 },
      { label: '90+ days', min_days: 91, max_days: null as number | null },
    ];

    let totalOutstanding = 0;
    const buckets = bucketDefs.map((def) => {
      const matching = overduePayments
        .map((p) => {
          const dueDate = new Date(p.due_date!);
          const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
          return { ...p, days_overdue: daysOverdue };
        })
        .filter((p) => {
          if (def.max_days === null) return p.days_overdue >= def.min_days;
          return p.days_overdue >= def.min_days && p.days_overdue <= def.max_days;
        });

      const bucketTotal = matching.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      totalOutstanding += bucketTotal;

      return {
        label: def.label,
        min_days: def.min_days,
        max_days: def.max_days,
        count: matching.length,
        total: bucketTotal,
        payments: matching.map((p) => ({
          id: p.id,
          application_id: p.application_id,
          defendant_name: appMap.get(p.application_id) || 'Unknown',
          amount: Number(p.amount),
          due_date: p.due_date!,
          days_overdue: p.days_overdue,
        })),
      };
    });

    return NextResponse.json({
      as_of: todayStr,
      total_outstanding: totalOutstanding,
      buckets,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to generate aging report';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
