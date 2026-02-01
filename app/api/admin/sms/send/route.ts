import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { sendSMS } from '@/lib/twilio-server';

export async function POST(req: NextRequest) {
  try {
    const { application_id, phone, message, recipient_label } = await req.json();

    if (!application_id || !phone || !message) {
      return NextResponse.json(
        { error: 'application_id, phone, and message are required' },
        { status: 400 },
      );
    }

    const result = await sendSMS(phone, message);

    const supabase = createServerClient();
    const { error: insertErr } = await supabase.from('sms_log').insert({
      application_id,
      phone,
      direction: 'outbound',
      message,
      twilio_sid: result.sid,
      status: result.status,
      sent_at: new Date().toISOString(),
    });

    if (insertErr) {
      console.error('[SMS] sms_log insert failed:', insertErr);
    }

    if (result.status === 'skipped') {
      return NextResponse.json({
        error: 'SMS not configured — message logged but not delivered. Check SignalWire env vars.',
      }, { status: 503 });
    }

    return NextResponse.json({
      success: true,
      sid: result.sid,
      status: result.status,
      recipient_label: recipient_label || phone,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to send SMS';
    console.error('Admin SMS send error:', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
