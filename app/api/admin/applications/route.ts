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

function computeIndemnitorStatus(hasIndemnitorSig: boolean): ActivityStatus {
  return hasIndemnitorSig ? 'complete' : 'pending';
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

    // Batch-query documents and signatures for status computation
    const [docsResult, sigsResult] = await Promise.all([
      supabase
        .from('documents')
        .select('application_id')
        .in('application_id', appIds),
      supabase
        .from('signatures')
        .select('application_id, signer_role')
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

    const enriched = apps.map((app) => ({
      ...app,
      defendant_status: computeDefendantStatus(
        app,
        docSet.has(app.id),
        defSigSet.has(app.id)
      ),
      indemnitor_status: computeIndemnitorStatus(indSigSet.has(app.id)),
    }));

    return NextResponse.json({ applications: enriched });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}
