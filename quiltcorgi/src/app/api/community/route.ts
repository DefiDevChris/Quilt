import { NextRequest } from 'next/server';
import { eq, and, ilike, desc, count, inArray, sql, gte } from 'drizzle-orm';
import { db } from '@/lib/db';
import { communityPosts, users, projects, userProfiles, likes, savedPosts } from '@/db/schema';
import { communityFeedSchema, createCommunityPostExtendedSchema } from '@/lib/validation';
import {
  getRequiredSession,
  unauthorizedResponse,
  validationErrorResponse,
  errorResponse,
} from '@/lib/auth-helpers';
import { checkTrustLevel, checkRateLimit } from '@/middleware/trust-guard';
import { escapeLikePattern } from '@/lib/escape-like';
import { formatCreatorName } from '@/lib/format-utils';

export const dynamic = 'force-dynamic';

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
    saved: url.searchParams.get('saved') ?? undefined,
    timeRange: url.searchParams.get('timeRange') ?? undefined,
  });

  if (!parsed.success) {
    return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid parameters');
  }

  const { search, sort, tab, category, page, limit, saved, timeRange } = parsed.data;
  const offset = (page - 1) * limit;

  try {
    // Handle ?saved=true — return only the current user's saved posts
    if (saved === 'true') {
      if (!session) {
        return unauthorizedResponse();
      }
      return handleSavedPosts(session, page, limit, offset);
    }

    // Handle ?sort=most-saved — return posts ordered by save count
    if (sort === 'most-saved') {
      return handleMostSaved(session, page, limit, offset, timeRange);
    }

    const conditions = [eq(communityPosts.status, 'approved')];

    if (category) {
      conditions.push(eq(communityPosts.category, category));
    }

    if (search) {
      conditions.push(ilike(communityPosts.title, `%${escapeLikePattern(search)}%`));
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
          creatorId: communityPosts.userId,
          creatorName: users.name,
          creatorUsername: userProfiles.username,
          creatorAvatarUrl: userProfiles.avatarUrl,
          creatorRole: users.role,
          projectId: communityPosts.projectId,
          projectName: projects.name,
          projectThumbnailUrl: projects.thumbnailUrl,
        })
        .from(communityPosts)
        .leftJoin(users, eq(communityPosts.userId, users.id))
        .leftJoin(userProfiles, eq(communityPosts.userId, userProfiles.userId))
        .leftJoin(projects, eq(communityPosts.projectId, projects.id))
        .where(whereClause)
        .orderBy(...orderBy)
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(communityPosts).where(whereClause),
    ]);

    const total = totalRow?.count ?? 0;

    // Compute isLikedByUser / isSavedByUser for the current user
    let likedPostIds = new Set<string>();
    let savedPostIds = new Set<string>();

    if (session) {
      const postIds = postRows.map((p) => p.id);
      if (postIds.length > 0) {
        const [likedRows, savedRows] = await Promise.all([
          db
            .select({ communityPostId: likes.communityPostId })
            .from(likes)
            .where(and(eq(likes.userId, session.user.id), inArray(likes.communityPostId, postIds))),
          db
            .select({ postId: savedPosts.postId })
            .from(savedPosts)
            .where(
              and(eq(savedPosts.userId, session.user.id), inArray(savedPosts.postId, postIds))
            ),
        ]);
        likedPostIds = new Set(likedRows.map((r) => r.communityPostId));
        savedPostIds = new Set(savedRows.map((r) => r.postId));
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
      creatorId: post.creatorId,
      creatorName: post.creatorName ? formatCreatorName(post.creatorName) : 'Anonymous',
      creatorUsername: post.creatorUsername ?? null,
      creatorAvatarUrl: post.creatorAvatarUrl ?? null,
      isPro: post.creatorRole === 'pro' || post.creatorRole === 'admin',
      projectId: post.projectId,
      projectName: post.projectName ?? null,
      projectThumbnailUrl: post.projectThumbnailUrl ?? null,
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
  } catch (error) {
    console.error('[Community API Error]', error);
    return errorResponse('Failed to load community feed', 'INTERNAL_ERROR', 500);
  }
}

/** Return the authenticated user's saved posts. */
async function handleSavedPosts(
  session: NonNullable<Awaited<ReturnType<typeof getRequiredSession>>>,
  page: number,
  limit: number,
  offset: number
) {
  // Get saved post IDs for this user
  const savedRows = await db
    .select({ postId: savedPosts.postId })
    .from(savedPosts)
    .where(eq(savedPosts.userId, session.user.id))
    .orderBy(desc(savedPosts.createdAt))
    .limit(limit)
    .offset(offset);

  const savedPostIds = savedRows.map((r) => r.postId);

  if (savedPostIds.length === 0) {
    return Response.json({
      success: true,
      data: {
        posts: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      },
    });
  }

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
        creatorId: communityPosts.userId,
        creatorName: users.name,
        creatorUsername: userProfiles.username,
        creatorAvatarUrl: userProfiles.avatarUrl,
        creatorRole: users.role,
      })
      .from(communityPosts)
      .leftJoin(users, eq(communityPosts.userId, users.id))
      .leftJoin(userProfiles, eq(communityPosts.userId, userProfiles.userId))
      .where(and(eq(communityPosts.status, 'approved'), inArray(communityPosts.id, savedPostIds))),
    db.select({ count: count() }).from(savedPosts).where(eq(savedPosts.userId, session.user.id)),
  ]);

  // Check which of these are liked by the user
  const postIds = postRows.map((p) => p.id);
  let likedPostIds = new Set<string>();
  if (postIds.length > 0) {
    const likedRows = await db
      .select({ communityPostId: likes.communityPostId })
      .from(likes)
      .where(and(eq(likes.userId, session.user.id), inArray(likes.communityPostId, postIds)));
    likedPostIds = new Set(likedRows.map((r) => r.communityPostId));
  }

  // Preserve the saved-order from the savedRows query
  const postMap = new Map(postRows.map((p) => [p.id, p]));
  const orderedPosts = savedPostIds
    .map((id) => postMap.get(id))
    .filter(Boolean)
    .map((post) => ({
      id: post!.id,
      title: post!.title,
      description: post!.description,
      thumbnailUrl: post!.thumbnailUrl,
      likeCount: post!.likeCount,
      commentCount: post!.commentCount,
      category: post!.category,
      creatorId: post!.creatorId,
      creatorName: post!.creatorName ? formatCreatorName(post!.creatorName) : 'Anonymous',
      creatorUsername: post!.creatorUsername ?? null,
      creatorAvatarUrl: post!.creatorAvatarUrl ?? null,
      isPro: post!.creatorRole === 'pro' || post!.creatorRole === 'admin',
      createdAt: post!.createdAt,
      isLikedByUser: likedPostIds.has(post!.id),
      isSavedByUser: true,
    }));

  const total = totalRow?.count ?? 0;

  return Response.json({
    success: true,
    data: {
      posts: orderedPosts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
  });
}

/** Return posts ordered by save count, optionally filtered to the last 30 days. */
async function handleMostSaved(
  session: Awaited<ReturnType<typeof getRequiredSession>>,
  page: number,
  limit: number,
  offset: number,
  timeRange?: string
) {
  const saveCountSubquery = db
    .select({
      postId: savedPosts.postId,
      saveCount: count().as('save_count'),
    })
    .from(savedPosts)
    .where(
      timeRange === 'month' ? gte(savedPosts.createdAt, sql`NOW() - INTERVAL '30 days'`) : undefined
    )
    .groupBy(savedPosts.postId)
    .as('save_counts');

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
        creatorId: communityPosts.userId,
        creatorName: users.name,
        creatorUsername: userProfiles.username,
        creatorAvatarUrl: userProfiles.avatarUrl,
        creatorRole: users.role,
        saveCount: saveCountSubquery.saveCount,
      })
      .from(communityPosts)
      .innerJoin(saveCountSubquery, eq(communityPosts.id, saveCountSubquery.postId))
      .leftJoin(users, eq(communityPosts.userId, users.id))
      .leftJoin(userProfiles, eq(communityPosts.userId, userProfiles.userId))
      .where(eq(communityPosts.status, 'approved'))
      .orderBy(desc(saveCountSubquery.saveCount), desc(communityPosts.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(communityPosts)
      .innerJoin(saveCountSubquery, eq(communityPosts.id, saveCountSubquery.postId))
      .where(eq(communityPosts.status, 'approved')),
  ]);

  const total = totalRow?.count ?? 0;

  // Compute isLikedByUser / isSavedByUser for the current user
  let likedPostIds = new Set<string>();
  let savedPostIds = new Set<string>();

  if (session) {
    const postIds = postRows.map((p) => p.id);
    if (postIds.length > 0) {
      const [likedRows, savedRows] = await Promise.all([
        db
          .select({ communityPostId: likes.communityPostId })
          .from(likes)
          .where(and(eq(likes.userId, session.user.id), inArray(likes.communityPostId, postIds))),
        db
          .select({ postId: savedPosts.postId })
          .from(savedPosts)
          .where(and(eq(savedPosts.userId, session.user.id), inArray(savedPosts.postId, postIds))),
      ]);
      likedPostIds = new Set(likedRows.map((r) => r.communityPostId));
      savedPostIds = new Set(savedRows.map((r) => r.postId));
    }
  }

  const postsWithMeta = postRows.map((post) => ({
    id: post.id,
    title: post.title,
    description: post.description,
    thumbnailUrl: post.thumbnailUrl,
    likeCount: post.likeCount,
    commentCount: post.commentCount,
    saveCount: post.saveCount ?? 0,
    category: post.category,
    creatorId: post.creatorId,
    creatorName: post.creatorName ? formatCreatorName(post.creatorName) : 'Anonymous',
    creatorUsername: post.creatorUsername ?? null,
    creatorAvatarUrl: post.creatorAvatarUrl ?? null,
    isPro: post.creatorRole === 'pro' || post.creatorRole === 'admin',
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
}

export async function POST(request: NextRequest) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const trustCheck = await checkTrustLevel(session.user.id, 'canPost');
  if (!trustCheck.allowed) {
    return trustCheck.response!;
  }

  const rateLimitCheck = await checkRateLimit(session.user.id, trustCheck.role, 'posts');
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
        'ALREADY_SHARED',
        409
      );
    }

    const [created] = await db
      .insert(communityPosts)
      .values({
        userId: session.user.id,
        projectId,
        title,
        description: description ?? null,
        thumbnailUrl: project.thumbnailUrl ?? '',
        category,
        status: 'approved',
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
