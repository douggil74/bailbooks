import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import type { ActivityStatus } from '@/lib/bail-types';

interface AppRow {
  id: string;
  status: string;
  defendant_first: string;
  defendant_last: string;
  defendant_phone: string | null;
  defendant_email: string | null;
  defendant_dob: string | null;
  defendant_address: string | null;
  defendant_dl_number: string | null;
  bond_amount: number | null;
  charge_description: string | null;
  court_date: string | null;
  court_name: string | null;
  county: string | null;
  bond_date: string | null;
  premium: number | null;
  down_payment: number | null;
  stripe_payment_method_id: string | null;
  created_at: string;
  updated_at: string | null;
  checkin_frequency: string | null;
}

function computeDefendantStatus(
  app: AppRow,
  hasDocuments: boolean,
  hasDefendantSig: boolean
): ActivityStatus {
  const hasContact = !!(app.defendant_phone && app.defendant_email);
  const hasPersonal = !!(app.defendant_dob && app.defendant_dl_number);
  const hasAddress = !!app.defendant_address;
  const hasCard = !!app.stripe_payment_method_id;

  if (hasContact && hasPersonal && hasAddress && hasDocuments && hasDefendantSig && hasCard) {
    return 'complete';
  }
  if (app.status === 'submitted') {
    return 'request_sent';
  }
  if (hasContact || hasPersonal || hasAddress) {
    return 'information';
  }
  return 'pending';
}

function computeIndemnitorStatus(
  indemnitorStatuses: string[],
  hasIndemnitorSig: boolean,
): ActivityStatus {
  if (indemnitorStatuses.length === 0) {
    return hasIndemnitorSig ? 'complete' : 'pending';
  }
  if (indemnitorStatuses.every(s => s === 'complete')) return 'complete';
  if (indemnitorStatuses.some(s => s === 'in_progress' || s === 'complete')) return 'information';
  return 'pending';
}

export async function GET() {
  try {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('applications')
      .select(
        'id, status, defendant_first, defendant_last, defendant_phone, defendant_email, defendant_dob, defendant_address, defendant_dl_number, bond_amount, charge_description, court_date, court_name, county, bond_date, premium, down_payment, stripe_payment_method_id, created_at, updated_at, checkin_frequency'
      )
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const apps = (data || []) as AppRow[];
    const appIds = apps.map((a) => a.id);

    if (appIds.length === 0) {
      return NextResponse.json({ applications: [] });
    }

    // Batch-query documents, signatures, and indemnitors for status computation
    const [docsResult, sigsResult, indemnitorsResult] = await Promise.all([
      supabase
        .from('documents')
        .select('application_id')
        .in('application_id', appIds),
      supabase
        .from('signatures')
        .select('application_id, signer_role')
        .in('application_id', appIds),
      supabase
        .from('indemnitors')
        .select('application_id, status')
        .in('application_id', appIds),
    ]);

    const docSet = new Set((docsResult.data || []).map((d: { application_id: string }) => d.application_id));
    const defSigSet = new Set<string>();
    const indSigSet = new Set<string>();
    for (const sig of sigsResult.data || []) {
      const s = sig as { application_id: string; signer_role: string };
      if (s.signer_role === 'defendant') defSigSet.add(s.application_id);
      if (s.signer_role === 'indemnitor') indSigSet.add(s.application_id);
    }

    const indemnitorsByApp = new Map<string, string[]>();
    for (const ind of indemnitorsResult.data || []) {
      const i = ind as { application_id: string; status: string };
      const arr = indemnitorsByApp.get(i.application_id) || [];
      arr.push(i.status);
      indemnitorsByApp.set(i.application_id, arr);
    }

    // Fetch assigned powers for all applications
    const powersResult = await supabase
      .from('powers')
      .select('application_id, power_number')
      .eq('status', 'active')
      .in('application_id', appIds);

    const powerByApp = new Map<string, string>();
    for (const pw of powersResult.data || []) {
      const p = pw as { application_id: string; power_number: string };
      powerByApp.set(p.application_id, p.power_number);
    }

    const enriched = apps.map((app) => ({
      ...app,
      power_number: powerByApp.get(app.id) || null,
      defendant_status: computeDefendantStatus(
        app,
        docSet.has(app.id),
        defSigSet.has(app.id)
      ),
      indemnitor_status: computeIndemnitorStatus(
        indemnitorsByApp.get(app.id) || [],
        indSigSet.has(app.id),
      ),
    }));

    return NextResponse.json({ applications: enriched });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}
