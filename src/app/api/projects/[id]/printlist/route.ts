import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { projects } from '@/db/schema/projects';
import { printlists } from '@/db/schema/printlists';
import { getRequiredSession } from '@/lib/auth-helpers';
import {
  unauthorizedResponse,
  validationErrorResponse,
  errorResponse,
} from '@/lib/api-responses';
import { checkRateLimit, API_RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';
import { printlistSchema } from '@/lib/validation';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const rl = await checkRateLimit(
    `printlist:${session.user.id}`,
    API_RATE_LIMITS.projects
  );
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

  const { id: projectId } = await params;
  if (!projectId) return errorResponse('Missing project ID', 'BAD_REQUEST', 400);

  try {
    const [printlist] = await db
      .select()
      .from(printlists)
      .where(eq(printlists.projectId, projectId))
      .limit(1);

    if (!printlist || printlist.userId !== session.user.id) {
      return Response.json({ success: true, data: null });
    }

    return Response.json({ success: true, data: printlist });
  } catch (err) {
    console.error('[printlist:get]', err);
    return errorResponse('Failed to fetch print list', 'INTERNAL_ERROR', 500);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const rl = await checkRateLimit(
    `printlist:${session.user.id}`,
    API_RATE_LIMITS.projects
  );
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

  const { id: projectId } = await params;
  if (!projectId) return errorResponse('Missing project ID', 'BAD_REQUEST', 400);

  try {
    const body = await request.json();
    const parsed = printlistSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(
        parsed.error.issues[0]?.message ?? 'Invalid input'
      );
    }

    const { items, paperSize } = parsed.data;

    const [project] = await db
      .select({ userId: projects.userId })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project || project.userId !== session.user.id) {
      return errorResponse('Project not found', 'NOT_FOUND', 404);
    }

    const [saved] = await db
      .insert(printlists)
      .values({
        projectId,
        userId: session.user.id,
        items,
        paperSize,
      })
      .onConflictDoUpdate({
        target: printlists.projectId,
        set: { items, paperSize, updatedAt: new Date() },
      })
      .returning();

    return Response.json({ success: true, data: saved }, { status: 200 });
  } catch (err) {
    console.error('[printlist:post]', err);
    return errorResponse('Failed to save print list', 'INTERNAL_ERROR', 500);
  }
}
