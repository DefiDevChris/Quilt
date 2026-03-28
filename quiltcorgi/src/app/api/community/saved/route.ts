import { NextRequest } from 'next/server';
import { eq, and, ilike, desc, count, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { communityPosts, likes, users, userProfiles, savedPosts } from '@/db/schema';
import { communityFeedSchema } from '@/lib/validation';
import {
  getRequiredSession,
  unauthorizedResponse,
  validationErrorResponse,
  errorResponse,
} from '@/lib/auth-helpers';
import { escapeLikePattern } from '@/lib/escape-like';

export const dynamic = 'force-dynamic';

function formatCreatorName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return parts[0] ?? '';
  return `${parts[0]} ${parts[1]![0]}.`;
}

export async function GET(request: NextRequest) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const url = request.nextUrl;
  const parsed = communityFeedSchema.safeParse({
    search: url.searchParams.get('search') ?? undefined,
    sort: url.searchParams.get('sort') ?? undefined,
    page: url.searchParams.get('page') ?? undefined,
    limit: url.searchParams.get('limit') ?? undefined,
  });

  if (!parsed.success) {
    return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid parameters');
  }

  const { search, sort, page, limit } = parsed.data;
  const offset = (page - 1) * limit;

  try {
    const baseConditions = [
      eq(communityPosts.status, 'approved'),
      eq(savedPosts.userId, session.user.id),
    ];

    if (search) {
      baseConditions.push(ilike(communityPosts.title, `%${escapeLikePattern(search)}%`));
    }

    const whereClause = and(...baseConditions);

    const orderBy =
      sort === 'popular'
        ? [desc(communityPosts.likeCount), desc(communityPosts.createdAt)]
        : [desc(savedPosts.createdAt)];

    const baseQuery = db
      .select({
        id: communityPosts.id,
        title: communityPosts.title,
        description: communityPosts.description,
        thumbnailUrl: communityPosts.thumbnailUrl,
        likeCount: communityPosts.likeCount,
        commentCount: communityPosts.commentCount,
        category: communityPosts.category,
        createdAt: communityPosts.createdAt,
        creatorName: users.name,
        creatorUsername: userProfiles.username,
        creatorAvatarUrl: userProfiles.avatarUrl,
      })
      .from(savedPosts)
      .innerJoin(communityPosts, eq(savedPosts.postId, communityPosts.id))
      .leftJoin(users, eq(communityPosts.userId, users.id))
      .leftJoin(userProfiles, eq(communityPosts.userId, userProfiles.userId))
      .where(whereClause);

    const [postRows, [totalRow]] = await Promise.all([
      baseQuery
        .orderBy(...orderBy)
        .limit(limit)
        .offset(offset),
      db
        .select({ count: count() })
        .from(savedPosts)
        .innerJoin(communityPosts, eq(savedPosts.postId, communityPosts.id))
        .where(whereClause),
    ]);

    const total = totalRow?.count ?? 0;

    let likedPostIds = new Set<string>();
    const postIds = postRows.map((p) => p.id);
    if (postIds.length > 0) {
      const userLikes = await db
        .select({ communityPostId: likes.communityPostId })
        .from(likes)
        .where(
          and(eq(likes.userId, session.user.id), sql`${likes.communityPostId} = ANY(${postIds})`)
        );
      likedPostIds = new Set(userLikes.map((l) => l.communityPostId));
    }

    const postsWithMeta = postRows.map((post) => ({
      id: post.id,
      title: post.title,
      description: post.description,
      thumbnailUrl: post.thumbnailUrl,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      category: post.category,
      creatorName: post.creatorName ? formatCreatorName(post.creatorName) : 'Anonymous',
      creatorUsername: post.creatorUsername ?? null,
      creatorAvatarUrl: post.creatorAvatarUrl ?? null,
      createdAt: post.createdAt,
      isLikedByUser: likedPostIds.has(post.id),
      isSavedByUser: true,
    }));

    return Response.json({
      success: true,
      data: {
        posts: postsWithMeta,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch {
    return errorResponse('Failed to fetch saved posts', 'INTERNAL_ERROR', 500);
  }
}
