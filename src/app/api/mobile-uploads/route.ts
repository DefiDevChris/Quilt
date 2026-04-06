import { NextRequest } from 'next/server';
import { eq, and, count, desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { mobileUploads } from '@/db/schema';
import { mobileUploadCreateSchema, mobileUploadListSchema } from '@/lib/validation';
import {
  getRequiredSession,
  unauthorizedResponse,
  validationErrorResponse,
  errorResponse,
} from '@/lib/auth-helpers';
import { checkRateLimit, API_RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';
import { MOBILE_UPLOADS_MAX_PENDING } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const rl = await checkRateLimit(`mobile-uploads:${session.user.id}`, API_RATE_LIMITS.upload);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

  const url = request.nextUrl;
  const parsed = mobileUploadListSchema.safeParse({
    status: url.searchParams.get('status') ?? undefined,
    page: url.searchParams.get('page') ?? undefined,
    limit: url.searchParams.get('limit') ?? undefined,
  });

  if (!parsed.success) {
    return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid parameters');
  }

  const { status, page, limit } = parsed.data;
  const offset = (page - 1) * limit;

  try {
    const conditions = [eq(mobileUploads.userId, session.user.id)];
    if (status) {
      conditions.push(eq(mobileUploads.status, status));
    }

    const whereClause = and(...conditions);

    const [rows, [totalRow]] = await Promise.all([
      db
        .select()
        .from(mobileUploads)
        .where(whereClause)
        .orderBy(desc(mobileUploads.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(mobileUploads).where(whereClause),
    ]);

    const total = totalRow?.count ?? 0;

    return Response.json({
      success: true,
      data: {
        uploads: rows.map((r) => ({
          ...r,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch {
    return errorResponse('Failed to fetch mobile uploads', 'INTERNAL_ERROR', 500);
  }
}

export async function POST(request: NextRequest) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const rl = await checkRateLimit(`mobile-uploads:${session.user.id}`, API_RATE_LIMITS.upload);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

  try {
    const body = await request.json();
    const parsed = mobileUploadCreateSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid upload data');
    }

    // Check pending count cap
    const [pendingRow] = await db
      .select({ count: count() })
      .from(mobileUploads)
      .where(and(eq(mobileUploads.userId, session.user.id), eq(mobileUploads.status, 'pending')));

    if ((pendingRow?.count ?? 0) >= MOBILE_UPLOADS_MAX_PENDING) {
      return errorResponse(
        `You have reached the limit of ${MOBILE_UPLOADS_MAX_PENDING} pending uploads. Process or delete existing uploads first.`,
        'VALIDATION_ERROR',
        422
      );
    }

    const { imageUrl, originalFilename, fileSizeBytes } = parsed.data;

    const [created] = await db
      .insert(mobileUploads)
      .values({
        userId: session.user.id,
        imageUrl,
        originalFilename,
        fileSizeBytes,
      })
      .returning();

    return Response.json(
      {
        success: true,
        data: {
          ...created,
          createdAt: created.createdAt.toISOString(),
          updatedAt: created.updatedAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch {
    return errorResponse('Failed to create mobile upload', 'INTERNAL_ERROR', 500);
  }
}
