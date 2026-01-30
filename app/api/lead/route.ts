import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

let resend: Resend | null = null;
function getResend() {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, bondAmount, message, urgency } = body;

    // Send email notification
    await getResend().emails.send({
      from: 'Bailbonds Financed <leads@resend.dev>',
      to: process.env.ADMIN_EMAIL || 'doug.cag@gmail.com',
      subject: `🚨 New Lead: ${name} - ${urgency === 'urgent' ? 'URGENT' : 'Normal'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1a4d2e; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; color: #d4af37;">New Bond Lead</h1>
          </div>
          <div style="padding: 20px; background: #f5f5f5;">
            <h2 style="color: #1a4d2e; margin-top: 0;">Contact Information</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Phone:</strong> <a href="tel:${phone}">${phone}</a></p>
            <p><strong>Urgency:</strong> ${urgency === 'urgent' ? '🚨 URGENT - Needs help NOW' : 'Normal'}</p>
            ${bondAmount ? `<p><strong>Estimated Bond Amount:</strong> $${Number(bondAmount).toLocaleString()}</p>` : ''}
            ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
            <hr style="border: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #666; font-size: 14px;">
              Received: ${new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })}
            </p>
            <a href="tel:${phone}" style="display: inline-block; background: #d4af37; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 10px;">
              Call ${name} Now
            </a>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Lead API error:', error);
    return NextResponse.json({ error: 'Failed to submit' }, { status: 500 });
  }
}
