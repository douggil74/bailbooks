import { NextRequest, NextResponse } from 'next/server';
import { getResend } from '@/lib/resend-server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, bondAmount, message, urgency } = body;

    // Calculate quote estimate
    const amt = parseFloat(bondAmount) || 0;
    const premium = amt * 0.12;
    const downPayment = premium * 0.5;

    const quoteHtml = amt > 0 ? `
      <div style="background: #1a4d2e; color: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
        <h3 style="margin: 0 0 10px 0; color: #d4af37;">Quote Estimate</h3>
        <p style="margin: 4px 0;"><strong>Bond Amount:</strong> $${amt.toLocaleString()}</p>
        <p style="margin: 4px 0;"><strong>12% Premium:</strong> $${premium.toLocaleString()}</p>
        <p style="margin: 4px 0; color: #d4af37; font-size: 18px;"><strong>Est. Down Payment (50%):</strong> $${downPayment.toLocaleString()}</p>
        <p style="margin: 8px 0 0 0; font-size: 12px; color: #ccc; font-style: italic;">Payment arrangements and discounts available upon interview.</p>
      </div>
    ` : '';

    await getResend().emails.send({
      from: 'BailBonds Financed <leads@resend.dev>',
      to: 'doug.cag@gmail.com',
      subject: `New Lead: ${name} - ${urgency === 'urgent' ? 'URGENT' : 'Normal'}${amt > 0 ? ` - $${amt.toLocaleString()} bond` : ''}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1a4d2e; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; color: #d4af37;">New Bond Lead</h1>
          </div>
          <div style="padding: 20px; background: #f5f5f5;">
            <h2 style="color: #1a4d2e; margin-top: 0;">Contact Information</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Phone:</strong> <a href="tel:${phone}">${phone}</a></p>
            <p><strong>Urgency:</strong> ${urgency === 'urgent' ? 'URGENT - Needs help NOW' : 'Normal'}</p>
            ${bondAmount ? `<p><strong>Bond Amount:</strong> $${amt.toLocaleString()}</p>` : ''}
            ${quoteHtml}
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
