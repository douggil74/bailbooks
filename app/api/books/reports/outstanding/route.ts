import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const orgId = req.nextUrl.searchParams.get('org_id');
  if (!orgId) {
    return NextResponse.json({ error: 'org_id is required' }, { status: 400 });
  }

  try {
    const supabase = createServerClient();

    // Get active/approved bonds
    const { data: bonds } = await supabase
      .from('applications')
      .select('id, defendant_first, defendant_last, bond_amount, premium, status, bond_date, forfeiture_status')
      .or(`org_id.eq.${orgId},org_id.is.null`)
      .in('status', ['active', 'approved']);

    if (!bonds || bonds.length === 0) {
      return NextResponse.json({
        as_of: new Date().toISOString().split('T')[0],
        total_liability: 0,
        total_premium_receivable: 0,
        bonds: [],
      });
    }

    // Get payment totals per application
    const appIds = bonds.map((b) => b.id);
    const { data: payments } = await supabase
      .from('payments')
      .select('application_id, amount, status')
      .in('application_id', appIds)
      .eq('status', 'paid');

    const paidMap = new Map<string, number>();
    for (const p of payments || []) {
      paidMap.set(p.application_id, (paidMap.get(p.application_id) || 0) + (Number(p.amount) || 0));
    }

    let totalLiability = 0;
    let totalPremiumReceivable = 0;

    const bondList = bonds.map((b) => {
      const premium = Number(b.premium) || 0;
      const bondAmount = Number(b.bond_amount) || 0;
      const collected = paidMap.get(b.id) || 0;
      const remaining = Math.max(0, premium - collected);
      totalLiability += bondAmount;
      totalPremiumReceivable += remaining;

      return {
        id: b.id,
        defendant_name: `${b.defendant_first} ${b.defendant_last}`,
        bond_amount: bondAmount,
        premium,
        collected,
        remaining,
        status: b.status,
        bond_date: b.bond_date,
        forfeiture_status: b.forfeiture_status,
      };
    });

    return NextResponse.json({
      as_of: new Date().toISOString().split('T')[0],
      total_liability: totalLiability,
      total_premium_receivable: totalPremiumReceivable,
      bonds: bondList,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to generate outstanding bond report';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
