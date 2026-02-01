import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

/** Strip phone to digits-only for flexible matching */
function stripPhone(phone: string): string {
  return phone.replace(/\D/g, '').replace(/^1(\d{10})$/, '$1');
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const from = formData.get('From') as string | null;
    const body = formData.get('Body') as string | null;
    const messageSid = formData.get('MessageSid') as string | null;

    if (!from) {
      return new NextResponse('<Response></Response>', {
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
      });
    }

    const supabase = createServerClient();
    const digits = stripPhone(from);

    // Try to find application by phone number (try multiple formats)
    let appId: string | null = null;

    // Try exact match first
    const { data: exactMatch } = await supabase
      .from('applications')
      .select('id')
      .eq('defendant_phone', from)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (exactMatch) {
      appId = exactMatch.id;
    } else if (digits.length === 10) {
      // Try 10-digit match (DB may store as '9855551234')
      const { data: digitMatch } = await supabase
        .from('applications')
        .select('id')
        .eq('defendant_phone', digits)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (digitMatch) {
        appId = digitMatch.id;
      } else {
        // Try +1 prefix match
        const { data: e164Match } = await supabase
          .from('applications')
          .select('id')
          .eq('defendant_phone', `+1${digits}`)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        if (e164Match) appId = e164Match.id;
      }
    }

    // Also check indemnitor phones if no match yet
    if (!appId && digits.length === 10) {
      for (const phoneVariant of [from, digits, `+1${digits}`]) {
        const { data: indMatch } = await supabase
          .from('indemnitors')
          .select('application_id')
          .eq('phone', phoneVariant)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        if (indMatch) {
          appId = indMatch.application_id;
          break;
        }
      }
    }

    console.log(`[SMS Webhook] From: ${from}, digits: ${digits}, matched app: ${appId || 'none'}`);

    // Log inbound SMS
    const { error: insertErr } = await supabase.from('sms_log').insert({
      application_id: appId,
      phone: from,
      direction: 'inbound',
      message: body || '',
      twilio_sid: messageSid || null,
      status: 'received',
      sent_at: new Date().toISOString(),
    });

    if (insertErr) {
      console.error('[SMS Webhook] sms_log insert error:', insertErr);
    }

    // Return TwiML empty response (no auto-reply for now)
    return new NextResponse('<Response></Response>', {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch {
    return new NextResponse('<Response></Response>', {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    });
  }
}
