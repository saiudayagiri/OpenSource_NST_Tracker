'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

const LINKS = [
  { href: '/',             label: 'Home'         },
  { href: '/contributors', label: 'Contributors' },
  { href: '/join',         label: 'Join Tracker' },
  { href: '/check-work',   label: 'Check My Work'},
  { href: '/repo-activity', label: 'Repo Activity'},
  { href: '/achievers',    label: 'Hall of Fame' },
  { href: '/programs',     label: 'Programs'     },
  { href: '/get-started',  label: 'Get Started'  },
  { href: '/issues',       label: 'Issues'       },
];

interface Session {
  authenticated: boolean;
  user?: {
    username: string;
    name: string;
    avatarUrl: string;
  };
}

export function Nav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  // Fetch session on mount and route change
  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => setSession(data))
      .catch(() => setSession({ authenticated: false }));
  }, [path]);

  // Close menu on route change
  useEffect(() => { setOpen(false); }, [path]);
  // Prevent body scroll when menu open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#030712]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between gap-4" style={{ height: 52 }}>
          {/* Logo */}
          <Link href="/" className="text-sm font-semibold text-white/80 hover:text-white transition-colors shrink-0">
            Opensource Tracker{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
              NST
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-0.5 overflow-x-auto scrollbar-none">
            {LINKS.map(({ href, label }) => {
              const active = href === '/' ? path === '/' : path === href || path.startsWith(href + '/');
              return (
                <Link
                  key={href}
                  href={href}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-sm transition-all ${
                    active
                      ? 'bg-white/[0.07] text-white'
                      : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2.5">
            {/* Session Widget */}
            {session === null ? (
              <div className="w-16 h-7 rounded-full bg-white/[0.02] animate-pulse hidden sm:block" />
            ) : session.authenticated && session.user ? (
              <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.15] px-2.5 py-1 rounded-full text-xs font-medium text-white/80 transition-all select-none">
                <img
                  src={session.user.avatarUrl}
                  alt={session.user.username}
                  className="w-5 h-5 rounded-full object-cover ring-1 ring-white/10"
                />
                <span className="hidden sm:inline">@{session.user.username}</span>
                <Link
                  href="/api/auth/logout"
                  prefetch={false}
                  className="text-white/30 hover:text-red-400 font-bold ml-1.5 transition-colors"
                  title="Sign Out"
                >
                  ✕
                </Link>
              </div>
            ) : (
              <Link
                href="/api/auth/github"
                prefetch={false}
                className="inline-flex items-center gap-1.5 bg-[#161b22] border border-white/[0.08] hover:bg-[#21262d] hover:border-white/[0.15] text-white px-3 py-1.5 rounded-full text-xs font-semibold transition-all shadow-md active:scale-95 shrink-0"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.479C19.138 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
                Sign In
              </Link>
            )}

            {/* Admin icon */}
            <Link
              href="/admin"
              title="Admin Panel"
              id="admin-nav-link"
              className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                path.startsWith('/admin')
                  ? 'bg-purple-500/20 border border-purple-500/40 text-purple-400'
                  : 'text-white/15 hover:text-white/40 hover:bg-white/[0.05]'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </Link>

            {/* Mobile hamburger */}
            <button
              onClick={() => setOpen((o) => !o)}
              aria-label="Toggle menu"
              className="md:hidden w-8 h-8 flex flex-col items-center justify-center gap-1.5 rounded-lg hover:bg-white/[0.05] transition-all"
            >
              <span className={`block h-px w-4 bg-white/50 transition-all duration-200 ${open ? 'rotate-45 translate-y-[7px]' : ''}`} />
              <span className={`block h-px w-4 bg-white/50 transition-all duration-200 ${open ? 'opacity-0' : ''}`} />
              <span className={`block h-px w-4 bg-white/50 transition-all duration-200 ${open ? '-rotate-45 -translate-y-[7px]' : ''}`} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile slide-out menu */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          {/* Panel */}
          <div className="absolute top-[52px] left-0 right-0 bg-[#030712] border-b border-white/[0.08] shadow-2xl shadow-black/40">
            <div className="flex flex-col py-2 px-2">
              {LINKS.map(({ href, label }) => {
                const active = href === '/' ? path === '/' : path === href || path.startsWith(href + '/');
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${
                      active ? 'bg-white/[0.07] text-white font-medium' : 'text-white/50 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    {label}
                    {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-400" />}
                  </Link>
                );
              })}

              {session?.authenticated && session.user ? (
                <div className="border-t border-white/[0.08] mt-2 pt-2 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={session.user.avatarUrl}
                      alt={session.user.username}
                      className="w-7 h-7 rounded-full object-cover ring-1 ring-white/10"
                    />
                    <div className="text-sm font-semibold text-white">@{session.user.username}</div>
                  </div>
                  <Link
                    href="/api/auth/logout"
                    prefetch={false}
                    className="text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg hover:bg-red-500/15 transition-all"
                  >
                    Sign Out
                  </Link>
                </div>
              ) : (
                <div className="border-t border-white/[0.08] mt-2 pt-4 pb-2 px-4">
                  <Link
                    href="/api/auth/github"
                    prefetch={false}
                    className="w-full flex items-center justify-center gap-2 bg-[#161b22] border border-white/[0.08] hover:bg-[#21262d] hover:border-white/[0.15] text-white py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.479C19.138 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                    </svg>
                    Sign In with GitHub
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
