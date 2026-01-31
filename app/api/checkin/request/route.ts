import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { sendCheckinRequest } from '@/lib/twilio-server';
import type { CheckinRequestBody } from '@/lib/bail-types';

export async function POST(req: NextRequest) {
  try {
    const body: CheckinRequestBody = await req.json();

    if (!body.application_id) {
      return NextResponse.json({ error: 'application_id is required' }, { status: 400 });
    }

    const supabase = createServerClient();

    const { data: app } = await supabase
      .from('applications')
      .select('id, defendant_phone, defendant_first, sms_consent, gps_consent')
      .eq('id', body.application_id)
      .single();

    if (!app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (!app.defendant_phone) {
      return NextResponse.json({ error: 'No phone number on file' }, { status: 400 });
    }

    if (!app.sms_consent) {
      return NextResponse.json({ error: 'SMS consent not given' }, { status: 403 });
    }

    const message = await sendCheckinRequest(body.application_id, app.defendant_phone);

    // Log the SMS
    await supabase.from('sms_log').insert({
      application_id: body.application_id,
      phone: app.defendant_phone,
      direction: 'outbound',
      message: `Check-in request sent to ${app.defendant_first || 'defendant'}`,
      twilio_sid: message.sid,
      status: message.status,
    });

    return NextResponse.json({ success: true, sid: message.sid });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to send check-in request';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
