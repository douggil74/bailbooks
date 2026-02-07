import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();

    if (!phone) {
      return NextResponse.json({ error: 'phone is required' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Find the most recent pending/sent quote for this phone
    const digits = phone.replace(/\D/g, '').slice(-10);
    const { data: quote } = await supabase
      .from('quotes')
      .select('*')
      .eq('status', 'sent')
      .ilike('phone', `%${digits}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!quote) {
      return NextResponse.json({ error: 'No pending quote found for this phone' }, { status: 404 });
    }

    // Split name
    const parts = (quote.name || '').trim().split(/\s+/);
    const first = parts[0] || 'Unknown';
    const last = parts.slice(1).join(' ') || 'Unknown';

    // Create the case
    const { data: app, error: appErr } = await supabase
      .from('applications')
      .insert({
        defendant_first: first,
        defendant_last: last,
        defendant_phone: quote.phone,
        bond_amount: quote.bond_amount,
        premium: quote.premium,
        down_payment: quote.down_payment,
        status: 'submitted',
      })
      .select('id')
      .single();

    if (appErr) {
      console.error('[Quote Accept] Case creation error:', appErr);
      return NextResponse.json({ error: appErr.message }, { status: 500 });
    }

    // Mark quote as accepted
    await supabase
      .from('quotes')
      .update({ status: 'accepted', application_id: app.id })
      .eq('id', quote.id);

    return NextResponse.json({
      success: true,
      application_id: app.id,
      defendant: `${first} ${last}`,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to accept quote';
    console.error('[Quote Accept] Error:', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
