import { checkAdminAuth } from '@/lib/admin-auth';
import { getJoinRequestsKV, updateJoinRequestStatus } from '@/lib/kv-join-requests';
import { addStudent } from '@/lib/kv-students';
import { invalidateSummaryCache } from '@/lib/summary-cache';
import { revalidatePath } from 'next/cache';

/** GET /api/admin/join-requests — list all queued requests */
export async function GET() {
  if (!(await checkAdminAuth())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const requests = await getJoinRequestsKV();
  return Response.json(requests);
}

/** POST /api/admin/join-requests — approve or reject a request */
export async function POST(request: Request) {
  if (!(await checkAdminAuth())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { github, action } = body as { github?: string; action?: 'approve' | 'reject' };

    if (!github || !action) {
      return Response.json({ error: 'Missing github or action' }, { status: 400 });
    }

    if (action === 'approve') {
      const requests = await getJoinRequestsKV();
      const reqDetail = requests.find(
        (r) => r.github.toLowerCase() === github.toLowerCase() && r.status === 'pending'
      );

      const addRes = await addStudent(github, reqDetail?.year, reqDetail?.campus);
      if (!addRes.ok) {
        // Even if already in the list, we still mark request as approved to clean up queue
        if (addRes.message?.includes('already')) {
          await updateJoinRequestStatus(github, 'approved');
          return Response.json({ ok: true, message: 'Student was already in list, request closed.' });
        }
        return Response.json({ error: addRes.message ?? 'Failed to add student' }, { status: 400 });
      }

      await updateJoinRequestStatus(github, 'approved');
      await invalidateSummaryCache();
      revalidatePath('/contributors');
      revalidatePath('/');
    } else if (action === 'reject') {
      const updateRes = await updateJoinRequestStatus(github, 'rejected');
      if (!updateRes.ok) {
        return Response.json({ error: 'Request not found or not pending' }, { status: 404 });
      }
    } else {
      return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error('Error handling join request admin action:', error);
    return Response.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
