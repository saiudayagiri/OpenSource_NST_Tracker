'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useRef } from 'react';

const PRESETS = [
  { label: 'All',      value: 'all'     },
  { label: '1 Day',    value: '1day'    },
  { label: '1 Week',   value: 'week'    },
  { label: '1 Month',  value: 'month'   },
  { label: '2 Months', value: '2months' },
  { label: '3 Months', value: '3months' },
];

const YEARS = ['1st year', '2nd year', '3rd year', '4th year'] as const;
const CAMPUSES = ['ADYPU', 'Rishihood', 'SVYASA'] as const;

export function FilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const period = searchParams.get('period') ?? 'all';
  const searchQuery = searchParams.get('search') ?? '';
  const yearParam = searchParams.get('year') ?? '';
  const campusParam = searchParams.get('campus') ?? '';

  const [showCustom, setShowCustom] = useState(period === 'custom');
  const [from, setFrom] = useState(searchParams.get('from') ?? '');
  const [to, setTo]     = useState(searchParams.get('to')   ?? '');
  const [search, setSearch] = useState(searchQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [prevPeriod, setPrevPeriod] = useState(period);
  if (period !== prevPeriod) {
    setPrevPeriod(period);
    if (period !== 'custom') setShowCustom(false);
  }

  const [prevSearchQuery, setPrevSearchQuery] = useState(searchQuery);
  if (searchQuery !== prevSearchQuery) {
    setPrevSearchQuery(searchQuery);
    setSearch(searchQuery);
  }

  function buildParams(overrides: Record<string, string>) {
    const p = new URLSearchParams();
    const cur = {
      period,
      from: searchParams.get('from') ?? '',
      to: searchParams.get('to') ?? '',
      search,
      year: yearParam,
      campus: campusParam,
    };
    const merged = { ...cur, ...overrides };
    if (merged.period && merged.period !== 'all') p.set('period', merged.period);
    if (merged.from) p.set('from', merged.from);
    if (merged.to) p.set('to', merged.to);
    if (merged.search) p.set('search', merged.search);
    if (merged.year) p.set('year', merged.year);
    if (merged.campus) p.set('campus', merged.campus);
    return p.toString();
  }

  function navigate(value: string) {
    if (value === 'custom') { setShowCustom(true); return; }
    setShowCustom(false);
    const qs = buildParams({ period: value, from: '', to: '' });
    router.push(qs ? `/contributors?${qs}` : '/contributors', { scroll: false });
  }

  function applyCustom() {
    if (!from) return;
    const p = new URLSearchParams({ period: 'custom', from });
    if (to) p.set('to', to);
    if (search) p.set('search', search);
    if (yearParam) p.set('year', yearParam);
    if (campusParam) p.set('campus', campusParam);
    router.push(`/contributors?${p.toString()}`, { scroll: false });
    setShowCustom(false);
  }

  function handleSearch(value: string) {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const qs = buildParams({ search: value });
      router.push(qs ? `/contributors?${qs}` : '/contributors', { scroll: false });
    }, 350);
  }

  function handleYearChange(value: string) {
    const qs = buildParams({ year: value });
    router.push(qs ? `/contributors?${qs}` : '/contributors', { scroll: false });
  }

  function handleCampusChange(value: string) {
    const qs = buildParams({ campus: value });
    router.push(qs ? `/contributors?${qs}` : '/contributors', { scroll: false });
  }

  const isCustomActive = period === 'custom';

  const hasActiveFilters = period !== 'all' || search || yearParam || campusParam;

  return (
    <div className="max-w-6xl mx-auto px-4 pb-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        {/* Search input */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name or username…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/[0.09] text-white/70 placeholder-white/20 text-sm rounded-full pl-9 pr-4 py-1.5 focus:outline-none focus:border-purple-500/40 focus:bg-white/[0.06] transition-all"
          />
          {search && (
            <button
              onClick={() => handleSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Year filter */}
        <div className="relative">
          <select
            value={yearParam}
            onChange={(e) => handleYearChange(e.target.value)}
            className={`appearance-none cursor-pointer px-4 py-1.5 pr-8 rounded-full text-sm font-medium transition-all border focus:outline-none ${
              yearParam
                ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                : 'bg-white/[0.03] border-white/[0.08] text-white/40 hover:text-white/70 hover:border-white/20'
            }`}
          >
            <option value="" className="bg-[#0f1729] text-white/70">All Years</option>
            {YEARS.map((y) => (
              <option key={y} value={y} className="bg-[#0f1729] text-white/70">{y}</option>
            ))}
          </select>
          <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-white/30 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Campus filter */}
        <div className="relative">
          <select
            value={campusParam}
            onChange={(e) => handleCampusChange(e.target.value)}
            className={`appearance-none cursor-pointer px-4 py-1.5 pr-8 rounded-full text-sm font-medium transition-all border focus:outline-none ${
              campusParam
                ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                : 'bg-white/[0.03] border-white/[0.08] text-white/40 hover:text-white/70 hover:border-white/20'
            }`}
          >
            <option value="" className="bg-[#0f1729] text-white/70">All Campuses</option>
            {CAMPUSES.map((c) => (
              <option key={c} value={c} className="bg-[#0f1729] text-white/70">{c}</option>
            ))}
          </select>
          <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-white/30 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Divider */}
        <div className="hidden sm:block h-5 w-px bg-white/[0.08]" />

        {/* Preset pills */}
        <div className="flex flex-wrap items-center gap-2">
          {PRESETS.map(({ label, value }) => {
            const active = period === value;
            return (
              <button
                key={value}
                onClick={() => navigate(value)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                  active
                    ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                    : 'bg-white/[0.03] border-white/[0.08] text-white/40 hover:text-white/70 hover:border-white/20'
                }`}
              >
                {label}
              </button>
            );
          })}

          {/* Custom pill */}
          <button
            onClick={() => navigate('custom')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
              isCustomActive || showCustom
                ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                : 'bg-white/[0.03] border-white/[0.08] text-white/40 hover:text-white/70 hover:border-white/20'
            }`}
          >
            Custom
          </button>
        </div>
      </div>

      {/* Custom date inputs */}
      {showCustom && (
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="bg-white/[0.05] border border-white/[0.12] text-white/70 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-purple-500/50 [color-scheme:dark]"
          />
          <span className="text-white/30 text-sm">→</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            min={from}
            className="bg-white/[0.05] border border-white/[0.12] text-white/70 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-purple-500/50 [color-scheme:dark]"
          />
          <button
            onClick={applyCustom}
            disabled={!from}
            className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-full transition-colors"
          >
            Apply
          </button>
          <button
            onClick={() => setShowCustom(false)}
            className="text-white/30 hover:text-white/60 text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Active filter labels */}
      {hasActiveFilters && (
        <p className="text-white/25 text-xs mt-3 flex flex-wrap gap-x-2 items-center">
          {period !== 'all' && (
            <span>
              {period === 'custom'
                ? `Contributions from ${from}${to ? ` to ${to}` : ' onwards'}`
                : `Last ${
                    period === '1day' ? '24 hours' :
                    period === 'week' ? '7 days' :
                    period === 'month' ? '30 days' :
                    period === '2months' ? '2 months' :
                    '3 months'
                  }`
              }
            </span>
          )}
          {yearParam && (
            <>
              {period !== 'all' && <span className="text-white/15">·</span>}
              <span className="text-purple-400/60">{yearParam}</span>
            </>
          )}
          {campusParam && (
            <>
              {(period !== 'all' || yearParam) && <span className="text-white/15">·</span>}
              <span className="text-blue-400/60">{campusParam}</span>
            </>
          )}
          {search && (
            <>
              {(period !== 'all' || yearParam || campusParam) && <span className="text-white/15">·</span>}
              <span>Searching &ldquo;{search}&rdquo;</span>
            </>
          )}
          <span className="text-white/15">·</span>
          <button
            onClick={() => { setSearch(''); router.push('/contributors', { scroll: false }); }}
            className="underline hover:text-white/50 transition-colors"
          >
            Clear all
          </button>
        </p>
      )}
    </div>
  );
}
