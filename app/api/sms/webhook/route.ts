import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

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

    // Try to find application by phone number
    const { data: app } = await supabase
      .from('applications')
      .select('id')
      .eq('defendant_phone', from)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Log inbound SMS
    await supabase.from('sms_log').insert({
      application_id: app?.id || null,
      phone: from,
      direction: 'inbound',
      message: body || '',
      twilio_sid: messageSid || null,
      status: 'received',
    });

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
