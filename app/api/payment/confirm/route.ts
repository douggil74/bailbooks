import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import type { ConfirmPaymentRequest } from '@/lib/bail-types';

export async function POST(req: NextRequest) {
  try {
    const body: ConfirmPaymentRequest = await req.json();

    if (!body.application_id || !body.payment_method_id || !body.customer_id) {
      return NextResponse.json(
        { error: 'application_id, payment_method_id, and customer_id are required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('applications')
      .update({
        stripe_customer_id: body.customer_id,
        stripe_payment_method_id: body.payment_method_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', body.application_id)
      .select('id, stripe_customer_id, stripe_payment_method_id')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
