import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const applicationId = req.nextUrl.searchParams.get('application_id');
  if (!applicationId) {
    return NextResponse.json({ error: 'application_id is required' }, { status: 400 });
  }

  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('application_id', applicationId)
      .order('due_date', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ payments: data || [] });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch payments';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { application_id, amount, type, payment_method, description, due_date, status } = body;

    if (!application_id || !amount) {
      return NextResponse.json({ error: 'application_id and amount are required' }, { status: 400 });
    }

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('payments')
      .insert({
        application_id,
        amount,
        type: type || 'manual',
        status: status || 'paid',
        payment_method: payment_method || 'cash',
        description: description || null,
        due_date: due_date || null,
        paid_at: (status || 'paid') === 'paid' ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ payment: data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create payment';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...fields } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const allowed = ['amount', 'type', 'status', 'payment_method', 'description', 'due_date', 'paid_at', 'stripe_payment_intent_id'];
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const key of allowed) {
      if (key in fields) updates[key] = fields[key];
    }

    if (fields.status === 'paid' && !fields.paid_at) {
      updates.paid_at = new Date().toISOString();
    }

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('payments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ payment: data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to update payment';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  try {
    const supabase = createServerClient();
    const { error } = await supabase.from('payments').delete().eq('id', id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ deleted: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to delete payment';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
