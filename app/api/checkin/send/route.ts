import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getResend } from '@/lib/resend-server';
import { sendCheckinRequest } from '@/lib/twilio-server';
import { checkinReminderEmail } from '@/lib/email-templates';
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
      .select('id, defendant_first, defendant_phone, defendant_email, sms_consent, checkin_code')
      .eq('id', body.application_id)
      .single();

    if (!app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Ensure short checkin_code exists for SMS-friendly URLs
    let checkinCode = app.checkin_code as string | null;
    if (!checkinCode) {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
      const bytes = new Uint8Array(8);
      crypto.getRandomValues(bytes);
      checkinCode = Array.from(bytes, b => chars[b % chars.length]).join('');
      await supabase
        .from('applications')
        .update({ checkin_code: checkinCode })
        .eq('id', app.id);
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bailbondsfinanced.com';
    const checkinUrl = `${siteUrl}/c/${checkinCode}`;
    const channels: string[] = [];
    const errors: string[] = [];

    // Send SMS if phone exists (admin-initiated sends skip consent check)
    if (app.defendant_phone) {
      try {
        const message = await sendCheckinRequest(app.id, app.defendant_phone, checkinCode);
        await supabase.from('sms_log').insert({
          application_id: app.id,
          phone: app.defendant_phone,
          direction: 'outbound',
          message: `Check-in request sent to ${app.defendant_first || 'defendant'}`,
          twilio_sid: message.sid,
          status: message.status,
        });
        channels.push('sms');
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Unknown SMS error';
        console.error('Check-in SMS failed:', err);
        errors.push(`SMS: ${errMsg}`);
      }
    }

    // Send email if email exists
    if (app.defendant_email) {
      try {
        const resend = getResend();
        const emailTemplate = checkinReminderEmail({
          defendantFirst: app.defendant_first,
          checkinUrl,
        });
        await resend.emails.send({
          from: 'BailBonds Financed <reminders@resend.dev>',
          to: app.defendant_email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
        });
        channels.push('email');
      } catch (err) {
        console.error('Check-in email failed:', err);
      }
    }

    if (channels.length === 0) {
      const detail = errors.length > 0
        ? `Send failed: ${errors.join('; ')}`
        : 'No contact method available (no phone or email on file)';
      return NextResponse.json({ error: detail }, { status: 400 });
    }

    // Log to reminders_sent
    for (const channel of channels) {
      await supabase.from('reminders_sent').insert({
        application_id: app.id,
        reminder_type: `checkin_manual_${new Date().toISOString().split('T')[0]}`,
        channel,
      });
    }

    return NextResponse.json({
      success: true,
      channels_sent: channels,
      ...(errors.length > 0 ? { warnings: errors } : {}),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to send check-in';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
