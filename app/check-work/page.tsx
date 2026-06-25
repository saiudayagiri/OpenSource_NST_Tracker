'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CheckWorkLandingPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => setAuthenticated(data.authenticated))
      .catch(() => setAuthenticated(false));
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim()) return;

    setLoading(true);
    router.push(`/check-work/${encodeURIComponent(username.trim())}`);
  }

  return (
    <main className="min-h-screen bg-[#030712] flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-purple-600/10 blur-[130px] rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[250px] bg-blue-600/5 blur-[100px] rounded-full" />
      </div>

      <div className="relative w-full max-w-lg">
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
          <div className="flex items-center gap-3.5 mb-6">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500/25 to-blue-500/15 border border-purple-500/20 flex items-center justify-center text-xl">
              🔍
            </div>
            <div>
              <h1 className="text-xl font-bold text-white leading-tight">Check My Work</h1>
              <p className="text-white/35 text-xs mt-0.5">Preview your open-source contributions directly</p>
            </div>
          </div>

          {authenticated === false && (
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4 text-purple-300 text-xs mb-6 flex items-center justify-between gap-3 animate-in fade-in duration-300">
              <span className="leading-relaxed">
                <strong>Sign In Recommended:</strong> Sign in with GitHub to increase API rate limits when loading contributions.
              </span>
              <a
                href="/api/auth/github"
                className="bg-[#161b22] border border-white/[0.08] hover:bg-[#21262d] hover:border-white/[0.15] text-white px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all shrink-0"
              >
                Sign In
              </a>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2.5">
              <label htmlFor="username-input" className="block text-xs font-semibold text-white/45 uppercase tracking-wider">
                Enter GitHub Username
              </label>
              <input
                id="username-input"
                type="text"
                required
                placeholder="e.g. sarthak-gupta229"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                className="w-full bg-white/[0.04] border border-white/[0.09] rounded-2xl px-4 py-3.5 text-white placeholder-white/20 text-sm focus:outline-none focus:border-purple-500/40 focus:bg-white/[0.06] transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !username.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-2xl transition-all shadow-lg shadow-purple-900/30 hover:shadow-purple-900/50 hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Loading contributions…
                </>
              ) : (
                'View My Contributions'
              )}
            </button>
          </form>
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
