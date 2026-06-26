import { readFileSync } from 'fs';
import { join } from 'path';
import { getStudentsKV } from './kv-students';
import { readProfileCache, writeProfileCache, isProfileFresh, type ProfileCacheEntry } from './profile-cache';
import { execSync } from 'child_process';
import { cookies } from 'next/headers';

let cachedToken: string | undefined = process.env.GITHUB_TOKEN;
let checkedGhCli = false;

export function getGitHubToken(): string | undefined {
  if (cachedToken) return cachedToken;
  if (checkedGhCli) return undefined;
  checkedGhCli = true;
  try {
    const token = execSync('gh auth token', { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    if (token && token.startsWith('gh')) {
      console.log('Successfully loaded GitHub token from GitHub CLI.');
      cachedToken = token;
      return token;
    }
  } catch (e) {
    // gh CLI not installed or not logged in
  }
  return undefined;
}

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || (typeof window === 'undefined' ? getGitHubToken() : undefined);

export class GitHubRateLimitError extends Error {
  constructor(message = 'GitHub API rate limit exceeded') {
    super(message);
    this.name = 'GitHubRateLimitError';
  }
}

export async function getGitHubHeaders(): Promise<HeadersInit> {
  let token: string | undefined = undefined;
  try {
    const cookieStore = await cookies();
    token = cookieStore.get('github_oauth_token')?.value;
  } catch {
    // cookies() can throw when evaluated outside of request contexts (e.g. static rendering)
  }

  if (!token) {
    token = GITHUB_TOKEN;
  }

  return {
    Accept: 'application/vnd.github.v3+json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function githubSearch<T>(
  q: string,
  page = 1,
  perPage = 100,
  retryWithSystemToken = true
): Promise<{ total_count: number; items: T[] } | null> {
  let headers = await getGitHubHeaders();
  let res = await fetch(
    `https://api.github.com/search/issues?q=${encodeURIComponent(q)}&sort=created&order=desc&per_page=${perPage}&page=${page}`,
    { headers, next: { revalidate: 3600 } }
  );
  if (!res.ok) {
    if (res.status === 401 && retryWithSystemToken && GITHUB_TOKEN) {
      console.warn('OAuth token in cookie was unauthorized. Retrying with system GITHUB_TOKEN...');
      headers = {
        Accept: 'application/vnd.github.v3+json',
        Authorization: `Bearer ${GITHUB_TOKEN}`,
      };
      res = await fetch(
        `https://api.github.com/search/issues?q=${encodeURIComponent(q)}&sort=created&order=desc&per_page=${perPage}&page=${page}`,
        { headers, next: { revalidate: 3600 } }
      );
      if (res.ok) {
        return res.json();
      }
    }
    if (res.status === 403 || res.status === 429) {
      throw new GitHubRateLimitError();
    }
    return null;
  }
  return res.json();
}

async function githubSearchAll<T>(
  q: string
): Promise<{ total_count: number; items: T[] } | null> {
  const allItems: T[] = [];
  let page = 1;
  const maxPages = GITHUB_TOKEN ? 10 : 3;
  let totalCount = 0;

  while (page <= maxPages) {
    const data = await githubSearch<T>(q, page, 100);
    if (!data) {
      if (page === 1) return null;
      break;
    }
    totalCount = data.total_count;
    allItems.push(...data.items);
    if (allItems.length >= data.total_count || data.items.length < 100) break;
    page++;
    if (page <= maxPages) {
      await new Promise((r) => setTimeout(r, GITHUB_TOKEN ? 200 : 1000));
    }
  }

  return { total_count: totalCount, items: allItems };
}


export interface StudentPR {
  id: number;
  number: number;
  title: string;
  state: 'open' | 'closed';
  html_url: string;
  repository_url: string;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  draft: boolean;
  labels: Array<{ id: number; name: string; color: string }>;
  pull_request: {
    merged_at: string | null;
    html_url: string;
  };
  user: {
    login: string;
    avatar_url: string;
    html_url: string;
  };
}

export interface GitHubUser {
  login: string;
  avatar_url: string;
  html_url: string;
  name: string | null;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
  company: string | null;
  location: string | null;
  blog: string | null;
  twitter_username: string | null;
  created_at: string;
}

export interface Student {
  github: string;
  year?: '1st year' | '2nd year' | '3rd year' | '4th year';
  campus?: 'Rishihood' | 'ADYPU' | 'SVYASA';
}

export interface StudentSummary {
  profile: GitHubUser;
  totalPRs: number;
  mergedPRs: number;
  openPRs: number;
  closedPRs: number;
  /** mergedPRs minus any flagged merged PRs — used for ranking */
  scoreMergedPRs: number;
  issuesCount: number;
  year?: '1st year' | '2nd year' | '3rd year' | '4th year';
  campus?: 'Rishihood' | 'ADYPU' | 'SVYASA';
}

// getStudents() has been replaced with getStudentsKV() from './kv-students'

export async function getStudentProfile(username: string, retryWithSystemToken = true): Promise<GitHubUser | null> {
  let headers = await getGitHubHeaders();
  let res = await fetch(`https://api.github.com/users/${username}`, {
    headers,
    next: { revalidate: 3600 },
  });
  if (!res.ok) {
    if (res.status === 401 && retryWithSystemToken && GITHUB_TOKEN) {
      console.warn('OAuth token in cookie was unauthorized. Retrying with system GITHUB_TOKEN...');
      headers = {
        Accept: 'application/vnd.github.v3+json',
        Authorization: `Bearer ${GITHUB_TOKEN}`,
      };
      res = await fetch(`https://api.github.com/users/${username}`, {
        headers,
        next: { revalidate: 3600 },
      });
      if (res.ok) return res.json();
    }
    if (res.status === 403 || res.status === 429) {
      throw new GitHubRateLimitError();
    }
    return null;
  }
  return res.json();
}

export interface StudentIssue {
  id: number;
  number: number;
  title: string;
  state: 'open' | 'closed';
  html_url: string;
  repository_url: string;
  created_at: string;
  closed_at: string | null;
  comments: number;
  labels: Array<{ id: number; name: string; color: string }>;
  user: { login: string; avatar_url: string; html_url: string };
}

// PRs authored by username in repos NOT owned by username (excludes own repos & forks)
function searchPRs(username: string, extra = '', page = 1, perPage = 100) {
  return githubSearch<StudentPR>(
    `is:pr author:${username} -user:${username}${extra ? ' ' + extra : ''}`,
    page,
    perPage
  );
}

export async function getStudentIssues(username: string): Promise<StudentIssue[] | null> {
  const all: StudentIssue[] = [];
  let page = 1;
  const maxPages = GITHUB_TOKEN ? 10 : 3;
  while (page <= maxPages) {
    const data = await githubSearch<StudentIssue>(
      `is:issue author:${username} -user:${username}`,
      page
    );
    if (!data) return null;
    all.push(...data.items);
    if (all.length >= data.total_count || data.items.length < 100) break;
    page++;
  }
  return all;
}

export async function getStudentReviews(username: string): Promise<StudentPR[]> {
  const all: StudentPR[] = [];
  let page = 1;
  const maxPages = GITHUB_TOKEN ? 10 : 3;
  while (page <= maxPages) {
    const data = await githubSearch<StudentPR>(
      `is:pr reviewed-by:${username} -user:${username} -author:${username}`,
      page
    );
    if (!data) break;
    all.push(...data.items);
    if (all.length >= data.total_count || data.items.length < 100) break;
    page++;
  }
  return all;
}


export async function getStudentPRs(username: string): Promise<StudentPR[] | null> {
  const allPRs: StudentPR[] = [];
  let page = 1;
  const maxPages = GITHUB_TOKEN ? 10 : 3;

  while (page <= maxPages) {
    const data = await searchPRs(username, '', page);
    if (!data) return null;
    allPRs.push(...data.items);
    if (allPRs.length >= data.total_count || data.items.length < 100) break;
    page++;
  }

  return allPRs;
}

function getSummaryFromCache(
  cached: ProfileCacheEntry,
  dateQuery: string,
  flaggedPRIds: Set<string>
): StudentSummary {
  let prs = cached.prs || [];
  let issues = cached.issues || [];

  if (dateQuery) {
    const gtMatch = dateQuery.match(/created:>([0-9-]{10})/);
    const rangeMatch = dateQuery.match(/created:([0-9-]{10})\.\.([0-9-]{10})/);

    if (gtMatch) {
      const minDate = new Date(gtMatch[1]);
      prs = prs.filter((pr) => new Date(pr.created_at) > minDate);
      issues = issues.filter((is) => new Date(is.created_at) > minDate);
    } else if (rangeMatch) {
      const minDate = new Date(rangeMatch[1]);
      const maxDate = new Date(rangeMatch[2]);
      minDate.setHours(0, 0, 0, 0);
      maxDate.setHours(23, 59, 59, 999);
      prs = prs.filter((pr) => {
        const d = new Date(pr.created_at);
        return d >= minDate && d <= maxDate;
      });
      issues = issues.filter((is) => {
        const d = new Date(is.created_at);
        return d >= minDate && d <= maxDate;
      });
    }
  }

  const totalPRs = prs.length;
  const mergedPRsList = prs.filter((pr) => pr.pull_request?.merged_at);
  const mergedPRs = mergedPRsList.length;
  const openPRs = prs.filter((pr) => pr.state === 'open').length;
  const closedPRs = prs.filter((pr) => pr.state === 'closed' && !pr.pull_request?.merged_at).length;

  const flaggedMerged = mergedPRsList.filter((pr) => {
    const repo = pr.repository_url.replace('https://api.github.com/repos/', '');
    const key = `${repo}#${pr.number}`;
    return flaggedPRIds.has(key);
  }).length;

  return {
    profile: cached.profile,
    totalPRs,
    mergedPRs,
    openPRs,
    closedPRs,
    scoreMergedPRs: Math.max(0, mergedPRs - flaggedMerged),
    issuesCount: issues.length,
  };
}

export async function getStudentSummary(
  student: Student,
  dateQuery = '',
  flaggedPRIds: Set<string> = new Set()
): Promise<StudentSummary | null> {
  let cached: ProfileCacheEntry | null = null;
  try {
    cached = await readProfileCache(student.github);
  } catch (err) {
    console.error(`Failed to read profile cache for ${student.github}:`, err);
  }

  // If we have profile cache, use it immediately to avoid hitting the rate limit
  if (cached) {
    try {
      const summary = getSummaryFromCache(cached, dateQuery, flaggedPRIds);
      summary.year = student.year;
      summary.campus = student.campus;
      return summary;
    } catch (err) {
      console.error(`Error generating summary from cache for ${student.github}:`, err);
    }
  }

  try {
    const [profile, data, issueData] = await Promise.all([
      getStudentProfile(student.github),
      searchPRs(student.github, dateQuery, 1, 100),
      githubSearch<StudentIssue>(
        `is:issue author:${student.github} -user:${student.github}${dateQuery ? ' ' + dateQuery : ''}`,
        1,
        100
      )
    ]);
    if (!profile) {
      if (cached) {
        console.warn(`Profile fetch failed but fallback cache exists for ${student.github}`);
        const summary = getSummaryFromCache(cached, dateQuery, flaggedPRIds);
        summary.year = student.year;
        summary.campus = student.campus;
        return summary;
      }
      return null;
    }

    const items = data ? data.items : [];
    const total = data ? data.total_count : 0;

    const mergedItems = items.filter((pr) => pr.pull_request?.merged_at);
    const openInSample = items.filter((pr) => pr.state === 'open').length;
    const closedInSample = items.filter(
      (pr) => !pr.pull_request?.merged_at && pr.state === 'closed'
    ).length;

    const sampleSize = items.length || 1;
    const scale = total / sampleSize;

    const mergedInSample = mergedItems.length;
    const mergedPRs = Math.round(mergedInSample * scale);

    const flaggedMergedInSample = mergedItems.filter((pr) => {
      const repo = pr.repository_url.replace('https://api.github.com/repos/', '');
      const key = `${repo}#${pr.number}`;
      return flaggedPRIds.has(key);
    }).length;
    const flaggedMerged = Math.round(flaggedMergedInSample * scale);

    if (!dateQuery && profile && data !== null && issueData !== null) {
      try {
        const prsList = data.items;
        const issuesList = issueData.items;
        writeProfileCache(student.github, profile, prsList, issuesList).catch((err) =>
          console.error(`Failed to write profile cache in summary:`, err)
        );
      } catch (cacheErr) {
        console.error(`Failed to trigger cache write for ${student.github}:`, cacheErr);
      }
    }

    return {
      profile,
      totalPRs: total,
      mergedPRs,
      openPRs: Math.round(openInSample * scale),
      closedPRs: Math.round(closedInSample * scale),
      scoreMergedPRs: Math.max(0, mergedPRs - flaggedMerged),
      issuesCount: issueData ? issueData.total_count : 0,
      year: student.year,
      campus: student.campus,
    };
  } catch (error) {
    console.warn(`Error or rate limit hit during live summary fetch for ${student.github}:`, error);
    if (cached) {
      console.info(`Falling back to cached profile data for ${student.github}`);
      try {
        const summary = getSummaryFromCache(cached, dateQuery, flaggedPRIds);
        summary.year = student.year;
        summary.campus = student.campus;
        return summary;
      } catch (err) {
        console.error(`Error generating summary from stale cache for ${student.github}:`, err);
      }
    }
    return null;
  }
}

export async function getAllStudentSummaries(
  dateQuery = '',
  flaggedPRIds: Set<string> = new Set(),
  forceLive = false
): Promise<StudentSummary[]> {
  const students = await getStudentsKV();
  if (students.length === 0) return [];

  const summaries: StudentSummary[] = [];
  const uncachedStudents: Student[] = [];

  // ── Phase 1: Resolve from individual profile caches (zero API calls) ──
  if (!forceLive) {
    const cachedResults = await Promise.all(
      students.map(async (student) => {
        try {
          const cached = await readProfileCache(student.github);
          return { student, cached };
        } catch {
          return { student, cached: null };
        }
      })
    );

    for (const { student, cached } of cachedResults) {
      if (cached) {
        const summary = getSummaryFromCache(cached, dateQuery, flaggedPRIds);
        summary.year = student.year;
        summary.campus = student.campus;
        summaries.push(summary);
      } else {
        const placeholder: StudentSummary = {
          profile: {
            login: student.github,
            name: student.github,
            avatar_url: `https://avatars.githubusercontent.com/${student.github}?s=100`,
            html_url: `https://github.com/${student.github}`,
            bio: null,
            public_repos: 0,
            followers: 0,
            following: 0,
            company: null,
            location: null,
            blog: null,
            twitter_username: null,
            created_at: new Date().toISOString(),
          },
          totalPRs: 0,
          mergedPRs: 0,
          openPRs: 0,
          closedPRs: 0,
          scoreMergedPRs: 0,
          issuesCount: 0,
          year: student.year,
          campus: student.campus,
        };
        summaries.push(placeholder);
      }
    }

    return summaries.sort((a, b) => b.scoreMergedPRs - a.scoreMergedPRs);
  }

  // ── Phase 2: Batch-query GitHub for remaining (or all) students ────
  const studentsToFetch = forceLive ? students : uncachedStudents;
  const usernames = studentsToFetch.map((s) => s.github);
  const batchSize = 15;
  const allPRs: StudentPR[] = [];
  const allIssues: StudentIssue[] = [];
  let rateLimitHit = false;
  const successfulFetches = new Map<string, boolean>();

  for (let i = 0; i < usernames.length; i += batchSize) {
    // Cool down after a rate-limit detection (search limit resets every 60s)
    if (rateLimitHit) {
      console.log(`Rate limit cooldown: waiting 65s before batch at index ${i}...`);
      await new Promise((r) => setTimeout(r, 65_000));
      rateLimitHit = false;
    }

    const batch = usernames.slice(i, i + batchSize);
    const authorQuery = batch.map((u) => `author:${u}`).join(' ');
    const prQuery = `is:pr ${authorQuery}${dateQuery ? ' ' + dateQuery : ''}`;
    const issueQuery = `is:issue ${authorQuery}${dateQuery ? ' ' + dateQuery : ''}`;

    const results = await Promise.allSettled([
      githubSearchAll<StudentPR>(prQuery),
      githubSearchAll<StudentIssue>(issueQuery),
    ]);

    let batchSuccess = false;
    let batchRateLimited = false;

    const prFulfilled = results[0].status === 'fulfilled' && results[0].value !== null;
    const issueFulfilled = results[1].status === 'fulfilled' && results[1].value !== null;

    if (prFulfilled && issueFulfilled) {
      allPRs.push(...(results[0] as PromiseFulfilledResult<any>).value.items);
      allIssues.push(...(results[1] as PromiseFulfilledResult<any>).value.items);
      batchSuccess = true;
    } else {
      if (results[0].status === 'rejected' && results[0].reason instanceof GitHubRateLimitError) batchRateLimited = true;
      else if (results[0].status === 'fulfilled' && results[0].value === null) {
        console.warn(`PR batch ${i} returned null`);
      } else if (results[0].status === 'rejected') {
        console.error(`PR batch ${i} error:`, results[0].reason);
      }

      if (results[1].status === 'rejected' && results[1].reason instanceof GitHubRateLimitError) batchRateLimited = true;
      else if (results[1].status === 'fulfilled' && results[1].value === null) {
        console.warn(`Issue batch ${i} returned null`);
      } else if (results[1].status === 'rejected') {
        console.error(`Issue batch ${i} error:`, results[1].reason);
      }
    }

    // On rate limit: wait for reset and retry the batch once
    if (batchRateLimited) {
      console.log(`Rate limit on batch ${i}, waiting 65s and retrying...`);
      await new Promise((r) => setTimeout(r, 65_000));

      const retry = await Promise.allSettled([
        githubSearchAll<StudentPR>(prQuery),
        githubSearchAll<StudentIssue>(issueQuery),
      ]);

      const retryPrFulfilled = retry[0].status === 'fulfilled' && retry[0].value !== null;
      const retryIssueFulfilled = retry[1].status === 'fulfilled' && retry[1].value !== null;

      if (retryPrFulfilled && retryIssueFulfilled) {
        allPRs.push(...(retry[0] as PromiseFulfilledResult<any>).value.items);
        allIssues.push(...(retry[1] as PromiseFulfilledResult<any>).value.items);
        batchSuccess = true;
      } else {
        if (retry[0].status === 'rejected' && retry[0].reason instanceof GitHubRateLimitError) {
          rateLimitHit = true; // Triggers cooldown before next batch
        }
      }
    }

    // Record success state for this batch of usernames
    for (const u of batch) {
      successfulFetches.set(u.toLowerCase(), batchSuccess);
    }

    if (i + batchSize < usernames.length && !rateLimitHit) {
      await new Promise((r) => setTimeout(r, GITHUB_TOKEN ? 1500 : 6500));
    }
  }

  // ── Group contributions by student username (lowercase key) ────────
  const studentPRMap = new Map<string, StudentPR[]>();
  const studentIssueMap = new Map<string, StudentIssue[]>();

  for (const pr of allPRs) {
    const login = pr.user.login.toLowerCase();
    const repoOwner = pr.repository_url.split('/repos/')[1]?.split('/')[0];
    if (repoOwner && repoOwner.toLowerCase() !== login) {
      if (!studentPRMap.has(login)) studentPRMap.set(login, []);
      studentPRMap.get(login)!.push(pr);
    }
  }

  for (const issue of allIssues) {
    const login = issue.user.login.toLowerCase();
    const repoOwner = issue.repository_url.split('/repos/')[1]?.split('/')[0];
    if (repoOwner && repoOwner.toLowerCase() !== login) {
      if (!studentIssueMap.has(login)) studentIssueMap.set(login, []);
      studentIssueMap.get(login)!.push(issue);
    }
  }

  // ── Build summaries for fetched students ───────────────────────────
  for (const student of studentsToFetch) {
    const lowerName = student.github.toLowerCase();
    const isSuccess = successfulFetches.get(lowerName) ?? false;
    const cached = await readProfileCache(student.github);

    if (!isSuccess && cached) {
      // Fallback to stale cache if batch query failed
      const summary = getSummaryFromCache(cached, dateQuery, flaggedPRIds);
      summary.year = student.year;
      summary.campus = student.campus;
      summaries.push(summary);
      continue;
    }

    const prs = studentPRMap.get(lowerName) || [];
    const issues = studentIssueMap.get(lowerName) || [];

    // Resolve profile (cache → live → placeholder)
    let profile: GitHubUser | null = null;
    if (cached) {
      profile = cached.profile;
    } else {
      try {
        profile = await getStudentProfile(student.github);
      } catch (err) {
        console.error(`Failed to load profile for ${student.github}:`, err);
      }
    }

    if (!profile) {
      profile = {
        login: student.github,
        avatar_url: `https://github.com/${student.github}.png`,
        html_url: `https://github.com/${student.github}`,
        name: student.github,
        bio: null,
        public_repos: 0,
        followers: 0,
        following: 0,
        company: null,
        location: null,
        blog: null,
        twitter_username: null,
        created_at: new Date().toISOString(),
      };
    }

    // Persist to profile cache when fetching ALL-TIME data (no date filter) AND batch fetch succeeded
    // so future custom date queries can compute locally from cache
    if (!dateQuery && isSuccess) {
      writeProfileCache(student.github, profile, prs, issues).catch((err) =>
        console.error(`Failed to write profile cache for ${student.github}:`, err)
      );
    }

    const totalPRs = prs.length;
    const mergedPRsList = prs.filter((pr) => pr.pull_request?.merged_at);
    const mergedPRs = mergedPRsList.length;
    const openPRs = prs.filter((pr) => pr.state === 'open').length;
    const closedPRs = prs.filter((pr) => pr.state === 'closed' && !pr.pull_request?.merged_at).length;

    const flaggedMerged = mergedPRsList.filter((pr) => {
      const repo = pr.repository_url.replace('https://api.github.com/repos/', '');
      const key = `${repo}#${pr.number}`;
      return flaggedPRIds.has(key);
    }).length;

    summaries.push({
      profile,
      totalPRs,
      mergedPRs,
      openPRs,
      closedPRs,
      scoreMergedPRs: Math.max(0, mergedPRs - flaggedMerged),
      issuesCount: issues.length,
      year: student.year,
      campus: student.campus,
    });
  }

  // Rank by effective merged PRs
  return summaries.sort((a, b) => b.scoreMergedPRs - a.scoreMergedPRs);
}

export function repoFromUrl(repoUrl: string): string {
  return repoUrl.replace('https://api.github.com/repos/', '');
}

export function buildDateQuery(period: string, from?: string, to?: string): string {
  const toISO = (d: Date) => d.toISOString().split('T')[0];
  const ago = (days: number) => toISO(new Date(Date.now() - days * 86_400_000));
  switch (period) {
    case '1day':    return `created:>${ago(1)}`;
    case 'week':    return `created:>${ago(7)}`;
    case 'month':   return `created:>${ago(30)}`;
    case '2months': return `created:>${ago(60)}`;
    case '3months': return `created:>${ago(90)}`;
    case '6months': return `created:>${ago(180)}`;
    case 'year':    return `created:>${ago(365)}`;
    case 'custom':
      if (from && to)  return `created:${from}..${to}`;
      if (from)        return `created:>${from}`;
      return '';
    default: return '';
  }
}

export async function refreshStudentCache(username: string): Promise<void> {
  console.log(`Refreshing cache for user: ${username}`);
  const profile = await getStudentProfile(username);
  if (!profile) {
    throw new Error(`Profile not found for user: ${username}`);
  }
  const prs = await getStudentPRs(username);
  const issues = await getStudentIssues(username);
  if (prs === null || issues === null) {
    throw new Error(`Failed to fetch contributions for user: ${username}`);
  }
  await writeProfileCache(username, profile, prs, issues);
}

export async function updateStaleProfiles(batchSize = 5): Promise<string[]> {
  const students = await getStudentsKV();
  if (students.length === 0) return [];

  // Read all caches in parallel to find timestamps
  const studentCaches = await Promise.all(
    students.map(async (student) => {
      try {
        const cached = await readProfileCache(student.github);
        return {
          student,
          cachedAt: cached ? new Date(cached.cachedAt).getTime() : 0,
        };
      } catch {
        return { student, cachedAt: 0 };
      }
    })
  );

  // Sort by cachedAt (oldest or un-cached first)
  studentCaches.sort((a, b) => a.cachedAt - b.cachedAt);

  const targets = studentCaches.slice(0, batchSize);
  const updatedUsernames: string[] = [];

  for (const target of targets) {
    try {
      await refreshStudentCache(target.student.github);
      updatedUsernames.push(target.student.github);
      // Wait 1.5 seconds between students to respect GitHub Search rate limits
      await new Promise((r) => setTimeout(r, 1500));
    } catch (err) {
      console.error(`Failed to refresh cache for ${target.student.github}:`, err);
    }
  }

  return updatedUsernames;
}
