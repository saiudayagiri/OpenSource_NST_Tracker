import { NextResponse } from 'next/server';
import { updateStaleProfiles, getAllStudentSummaries, buildDateQuery } from '@/lib/github';
import { getFlaggedPRIdSet } from '@/lib/flagged';
import { writeSummaryCache } from '@/lib/summary-cache';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // 1. Trigger the incremental updates of stale profile caches (fetches from GitHub)
    console.log('[Incremental Refresh] Starting stale profile updates...');
    const updatedUsers = await updateStaleProfiles(5);
    console.log('[Incremental Refresh] Updated users:', updatedUsers);

    // 2. Regenerate the global summary caches using the local profile caches (zero GitHub API calls)
    console.log('[Incremental Refresh] Regenerating summary caches...');
    const flaggedPRIds = await getFlaggedPRIdSet();
    
    // We update the most common periods
    const periods = ['all', 'week', 'month'];
    for (const period of periods) {
      const dateQuery = buildDateQuery(period);
      const summaries = await getAllStudentSummaries(dateQuery, flaggedPRIds, false);
      await writeSummaryCache(summaries, period);
      console.log(`[Incremental Refresh] Re-wrote summary cache for period: ${period}`);
    }

    // 3. Trigger revalidation of Next.js pages
    revalidatePath('/contributors');
    revalidatePath('/');
    console.log('[Incremental Refresh] Next.js paths revalidated.');

    return NextResponse.json({
      ok: true,
      updatedUsers,
      message: `Successfully refreshed cache for: ${updatedUsers.join(', ')}`,
    });
  } catch (error: any) {
    console.error('[Incremental Refresh] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
