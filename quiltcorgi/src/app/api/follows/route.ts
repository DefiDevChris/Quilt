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
import { checkTrustLevel, checkRateLimit } from '@/middleware/trust-guard';
import { createNotification } from '@/lib/create-notification';
import { NOTIFICATION_TYPES } from '@/lib/notification-types';

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

  const rateCheck = await checkRateLimit(session.user.id, trustCheck.trustLevel, 'follows');
  if (!rateCheck.allowed) {
    return rateCheck.response!;
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
      .where(and(eq(follows.followerId, session.user.id), eq(follows.followingId, targetUserId)))
      .limit(1);

    if (existingFollow) {
      await db.transaction(async (tx) => {
        await tx
          .delete(follows)
          .where(
            and(eq(follows.followerId, session.user.id), eq(follows.followingId, targetUserId))
          );

        await Promise.all([
          tx
            .update(userProfiles)
            .set({
              followingCount: sql`GREATEST(${userProfiles.followingCount} - 1, 0)`,
              updatedAt: new Date(),
            })
            .where(eq(userProfiles.userId, session.user.id)),
          tx
            .update(userProfiles)
            .set({
              followerCount: sql`GREATEST(${userProfiles.followerCount} - 1, 0)`,
              updatedAt: new Date(),
            })
            .where(eq(userProfiles.userId, targetUserId)),
        ]);
      });

      return Response.json({
        success: true,
        data: { following: false },
      });
    }

    await db.transaction(async (tx) => {
      await tx.insert(follows).values({
        followerId: session.user.id,
        followingId: targetUserId,
      });

      await Promise.all([
        tx
          .update(userProfiles)
          .set({
            followingCount: sql`${userProfiles.followingCount} + 1`,
            updatedAt: new Date(),
          })
          .where(eq(userProfiles.userId, session.user.id)),
        tx
          .update(userProfiles)
          .set({
            followerCount: sql`${userProfiles.followerCount} + 1`,
            updatedAt: new Date(),
          })
          .where(eq(userProfiles.userId, targetUserId)),
      ]);
    });

    const followerName = session.user.name ?? 'Someone';

    const [followerProfile] = await db
      .select({ username: userProfiles.username })
      .from(userProfiles)
      .where(eq(userProfiles.userId, session.user.id))
      .limit(1);

    await createNotification({
      userId: targetUserId,
      type: NOTIFICATION_TYPES.NEW_FOLLOWER,
      title: 'New follower',
      message: `${followerName} started following you`,
      metadata: {
        followerId: session.user.id,
        followerUsername: followerProfile?.username ?? null,
      },
    });

    return Response.json({
      success: true,
      data: { following: true },
    });
  } catch {
    return errorResponse('Failed to toggle follow', 'INTERNAL_ERROR', 500);
  }
}
