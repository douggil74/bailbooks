import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import type { SubmitRequest } from '@/lib/bail-types';

export async function POST(req: NextRequest) {
  try {
    const body: SubmitRequest = await req.json();

    if (!body.application_id) {
      return NextResponse.json({ error: 'application_id is required' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Verify application exists and is still a draft
    const { data: app } = await supabase
      .from('applications')
      .select('id, status')
      .eq('id', body.application_id)
      .single();

    if (!app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (app.status !== 'draft') {
      return NextResponse.json(
        { error: 'Application has already been submitted' },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from('applications')
      .update({
        status: 'submitted',
        sms_consent: body.sms_consent,
        gps_consent: body.gps_consent,
        checkin_frequency: body.checkin_frequency || 'weekly',
        updated_at: new Date().toISOString(),
      })
      .eq('id', body.application_id)
      .select('id, status, updated_at')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
