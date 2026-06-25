'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CheckWorkLandingPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user?.username) {
          router.replace(`/check-work/${encodeURIComponent(data.user.username)}`);
        } else {
          setAuthenticated(false);
        }
      })
      .catch(() => setAuthenticated(false));
  }, [router]);

  return (
    <main className="min-h-screen bg-[#030712] flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-purple-600/10 blur-[130px] rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[250px] bg-blue-600/5 blur-[100px] rounded-full" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Navigation back */}
        <div className="flex justify-start mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/30 hover:text-white/60 transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 19l-7-7 7-7" />
            </svg>
            Home
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-3xl p-8 backdrop-blur-md shadow-2xl shadow-black/50">
          <div className="flex items-center gap-3.5 mb-8">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500/25 to-blue-500/15 border border-purple-500/20 flex items-center justify-center text-xl">
              🔍
            </div>
            <div>
              <h1 className="text-xl font-bold text-white leading-tight">Check My Work</h1>
              <p className="text-white/35 text-xs mt-0.5">Verify your open-source contributions</p>
            </div>
          </div>

          {authenticated === null ? (
            /* Loading state */
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <svg className="w-8 h-8 text-purple-500 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-white/40 text-xs">Checking authorization session...</p>
            </div>
          ) : (
            /* Auth wall / Sign-in state */
            <div className="space-y-6">
              <div className="space-y-4">
                <h2 className="text-white/80 font-semibold text-sm">Features:</h2>
                <ul className="space-y-3.5 text-xs text-white/50">
                  <li className="flex items-start gap-2.5">
                    <span className="text-emerald-400">✓</span>
                    <span>Secure verification directly linked to your GitHub profile.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-emerald-400">✓</span>
                    <span>Increases Search API rate limits for reliable contribution previews.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-emerald-400">✓</span>
                    <span>Real-time checking for PR merges, open statuses, and comments.</span>
                  </li>
                </ul>
              </div>

              <div className="pt-2">
                <a
                  href="/api/auth/github"
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold py-3.5 rounded-2xl transition-all shadow-lg shadow-purple-900/30 hover:shadow-purple-900/50 hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer text-sm"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482C19.138 20.193 22 16.44 22 12.017 22 6.484 17.522 2 12 2z" />
                  </svg>
                  Sign In with GitHub
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Info box */}
        <div className="mt-6 text-center text-xs text-white/20 px-4 leading-normal">
          This preview runs directly against live GitHub activity. If you want to permanently showcase your work on the leaderboard, send a request using the{' '}
          <Link href="/join" className="text-purple-400 hover:text-purple-300 underline font-medium">
            Join Tracker
          </Link>{' '}
          page.
        </div>
      </div>
    </main>
  );
}
