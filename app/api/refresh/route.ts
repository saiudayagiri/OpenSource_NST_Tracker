import {
  getAllStudentSummaries,
  getStudentProfile,
  getStudentPRs,
  getStudentIssues,
  buildDateQuery,
} from '@/lib/github';
import { getFlaggedPRIdSet } from '@/lib/flagged';
import {
  readSummaryCache,
  writeSummaryCache,
  isCacheFresh,
  REFRESH_COOLDOWN_MS,
} from '@/lib/summary-cache';
import { readProfileCache, writeProfileCache } from '@/lib/profile-cache';
import { revalidatePath } from 'next/cache';

/**
 * GET /api/refresh
 * Returns current cache metadata (age, count) without triggering a refresh.
 * Supports ?period=xxx and ?username=xxx
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const username = url.searchParams.get('username');
  const period = url.searchParams.get('period') || 'all';

  if (username) {
    const cached = await readProfileCache(username);
    if (!cached) {
      return Response.json({ cachedAt: null, fresh: false });
    }
    const ageMs = Date.now() - new Date(cached.cachedAt).getTime();
    // 1 hour fresh TTL
    const isFresh = ageMs < 60 * 60 * 1000;
    return Response.json({
      cachedAt: cached.cachedAt,
      fresh: isFresh,
    });
  }

  const cache = await readSummaryCache(period);
  if (!cache) {
    return Response.json({ cachedAt: null, fresh: false, count: 0 });
  }
  return Response.json({
    cachedAt: cache.cachedAt,
    fresh: isCacheFresh(cache),
    count: cache.summaries.length,
    cooldownMs: REFRESH_COOLDOWN_MS,
  });
}

/**
 * POST /api/refresh
 * Public endpoint — rate-limited to once every 5 minutes.
 * Re-fetches the requested profile or period summary cache.
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  const username = url.searchParams.get('username');
  const period = url.searchParams.get('period') || 'all';

  // 1. Refresh individual profile
  if (username) {
    const cached = await readProfileCache(username);
    const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes manual refresh cooldown

    if (cached) {
      const ageMs = Date.now() - new Date(cached.cachedAt).getTime();
      if (ageMs < COOLDOWN_MS) {
        const remainingSecs = Math.ceil((COOLDOWN_MS - ageMs) / 1000);
        return Response.json({
          ok: true,
          fromCache: true,
          cachedAt: cached.cachedAt,
          message: `Profile was refreshed recently. Try again in ${remainingSecs}s.`,
        });
      }
    }

    // Fetch fresh profile data
    const profile = await getStudentProfile(username);
    if (!profile) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const [prs, issues] = await Promise.all([
      getStudentPRs(username),
      getStudentIssues(username),
    ]);

    await writeProfileCache(username, profile, prs, issues);

    // Regenerate the global summary caches locally so the leaderboard is immediately updated
    try {
      const flaggedPRIds = await getFlaggedPRIdSet();
      const periods = ['all', 'week', 'month'];
      for (const p of periods) {
        const dateQuery = buildDateQuery(p);
        const summaries = await getAllStudentSummaries(dateQuery, flaggedPRIds, false);
        await writeSummaryCache(summaries, p);
      }
      revalidatePath('/contributors');
      revalidatePath('/');
    } catch (err) {
      console.error('Failed to update summary caches after individual refresh:', err);
    }

    revalidatePath(`/contributors/${username}`);

    return Response.json({
      ok: true,
      fromCache: false,
      cachedAt: new Date().toISOString(),
    });
  }

  // 2. Refresh summaries list for a specific period
  const cache = await readSummaryCache(period);

  // Rate limit: return early if cache is still fresh
  if (cache && isCacheFresh(cache)) {
    const ageMs = Date.now() - new Date(cache.cachedAt).getTime();
    const remainingSecs = Math.ceil((REFRESH_COOLDOWN_MS - ageMs) / 1000);
    return Response.json({
      ok: true,
      fromCache: true,
      cachedAt: cache.cachedAt,
      message: `Cache is fresh. Try again in ${remainingSecs}s.`,
    });
  }

  // Fetch fresh summaries from GitHub
  const flaggedPRIds = await getFlaggedPRIdSet();
  const dateQuery = buildDateQuery(period);
  const summaries = await getAllStudentSummaries(dateQuery, flaggedPRIds, true);
  await writeSummaryCache(summaries, period);

  // Tell Next.js to re-render the pages
  revalidatePath('/contributors');
  revalidatePath('/');

  return Response.json({ ok: true, fromCache: false, cachedAt: new Date().toISOString() });
}
