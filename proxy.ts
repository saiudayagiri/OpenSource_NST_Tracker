import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const cronSecret = process.env.CRON_SECRET;
  const requestSecret = request.headers.get('x-cron-secret') || 
                        request.headers.get('Authorization')?.replace('Bearer ', '');
  const isValidCron = cronSecret && requestSecret === cronSecret;

  // 1. Exclude auth endpoints, public assets, login page, and valid cron requests
  if (
    pathname.startsWith('/api/auth') ||
    pathname === '/login' ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    pathname.match(/\.(png|jpg|jpeg|svg|gif|webp)$/) ||
    (pathname === '/api/refresh/incremental' && isValidCron)
  ) {
    return NextResponse.next();
  }

  // 2. Resolve authentication status from cookies
  const token = request.cookies.get('github_oauth_token')?.value;

  // 3. Redirect unauthenticated visitors to /login or return 401 for APIs
  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
