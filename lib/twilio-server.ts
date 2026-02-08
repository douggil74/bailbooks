// SMS via SignalWire Compatibility API (LaML)
// No SDK needed — uses fetch with Basic Auth

const PROJECT_ID = process.env.SIGNALWIRE_PROJECT_ID?.trim();
const API_TOKEN = process.env.SIGNALWIRE_API_TOKEN?.trim();
const SPACE_URL = process.env.SIGNALWIRE_SPACE_URL?.trim();
const FROM_NUMBER = process.env.SIGNALWIRE_PHONE_NUMBER?.trim();

function getBaseUrl() {
  if (!PROJECT_ID || !API_TOKEN || !SPACE_URL || !FROM_NUMBER) {
    return null;
  }
  return `https://${SPACE_URL}/api/laml/2010-04-01/Accounts/${PROJECT_ID}/Messages`;
}

function getAuthHeader() {
  return 'Basic ' + Buffer.from(`${PROJECT_ID}:${API_TOKEN}`).toString('base64');
}

/** Normalize phone to E.164 (+1XXXXXXXXXX) for US numbers */
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (phone.startsWith('+')) return phone;
  return `+${digits}`;
}

export async function sendSMS(to: string, body: string) {
  const url = getBaseUrl();
  if (!url) {
    console.warn('[SMS] SignalWire not configured — skipping send to', to);
    return { sid: 'not-configured', status: 'skipped' };
  }

  const normalizedTo = normalizePhone(to);
  console.log(`[SMS] Sending to ${normalizedTo} from ${FROM_NUMBER} via ${SPACE_URL}`);

  const params = new URLSearchParams();
  params.append('From', FROM_NUMBER!);
  params.append('To', normalizedTo);
  params.append('Body', body);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': getAuthHeader(),
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: params.toString(),
  });

  // Safely parse response — SignalWire may return empty or non-JSON body
  const text = await res.text();
  console.log(`[SMS] SignalWire HTTP ${res.status}: ${text.slice(0, 500)}`);

  let data: Record<string, unknown>;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    if (!res.ok) {
      throw new Error(`SignalWire error ${res.status}: ${text.slice(0, 200)}`);
    }
    data = {};
  }

  if (!res.ok) {
    const errMsg = (data.message as string) || (data.error_message as string) || `SignalWire error ${res.status}`;
    console.error('[SMS] SignalWire error:', errMsg, data);
    throw new Error(errMsg);
  }

  console.log(`[SMS] Success — SID: ${data.sid}, status: ${data.status}`);
  return { sid: (data.sid as string) || 'sent', status: (data.status as string) || 'queued' };
}

export async function sendCheckinRequest(applicationId: string, phone: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bailbondsfinanced.com';
  const checkinUrl = `${siteUrl}/checkin?id=${applicationId}`;
  const body =
    `Time to check in! Tap the link below to complete your GPS check-in:\n${checkinUrl}\n— BailBonds Financed`;
  return sendSMS(phone, body);
}

export async function sendPaymentLinkSMS(
  phone: string,
  name: string,
  amount: number,
  url: string,
) {
  const body =
    `Hi ${name}, your payment of $${amount.toFixed(2)} is ready. ` +
    `Pay securely here: ${url} — BailBonds Financed`;
  return sendSMS(phone, body);
}

export async function sendIndemnitorInviteSMS(
  phone: string,
  indemnitorName: string,
  defendantName: string,
  inviteUrl: string,
) {
  const body =
    `Hi ${indemnitorName}, you've been listed as a co-signer for ${defendantName}. ` +
    `Please complete your information here: ${inviteUrl} — BailBonds Financed`;
  return sendSMS(phone, body);
}
