import twilio from 'twilio';

let twilioClient: ReturnType<typeof twilio> | null = null;

function getTwilio() {
  if (!twilioClient) {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (!sid || !token) throw new Error('Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN');
    twilioClient = twilio(sid, token);
  }
  return twilioClient;
}

export async function sendSMS(to: string, body: string) {
  const client = getTwilio();
  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!from) throw new Error('Missing TWILIO_PHONE_NUMBER');
  return client.messages.create({ to, from, body });
}

export async function sendCheckinRequest(applicationId: string, phone: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin
    : 'https://bailbondsfinanced.com';

  // In production, use the actual site URL
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || baseUrl;
  const url = `${siteUrl}/checkin?id=${applicationId}`;

  const body = `Time for your check-in with Bailbonds Financed. Tap here: ${url}`;
  return sendSMS(phone, body);
}
