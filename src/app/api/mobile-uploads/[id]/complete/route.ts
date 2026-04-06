import { NextRequest } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { mobileUploads } from '@/db/schema';
import { mobileUploadCompleteSchema } from '@/lib/validation';
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

export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const { id } = await params;

  const rl = await checkRateLimit(`mobile-uploads:${session.user.id}`, API_RATE_LIMITS.upload);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

  try {
    const body = await request.json();
    const parsed = mobileUploadCompleteSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid completion data');
    }

    const { processedEntityId, processedEntityType } = parsed.data;

    const [updated] = await db
      .update(mobileUploads)
      .set({
        status: 'completed',
        processedEntityId,
        processedEntityType,
      })
      .where(
        and(
          eq(mobileUploads.id, id),
          eq(mobileUploads.userId, session.user.id),
          eq(mobileUploads.status, 'processing')
        )
      )
      .returning();

    if (!updated) {
      const [existing] = await db
        .select({ id: mobileUploads.id, status: mobileUploads.status })
        .from(mobileUploads)
        .where(and(eq(mobileUploads.id, id), eq(mobileUploads.userId, session.user.id)));

      if (!existing) return notFoundResponse('Upload not found.');
      return errorResponse(
        `Upload is ${existing.status}. Only processing uploads can be completed.`,
        'VALIDATION_ERROR',
        422
      );
    }

    return Response.json({
      success: true,
      data: {
        ...updated,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch {
    return errorResponse('Failed to complete upload', 'INTERNAL_ERROR', 500);
  }
}
