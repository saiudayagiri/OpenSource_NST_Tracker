'use client';

import Link from 'next/link';

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#030712] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-purple-600/10 blur-[130px] rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[300px] bg-blue-600/5 blur-[100px] rounded-full" />
      </div>

      <div className="relative w-full max-w-md text-center">
        {/* Title / Logo */}
        <div className="mb-8 animate-in fade-in slide-in-from-top-3 duration-500">
          <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/25 rounded-full px-4 py-1.5 text-xs font-semibold text-purple-300 mb-4">
            🔒 Protected Platform
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Opensource Tracker{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
              NST
            </span>
          </h1>
          <p className="text-white/40 text-sm mt-2 leading-relaxed">
            Welcome! To access the leaderboard, scan repositories, or check your contributions, please authenticate.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-3xl p-8 backdrop-blur-md shadow-2xl shadow-black/50 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-purple-500/25 to-blue-500/15 border border-purple-500/20 flex items-center justify-center text-2xl mb-6 shadow-inner">
            🔑
          </div>
          
          <h2 className="text-lg font-bold text-white mb-2">GitHub Authentication Required</h2>
          <p className="text-white/35 text-xs mb-8 leading-normal">
            This platform uses GitHub credentials to authenticate developers and verify access control permissions.
          </p>

          <Link
            href="/api/auth/github"
            prefetch={false}
            className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold py-3.5 rounded-2xl transition-all shadow-lg shadow-purple-900/30 hover:shadow-purple-900/50 hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.479C19.138 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
            </svg>
            Sign In with GitHub
          </Link>
        </div>

        {/* Footer info */}
        <div className="mt-8 text-xs text-white/20 px-4 leading-relaxed animate-in fade-in duration-1000">
          Secured via GitHub OAuth. We only request read-only access to your public profile parameters.
        </div>
      </div>
    </main>
  );
}
