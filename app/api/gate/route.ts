import { NextRequest, NextResponse } from 'next/server';

const SITE_PASSWORD = process.env.SITE_PASSWORD || '';

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  if (!SITE_PASSWORD) {
    return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  }

  if (password !== SITE_PASSWORD) {
    return NextResponse.json({ error: 'Wrong password' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set('site_auth', 'ok', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return res;
}
