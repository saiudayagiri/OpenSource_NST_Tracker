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

export function Nav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);


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


            </div>
          </div>
        </div>
      )}
    </>
  );
}
