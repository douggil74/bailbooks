import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { retrievePaymentMethod } from '@/lib/stripe-server';
import type { CardInfoResponse } from '@/lib/bail-types';

export async function GET(req: NextRequest) {
  try {
    const applicationId = req.nextUrl.searchParams.get('application_id');
    if (!applicationId) {
      return NextResponse.json({ error: 'application_id is required' }, { status: 400 });
    }

    const supabase = createServerClient();
    const { data: app } = await supabase
      .from('applications')
      .select('stripe_payment_method_id')
      .eq('id', applicationId)
      .single();

    if (!app || !app.stripe_payment_method_id) {
      const noCard: CardInfoResponse = {
        has_card: false,
        brand: null,
        last4: null,
        exp_month: null,
        exp_year: null,
      };
      return NextResponse.json(noCard);
    }

    const pm = await retrievePaymentMethod(app.stripe_payment_method_id);

    const resp: CardInfoResponse = {
      has_card: true,
      brand: pm.card?.brand || null,
      last4: pm.card?.last4 || null,
      exp_month: pm.card?.exp_month || null,
      exp_year: pm.card?.exp_year || null,
    };

    return NextResponse.json(resp);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get card info';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
