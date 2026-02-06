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

    // Active bonds
    const { data: activeBonds } = await supabase
      .from('applications')
      .select('id, bond_amount, premium, down_payment, court_date, court_name, defendant_first, defendant_last, forfeiture_status')
      .eq('org_id', orgId)
      .in('status', ['active', 'approved']);

    const bonds = activeBonds || [];
    const totalActiveBonds = bonds.length;
    const totalBondLiability = bonds.reduce((sum, b) => sum + (Number(b.bond_amount) || 0), 0);
    const totalPremiumEarned = bonds.reduce((sum, b) => sum + (Number(b.premium) || 0), 0);
    const forfeitures = bonds.filter((b) => b.forfeiture_status).length;

    // All payments for this org
    const { data: allPayments } = await supabase
      .from('payments')
      .select('id, amount, status, due_date, paid_at, payment_method, application_id')
      .eq('org_id', orgId);

    const payments = allPayments || [];
    const paidPayments = payments.filter((p) => p.status === 'paid');
    const totalCollected = paidPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    // Outstanding = total premium - total collected
    const totalOutstanding = Math.max(0, totalPremiumEarned - totalCollected);

    // Overdue payments
    const overduePayments = payments.filter(
      (p) => p.status === 'pending' && p.due_date && p.due_date < todayStr
    );

    // Expenses for this org (current fiscal year — simplified to calendar year)
    const yearStart = `${now.getFullYear()}-01-01`;
    const { data: expenses } = await supabase
      .from('expenses')
      .select('amount')
      .eq('org_id', orgId)
      .gte('expense_date', yearStart);

    const totalExpenses = (expenses || []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const netIncome = totalCollected - totalExpenses;

    // Upcoming court dates (next 30 days)
    const thirtyDays = new Date(now);
    thirtyDays.setDate(thirtyDays.getDate() + 30);
    const upcomingCourts = bonds
      .filter((b) => b.court_date && b.court_date >= todayStr && b.court_date <= thirtyDays.toISOString().split('T')[0])
      .map((b) => ({
        application_id: b.id,
        defendant_name: `${b.defendant_first} ${b.defendant_last}`,
        court_name: b.court_name,
        court_date: b.court_date!,
        bond_amount: Number(b.bond_amount) || 0,
      }))
      .sort((a, b) => a.court_date.localeCompare(b.court_date));

    // Cash flow (last 6 months)
    const cashFlow = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = d.toLocaleDateString('en-US', { month: 'short' });
      const monthStart = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
      const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const monthEnd = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-01`;

      const monthIncome = paidPayments
        .filter((p) => p.paid_at && p.paid_at >= monthStart && p.paid_at < monthEnd)
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

      const { data: monthExpenses } = await supabase
        .from('expenses')
        .select('amount')
        .eq('org_id', orgId)
        .gte('expense_date', monthStart)
        .lt('expense_date', monthEnd);

      const monthExpenseTotal = (monthExpenses || []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

      cashFlow.push({ month: monthStr, income: monthIncome, expenses: monthExpenseTotal });
    }

    // Recent paid payments (last 10)
    const recentPayments = paidPayments
      .sort((a, b) => (b.paid_at || '').localeCompare(a.paid_at || ''))
      .slice(0, 10);

    // Resolve defendant names for recent payments
    const appIds = [...new Set(recentPayments.map((p) => p.application_id))];
    const { data: apps } = appIds.length > 0
      ? await supabase
          .from('applications')
          .select('id, defendant_first, defendant_last')
          .in('id', appIds)
      : { data: [] };
    const appMap = new Map((apps || []).map((a) => [a.id, `${a.defendant_first} ${a.defendant_last}`]));

    const recentList = recentPayments.map((p) => ({
      id: p.id,
      defendant_name: appMap.get(p.application_id) || 'Unknown',
      amount: Number(p.amount),
      paid_at: p.paid_at!,
      payment_method: p.payment_method,
    }));

    // Overdue list with defendant names
    const overdueAppIds = [...new Set(overduePayments.map((p) => p.application_id))];
    const { data: overdueApps } = overdueAppIds.length > 0
      ? await supabase
          .from('applications')
          .select('id, defendant_first, defendant_last')
          .in('id', overdueAppIds)
      : { data: [] };
    const overdueAppMap = new Map((overdueApps || []).map((a) => [a.id, `${a.defendant_first} ${a.defendant_last}`]));

    const overdueList = overduePayments.map((p) => {
      const dueDate = new Date(p.due_date!);
      const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      return {
        id: p.id,
        application_id: p.application_id,
        defendant_name: overdueAppMap.get(p.application_id) || 'Unknown',
        amount: Number(p.amount),
        due_date: p.due_date!,
        days_overdue: daysOverdue,
      };
    }).sort((a, b) => b.days_overdue - a.days_overdue);

    return NextResponse.json({
      total_active_bonds: totalActiveBonds,
      total_bond_liability: totalBondLiability,
      total_premium_earned: totalPremiumEarned,
      total_collected: totalCollected,
      total_outstanding: totalOutstanding,
      total_expenses: totalExpenses,
      net_income: netIncome,
      overdue_payments: overduePayments.length,
      upcoming_court_dates: upcomingCourts.length,
      forfeitures,
      cash_flow: cashFlow,
      recent_payments: recentList,
      overdue_list: overdueList,
      upcoming_courts: upcomingCourts,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch dashboard data';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
