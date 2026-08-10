import { NextResponse } from 'next/server';
import { verifySessionToken } from './lib/auth';

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  const isAdminApi = pathname.startsWith('/api/admin') && pathname !== '/api/admin/login';
  const isAdminPage = pathname.startsWith('/admin') && pathname !== '/admin/login';

  if (isAdminApi || isAdminPage) {
    const token = req.cookies.get('admin_session')?.value;
    const secret = process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || 'dev-secret';
    const ok = await verifySessionToken(token, secret);
    if (!ok) {
      if (isAdminApi) {
        return NextResponse.json({ error: 'Sessione scaduta, accedi di nuovo.' }, { status: 401 });
      }
      const url = req.nextUrl.clone();
      url.pathname = '/admin/login';
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*']
};
