import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const cronSecret = process.env.CRON_SECRET;
  const requestSecret = request.headers.get('x-cron-secret') ||
                        request.headers.get('Authorization')?.replace('Bearer ', '');
  const isValidCron = cronSecret && requestSecret === cronSecret;

  // Protect the incremental refresh cron endpoint with a secret
  if (pathname === '/api/refresh/incremental' && !isValidCron) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Everything else is public — no login required
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
