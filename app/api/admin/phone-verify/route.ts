import { NextRequest, NextResponse } from 'next/server';

const OSINT_URL = 'https://elite-recovery-osint.fly.dev/api/phone/type';

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();

    if (!phone) {
      return NextResponse.json({ error: 'phone is required' }, { status: 400 });
    }

    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      return NextResponse.json({ error: 'Phone must be at least 10 digits' }, { status: 400 });
    }

    const res = await fetch(OSINT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: digits }),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: text || 'OSINT lookup failed' }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Phone verification failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
