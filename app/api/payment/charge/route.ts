import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { createPaymentIntent } from '@/lib/stripe-server';
import type { ChargeRequest, ChargeResponse } from '@/lib/bail-types';

function advanceDate(currentDate: string | null, plan: string | null): string {
  const base = currentDate ? new Date(currentDate) : new Date();
  const days = plan === 'weekly' ? 7 : plan === 'biweekly' ? 14 : 30;
  base.setDate(base.getDate() + days);
  return base.toISOString().split('T')[0];
}

export async function POST(req: NextRequest) {
  try {
    const body: ChargeRequest = await req.json();

    if (!body.application_id || !body.amount || body.amount <= 0) {
      return NextResponse.json(
        { error: 'application_id and a positive amount are required' },
        { status: 400 },
      );
    }

    const supabase = createServerClient();

    const { data: app } = await supabase
      .from('applications')
      .select('id, stripe_customer_id, stripe_payment_method_id, payment_plan, next_payment_date')
      .eq('id', body.application_id)
      .single();

    if (!app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (!app.stripe_customer_id || !app.stripe_payment_method_id) {
      return NextResponse.json({ error: 'No card on file for this application' }, { status: 400 });
    }

    const amountCents = Math.round(body.amount * 100);

    const paymentIntent = await createPaymentIntent(
      app.stripe_customer_id,
      app.stripe_payment_method_id,
      amountCents,
      { application_id: body.application_id },
    );

    // Record payment in payments table
    await supabase.from('payments').insert({
      application_id: body.application_id,
      amount: body.amount,
      type: 'manual',
      status: 'paid',
      payment_method: 'card',
      stripe_payment_intent_id: paymentIntent.id,
      description: `Card charge — $${body.amount.toFixed(2)}`,
      paid_at: new Date().toISOString(),
    });

    // Advance next_payment_date
    const newDate = advanceDate(app.next_payment_date, app.payment_plan);

    await supabase
      .from('applications')
      .update({
        next_payment_date: newDate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', body.application_id);

    const resp: ChargeResponse = {
      success: true,
      payment_intent_id: paymentIntent.id,
      amount_charged: body.amount,
      new_next_payment_date: newDate,
    };

    return NextResponse.json(resp);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Charge failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
