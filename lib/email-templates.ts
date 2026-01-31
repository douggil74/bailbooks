interface CourtReminderParams {
  defendantFirst: string;
  courtDate: string;
  courtName: string;
  daysUntil: number;
}

interface PaymentReminderParams {
  defendantFirst: string;
  paymentAmount: number;
  paymentDueDate: string;
  daysUntil: number;
}

interface CheckinReminderParams {
  defendantFirst: string;
  checkinUrl: string;
}

interface PaymentLinkParams {
  defendantFirst: string;
  amount: number;
  paymentUrl: string;
}

const PHONE = '985-264-9519';
const PHONE_HREF = 'tel:+19852649519';

function layout(title: string, body: string): string {
  return `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a;">
      <!-- Nav bar -->
      <div style="background: #0a0a0a; border-bottom: 1px solid rgba(255,255,255,0.1); padding: 16px 24px; text-align: center;">
        <span style="font-size: 20px; font-weight: 800; color: #ffffff;">Bailbonds </span><span style="font-size: 20px; font-weight: 800; color: #d4af37;">Financed</span>
      </div>

      <!-- Hero header -->
      <div style="background: linear-gradient(135deg, #1a4d2e, #0f3620); padding: 32px 24px; text-align: center;">
        <h1 style="margin: 0; color: #d4af37; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">${title}</h1>
      </div>

      <!-- Body -->
      <div style="padding: 32px 24px; background: #0a0a0a;">
        ${body}
      </div>

      <!-- CTA footer -->
      <div style="padding: 24px; text-align: center; background: #0a0a0a; border-top: 1px solid rgba(255,255,255,0.1);">
        <a href="${PHONE_HREF}" style="display: inline-block; background: #d4af37; color: #0a0a0a; padding: 12px 28px; text-decoration: none; border-radius: 50px; font-weight: 700; font-size: 16px;">Call ${PHONE}</a>
      </div>

      <!-- Bottom footer -->
      <div style="padding: 20px 24px; text-align: center; background: #0a0a0a; border-top: 1px solid rgba(255,255,255,0.1);">
        <p style="margin: 0 0 4px 0; color: #ffffff; font-size: 13px; font-weight: 600;">Bailbonds <span style="color: #d4af37;">Financed</span></p>
        <p style="margin: 0 0 4px 0; color: #9ca3af; font-size: 12px;">Affiliate of Louisiana Bail Agents</p>
        <p style="margin: 0; color: #6b7280; font-size: 12px;">Serving St. Tammany Parish, Louisiana</p>
      </div>
    </div>
  `;
}

function infoCard(rows: string): string {
  return `
    <div style="background: #1a1a1a; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 20px; margin: 20px 0;">
      ${rows}
    </div>
  `;
}

function infoRow(label: string, value: string): string {
  return `<p style="margin: 6px 0; color: #d1d5db; font-size: 15px;"><span style="color: #9ca3af;">${label}:</span> <strong style="color: #ffffff;">${value}</strong></p>`;
}

export function courtReminderEmail({ defendantFirst, courtDate, courtName, daysUntil }: CourtReminderParams) {
  const formatted = new Date(courtDate + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const urgency = daysUntil <= 1 ? 'TOMORROW' : `in ${daysUntil} days`;

  return {
    subject: `Court Date Reminder — ${urgency} (${formatted})`,
    html: layout('Court Date Reminder', `
      <p style="color: #d1d5db; font-size: 15px; line-height: 1.6;">Hi ${defendantFirst},</p>
      <p style="color: #d1d5db; font-size: 15px; line-height: 1.6;">This is a reminder that your court date is <strong style="color: #d4af37;">${urgency}</strong>.</p>

      ${infoCard(`
        ${infoRow('Date', formatted)}
        ${infoRow('Court', courtName)}
      `)}

      <div style="background: linear-gradient(135deg, #1a4d2e, #0f3620); border-radius: 16px; padding: 20px; margin: 20px 0;">
        <p style="margin: 0; color: #ffffff; font-size: 14px; line-height: 1.6;">
          <strong style="color: #d4af37;">Important:</strong> Please arrive on time. Failure to appear may result in bond revocation and a warrant for your arrest.
        </p>
      </div>

      <p style="color: #9ca3af; font-size: 13px; line-height: 1.5;">If you have questions, contact us immediately.</p>
    `),
  };
}

export function paymentReminderEmail({ defendantFirst, paymentAmount, paymentDueDate, daysUntil }: PaymentReminderParams) {
  const formatted = new Date(paymentDueDate + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const urgency = daysUntil <= 1 ? 'tomorrow' : `in ${daysUntil} days`;

  return {
    subject: `Payment Reminder — $${paymentAmount.toLocaleString()} due ${urgency}`,
    html: layout('Payment Reminder', `
      <p style="color: #d1d5db; font-size: 15px; line-height: 1.6;">Hi ${defendantFirst},</p>
      <p style="color: #d1d5db; font-size: 15px; line-height: 1.6;">This is a reminder that your payment is due <strong style="color: #d4af37;">${urgency}</strong>.</p>

      ${infoCard(`
        ${infoRow('Amount Due', `$${paymentAmount.toLocaleString()}`)}
        ${infoRow('Due Date', formatted)}
      `)}

      <p style="color: #d1d5db; font-size: 15px; line-height: 1.6;">Please ensure your payment is made on time to remain in good standing.</p>
      <p style="color: #9ca3af; font-size: 13px; line-height: 1.5;">Contact us if you need to make alternate arrangements.</p>
    `),
  };
}

export function checkinReminderEmail({ defendantFirst, checkinUrl }: CheckinReminderParams) {
  return {
    subject: 'Check-in Reminder — Action Required',
    html: layout('Check-in Reminder', `
      <p style="color: #d1d5db; font-size: 15px; line-height: 1.6;">Hi ${defendantFirst},</p>
      <p style="color: #d1d5db; font-size: 15px; line-height: 1.6;">It&rsquo;s time for your scheduled check-in with Bailbonds Financed.</p>

      <div style="text-align: center; margin: 28px 0;">
        <a href="${checkinUrl}" style="display: inline-block; background: #d4af37; color: #0a0a0a; padding: 14px 32px; text-decoration: none; border-radius: 50px; font-weight: 700; font-size: 18px;">Check In Now</a>
      </div>

      <p style="color: #9ca3af; font-size: 13px; line-height: 1.5;">Please complete your check-in as soon as possible. Regular check-ins are a condition of your bond.</p>
    `),
  };
}

export function paymentLinkEmail({ defendantFirst, amount, paymentUrl }: PaymentLinkParams) {
  return {
    subject: `Payment Request — $${amount.toFixed(2)}`,
    html: layout('Payment Request', `
      <p style="color: #d1d5db; font-size: 15px; line-height: 1.6;">Hi ${defendantFirst},</p>
      <p style="color: #d1d5db; font-size: 15px; line-height: 1.6;">A payment of <strong style="color: #d4af37;">$${amount.toFixed(2)}</strong> has been requested by your bondsman.</p>

      ${infoCard(`
        ${infoRow('Amount Due', `$${amount.toFixed(2)}`)}
      `)}

      <div style="text-align: center; margin: 28px 0;">
        <a href="${paymentUrl}" style="display: inline-block; background: #d4af37; color: #0a0a0a; padding: 14px 32px; text-decoration: none; border-radius: 50px; font-weight: 700; font-size: 18px;">Pay Now</a>
      </div>

      <p style="color: #9ca3af; font-size: 13px; line-height: 1.5;">This link expires in 24 hours. Contact us if you have questions.</p>
    `),
  };
}
