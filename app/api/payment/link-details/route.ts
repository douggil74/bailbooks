import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { createPaymentIntentForLink } from '@/lib/stripe-server';

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.json({ valid: false, error: 'Token is required' }, { status: 400 });
    }

    const supabase = createServerClient();

    const { data: app } = await supabase
      .from('applications')
      .select('id, defendant_first, defendant_last, payment_link_amount, payment_link_expires_at, stripe_customer_id')
      .eq('payment_link_token', token)
      .single();

    if (!app) {
      return NextResponse.json({ valid: false, error: 'Invalid or expired payment link' });
    }

    // Check expiry
    if (app.payment_link_expires_at && new Date(app.payment_link_expires_at) < new Date()) {
      return NextResponse.json({ valid: false, error: 'This payment link has expired' });
    }

    if (!app.stripe_customer_id || !app.payment_link_amount) {
      return NextResponse.json({ valid: false, error: 'Payment link is not properly configured' });
    }

    const amountCents = Math.round(app.payment_link_amount * 100);

    const paymentIntent = await createPaymentIntentForLink(
      app.stripe_customer_id,
      amountCents,
      { application_id: app.id },
    );

    const defendantName = [app.defendant_first, app.defendant_last].filter(Boolean).join(' ');

    return NextResponse.json({
      valid: true,
      amount: app.payment_link_amount,
      defendant_name: defendantName,
      client_secret: paymentIntent.client_secret,
      application_id: app.id,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load payment details';
    return NextResponse.json({ valid: false, error: message }, { status: 500 });
  }
}
