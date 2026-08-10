import { NextResponse } from 'next/server';
import { createSessionToken } from '../../../../lib/auth';

export async function POST(req) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return NextResponse.json(
      { error: 'ADMIN_PASSWORD non è configurata sul server (variabili d\u2019ambiente di Vercel).' },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => ({}));
  if (body.password !== adminPassword) {
    return NextResponse.json({ error: 'Password errata.' }, { status: 401 });
  }

  const secret = process.env.SESSION_SECRET || adminPassword;
  const token = await createSessionToken(secret);

  const res = NextResponse.json({ ok: true });
  res.cookies.set('admin_session', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8
  });
  return res;
}
