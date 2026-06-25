import {
  getStudentPRs,
  getStudentIssues,
  getStudentProfile,
  StudentPR,
  StudentIssue,
  repoFromUrl,
  GitHubRateLimitError,
} from '@/lib/github';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ShareButton } from '../../contributors/ShareButton';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return { title: `Preview: ${username} — Opensource Tracker` };
}

type Tab = 'prs' | 'merged' | 'open' | 'issues';

// ─── Status badges ────────────────────────────────────────────────────────────

function PRBadge({ pr }: { pr: StudentPR }) {
  if (pr.pull_request?.merged_at)
    return (
      <span className="inline-flex items-center gap-1.5 bg-purple-500/15 text-purple-400 border border-purple-500/25 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap">
        <MergedIcon /> Merged
      </span>
    );
  if (pr.state === 'open')
    return (
      <span className="inline-flex items-center gap-1.5 bg-teal-500/15 text-teal-400 border border-teal-500/25 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap">
        <OpenIcon /> Open
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 bg-red-500/15 text-red-400 border border-red-500/25 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap">
      <ClosedIcon /> Closed
    </span>
  );
}

function IssueBadge({ issue }: { issue: StudentIssue }) {
  if (issue.state === 'open')
    return (
      <span className="inline-flex items-center gap-1.5 bg-teal-500/15 text-teal-400 border border-teal-500/25 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap">
        <IssueOpenIcon /> Open
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 bg-purple-500/15 text-purple-400 border border-purple-500/25 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap">
      <IssueClosedIcon /> Closed
    </span>
  );
}

// ─── Tiny SVG icons ────────────────────────────────────────────────────────────

function MergedIcon() {
  return (
    <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 16 16">
      <path d="M5.45 5.154A4.25 4.25 0 0 0 9.25 7.5h1.378a2.251 2.251 0 1 1 0 1.5H9.25A5.734 5.734 0 0 1 5 7.123v3.505a2.25 2.25 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.95-.218zm.55-.682a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0zM7.5 12.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0zm3.75-2.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5z" />
    </svg>
  );
}
function OpenIcon() {
  return (
    <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 16 16">
      <path d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854v2.293h.5a3.5 3.5 0 0 1 3.5 3.5v5.372a2.25 2.25 0 1 1-1.5 0V6.647a2 2 0 0 0-2-2H10v2.293a.25.25 0 0 1-.427.177L7.177 4.471a.25.25 0 0 1 0-.354zM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5zm8.25.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0z" />
    </svg>
  );
}
function ClosedIcon() {
  return (
    <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 16 16">
      <path d="M3.25 1A2.25 2.25 0 0 1 4 5.372v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 3.25 1zm9.5 14a2.25 2.25 0 1 1 0-4.5 2.25 2.25 0 0 1 0 4.5zM3.25 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5zm9.5 0a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5z" />
    </svg>
  );
}
function IssueOpenIcon() {
  return (
    <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 16 16">
      <path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />
      <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0z" />
    </svg>
  );
}
function IssueClosedIcon() {
  return (
    <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 16 16">
      <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm10.28-1.72-4.5 4.5a.75.75 0 0 1-1.06 0l-2-2a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018l1.47 1.47 3.97-3.97a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042Z" />
    </svg>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Labels({ labels }: { labels: Array<{ id: number; name: string; color: string }> }) {
  if (!labels.length) return null;
  return (
    <>
      {labels.slice(0, 4).map((label) => (
        <span
          key={label.id}
          className="text-xs px-1.5 py-0.5 rounded-full"
          style={{
            backgroundColor: `#${label.color}22`,
            color: `#${label.color}`,
            border: `1px solid #${label.color}44`,
          }}
        >
          {label.name}
        </span>
      ))}
    </>
  );
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function ExternalIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0 text-white/15 group-hover:text-white/40 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}

// ─── Content sections ─────────────────────────────────────────────────────────

function PRsSection({ prs }: { prs: StudentPR[] }) {
  const byRepo = new Map<string, StudentPR[]>();
  for (const pr of prs) {
    const repo = repoFromUrl(pr.repository_url);
    if (!byRepo.has(repo)) byRepo.set(repo, []);
    byRepo.get(repo)!.push(pr);
  }

  if (prs.length === 0)
    return <Empty text="No collaborative pull requests found." />;

  return (
    <div className="space-y-8">
      {Array.from(byRepo.entries()).map(([repo, repoPRs]) => (
        <div key={repo}>
          <RepoHeader repo={repo} count={repoPRs.length} />
          <div className="space-y-2">
            {repoPRs.map((pr) => (
              <a key={pr.id} href={pr.pull_request?.html_url ?? pr.html_url} target="_blank" rel="noopener noreferrer"
                className="group flex items-start gap-4 bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 hover:bg-white/[0.045] hover:border-white/[0.1] transition-all">
                <div className="flex-shrink-0 mt-0.5"><PRBadge pr={pr} /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-white/85 font-medium group-hover:text-white transition-colors leading-snug">{pr.title}</h3>
                    <span className="text-white/20 text-xs flex-shrink-0 tabular-nums mt-0.5">#{pr.number}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <span className="text-white/25 text-xs">{formatDate(pr.created_at)}</span>
                    {pr.draft && <span className="text-xs text-white/30 border border-white/10 px-1.5 py-0.5 rounded">Draft</span>}
                    <Labels labels={pr.labels} />
                  </div>
                </div>
                <ExternalIcon />
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function IssuesSection({ issues }: { issues: StudentIssue[] }) {
  const byRepo = new Map<string, StudentIssue[]>();
  for (const issue of issues) {
    const repo = repoFromUrl(issue.repository_url);
    if (!byRepo.has(repo)) byRepo.set(repo, []);
    byRepo.get(repo)!.push(issue);
  }

  if (issues.length === 0)
    return <Empty text="No issues found in other repositories." />;

  return (
    <div className="space-y-8">
      {Array.from(byRepo.entries()).map(([repo, repoIssues]) => (
        <div key={repo}>
          <RepoHeader repo={repo} count={repoIssues.length} />
          <div className="space-y-2">
            {repoIssues.map((issue) => (
              <a key={issue.id} href={issue.html_url} target="_blank" rel="noopener noreferrer"
                className="group flex items-start gap-4 bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 hover:bg-white/[0.045] hover:border-white/[0.1] transition-all">
                <div className="flex-shrink-0 mt-0.5"><IssueBadge issue={issue} /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-white/85 font-medium group-hover:text-white transition-colors leading-snug">{issue.title}</h3>
                    <span className="text-white/20 text-xs flex-shrink-0 tabular-nums mt-0.5">#{issue.number}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <span className="text-white/25 text-xs">{formatDate(issue.created_at)}</span>
                    {issue.comments > 0 && (
                      <span className="text-white/25 text-xs flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M1 2.75C1 1.784 1.784 1 2.75 1h10.5c.966 0 1.75.784 1.75 1.75v7.5A1.75 1.75 0 0 1 13.25 12H9.06l-2.573 2.573A1.458 1.458 0 0 1 4 13.543V12H2.75A1.75 1.75 0 0 1 1 10.25Z" />
                        </svg>
                        {issue.comments}
                      </span>
                    )}
                    <Labels labels={issue.labels} />
                  </div>
                </div>
                <ExternalIcon />
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function RepoHeader({ repo, count }: { repo: string; count: number }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <a href={`https://github.com/${repo}`} target="_blank" rel="noopener noreferrer"
        className="text-white/50 text-sm font-mono hover:text-purple-300 transition-colors flex items-center gap-1.5">
        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 16 16">
          <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8Z" />
        </svg>
        {repo}
      </a>
      <span className="bg-white/[0.06] text-white/30 text-xs px-2 py-0.5 rounded-full">
        {count}
      </span>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="text-center py-16 text-white/25">{text}</div>;
}

// ─── Badges & Chart Helpers ───────────────────────────────────────────────────

interface Badge {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  style: string;
}

function getBadges(allPRs: StudentPR[], mergedCount: number): Badge[] {
  const list: Badge[] = [];
  if (mergedCount >= 1) {
    list.push({
      id: 'first_merge',
      name: 'First Merge',
      emoji: '🌱',
      desc: 'First collaborative pull request merged',
      style: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/15',
    });
  }
  if (mergedCount >= 10) {
    list.push({
      id: 'merging_machine',
      name: 'Merging Machine',
      emoji: '🔥',
      desc: '10+ open-source contributions merged',
      style: 'bg-orange-500/10 border-orange-500/20 text-orange-400 hover:bg-orange-500/15',
    });
  }
  const hasBugFix = allPRs.some((pr) => {
    const title = pr.title.toLowerCase();
    const hasBugLabel = pr.labels.some((l) => {
      const name = l.name.toLowerCase();
      return name.includes('bug') || name.includes('fix');
    });
    return pr.pull_request?.merged_at && (title.includes('fix') || title.includes('bug') || hasBugLabel);
  });
  if (hasBugFix) {
    list.push({
      id: 'bug_squasher',
      name: 'Bug Squasher',
      emoji: '🐞',
      desc: 'Squashed bugs in collaborative projects',
      style: 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/15',
    });
  }
  const hasDocs = allPRs.some((pr) => {
    const title = pr.title.toLowerCase();
    const hasDocLabel = pr.labels.some((l) => {
      const name = l.name.toLowerCase();
      return name.includes('doc') || name.includes('documentation') || name.includes('readme');
    });
    return pr.pull_request?.merged_at && (title.includes('doc') || title.includes('readme') || hasDocLabel);
  });
  if (hasDocs) {
    list.push({
      id: 'doc_hero',
      name: 'Doc Hero',
      emoji: '📚',
      desc: 'Merged documentation improvements',
      style: 'bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/15',
    });
  }
  return list;
}

function getChartData(prs: StudentPR[]) {
  const months: Array<{ label: string; year: number; month: number; count: number }> = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      label: d.toLocaleDateString('en-US', { month: 'short' }),
      year: d.getFullYear(),
      month: d.getMonth(),
      count: 0,
    });
  }
  for (const pr of prs) {
    const prDate = new Date(pr.created_at);
    const y = prDate.getFullYear();
    const m = prDate.getMonth();
    const match = months.find((mo) => mo.year === y && mo.month === m);
    if (match) match.count++;
  }
  return months;
}

function ContributionChart({ prs }: { prs: StudentPR[] }) {
  const months = getChartData(prs);
  const maxVal = Math.max(...months.map((m) => m.count));
  const displayMax = maxVal === 0 ? 5 : maxVal;

  const width = 500;
  const height = 140;
  const paddingLeft = 35;
  const paddingRight = 15;
  const paddingTop = 15;
  const paddingBottom = 25;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const points = months.map((m, i) => {
    const x = paddingLeft + (i * chartWidth) / 5;
    const y = paddingTop + chartHeight - (m.count / displayMax) * chartHeight;
    return { x, y, value: m.count, label: m.label };
  });

  const lineD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${lineD} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`;

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 relative overflow-hidden backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white/60 text-xs font-semibold uppercase tracking-wider">Contribution Trend (PRs / Month)</h2>
        {maxVal > 0 && (
          <span className="text-purple-400 text-xs font-medium">
            Peak: {maxVal} PR{maxVal > 1 ? 's' : ''}/mo
          </span>
        )}
      </div>

      <div className="w-full">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id="area-glow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.01" />
            </linearGradient>
            <linearGradient id="line-glow" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#c084fc" />
              <stop offset="50%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#60a5fa" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.5, 1].map((ratio) => {
            const y = paddingTop + ratio * chartHeight;
            const labelValue = Math.round(displayMax - ratio * displayMax);
            return (
              <g key={ratio}>
                <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} className="stroke-white/[0.05] stroke-1" strokeDasharray="4 4" />
                <text x={paddingLeft - 8} y={y + 3} textAnchor="end" className="text-[9px] fill-white/20 font-mono font-medium">{maxVal === 0 && ratio > 0 ? '' : labelValue}</text>
              </g>
            );
          })}

          {/* Area fill */}
          {maxVal > 0 && <path d={areaD} fill="url(#area-glow)" />}

          {/* Glowing Line */}
          {maxVal > 0 ? (
            <path d={lineD} fill="none" stroke="url(#line-glow)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          ) : (
            <line x1={paddingLeft} y1={paddingTop + chartHeight} x2={width - paddingRight} y2={paddingTop + chartHeight} className="stroke-white/10 stroke-[1.5px]" />
          )}

          {/* Data Points */}
          {maxVal > 0 &&
            points.map((p, i) => (
              <g key={i} className="group/point">
                <circle cx={p.x} cy={p.y} r="6" className="fill-purple-500/0 stroke-purple-500/0 cursor-help" />
                <circle cx={p.x} cy={p.y} r="3.5" className="fill-[#030712] stroke-purple-400 stroke-2 transition-all group-hover/point:r-5 group-hover/point:fill-purple-400" />
                {p.value > 0 && (
                  <g className="opacity-0 group-hover/point:opacity-100 transition-opacity pointer-events-none">
                    <rect x={p.x - 14} y={p.y - 22} width="28" height="15" rx="4" className="fill-[#141424] stroke-white/10 stroke-[0.5px]" />
                    <text x={p.x} y={p.y - 12} textAnchor="middle" className="text-[9px] font-bold fill-white/80 font-mono">{p.value}</text>
                  </g>
                )}
              </g>
            ))}

          {/* X-axis labels */}
          {points.map((p, i) => (
            <text key={i} x={p.x} y={height - 5} textAnchor="middle" className="text-[9px] fill-white/30 font-medium">{p.label}</text>
          ))}
        </svg>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default async function CheckWorkUserPage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const [{ username }, { tab: rawTab }] = await Promise.all([params, searchParams]);
  const tab: Tab = rawTab === 'issues' ? 'issues' : rawTab === 'merged' ? 'merged' : rawTab === 'open' ? 'open' : 'prs';

  let profile = null;
  let allPRs: StudentPR[] = [];
  let issues: StudentIssue[] = [];
  let isRateLimited = false;
  let genericError = false;

  try {
    profile = await getStudentProfile(username);
    if (profile) {
      const [prsRes, issuesRes] = await Promise.all([
        getStudentPRs(username),
        getStudentIssues(username),
      ]);
      if (prsRes === null || issuesRes === null) {
        throw new Error('API_ERROR');
      }
      allPRs = prsRes;
      issues = issuesRes;
    }
  } catch (err: any) {
    console.error('Error fetching check-work details:', err);
    if (err instanceof GitHubRateLimitError || err.message === 'RATE_LIMIT') {
      isRateLimited = true;
    } else {
      genericError = true;
    }
  }

  // 1. Rate Limit Error Page
  if (isRateLimited) {
    return (
      <main className="min-h-screen bg-[#030712] flex flex-col items-center justify-center text-center px-4 py-12">
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-3xl p-8 max-w-md backdrop-blur-md shadow-2xl shadow-black/50">
          <div className="text-4xl mb-4">⏳</div>
          <h1 className="text-xl font-bold text-white mb-3">GitHub API Rate Limit Hit</h1>
          <p className="text-white/40 text-sm leading-relaxed mb-6">
            The public GitHub API search rate limit has been hit. Please sign in with your GitHub account to authenticate your requests and get your personal high rate limits (5,000 requests/hour).
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/api/auth/github"
              prefetch={false}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white py-3 rounded-xl text-sm font-semibold transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.479C19.138 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
              Sign In with GitHub
            </Link>
            <Link
              href="/"
              className="text-white/40 hover:text-white text-xs font-semibold py-2 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // 2. Generic Error or Not Found Page
  if (!profile || genericError) {
    return (
      <main className="min-h-screen bg-[#030712] flex flex-col items-center justify-center text-center px-4 py-12">
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-3xl p-8 max-w-md backdrop-blur-md">
          <div className="text-4xl mb-4">🔍</div>
          <h1 className="text-xl font-bold text-white mb-3">GitHub User Not Found</h1>
          <p className="text-white/40 text-sm leading-relaxed mb-6">
            We couldn&apos;t find GitHub username <span className="text-purple-400 font-semibold">@{username}</span>. Make sure the username is spelled correctly.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 rounded-xl transition-all text-xs font-semibold"
          >
            Back to Home
          </Link>
        </div>
      </main>
    );
  }

  const counts = {
    prs: allPRs.length,
    mergedPRs: allPRs.filter(pr => pr.pull_request?.merged_at).length,
    openPRs: allPRs.filter(pr => pr.state === 'open').length,
    issues: issues.length,
  };

  const prs = tab === 'merged' ? allPRs.filter(pr => pr.pull_request?.merged_at)
            : tab === 'open'   ? allPRs.filter(pr => pr.state === 'open')
            : allPRs;

  const badges = getBadges(allPRs, counts.mergedPRs);

  return (
    <main className="min-h-screen bg-[#030712]">
      {/* Navigation back */}
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-white/30 hover:text-white/70 transition-colors text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </Link>
      </div>

      {/* Alert Banner for Preview Mode */}
      <div className="max-w-4xl mx-auto px-4 mt-6">
        <div className="bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-transparent border border-purple-500/20 rounded-2xl px-5 py-4 text-sm text-purple-300/90 flex flex-wrap items-center justify-between gap-4 backdrop-blur-sm">
          <span className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse flex-shrink-0" />
            <span>
              <strong>Preview Sandbox:</strong> Showing contributions for <span className="text-white">@{profile.login}</span>. You are not registered on the leaderboards.
            </span>
          </span>
          <Link
            href="/join"
            className="bg-purple-600 hover:bg-purple-500 text-white px-3.5 py-1.5 rounded-xl transition-all text-xs font-semibold shadow-lg shadow-purple-900/20"
          >
            Request to Join Tracker
          </Link>
        </div>
      </div>

      {/* Profile hero */}
      <div className="relative overflow-hidden pt-8 pb-10 px-4">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-purple-600/8 blur-[80px] rounded-full" />
        </div>

        <div className="relative max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="relative flex-shrink-0">
              <Image src={profile.avatar_url} alt={profile.login} width={112} height={112}
                className="w-28 h-28 rounded-full ring-4 ring-purple-500/25 shadow-2xl shadow-purple-900/30 object-cover" />
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl font-bold text-white">{profile.name ?? profile.login}</h1>
              <p className="text-white/40 text-sm mt-0.5">@{profile.login}</p>
              {profile.bio && <p className="text-white/55 mt-3 max-w-lg leading-relaxed">{profile.bio}</p>}

              {/* Badges showcase */}
              {badges.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4 justify-center sm:justify-start">
                  {badges.map((b) => (
                    <div key={b.id} title={b.desc} className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-help ${b.style}`}>
                      <span>{b.emoji}</span>
                      <span>{b.name}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-4 mt-4 justify-center sm:justify-start text-sm text-white/35">
                {profile.company && <span className="flex items-center gap-1.5">🏢 {profile.company}</span>}
                {profile.location && <span className="flex items-center gap-1.5">📍 {profile.location}</span>}
                <a href={profile.html_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-white/70 transition-colors">
                  🔗 GitHub Profile
                </a>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 justify-center sm:justify-start">
                <ShareButton
                  username={profile.login}
                  displayName={profile.name ?? profile.login}
                  avatarUrl={profile.avatar_url}
                  mergedCount={counts.mergedPRs}
                  totalCount={counts.prs}
                  badges={badges}
                />
              </div>
            </div>
          </div>

          {/* Interactive stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
            {[
              { tabId: 'prs',    label: 'Total PRs', value: counts.prs,       color: 'text-white',        ring: 'ring-white/20'        },
              { tabId: 'merged', label: 'Merged',    value: counts.mergedPRs,  color: 'text-emerald-400',  ring: 'ring-emerald-500/40'  },
              { tabId: 'open',   label: 'Open',      value: counts.openPRs,   color: 'text-teal-400',     ring: 'ring-teal-500/40'     },
              { tabId: 'issues', label: 'Issues',    value: counts.issues,    color: 'text-purple-400',   ring: 'ring-purple-500/40'   },
            ].map(({ tabId, label, value, color, ring }) => {
              const active = tab === tabId;
              return (
                <Link
                  key={tabId}
                  href={`/check-work/${username}?tab=${tabId}`}
                  className={`rounded-xl p-4 text-center transition-all border ${
                    active
                      ? `bg-white/[0.07] border-white/[0.15] ring-1 ${ring}`
                      : 'bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12]'
                  }`}
                >
                  <div className={`text-2xl font-bold tabular-nums ${color}`}>{value}</div>
                  <div className={`text-xs mt-0.5 ${active ? 'text-white/60' : 'text-white/35'}`}>{label}</div>
                  {active && <div className={`w-6 h-0.5 rounded-full mx-auto mt-2 ${color.replace('text-', 'bg-')}`} />}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Contribution Trend Chart */}
      <div className="max-w-4xl mx-auto px-4 mb-6">
        <ContributionChart prs={allPRs} />
      </div>

      {/* Lists of contributions */}
      <div className="max-w-4xl mx-auto px-4 pb-24">
        {tab !== 'issues' && <PRsSection prs={prs} />}
        {tab === 'issues' && <IssuesSection issues={issues} />}
      </div>
    </main>
  );
}
