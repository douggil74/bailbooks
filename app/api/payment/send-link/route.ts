import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { createServerClient } from '@/lib/supabase';
import { createCustomer } from '@/lib/stripe-server';
import { sendPaymentLinkSMS } from '@/lib/twilio-server';
import { paymentLinkEmail } from '@/lib/email-templates';
import { getResend } from '@/lib/resend-server';
import type { SendPaymentLinkRequest, SendPaymentLinkResponse } from '@/lib/bail-types';

export async function POST(req: NextRequest) {
  try {
    const body: SendPaymentLinkRequest = await req.json();

    if (!body.application_id || !body.amount || body.amount <= 0) {
      return NextResponse.json(
        { error: 'application_id and a positive amount are required' },
        { status: 400 },
      );
    }

    const supabase = createServerClient();

    const { data: app } = await supabase
      .from('applications')
      .select('id, defendant_first, defendant_last, defendant_phone, defendant_email, sms_consent, stripe_customer_id')
      .eq('id', body.application_id)
      .single();

    if (!app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Create or reuse Stripe customer
    let customerId = app.stripe_customer_id;
    if (!customerId) {
      const name = [app.defendant_first, app.defendant_last].filter(Boolean).join(' ') || undefined;
      const customer = await createCustomer(app.defendant_email || undefined, name);
      customerId = customer.id;

      await supabase
        .from('applications')
        .update({ stripe_customer_id: customerId, updated_at: new Date().toISOString() })
        .eq('id', body.application_id);
    }

    // Generate token and expiry
    const token = randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

    await supabase
      .from('applications')
      .update({
        payment_link_token: token,
        payment_link_amount: body.amount,
        payment_link_created_at: now.toISOString(),
        payment_link_expires_at: expiresAt.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('id', body.application_id);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const paymentUrl = `${baseUrl}/pay/${token}`;
    const channelsSent: string[] = [];
    const firstName = app.defendant_first || 'Client';

    // Send SMS
    if ((body.channel === 'sms' || body.channel === 'both') && app.defendant_phone) {
      const smsResult = await sendPaymentLinkSMS(
        app.defendant_phone,
        firstName,
        body.amount,
        paymentUrl,
      );

      await supabase.from('sms_log').insert({
        application_id: body.application_id,
        phone: app.defendant_phone,
        direction: 'outbound',
        message: `Payment link sent: $${body.amount.toFixed(2)} — ${paymentUrl}`,
        twilio_sid: smsResult.sid,
        status: smsResult.status,
        sent_at: now.toISOString(),
      });

      channelsSent.push('sms');
    }

    // Send email
    if ((body.channel === 'email' || body.channel === 'both') && app.defendant_email) {
      const { subject, html } = paymentLinkEmail({
        defendantFirst: firstName,
        amount: body.amount,
        paymentUrl,
      });

      const resend = getResend();
      await resend.emails.send({
        from: 'BailBonds Made Easy <noreply@bailmade.simple>',
        to: app.defendant_email,
        subject,
        html,
      });

      channelsSent.push('email');
    }

    const resp: SendPaymentLinkResponse = {
      success: true,
      token,
      payment_url: paymentUrl,
      channels_sent: channelsSent,
    };

    return NextResponse.json(resp);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to send payment link';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
