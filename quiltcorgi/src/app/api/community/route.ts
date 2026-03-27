import { NextRequest } from 'next/server';
import { eq, and, ilike, desc, count, sql, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  communityPosts,
  likes,
  users,
  projects,
  userProfiles,
  follows,
  savedPosts,
} from '@/db/schema';
import { communityFeedSchema, createCommunityPostExtendedSchema } from '@/lib/validation';
import {
  getRequiredSession,
  unauthorizedResponse,
  validationErrorResponse,
  errorResponse,
} from '@/lib/auth-helpers';
import { checkTrustLevel, checkRateLimit, buildTrustUserInput } from '@/middleware/trust-guard';
import { shouldModerateContent } from '@/lib/trust-engine';

export const dynamic = 'force-dynamic';

function formatCreatorName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return parts[0] ?? '';
  return `${parts[0]} ${parts[1]![0]}.`;
}

export async function GET(request: NextRequest) {
  const session = await getRequiredSession();

  const url = request.nextUrl;
  const parsed = communityFeedSchema.safeParse({
    search: url.searchParams.get('search') ?? undefined,
    sort: url.searchParams.get('sort') ?? undefined,
    tab: url.searchParams.get('tab') ?? undefined,
    category: url.searchParams.get('category') ?? undefined,
    page: url.searchParams.get('page') ?? undefined,
    limit: url.searchParams.get('limit') ?? undefined,
  });

  if (!parsed.success) {
    return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid parameters');
  }

  const { search, sort, tab, category, page, limit } = parsed.data;
  const offset = (page - 1) * limit;

  if (tab === 'following' && !session) {
    return unauthorizedResponse();
  }

  try {
    const conditions = [eq(communityPosts.status, 'approved')];

    if (tab === 'featured') {
      conditions.push(eq(communityPosts.isFeatured, true));
    }

    if (tab === 'following' && session) {
      const followedUsers = db
        .select({ followingId: follows.followingId })
        .from(follows)
        .where(eq(follows.followerId, session.user.id));

      conditions.push(inArray(communityPosts.userId, followedUsers));
    }

    if (category) {
      conditions.push(eq(communityPosts.category, category));
    }

    if (search) {
      conditions.push(ilike(communityPosts.title, `%${search}%`));
    }

    const whereClause = and(...conditions);

    const orderBy =
      sort === 'popular'
        ? [desc(communityPosts.likeCount), desc(communityPosts.createdAt)]
        : [desc(communityPosts.createdAt)];

    const [postRows, [totalRow]] = await Promise.all([
      db
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
        .from(communityPosts)
        .leftJoin(users, eq(communityPosts.userId, users.id))
        .leftJoin(userProfiles, eq(communityPosts.userId, userProfiles.userId))
        .where(whereClause)
        .orderBy(...orderBy)
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(communityPosts).where(whereClause),
    ]);

    const total = totalRow?.count ?? 0;

    let likedPostIds = new Set<string>();
    let savedPostIds = new Set<string>();

    if (session) {
      const postIds = postRows.map((p) => p.id);
      if (postIds.length > 0) {
        const [userLikes, userSaves] = await Promise.all([
          db
            .select({ communityPostId: likes.communityPostId })
            .from(likes)
            .where(
              and(
                eq(likes.userId, session.user.id),
                sql`${likes.communityPostId} = ANY(${postIds})`
              )
            ),
          db
            .select({ postId: savedPosts.postId })
            .from(savedPosts)
            .where(
              and(
                eq(savedPosts.userId, session.user.id),
                sql`${savedPosts.postId} = ANY(${postIds})`
              )
            ),
        ]);
        likedPostIds = new Set(userLikes.map((l) => l.communityPostId));
        savedPostIds = new Set(userSaves.map((s) => s.postId));
      }
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
      isSavedByUser: savedPostIds.has(post.id),
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
    return errorResponse('Failed to fetch community posts', 'INTERNAL_ERROR', 500);
  }
}

export async function POST(request: NextRequest) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const trustCheck = await checkTrustLevel(session.user.id, 'canPost');
  if (!trustCheck.allowed) {
    return trustCheck.response!;
  }

  const rateLimitCheck = await checkRateLimit(session.user.id, trustCheck.trustLevel, 'posts');
  if (!rateLimitCheck.allowed) {
    return rateLimitCheck.response!;
  }

  try {
    const body = await request.json();
    const parsed = createCommunityPostExtendedSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid post data');
    }

    const { projectId, title, description, category } = parsed.data;

    const [project] = await db
      .select({ id: projects.id, userId: projects.userId, thumbnailUrl: projects.thumbnailUrl })
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, session.user.id)))
      .limit(1);

    if (!project) {
      return errorResponse('Project not found.', 'NOT_FOUND', 404);
    }

    const [existingPost] = await db
      .select({ id: communityPosts.id })
      .from(communityPosts)
      .where(eq(communityPosts.projectId, projectId))
      .limit(1);

    if (existingPost) {
      return errorResponse(
        'This project has already been shared to the community.',
        'ALREADY_SHARED' as 'CONFLICT',
        409
      );
    }

    const trustUser = await buildTrustUserInput(session.user.id);
    const approvedPostCount = trustUser?.approvedPostCount ?? 0;
    const needsModeration = shouldModerateContent(trustCheck.trustLevel, 'post', approvedPostCount);
    const status = needsModeration ? 'pending' : 'approved';

    const [created] = await db
      .insert(communityPosts)
      .values({
        userId: session.user.id,
        projectId,
        title,
        description: description ?? null,
        thumbnailUrl: project.thumbnailUrl ?? '',
        category,
        status,
      })
      .returning();

    return Response.json(
      {
        success: true,
        data: created,
      },
      { status: 201 }
    );
  } catch {
    return errorResponse('Failed to create community post', 'INTERNAL_ERROR', 500);
  }
}
