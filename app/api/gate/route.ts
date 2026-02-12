import { NextRequest, NextResponse } from 'next/server';

const ACCESS_CODE = process.env.SITE_PASSWORD || '26262626';

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  if (password !== ACCESS_CODE) {
    return NextResponse.json({ error: 'Wrong code' }, { status: 401 });
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
