import { getProgramMeta, type PersonEntry } from '@/lib/data';
import { getAchieversKV } from '@/lib/kv-achievers';
import { getStudentProfile, type GitHubUser } from '@/lib/github';
import { readProfileCache } from '@/lib/profile-cache';
import Image from 'next/image';
import Link from 'next/link';

export const revalidate = 3600;
export const metadata = { title: 'Hall of Fame — Opensource Tracker NST' };

function InitialsAvatar({ name, size = 56 }: { name: string; size?: number }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
  const colors = [
    'from-purple-500 to-blue-500',
    'from-blue-500 to-cyan-500',
    'from-emerald-500 to-teal-500',
    'from-orange-500 to-amber-500',
    'from-pink-500 to-rose-500',
    'from-violet-500 to-purple-500',
  ];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div
      style={{ width: size, height: size }}
      className={`rounded-full bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0 ring-2 ring-white/10`}
    >
      <span className="text-white font-bold" style={{ fontSize: size * 0.35 }}>
        {initials}
      </span>
    </div>
  );
}

function AchieverCard({
  entry,
  profile,
  index,
}: {
  entry: PersonEntry;
  profile: GitHubUser | null;
  index: number;
}) {
  const displayName = profile?.name ?? entry.name ?? entry.github;
  const handle = profile?.login ?? entry.github;
  const bio = entry.headline ?? profile?.bio;

  const inner = (
    <div className="group relative bg-white/[0.025] border border-white/[0.07] rounded-2xl p-6 hover:bg-white/[0.055] hover:border-yellow-500/35 transition-all duration-300 hover:shadow-xl hover:shadow-yellow-500/10 hover:-translate-y-1 h-full">
      {index < 3 && (
        <div className="absolute top-4 right-4 text-lg">
          {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
        </div>
      )}

      <div className="flex items-start gap-4 mb-4">
        {profile ? (
          <Image
            src={profile.avatar_url}
            alt={displayName}
            width={56}
            height={56}
            className="w-14 h-14 rounded-full ring-2 ring-white/10 group-hover:ring-yellow-500/30 transition-all object-cover flex-shrink-0"
          />
        ) : (
          <div className="group-hover:[--ring-color:rgba(234,179,8,0.3)] transition-all">
            <InitialsAvatar name={displayName} size={56} />
          </div>
        )}

        <div className="flex-1 min-w-0 pt-0.5">
          <h3 className="font-semibold text-white/90 group-hover:text-white truncate transition-colors">
            {displayName}
          </h3>
          <p className="text-white/35 text-xs mt-0.5">@{handle}</p>
          {bio && (
            <p className="text-white/40 text-xs mt-1.5 line-clamp-2 leading-relaxed">{bio}</p>
          )}
        </div>
      </div>

      {/* Program badges */}
      <div className="flex flex-wrap gap-1.5">
        {entry.programs.map((prog, i) => {
          const meta = getProgramMeta(prog.name);
          return (
            <span
              key={i}
              className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border ${meta.bg} ${meta.color} ${meta.border}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
              {prog.name}
              {prog.year && <span className="opacity-60">{prog.year}</span>}
              {prog.org && <span className="opacity-50">· {prog.org}</span>}
            </span>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-white/20 text-xs group-hover:text-white/40 transition-colors">
          View achievements
        </span>
        <svg
          className="w-4 h-4 text-white/15 group-hover:text-yellow-400 group-hover:translate-x-0.5 transition-all"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );

  return profile ? (
    <Link href={`/achievers/${entry.github}`} className="block h-full">
      {inner}
    </Link>
  ) : (
    <div className="h-full">{inner}</div>
  );
}

export default async function AchieversPage() {
  const entries = await getAchieversKV();

  const achievers = await Promise.all(
    entries.map(async (e) => {
      let profile = null;
      try {
        const cached = await readProfileCache(e.github);
        if (cached) {
          profile = cached.profile;
        } else {
          profile = await getStudentProfile(e.github);
        }
      } catch (err) {
        console.error(`Failed to load profile for achiever ${e.github}:`, err);
      }
      return {
        entry: e,
        profile,
      };
    })
  );

  const programCount = achievers.reduce((n, a) => n + a.entry.programs.length, 0);
  const programSet = new Set(achievers.flatMap((a) => a.entry.programs.map((p) => p.name)));

  return (
    <main className="min-h-screen bg-[#030712]">
      <div className="relative overflow-hidden pt-14 pb-10 px-4">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute top-0 left-1/3 w-[500px] h-[350px] rounded-full bg-yellow-600/6 blur-[100px]" />
          <div className="absolute top-0 right-1/3 w-[400px] h-[300px] rounded-full bg-amber-600/6 blur-[100px]" />
        </div>

        <div className="relative max-w-6xl mx-auto text-center">
          <div className="flex justify-start mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-white/30 hover:text-white/60 transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
              </svg>
              Home
            </Link>
          </div>

          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-xs text-yellow-300/70 mb-6">
            Students who cracked top open source programs
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 tracking-tight">
            Hall of{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400">
              Fame
            </span>
          </h1>
          <p className="text-white/40 text-lg max-w-lg mx-auto mb-10">
            Our students who got selected into prestigious open source programs.
          </p>

          {achievers.length > 0 && (
            <div className="flex flex-wrap justify-center gap-3">
              {[
                { label: 'Achievers', value: achievers.length },
                { label: 'Selections', value: programCount },
                { label: 'Programs', value: programSet.size },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white/[0.04] border border-white/[0.08] rounded-2xl px-8 py-4"
                >
                  <div className="text-3xl font-bold text-white tabular-nums">{stat.value}</div>
                  <div className="text-white/35 text-sm mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-24">
        {achievers.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-2xl font-bold text-white mb-2">Coming Soon</h2>
            <p className="text-white/35 text-sm max-w-xs mx-auto">
              Our Hall of Fame is being built. NST students who crack GSoC, LFX, Outreachy and more will be celebrated here.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link href="/programs" className="text-xs px-4 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400/70 hover:text-yellow-400 transition-all">
                Learn about programs →
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {achievers.map(({ entry, profile }, index) => (
              <AchieverCard key={entry.github} entry={entry} profile={profile} index={index} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
