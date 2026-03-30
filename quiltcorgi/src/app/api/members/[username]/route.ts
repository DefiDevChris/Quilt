import { NextRequest } from 'next/server';
import { eq, desc, count, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { userProfiles, users, communityPosts } from '@/db/schema';
import { notFoundResponse, errorResponse } from '@/lib/auth-helpers';
import { COMMUNITY_PAGINATION_DEFAULT_LIMIT } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
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

    const url = request.nextUrl;
    const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
    const limit = Math.min(
      48,
      Math.max(1, parseInt(url.searchParams.get('limit') ?? String(COMMUNITY_PAGINATION_DEFAULT_LIMIT), 10) || COMMUNITY_PAGINATION_DEFAULT_LIMIT)
    );
    const offset = (page - 1) * limit;

    const [postRows, [totalRow]] = await Promise.all([
      db
        .select({
          id: communityPosts.id,
          title: communityPosts.title,
          description: communityPosts.description,
          thumbnailUrl: communityPosts.thumbnailUrl,
          likeCount: communityPosts.likeCount,
          category: communityPosts.category,
          createdAt: communityPosts.createdAt,
        })
        .from(communityPosts)
        .where(
          and(
            eq(communityPosts.userId, profile.userId),
            eq(communityPosts.status, 'approved')
          )
        )
        .orderBy(desc(communityPosts.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: count() })
        .from(communityPosts)
        .where(
          and(
            eq(communityPosts.userId, profile.userId),
            eq(communityPosts.status, 'approved')
          )
        ),
    ]);

    const total = totalRow?.count ?? 0;
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
          createdAt: profile.createdAt,
        },
        posts: postRows,
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
