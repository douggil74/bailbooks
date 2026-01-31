import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { createCustomer, createSetupIntent } from '@/lib/stripe-server';
import type { SetupIntentRequest } from '@/lib/bail-types';

export async function POST(req: NextRequest) {
  try {
    const body: SetupIntentRequest = await req.json();

    if (!body.application_id) {
      return NextResponse.json({ error: 'application_id is required' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Get application
    const { data: app } = await supabase
      .from('applications')
      .select('id, stripe_customer_id, defendant_email, defendant_first, defendant_last')
      .eq('id', body.application_id)
      .single();

    if (!app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Reuse existing Stripe customer or create new one
    let customerId = app.stripe_customer_id;

    if (!customerId) {
      const email = body.email || app.defendant_email || undefined;
      const name = body.name || [app.defendant_first, app.defendant_last].filter(Boolean).join(' ') || undefined;
      const customer = await createCustomer(email, name);
      customerId = customer.id;

      // Save customer ID to application
      await supabase
        .from('applications')
        .update({ stripe_customer_id: customerId, updated_at: new Date().toISOString() })
        .eq('id', body.application_id);
    }

    const setupIntent = await createSetupIntent(customerId);

    return NextResponse.json({
      client_secret: setupIntent.client_secret,
      customer_id: customerId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Payment setup failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
