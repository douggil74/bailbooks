// Twilio SMS is not configured for this project yet.
// These are stubs so routes that reference them don't crash.

export async function sendSMS(to: string, body: string) {
  console.warn('SMS not configured — skipping send to', to);
  return { sid: 'not-configured', status: 'skipped' };
}

export async function sendCheckinRequest(applicationId: string, phone: string) {
  console.warn('SMS not configured — skipping checkin request for', applicationId);
  return { sid: 'not-configured', status: 'skipped' };
}

export async function sendPaymentLinkSMS(
  phone: string,
  name: string,
  amount: number,
  url: string,
) {
  const body =
    `Hi ${name}, your payment of $${amount.toFixed(2)} is ready. ` +
    `Pay securely here: ${url} — Bailbonds Financed`;
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
    `Please complete your information here: ${inviteUrl} — Bailbonds Financed`;
  return sendSMS(phone, body);
}
