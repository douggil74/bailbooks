// SMS via SignalWire Compatibility API (LaML)
// No SDK needed — uses fetch with Basic Auth

const PROJECT_ID = process.env.SIGNALWIRE_PROJECT_ID;
const API_TOKEN = process.env.SIGNALWIRE_API_TOKEN;
const SPACE_URL = process.env.SIGNALWIRE_SPACE_URL;
const FROM_NUMBER = process.env.SIGNALWIRE_PHONE_NUMBER;

function getBaseUrl() {
  if (!PROJECT_ID || !API_TOKEN || !SPACE_URL || !FROM_NUMBER) {
    return null;
  }
  return `https://${SPACE_URL}/api/laml/2010-04-01/Accounts/${PROJECT_ID}/Messages`;
}

function getAuthHeader() {
  return 'Basic ' + Buffer.from(`${PROJECT_ID}:${API_TOKEN}`).toString('base64');
}

export async function sendSMS(to: string, body: string) {
  const url = getBaseUrl();
  if (!url) {
    console.warn('SignalWire not configured — skipping send to', to);
    return { sid: 'not-configured', status: 'skipped' };
  }

  const params = new URLSearchParams();
  params.append('From', FROM_NUMBER!);
  params.append('To', to);
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

  const data = await res.json();

  if (!res.ok) {
    console.error('SignalWire SMS error:', data);
    throw new Error(data.message || `SignalWire error ${res.status}`);
  }

  return { sid: data.sid || 'sent', status: data.status || 'queued' };
}

export async function sendCheckinRequest(applicationId: string, phone: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bailbondsfinanced.com';
  const checkinUrl = `${siteUrl}/checkin?id=${applicationId}`;
  const body =
    `Time to check in! Tap the link below to complete your GPS check-in:\n${checkinUrl}\n— BailBonds Made Easy`;
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
    `Pay securely here: ${url} — BailBonds Made Easy`;
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
    `Please complete your information here: ${inviteUrl} — BailBonds Made Easy`;
  return sendSMS(phone, body);
}
