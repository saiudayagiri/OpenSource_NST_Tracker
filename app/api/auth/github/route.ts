import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    console.error('GITHUB_CLIENT_ID is not configured in environment variables.');
    return NextResponse.json(
      { error: 'GitHub OAuth Client ID is not configured.' },
      { status: 500 }
    );
  }

  // If Client ID is mock/ADMIN, bypass the OAuth flow and log in using local GITHUB_TOKEN
  if (clientId === 'ADMIN' && process.env.GITHUB_TOKEN) {
    const cookieStore = await cookies();
    cookieStore.set('github_oauth_token', process.env.GITHUB_TOKEN, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Generate GitHub login URL
  const githubUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=read:user`;

  return NextResponse.redirect(githubUrl);
}

