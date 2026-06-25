'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  cachedAt: string | null;
  username?: string;
  period?: string;
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  if (diffSecs < 60) return `${diffSecs}s ago`;
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

export function RefreshButton({ cachedAt: initialCachedAt, username, period }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [cachedAt, setCachedAt] = useState(initialCachedAt);
  const [label, setLabel] = useState('');
  const [cooldown, setCooldown] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Sync state if props change
  useEffect(() => {
    setCachedAt(initialCachedAt);
  }, [initialCachedAt]);

  // Tick the "X ago" label every 30 seconds
  useEffect(() => {
    function update() {
      if (cachedAt) setLabel(timeAgo(cachedAt));
    }
    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, [cachedAt]);

  // Auto-clear toast alert after 4 seconds (unless it is loading/info state)
  useEffect(() => {
    if (toast && toast.type !== 'info') {
      const id = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(id);
    }
  }, [toast]);

  async function handleRefresh() {
    setError('');
    setToast({ message: 'Fetching latest data from GitHub...', type: 'info' });
    let url = '/api/refresh';
    if (username) {
      url = `/api/refresh?username=${encodeURIComponent(username)}`;
    } else if (period) {
      url = `/api/refresh?period=${encodeURIComponent(period)}`;
    }

    try {
      const res = await fetch(url, { method: 'POST' });
      if (!res.ok) throw new Error('API request failed');
      const data = await res.json();
      if (data.fromCache) {
        setCooldown(true);
        const msg = data.message || 'Data was refreshed recently. Try again in a few minutes.';
        setError(msg);
        setToast({ message: msg, type: 'error' });
        setTimeout(() => { setCooldown(false); setError(''); }, 8000);
        return;
      }
      if (data.cachedAt) setCachedAt(data.cachedAt);
      setToast({ message: 'Successfully updated leaderboard stats!', type: 'success' });
      // Re-render server components with fresh cache
      startTransition(() => { router.refresh(); });
    } catch {
      setToast({ message: 'Failed to fetch updates. Please try again.', type: 'error' });
    }
  }

  const isLoading = isPending;

  return (
    <div className="flex items-center gap-3">
      {/* Last updated label */}
      {cachedAt && (
        <span className="text-white/25 text-xs flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-white/20 inline-block" />
          Updated {label}
        </span>
      )}
      {!cachedAt && (
        <span className="text-white/20 text-xs">No cache yet</span>
      )}

      {/* Refresh button */}
      <button
        onClick={handleRefresh}
        disabled={isLoading || cooldown}
        id="public-refresh-btn"
        title="Fetch latest data from GitHub"
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
          cooldown
            ? 'bg-white/[0.02] border-white/[0.06] text-white/20 cursor-not-allowed'
            : 'bg-white/[0.03] border-white/[0.08] text-white/40 hover:text-white/70 hover:bg-white/[0.06] hover:border-white/[0.12]'
        }`}
      >
        <svg
          className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        {isLoading ? 'Refreshing…' : 'Refresh'}
      </button>

      {/* Cooldown error */}
      {error && (
        <span className="text-yellow-500/60 text-xs">{error}</span>
      )}

      {/* Custom Premium Toast Alert */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3.5 rounded-xl border border-white/10 bg-[#030712]/90 backdrop-blur-md shadow-2xl text-xs max-w-xs transition-all duration-300">
          {toast.type === 'success' && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          )}
          {toast.type === 'info' && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
          )}
          {toast.type === 'error' && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          )}
          <span className="text-white/80 font-medium">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
