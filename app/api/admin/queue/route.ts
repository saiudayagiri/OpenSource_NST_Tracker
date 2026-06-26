/**
 * GET /api/admin/queue
 *
 * Returns ALL PRs for ALL students from the server-side profile caches.
 * This avoids the browser making 800+ individual GitHub API calls
 * (which gets rate-limited to ~10 requests and silently fails).
 *
 * Instead, it reads the already-cached profile data that the cron job
 * and refresh system maintain — zero GitHub API calls needed.
 */

import { checkAdminAuth } from '@/lib/admin-auth';
import { getStudentsKV } from '@/lib/kv-students';
import { readProfileCache } from '@/lib/profile-cache';

export const dynamic = 'force-dynamic';

interface QueuePR {
  id: number;
  number: number;
  title: string;
  state: string;
  html_url: string;
  repository_url: string;
  created_at: string;
  pull_request?: { merged_at: string | null; html_url: string };
  user: { login: string; avatar_url: string };
}

export async function GET() {
  const isAdmin = await checkAdminAuth();
  if (!isAdmin) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const students = await getStudentsKV();
  const allPRs: QueuePR[] = [];
  let cachedCount = 0;
  let uncachedCount = 0;

  // Read all profile caches in parallel (they're local KV reads, very fast)
  const cacheResults = await Promise.all(
    students.map(async (student) => {
      try {
        const cached = await readProfileCache(student.github);
        return { github: student.github, cached };
      } catch {
        return { github: student.github, cached: null };
      }
    })
  );

  for (const { github, cached } of cacheResults) {
    if (!cached) {
      uncachedCount++;
      continue;
    }
    cachedCount++;

    // Extract PRs from the profile cache
    for (const pr of (cached.prs || [])) {
      // Exclude PRs to the student's own repos (same filter as GitHub search)
      const repoOwner = pr.repository_url?.split('/repos/')[1]?.split('/')[0];
      if (repoOwner && repoOwner.toLowerCase() === github.toLowerCase()) continue;

      allPRs.push({
        id: pr.id,
        number: pr.number,
        title: pr.title,
        state: pr.state,
        html_url: pr.html_url,
        repository_url: pr.repository_url,
        created_at: pr.created_at,
        pull_request: pr.pull_request
          ? { merged_at: pr.pull_request.merged_at, html_url: pr.pull_request.html_url }
          : undefined,
        user: {
          login: pr.user?.login ?? github,
          avatar_url: pr.user?.avatar_url ?? `https://github.com/${github}.png`,
        },
      });
    }
  }

  // Sort by created_at descending (newest first)
  allPRs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return Response.json({
    prs: allPRs,
    stats: {
      totalPRs: allPRs.length,
      cachedStudents: cachedCount,
      uncachedStudents: uncachedCount,
      totalStudents: students.length,
    },
  });
}
