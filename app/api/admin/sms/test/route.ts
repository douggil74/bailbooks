import { NextResponse } from 'next/server';
import { sendSMS } from '@/lib/twilio-server';

export async function GET() {
  const testPhone = '+19852372805';

  try {
    const result = await sendSMS(testPhone, 'BailBonds SMS test — if you see this, SignalWire is working.');
    return NextResponse.json({
      success: true,
      to: testPhone,
      sid: result.sid,
      status: result.status,
    });
  } catch (err) {
    return NextResponse.json({
      success: false,
      to: testPhone,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
