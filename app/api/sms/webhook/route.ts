import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { sendSMS } from '@/lib/twilio-server';

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

    // Check for YES reply to a pending quote
    const trimmed = (body || '').trim().toUpperCase();
    if (trimmed === 'YES' || trimmed === 'Y') {
      try {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bailmadesimple.vercel.app';
        const acceptRes = await fetch(`${siteUrl}/api/quote/accept`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: from }),
        });
        const acceptData = await acceptRes.json();

        if (acceptRes.ok && acceptData.application_id) {
          // Confirm to customer
          await sendSMS(
            from,
            `Great news, ${acceptData.defendant}! Your bail bond case has been started. ` +
            `An agent will contact you shortly. — BailBonds Made Easy 985-264-9519`,
          );
          console.log(`[SMS Webhook] Quote accepted — case ${acceptData.application_id} created for ${from}`);
        }
      } catch (err) {
        console.error('[SMS Webhook] Quote accept error:', err);
      }
    }

    // Return TwiML empty response
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
