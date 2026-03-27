import { NextRequest } from 'next/server';
import { eq, and, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { follows, userProfiles } from '@/db/schema';
import {
  getRequiredSession,
  unauthorizedResponse,
  validationErrorResponse,
  errorResponse,
} from '@/lib/auth-helpers';
import { checkTrustLevel } from '@/middleware/trust-guard';

export const dynamic = 'force-dynamic';

const followToggleSchema = z.object({
  targetUserId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const trustCheck = await checkTrustLevel(session.user.id, 'canFollow');
  if (!trustCheck.allowed) {
    return trustCheck.response!;
  }

  try {
    const body = await request.json();
    const parsed = followToggleSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid follow data');
    }

    const { targetUserId } = parsed.data;

    if (targetUserId === session.user.id) {
      return errorResponse('You cannot follow yourself.', 'VALIDATION_ERROR', 422);
    }

    const [existingFollow] = await db
      .select({ followerId: follows.followerId })
      .from(follows)
      .where(
        and(
          eq(follows.followerId, session.user.id),
          eq(follows.followingId, targetUserId)
        )
      )
      .limit(1);

    if (existingFollow) {
      await db
        .delete(follows)
        .where(
          and(
            eq(follows.followerId, session.user.id),
            eq(follows.followingId, targetUserId)
          )
        );

      await Promise.all([
        db
          .update(userProfiles)
          .set({
            followingCount: sql`GREATEST(${userProfiles.followingCount} - 1, 0)`,
            updatedAt: new Date(),
          })
          .where(eq(userProfiles.userId, session.user.id)),
        db
          .update(userProfiles)
          .set({
            followerCount: sql`GREATEST(${userProfiles.followerCount} - 1, 0)`,
            updatedAt: new Date(),
          })
          .where(eq(userProfiles.userId, targetUserId)),
      ]);

      return Response.json({
        success: true,
        data: { following: false },
      });
    }

    await db.insert(follows).values({
      followerId: session.user.id,
      followingId: targetUserId,
    });

    await Promise.all([
      db
        .update(userProfiles)
        .set({
          followingCount: sql`${userProfiles.followingCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(userProfiles.userId, session.user.id)),
      db
        .update(userProfiles)
        .set({
          followerCount: sql`${userProfiles.followerCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(userProfiles.userId, targetUserId)),
    ]);

    return Response.json({
      success: true,
      data: { following: true },
    });
  } catch {
    return errorResponse('Failed to toggle follow', 'INTERNAL_ERROR', 500);
  }
}
