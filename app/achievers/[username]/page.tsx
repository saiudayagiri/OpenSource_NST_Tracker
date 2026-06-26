import { getProgramMeta } from '@/lib/data';
import { getAchieverKV } from '@/lib/kv-achievers';
import { getStudentProfile, getStudentPRs, getStudentIssues, repoFromUrl, StudentPR } from '@/lib/github';
import { readProfileCache, writeProfileCache, isProfileFresh } from '@/lib/profile-cache';
import { getStudentsKV } from '@/lib/kv-students';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return { title: `${username} — Hall of Fame` };
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default async function AchieverPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const [entry, students] = await Promise.all([getAchieverKV(username), getStudentsKV()]);
  if (!entry) notFound();
  const student = students.find((s) => s.github.toLowerCase() === username.toLowerCase());

  let profile = null;
  let prs: StudentPR[] = [];

  const cached = await readProfileCache(username);
  if (cached && isProfileFresh(cached)) {
    profile = cached.profile;
    prs = cached.prs;
  } else {
    try {
      const [freshProfile, freshPRs] = await Promise.all([
        getStudentProfile(username),
        getStudentPRs(username),
      ]);
      const freshIssues = await getStudentIssues(username);
      if (freshProfile && freshPRs !== null && freshIssues !== null) {
        profile = freshProfile;
        prs = freshPRs;
        await writeProfileCache(username, freshProfile, freshPRs, freshIssues);
      } else if (cached) {
        profile = cached.profile;
        prs = cached.prs;
      }
    } catch {
      if (cached) {
        profile = cached.profile;
        prs = cached.prs;
      }
    }
  }

  if (!profile) notFound();

  const mergedCount = prs.filter(pr => pr.pull_request?.merged_at).length;
  const repoCount   = new Set(prs.map(pr => repoFromUrl(pr.repository_url))).size;

  return (
    <main className="min-h-screen bg-[#030712]">
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <Link href="/achievers" className="inline-flex items-center gap-2 text-white/30 hover:text-white/70 transition-colors text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
          Hall of Fame
        </Link>
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden pt-8 pb-8 px-4">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-yellow-600/6 blur-[80px] rounded-full" />
        </div>

        <div className="relative max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <Image
              src={profile.avatar_url}
              alt={profile.login}
              width={112}
              height={112}
              className="w-28 h-28 rounded-full ring-4 ring-yellow-500/20 shadow-2xl object-cover flex-shrink-0"
            />
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl font-bold text-white">{profile.name ?? profile.login}</h1>
              <p className="text-white/40 text-sm mt-0.5">@{profile.login}</p>
              {(student?.year || student?.campus) && (
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 mt-1.5">
                  {student.year && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/25 text-purple-400 font-medium">
                      🎓 {student.year}
                    </span>
                  )}
                  {student.campus && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 font-medium">
                      📍 {student.campus}
                    </span>
                  )}
                </div>
              )}
              <p className="text-white/55 mt-3 max-w-lg leading-relaxed">
                {entry.headline ?? profile.bio}
              </p>
              <div className="flex flex-wrap gap-4 mt-4 justify-center sm:justify-start text-sm text-white/35">
                {profile.location && (
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M8 0a5 5 0 0 0-5 5c0 2.76 2.5 4.9 5 8 2.5-3.1 5-5.24 5-8a5 5 0 0 0-5-5zm0 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" />
                    </svg>
                    {profile.location}
                  </span>
                )}
                <a href={profile.html_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-white/70 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
                  </svg>
                  GitHub
                </a>
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3 mt-8">
            {[
              { label: 'Contributions', value: prs.length,    color: 'text-yellow-400'  },
              { label: 'Merged PRs',    value: mergedCount,   color: 'text-emerald-400' },
              { label: 'Repos',         value: repoCount,     color: 'text-white'       },
            ].map(stat => (
              <div key={stat.label} className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 text-center">
                <div className={`text-2xl font-bold tabular-nums ${stat.color}`}>{stat.value}</div>
                <div className="text-white/35 text-xs mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-24 space-y-10">

        {/* Program achievements */}
        {entry.programs.length > 0 && (
          <section>
            <h2 className="text-white/50 text-xs font-medium uppercase tracking-widest mb-4">
              Program Achievements
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {entry.programs.map((prog, i) => {
                const meta = getProgramMeta(prog.name);
                const card = (
                  <div className={`rounded-2xl border p-5 ${meta.bg} ${meta.border} ${prog.url ? 'hover:opacity-90 transition-opacity cursor-pointer' : ''}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className={`text-base font-semibold ${meta.color}`}>{prog.name}</div>
                        <div className="text-white/50 text-sm mt-0.5">{meta.label}</div>
                        {prog.org && <div className="text-white/35 text-xs mt-1">{prog.org}</div>}
                      </div>
                      {prog.year && (
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${meta.bg} ${meta.color} border ${meta.border}`}>
                          {prog.year}
                        </span>
                      )}
                    </div>
                    {prog.url && (
                      <div className={`mt-4 flex items-center gap-1.5 text-xs ${meta.color}`}>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        View project
                      </div>
                    )}
                  </div>
                );
                return prog.url ? (
                  <a key={i} href={prog.url} target="_blank" rel="noopener noreferrer">{card}</a>
                ) : (
                  <div key={i}>{card}</div>
                );
              })}
            </div>
          </section>
        )}

        {/* Recent contributions */}
        {prs.length > 0 && (
          <section>
            <h2 className="text-white/50 text-xs font-medium uppercase tracking-widest mb-4">
              Open Source Contributions
            </h2>
            <div className="space-y-2">
              {prs.slice(0, 10).map(pr => (
                <a key={pr.id} href={pr.pull_request?.html_url ?? pr.html_url} target="_blank" rel="noopener noreferrer"
                  className="group flex items-start gap-4 bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 hover:bg-white/[0.045] hover:border-white/[0.1] transition-all">
                  <div className="flex-shrink-0 mt-0.5">
                    {pr.pull_request?.merged_at ? (
                      <span className="inline-flex items-center bg-purple-500/15 text-purple-400 border border-purple-500/25 px-2.5 py-1 rounded-full text-xs font-medium">Merged</span>
                    ) : pr.state === 'open' ? (
                      <span className="inline-flex items-center bg-teal-500/15 text-teal-400 border border-teal-500/25 px-2.5 py-1 rounded-full text-xs font-medium">Open</span>
                    ) : (
                      <span className="inline-flex items-center bg-red-500/15 text-red-400 border border-red-500/25 px-2.5 py-1 rounded-full text-xs font-medium">Closed</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white/85 font-medium group-hover:text-white transition-colors leading-snug">{pr.title}</h3>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-white/30 text-xs font-mono">{repoFromUrl(pr.repository_url)}</span>
                      <span className="text-white/20 text-xs">{formatDate(pr.created_at)}</span>
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-white/15 group-hover:text-white/40 flex-shrink-0 mt-0.5 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
