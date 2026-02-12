import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { sendDefendantLinkSMS } from '@/lib/twilio-server';

export async function POST(req: NextRequest) {
  try {
    const { application_id } = await req.json();

    if (!application_id) {
      return NextResponse.json({ error: 'application_id is required' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Fetch application
    const { data: app, error: fetchErr } = await supabase
      .from('applications')
      .select('id, defendant_first, defendant_last, defendant_phone')
      .eq('id', application_id)
      .single();

    if (fetchErr || !app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (!app.defendant_phone) {
      return NextResponse.json({ error: 'Defendant has no phone number' }, { status: 400 });
    }

    // Validate phone has at least 10 digits
    const phoneDigits = app.defendant_phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      return NextResponse.json({ error: `Invalid phone number: ${app.defendant_phone} (need 10 digits)` }, { status: 400 });
    }

    // Generate short token (8 alphanumeric chars) — same pattern as indemnitor invite
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    const token = Array.from(bytes, b => chars[b % chars.length]).join('');

    const { error: updateError } = await supabase
      .from('applications')
      .update({ onboard_token: token })
      .eq('id', application_id);

    if (updateError) {
      console.error('[DefendantLink] Token update error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin).trim();
    const url = `${baseUrl}/d/${token}`;
    const defendantName = app.defendant_first || 'there';

    // Send SMS
    let smsResult: { sid: string; status: string };
    try {
      smsResult = await sendDefendantLinkSMS(app.defendant_phone, defendantName, url);
    } catch (smsErr) {
      const smsMsg = smsErr instanceof Error ? smsErr.message : 'SMS send failed';
      console.error('[DefendantLink] SMS error:', smsMsg);
      return NextResponse.json(
        { error: `SMS failed: ${smsMsg}. Token was created — try resending.` },
        { status: 502 },
      );
    }

    // Log to sms_log
    const smsBody =
      `Hi ${defendantName}, please review your info, upload your ID, and sign here: ${url} — BailBonds Financed`;

    await supabase.from('sms_log').insert({
      application_id: app.id,
      phone: app.defendant_phone,
      direction: 'outbound',
      message: smsBody,
      twilio_sid: smsResult.sid,
      status: smsResult.status,
      sent_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, url, token });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to generate link';
    console.error('[DefendantLink] Unhandled error:', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
