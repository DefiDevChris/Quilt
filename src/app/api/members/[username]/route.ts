import { NextRequest } from 'next/server';
import { eq, desc, count, and, sql, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { userProfiles, users, socialPosts, likes, follows } from '@/db/schema';
import { notFoundResponse, errorResponse } from '@/lib/auth-helpers';
import { COMMUNITY_PAGINATION_DEFAULT_LIMIT } from '@/lib/constants';
import { getSession } from '@/lib/cognito-session';
import { checkRateLimit, API_RATE_LIMITS, getClientIp, rateLimitResponse } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const ip = getClientIp(request);
  const rl = await checkRateLimit(`member-profile:${ip}`, API_RATE_LIMITS.publicRead);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

  const { username } = await params;

  try {
    const [profile] = await db
      .select({
        id: userProfiles.id,
        userId: userProfiles.userId,
        displayName: userProfiles.displayName,
        username: userProfiles.username,
        bio: userProfiles.bio,
        avatarUrl: userProfiles.avatarUrl,
        location: userProfiles.location,
        websiteUrl: userProfiles.websiteUrl,
        instagramHandle: userProfiles.instagramHandle,
        youtubeHandle: userProfiles.youtubeHandle,
        tiktokHandle: userProfiles.tiktokHandle,
        publicEmail: userProfiles.publicEmail,
        privacyMode: userProfiles.privacyMode,
        createdAt: userProfiles.createdAt,
        role: users.role,
      })
      .from(userProfiles)
      .leftJoin(users, eq(userProfiles.userId, users.id))
      .where(eq(userProfiles.username, username))
      .limit(1);

    if (!profile) {
      return notFoundResponse('User not found.');
    }

    const session = await getSession();
    const currentUserId = session?.user.id ?? null;
    const isOwner = currentUserId === profile.userId;

    if (profile.privacyMode === 'private' && !isOwner) {
      return notFoundResponse('User not found.');
    }

    const url = request.nextUrl;
    const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
    const limit = Math.min(
      48,
      Math.max(
        1,
        parseInt(url.searchParams.get('limit') ?? String(COMMUNITY_PAGINATION_DEFAULT_LIMIT), 10) ||
          COMMUNITY_PAGINATION_DEFAULT_LIMIT
      )
    );
    const offset = (page - 1) * limit;

    const [postRows, [totalRow], followerCountRow, followingCountRow, isFollowedRow] =
      await Promise.all([
        db
          .select({
            id: socialPosts.id,
            title: socialPosts.title,
            description: socialPosts.description,
            thumbnailUrl: socialPosts.thumbnailUrl,
            likeCount: socialPosts.likeCount,
            commentCount: socialPosts.commentCount,
            category: socialPosts.category,
            createdAt: socialPosts.createdAt,
          })
          .from(socialPosts)
          .where(and(eq(socialPosts.userId, profile.userId), isNull(socialPosts.deletedAt)))
          .orderBy(desc(socialPosts.createdAt))
          .limit(limit)
          .offset(offset),
        db
          .select({ count: count() })
          .from(socialPosts)
          .where(and(eq(socialPosts.userId, profile.userId), isNull(socialPosts.deletedAt))),
        db.select({ count: count() }).from(follows).where(eq(follows.followingId, profile.userId)),
        db.select({ count: count() }).from(follows).where(eq(follows.followerId, profile.userId)),
        currentUserId
          ? db
              .select({ followerId: follows.followerId })
              .from(follows)
              .where(
                and(eq(follows.followerId, currentUserId), eq(follows.followingId, profile.userId))
              )
              .limit(1)
          : Promise.resolve([]),
      ]);

    const total = totalRow?.count ?? 0;
    const followerCount = followerCountRow[0]?.count ?? 0;
    const followingCount = followingCountRow[0]?.count ?? 0;
    const isFollowedByCurrentUser = isFollowedRow.length > 0;

    let likedPostIds = new Set<string>();
    if (currentUserId && postRows.length > 0) {
      const postIds = postRows.map((p) => p.id);
      const likedRows = await db
        .select({ postId: likes.communityPostId })
        .from(likes)
        .where(
          and(eq(likes.userId, currentUserId), sql`${likes.communityPostId} = ANY(${postIds})`)
        );
      likedPostIds = new Set(likedRows.map((r) => r.postId as string));
    }

    const posts = postRows.map((p) => ({
      ...p,
      isLikedByUser: likedPostIds.has(p.id),
    }));

    const isPro = profile.role === 'pro' || profile.role === 'admin';

    return Response.json({
      success: true,
      data: {
        profile: {
          id: profile.id,
          userId: profile.userId,
          displayName: profile.displayName,
          username: profile.username,
          bio: profile.bio,
          avatarUrl: profile.avatarUrl,
          location: profile.location,
          websiteUrl: profile.websiteUrl,
          instagramHandle: profile.instagramHandle,
          youtubeHandle: profile.youtubeHandle,
          tiktokHandle: profile.tiktokHandle,
          publicEmail: profile.publicEmail,
          isPro,
          privacyMode: profile.privacyMode ?? 'public',
          createdAt: profile.createdAt,
          followerCount,
          followingCount,
          isFollowedByCurrentUser,
        },
        posts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch {
    return errorResponse('Failed to fetch member profile', 'INTERNAL_ERROR', 500);
  }
}
