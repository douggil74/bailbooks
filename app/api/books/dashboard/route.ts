import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const orgId = req.nextUrl.searchParams.get('org_id');
  if (!orgId) {
    return NextResponse.json({ error: 'org_id is required' }, { status: 400 });
  }

  try {
    const supabase = createServerClient();
    const orgFilter = `org_id.eq.${orgId},org_id.is.null`;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const yearStart = `${now.getFullYear()}-01-01`;

    // Active bonds (include completed for full picture)
    const { data: activeBonds } = await supabase
      .from('applications')
      .select('id, bond_amount, premium, down_payment, court_date, court_name, defendant_first, defendant_last, forfeiture_status, status')
      .or(orgFilter)
      .in('status', ['active', 'approved', 'completed']);

    const bonds = activeBonds || [];
    const totalActiveBonds = bonds.filter((b) => b.status !== 'completed').length;
    const totalBondLiability = bonds.filter((b) => b.status !== 'completed')
      .reduce((sum, b) => sum + (Number(b.bond_amount) || 0), 0);
    const totalPremiumEarned = bonds.reduce((sum, b) => sum + (Number(b.premium) || 0), 0);
    const forfeitures = bonds.filter((b) => b.forfeiture_status && b.forfeiture_status !== 'resolved').length;

    // All payments
    const { data: allPayments } = await supabase
      .from('payments')
      .select('id, amount, status, due_date, paid_at, payment_method, application_id')
      .or(orgFilter);

    const payments = allPayments || [];
    const paidPayments = payments.filter((p) => p.status === 'paid');
    const totalCollected = paidPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    // Outstanding = sum of per-bond remaining (not aggregate, to avoid overpayment offset)
    const appIds = bonds.map((b) => b.id);
    const paidByApp = new Map<string, number>();
    for (const p of paidPayments) {
      if (appIds.includes(p.application_id)) {
        paidByApp.set(p.application_id, (paidByApp.get(p.application_id) || 0) + (Number(p.amount) || 0));
      }
    }
    let totalOutstanding = 0;
    for (const b of bonds) {
      if (b.status === 'completed') continue;
      const premium = Number(b.premium) || 0;
      const paid = paidByApp.get(b.id) || 0;
      totalOutstanding += Math.max(0, premium - paid);
    }

    // Overdue payments
    const overduePayments = payments.filter(
      (p) => p.status === 'pending' && p.due_date && p.due_date < todayStr
    );

    // YTD deposits from transactions (cash basis, matches P&L approach)
    const { data: ytdDeposits } = await supabase
      .from('transactions')
      .select('amount')
      .or(orgFilter)
      .eq('transaction_type', 'deposit')
      .gte('transaction_date', yearStart)
      .lte('transaction_date', todayStr);

    const ytdDepositsTotal = (ytdDeposits || []).reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

    // YTD expenses
    const { data: expenses } = await supabase
      .from('expenses')
      .select('amount')
      .or(orgFilter)
      .gte('expense_date', yearStart);

    const totalExpenses = (expenses || []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    // YTD withdrawals from transactions
    const { data: ytdWithdrawals } = await supabase
      .from('transactions')
      .select('amount')
      .or(orgFilter)
      .eq('transaction_type', 'withdrawal')
      .gte('transaction_date', yearStart)
      .lte('transaction_date', todayStr);

    const ytdWithdrawalsTotal = (ytdWithdrawals || []).reduce((sum, w) => sum + (Number(w.amount) || 0), 0);

    // Net income matches P&L: revenue = max(deposits, payments), expenses = expenses + withdrawals
    const ytdRevenue = Math.max(ytdDepositsTotal, totalCollected);
    const netIncome = ytdRevenue - totalExpenses - ytdWithdrawalsTotal;

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

    // Cash flow (last 6 months) — use transactions for income, expenses for outgo
    const cashFlow = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = d.toLocaleDateString('en-US', { month: 'short' });
      const monthStart = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
      const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const monthEnd = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-01`;

      // Income from deposits in this month
      const { data: monthDeposits } = await supabase
        .from('transactions')
        .select('amount')
        .or(orgFilter)
        .eq('transaction_type', 'deposit')
        .gte('transaction_date', monthStart)
        .lt('transaction_date', monthEnd);

      const monthIncome = (monthDeposits || []).reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

      const { data: monthExpenses } = await supabase
        .from('expenses')
        .select('amount')
        .or(orgFilter)
        .gte('expense_date', monthStart)
        .lt('expense_date', monthEnd);

      const monthExpenseTotal = (monthExpenses || []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

      cashFlow.push({ month: monthStr, income: monthIncome, expenses: monthExpenseTotal });
    }

    // Recent paid payments (last 10)
    const recentPayments = paidPayments
      .sort((a, b) => (b.paid_at || '').localeCompare(a.paid_at || ''))
      .slice(0, 10);

    const recentAppIds = [...new Set(recentPayments.map((p) => p.application_id))];
    const { data: apps } = recentAppIds.length > 0
      ? await supabase
          .from('applications')
          .select('id, defendant_first, defendant_last')
          .in('id', recentAppIds)
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
