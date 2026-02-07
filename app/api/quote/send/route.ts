import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { sendSMS } from '@/lib/twilio-server';

export async function POST(req: NextRequest) {
  try {
    const { name, phone, bond_amount, message } = await req.json();

    if (!name || !phone || !bond_amount) {
      return NextResponse.json(
        { error: 'name, phone, and bond_amount are required' },
        { status: 400 },
      );
    }

    const amt = parseFloat(bond_amount);
    const premium = amt * 0.12;
    const downPayment = premium * 0.5;

    const fmt = (n: number) =>
      n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    // Store the pending quote in DB
    const supabase = createServerClient();
    const { data: quote, error: insertErr } = await supabase
      .from('quotes')
      .insert({
        name,
        phone,
        bond_amount: amt,
        premium,
        down_payment: downPayment,
        message: message || null,
        status: 'sent',
      })
      .select('id')
      .single();

    if (insertErr) {
      console.error('[Quote] Insert error:', insertErr);
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    // Text the quote to the customer
    const smsBody =
      `Hi ${name.split(' ')[0]}, here's your bail bond quote from BailBonds Made Easy:\n\n` +
      `Bond Amount: $${fmt(amt)}\n` +
      `Premium (12%): $${fmt(premium)}\n` +
      `Est. Down Payment: $${fmt(downPayment)}\n\n` +
      `Payment plans available. Reply YES to proceed or call 985-264-9519.\n` +
      `— BailBonds Made Easy`;

    const result = await sendSMS(phone, smsBody);

    // Update quote with SMS sid
    await supabase
      .from('quotes')
      .update({ sms_sid: result.sid })
      .eq('id', quote.id);

    return NextResponse.json({
      success: true,
      quote_id: quote.id,
      sms_status: result.status,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to send quote';
    console.error('[Quote] Send error:', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
