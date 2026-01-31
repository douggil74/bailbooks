import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import type { CompletePaymentLinkRequest } from '@/lib/bail-types';

export async function POST(req: NextRequest) {
  try {
    const body: CompletePaymentLinkRequest = await req.json();

    if (!body.token || !body.payment_method_id) {
      return NextResponse.json(
        { error: 'token and payment_method_id are required' },
        { status: 400 },
      );
    }

    const supabase = createServerClient();

    const { data: app } = await supabase
      .from('applications')
      .select('id, payment_link_amount, payment_link_expires_at')
      .eq('payment_link_token', body.token)
      .single();

    if (!app) {
      return NextResponse.json({ error: 'Invalid payment link' }, { status: 404 });
    }

    if (app.payment_link_expires_at && new Date(app.payment_link_expires_at) < new Date()) {
      return NextResponse.json({ error: 'Payment link has expired' }, { status: 400 });
    }

    // Record the payment
    if (app.payment_link_amount && body.payment_intent_id) {
      await supabase.from('payments').insert({
        application_id: app.id,
        amount: app.payment_link_amount,
        type: 'manual',
        status: 'paid',
        payment_method: 'card',
        stripe_payment_intent_id: body.payment_intent_id,
        description: 'Payment via link',
        paid_at: new Date().toISOString(),
      });
    }

    // Save payment method for future charges and clear payment link columns
    await supabase
      .from('applications')
      .update({
        stripe_payment_method_id: body.payment_method_id,
        payment_link_token: null,
        payment_link_amount: null,
        payment_link_created_at: null,
        payment_link_expires_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', app.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to complete payment';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
