import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { application_id, total_amount, down_payment, payment_amount, frequency, start_date } = body;

    if (!application_id || !total_amount || !payment_amount || !frequency || !start_date) {
      return NextResponse.json(
        { error: 'application_id, total_amount, payment_amount, frequency, and start_date are required' },
        { status: 400 },
      );
    }

    const supabase = createServerClient();
    const remaining = total_amount - (down_payment || 0);
    const numPayments = Math.ceil(remaining / payment_amount);
    const frequencyDays = frequency === 'weekly' ? 7 : frequency === 'biweekly' ? 14 : 30;

    const payments = [];

    // Down payment entry
    if (down_payment && down_payment > 0) {
      payments.push({
        application_id,
        amount: down_payment,
        type: 'down_payment',
        status: 'pending',
        payment_method: null,
        description: 'Down payment',
        due_date: start_date,
      });
    }

    // Scheduled payments
    const baseDate = new Date(start_date + 'T00:00:00');
    for (let i = 0; i < numPayments; i++) {
      const dueDate = new Date(baseDate);
      dueDate.setDate(dueDate.getDate() + frequencyDays * (i + 1));
      const isLast = i === numPayments - 1;
      const amt = isLast ? remaining - payment_amount * (numPayments - 1) : payment_amount;

      payments.push({
        application_id,
        amount: Math.round(amt * 100) / 100,
        type: 'scheduled',
        status: 'pending',
        payment_method: null,
        description: `Payment ${i + 1} of ${numPayments}`,
        due_date: dueDate.toISOString().split('T')[0],
      });
    }

    const { data, error } = await supabase
      .from('payments')
      .insert(payments)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update application with plan info
    await supabase
      .from('applications')
      .update({
        payment_plan: frequency,
        payment_amount,
        down_payment: down_payment || 0,
        next_payment_date: payments[down_payment ? 1 : 0]?.due_date || start_date,
        updated_at: new Date().toISOString(),
      })
      .eq('id', application_id);

    return NextResponse.json({ payments: data, count: data?.length || 0 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create payment plan';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const applicationId = req.nextUrl.searchParams.get('application_id');
  if (!applicationId) {
    return NextResponse.json({ error: 'application_id is required' }, { status: 400 });
  }

  try {
    const supabase = createServerClient();
    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('application_id', applicationId)
      .eq('status', 'pending');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ deleted: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to delete payment plan';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
