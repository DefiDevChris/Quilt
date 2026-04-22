import { NextRequest } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { mobileUploads } from '@/db/schema';
import { mobileUploadUpdateSchema } from '@/lib/validation';
import {
  getRequiredSession,
  unauthorizedResponse,
  notFoundResponse,
  validationErrorResponse,
  errorResponse,
} from '@/lib/auth-helpers';
import { checkRateLimit, API_RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const { id } = await params;

  const rl = await checkRateLimit(`mobile-uploads:${session.user.id}`, API_RATE_LIMITS.upload);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

  try {
    const [row] = await db
      .select()
      .from(mobileUploads)
      .where(and(eq(mobileUploads.id, id), eq(mobileUploads.userId, session.user.id)));

    if (!row) return notFoundResponse('Upload not found.');

    return Response.json({
      success: true,
      data: {
        ...row,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      },
    });
  } catch (err) { console.error('[mobile-uploads/[id]]', err);
    return errorResponse('Failed to fetch upload', 'INTERNAL_ERROR', 500);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const { id } = await params;

  const rl = await checkRateLimit(`mobile-uploads:${session.user.id}`, API_RATE_LIMITS.upload);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

  try {
    const body = await request.json();
    const parsed = mobileUploadUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid update data');
    }

    // Only allow updating pending uploads
    const [existing] = await db
      .select()
      .from(mobileUploads)
      .where(and(eq(mobileUploads.id, id), eq(mobileUploads.userId, session.user.id)));

    if (!existing) return notFoundResponse('Upload not found.');

    if (existing.status !== 'pending') {
      return errorResponse('Only pending uploads can be updated.', 'VALIDATION_ERROR', 422);
    }

    const [updated] = await db
      .update(mobileUploads)
      .set(parsed.data)
      .where(and(eq(mobileUploads.id, id), eq(mobileUploads.userId, session.user.id)))
      .returning();

    return Response.json({
      success: true,
      data: {
        ...updated,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (err) { console.error('[mobile-uploads/[id]]', err);
    return errorResponse('Failed to update upload', 'INTERNAL_ERROR', 500);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const { id } = await params;

  const rl = await checkRateLimit(`mobile-uploads:${session.user.id}`, API_RATE_LIMITS.upload);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

  try {
    const [deleted] = await db
      .delete(mobileUploads)
      .where(and(eq(mobileUploads.id, id), eq(mobileUploads.userId, session.user.id)))
      .returning();

    if (!deleted) return notFoundResponse('Upload not found.');

    return Response.json({ success: true });
  } catch (err) { console.error('[mobile-uploads/[id]]', err);
    return errorResponse('Failed to delete upload', 'INTERNAL_ERROR', 500);
  }
}
