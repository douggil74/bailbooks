import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { sendIndemnitorInviteSMS } from '@/lib/twilio-server';

export async function POST(req: NextRequest) {
  try {
    const { indemnitor_id } = await req.json();

    if (!indemnitor_id) {
      return NextResponse.json({ error: 'indemnitor_id is required' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Fetch indemnitor with application info
    const { data: indemnitor, error: fetchErr } = await supabase
      .from('indemnitors')
      .select('*, applications(defendant_first, defendant_last)')
      .eq('id', indemnitor_id)
      .single();

    if (fetchErr) {
      console.error('[Invite] Fetch error:', fetchErr);
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }

    if (!indemnitor) {
      return NextResponse.json({ error: 'Indemnitor not found' }, { status: 404 });
    }

    if (!indemnitor.phone) {
      return NextResponse.json({ error: 'Indemnitor has no phone number — add a phone first' }, { status: 400 });
    }

    // Validate phone has at least 10 digits
    const phoneDigits = indemnitor.phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      return NextResponse.json({ error: `Invalid phone number: ${indemnitor.phone} (need 10 digits)` }, { status: 400 });
    }

    // Generate token with 72hr expiry
    const token = crypto.randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 72 * 60 * 60 * 1000);

    const { error: updateError } = await supabase
      .from('indemnitors')
      .update({
        invite_token: token,
        invite_sent_at: now.toISOString(),
        invite_expires_at: expiresAt.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('id', indemnitor_id);

    if (updateError) {
      console.error('[Invite] Token update error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Build invite URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;
    const inviteUrl = `${baseUrl}/indemnitor/${token}`;

    // Handle join — Supabase FK joins can return object or array
    const rawApp = indemnitor.applications as unknown;
    const app = Array.isArray(rawApp) ? rawApp[0] : rawApp;
    const defendantName = app
      ? `${(app as { defendant_first: string }).defendant_first} ${(app as { defendant_last: string }).defendant_last}`
      : 'the defendant';

    // Send SMS
    let smsResult: { sid: string; status: string };
    try {
      smsResult = await sendIndemnitorInviteSMS(
        indemnitor.phone,
        indemnitor.first_name,
        defendantName,
        inviteUrl,
      );
    } catch (smsErr) {
      const smsMsg = smsErr instanceof Error ? smsErr.message : 'SMS send failed';
      console.error('[Invite] SMS error:', smsMsg);
      return NextResponse.json(
        { error: `SMS failed: ${smsMsg}. Token was created — try resending.` },
        { status: 502 },
      );
    }

    // Log to sms_log
    await supabase.from('sms_log').insert({
      application_id: indemnitor.application_id,
      phone: indemnitor.phone,
      direction: 'outbound',
      message: `Indemnitor invite sent to ${indemnitor.first_name} ${indemnitor.last_name}`,
      twilio_sid: smsResult.sid,
      status: smsResult.status,
      sent_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      invite_url: inviteUrl,
      expires_at: expiresAt.toISOString(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to send invite';
    console.error('[Invite] Unhandled error:', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
