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

function layout(title: string, body: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1a4d2e; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0; color: #d4af37;">${title}</h1>
      </div>
      <div style="padding: 20px; background: #f5f5f5;">
        ${body}
      </div>
      <div style="padding: 15px; text-align: center; background: #1a4d2e;">
        <p style="margin: 0; color: #ccc; font-size: 12px;">Bailbonds Financed &mdash; St. Tammany Parish, LA</p>
      </div>
    </div>
  `;
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
      <p style="color: #333;">Hi ${defendantFirst},</p>
      <p style="color: #333;">This is a reminder that your court date is <strong>${urgency}</strong>.</p>
      <div style="background: white; border-left: 4px solid #d4af37; padding: 15px; margin: 15px 0; border-radius: 4px;">
        <p style="margin: 4px 0; color: #333;"><strong>Date:</strong> ${formatted}</p>
        <p style="margin: 4px 0; color: #333;"><strong>Court:</strong> ${courtName}</p>
      </div>
      <p style="color: #333;">Please arrive on time. Failure to appear may result in bond revocation and a warrant for your arrest.</p>
      <p style="color: #666; font-size: 13px;">If you have questions, contact us immediately.</p>
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
      <p style="color: #333;">Hi ${defendantFirst},</p>
      <p style="color: #333;">This is a reminder that your payment is due <strong>${urgency}</strong>.</p>
      <div style="background: white; border-left: 4px solid #d4af37; padding: 15px; margin: 15px 0; border-radius: 4px;">
        <p style="margin: 4px 0; color: #333;"><strong>Amount Due:</strong> $${paymentAmount.toLocaleString()}</p>
        <p style="margin: 4px 0; color: #333;"><strong>Due Date:</strong> ${formatted}</p>
      </div>
      <p style="color: #333;">Please ensure your payment is made on time to remain in good standing.</p>
      <p style="color: #666; font-size: 13px;">Contact us if you need to make alternate arrangements.</p>
    `),
  };
}

export function checkinReminderEmail({ defendantFirst, checkinUrl }: CheckinReminderParams) {
  return {
    subject: 'Check-in Reminder — Action Required',
    html: layout('Check-in Reminder', `
      <p style="color: #333;">Hi ${defendantFirst},</p>
      <p style="color: #333;">It&rsquo;s time for your scheduled check-in with Bailbonds Financed.</p>
      <div style="text-align: center; margin: 20px 0;">
        <a href="${checkinUrl}" style="display: inline-block; background: #d4af37; color: #000; padding: 14px 28px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
          Check In Now
        </a>
      </div>
      <p style="color: #666; font-size: 13px;">Please complete your check-in as soon as possible. Regular check-ins are a condition of your bond.</p>
    `),
  };
}
