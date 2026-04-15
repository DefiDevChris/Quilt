import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { userProfiles } from '@/db/schema';
import { updateProfileSchema } from '@/lib/validation';
import {
  getRequiredSession,
  unauthorizedResponse,
  validationErrorResponse,
  errorResponse,
} from '@/lib/auth-helpers';
import { checkRateLimit, API_RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const rl = await checkRateLimit(`profile:${session.user.id}`, API_RATE_LIMITS.profile);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

  try {
    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, session.user.id))
      .limit(1);

    return Response.json({
      success: true,
      data: profile ?? null,
    });
  } catch {
    return errorResponse('Failed to fetch profile', 'INTERNAL_ERROR', 500);
  }
}

export async function PUT(request: Request) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const rl = await checkRateLimit(`profile:${session.user.id}`, API_RATE_LIMITS.profile);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

  try {
    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid profile data');
    }

    const { displayName } = parsed.data;

    const [existing] = await db
      .select({ id: userProfiles.id })
      .from(userProfiles)
      .where(eq(userProfiles.userId, session.user.id))
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(userProfiles)
        .set({ displayName, updatedAt: new Date() })
        .where(eq(userProfiles.id, existing.id))
        .returning();

      return Response.json({
        success: true,
        data: updated,
      });
    }

    const [created] = await db
      .insert(userProfiles)
      .values({ userId: session.user.id, displayName })
      .returning();

    return Response.json(
      {
        success: true,
        data: created,
      },
      { status: 201 }
    );
  } catch {
    return errorResponse('Failed to update profile', 'INTERNAL_ERROR', 500);
  }
}
