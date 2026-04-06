import { NextRequest } from 'next/server';
import { eq, and, ilike, desc, count, inArray, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { socialPosts, users, projects, userProfiles, likes, bookmarks } from '@/db/schema';
import {
  communityFeedSchema,
  createCommunityPostExtendedSchema,
  createCommunityPostSimpleSchema,
} from '@/lib/validation';
import { getSession } from '@/lib/cognito-session';
import {
  getRequiredSession,
  unauthorizedResponse,
  validationErrorResponse,
  errorResponse,
} from '@/lib/auth-helpers';
import {
  checkTrustLevel,
  checkPrivacyPermission,
  checkCommunityRateLimit,
} from '@/middleware/trust-guard';
import { escapeLikePattern } from '@/lib/escape-like';
import { formatCreatorName } from '@/lib/format-utils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await getSession();

  const url = request.nextUrl;
  const parsed = communityFeedSchema.safeParse({
    search: url.searchParams.get('search') ?? undefined,
    sort: url.searchParams.get('sort') ?? undefined,
    tab: url.searchParams.get('tab') ?? undefined,
    category: url.searchParams.get('category') ?? undefined,
    creatorId: url.searchParams.get('creatorId') ?? undefined,
    page: url.searchParams.get('page') ?? undefined,
    limit: url.searchParams.get('limit') ?? undefined,
  });

  if (!parsed.success) {
    return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid parameters');
  }

  const { search, sort, category, creatorId, page, limit } = parsed.data;
  const tab = parsed.data.tab;
  const offset = (page - 1) * limit;

  try {
    // For the "saved" tab, we need to filter to bookmarked posts only
    const isSavedTab = tab === 'saved';
    if (isSavedTab && !session) {
      return Response.json({
        success: true,
        data: {
          posts: [],
          pagination: { page: 1, limit, total: 0, totalPages: 0 },
        },
      });
    }

    const conditions = [isNull(socialPosts.deletedAt)];

    if (category) {
      conditions.push(eq(socialPosts.category, category));
    }

    if (creatorId) {
      conditions.push(eq(socialPosts.userId, creatorId));
    }

    if (search) {
      conditions.push(ilike(socialPosts.title, `%${escapeLikePattern(search)}%`));
    }

    if (isSavedTab && session) {
      // Only show posts the user has bookmarked
      const bookmarkedIds = await db
        .select({ postId: bookmarks.postId })
        .from(bookmarks)
        .where(eq(bookmarks.userId, session.user.id));
      const ids = bookmarkedIds.map((b) => b.postId);
      if (ids.length === 0) {
        return Response.json({
          success: true,
          data: {
            posts: [],
            pagination: { page: 1, limit, total: 0, totalPages: 0 },
          },
        });
      }
      conditions.push(inArray(socialPosts.id, ids));
    }

    const whereClause = and(...conditions);

    const orderBy =
      sort === 'popular'
        ? [desc(socialPosts.likeCount), desc(socialPosts.createdAt)]
        : [desc(socialPosts.createdAt)];

    const [postRows, [totalRow]] = await Promise.all([
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
          creatorId: socialPosts.userId,
          creatorName: users.name,
          creatorUsername: userProfiles.username,
          creatorAvatarUrl: userProfiles.avatarUrl,
          creatorRole: users.role,
          projectId: socialPosts.projectId,
          projectName: projects.name,
          projectThumbnailUrl: projects.thumbnailUrl,
          templateId: socialPosts.templateId,
        })
        .from(socialPosts)
        .leftJoin(users, eq(socialPosts.userId, users.id))
        .leftJoin(userProfiles, eq(socialPosts.userId, userProfiles.userId))
        .leftJoin(projects, eq(socialPosts.projectId, projects.id))
        .where(whereClause)
        .orderBy(...orderBy)
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(socialPosts).where(whereClause),
    ]);

    const total = totalRow?.count ?? 0;

    // Compute isLikedByUser and isBookmarkedByUser for the current user
    let likedPostIds = new Set<string>();
    let bookmarkedPostIds = new Set<string>();

    if (session) {
      const postIds = postRows.map((p) => p.id);
      if (postIds.length > 0) {
        const [likedRows, bookmarkedRows] = await Promise.all([
          db
            .select({ communityPostId: likes.communityPostId })
            .from(likes)
            .where(and(eq(likes.userId, session.user.id), inArray(likes.communityPostId, postIds))),
          db
            .select({ postId: bookmarks.postId })
            .from(bookmarks)
            .where(and(eq(bookmarks.userId, session.user.id), inArray(bookmarks.postId, postIds))),
        ]);
        likedPostIds = new Set(likedRows.map((r) => r.communityPostId));
        bookmarkedPostIds = new Set(bookmarkedRows.map((r) => r.postId));
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
      templateId: post.templateId ?? null,
      createdAt: post.createdAt,
      isLikedByUser: likedPostIds.has(post.id),
      isBookmarkedByUser: bookmarkedPostIds.has(post.id),
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
    console.error('[Social API Error]', error);
    return errorResponse('Failed to load social feed', 'INTERNAL_ERROR', 500);
  }
}

export async function POST(request: NextRequest) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const trustCheck = await checkTrustLevel(session.user.id, 'canPost');
  if (!trustCheck.allowed) {
    return trustCheck.response!;
  }

  const privacyCheck = await checkPrivacyPermission(session.user.id, 'canPost');
  if (!privacyCheck.allowed) return privacyCheck.response!;

  const rateLimitCheck = await checkCommunityRateLimit(session.user.id, trustCheck.role, 'posts');
  if (!rateLimitCheck.allowed) {
    return rateLimitCheck.response!;
  }

  try {
    const body = await request.json();

    // Try extended schema first (with projectId), then simple schema
    const extendedParsed = createCommunityPostExtendedSchema.safeParse(body);
    const simpleParsed = createCommunityPostSimpleSchema.safeParse(body);

    const parsed = extendedParsed.success ? extendedParsed : simpleParsed;

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid post data');
    }

    let thumbnailUrl = '';

    // If projectId is provided, validate and get thumbnail
    if ('projectId' in parsed.data && parsed.data.projectId) {
      const [project] = await db
        .select({ id: projects.id, userId: projects.userId, thumbnailUrl: projects.thumbnailUrl })
        .from(projects)
        .where(and(eq(projects.id, parsed.data.projectId), eq(projects.userId, session.user.id)))
        .limit(1);

      if (!project) {
        return errorResponse('Project not found.', 'NOT_FOUND', 404);
      }

      const [existingPost] = await db
        .select({ id: socialPosts.id })
        .from(socialPosts)
        .where(eq(socialPosts.projectId, parsed.data.projectId))
        .limit(1);

      if (existingPost) {
        return errorResponse(
          'This project has already been shared to the community.',
          'ALREADY_SHARED',
          409
        );
      }

      thumbnailUrl = project.thumbnailUrl ?? '';
    } else if ('imageUrl' in parsed.data && parsed.data.imageUrl) {
      // Simple post with image URL
      thumbnailUrl = parsed.data.imageUrl;
    }

    const projectId = 'projectId' in parsed.data ? (parsed.data.projectId ?? null) : null;

    const [created] = await db
      .insert(socialPosts)
      .values({
        userId: session.user.id,
        projectId: projectId,
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        thumbnailUrl,
        category: parsed.data.category ?? 'general',
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
