import { NextRequest } from 'next/server';
import { eq, and, ilike, desc, count, inArray, isNull, lt } from 'drizzle-orm';
import { db } from '@/lib/db';
import { socialPosts, users, projects, userProfiles, likes } from '@/db/schema';
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
import { isPro } from '@/lib/role-utils';
import type { UserRole } from '@/lib/role-utils';
import { checkRateLimit, API_RATE_LIMITS, getClientIp, rateLimitResponse } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = await checkRateLimit(`community:${ip}`, API_RATE_LIMITS.blocks);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

  const session = await getSession();

  const url = request.nextUrl;
  const parsed = communityFeedSchema.safeParse({
    search: url.searchParams.get('search') ?? undefined,
    sort: url.searchParams.get('sort') ?? undefined,
    tab: url.searchParams.get('tab') ?? undefined,
    category: url.searchParams.get('category') ?? undefined,
    creatorId: url.searchParams.get('creatorId') ?? undefined,
    cursor: url.searchParams.get('cursor') ?? undefined,
    limit: url.searchParams.get('limit') ?? undefined,
  });

  if (!parsed.success) {
    return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid parameters');
  }

  const { search, sort, category, creatorId, cursor, limit } = parsed.data;

  try {
    // Filter for posts that are not soft-deleted
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

    if (cursor) {
      const cursorDate = new Date(cursor);
      conditions.push(lt(socialPosts.createdAt, cursorDate));
    }

    const whereClause = and(...conditions);

    const orderBy =
      sort === 'popular'
        ? [desc(socialPosts.likeCount), desc(socialPosts.createdAt)]
        : [desc(socialPosts.createdAt)];

    const postRows = await db
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
        .limit(limit + 1); // Fetch one extra to determine if there's a next page

    const hasNextPage = postRows.length > limit;
    const postsToReturn = hasNextPage ? postRows.slice(0, -1) : postRows;
    const nextCursor = hasNextPage ? postsToReturn[postsToReturn.length - 1].createdAt.toISOString() : null;

    // Compute isLikedByUser for the current user
    let likedPostIds = new Set<string>();

    if (session) {
      const postIds = postRows.map((p) => p.id);
      if (postIds.length > 0) {
        const likedRows = await db
          .select({ communityPostId: likes.communityPostId })
          .from(likes)
          .where(and(eq(likes.userId, session.user.id), inArray(likes.communityPostId, postIds)));
        likedPostIds = new Set(likedRows.map((r) => r.communityPostId));
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
      isPro: isPro((post.creatorRole ?? 'free') as UserRole),
      projectId: post.projectId,
      projectName: post.projectName ?? null,
      projectThumbnailUrl: post.projectThumbnailUrl ?? null,
      templateId: post.templateId ?? null,
      createdAt: post.createdAt,
      isLikedByUser: likedPostIds.has(post.id),
    }));

    return Response.json({
      success: true,
      data: {
        posts: postsWithMeta,
        pagination: {
          nextCursor,
          limit,
        },
      },
    });
  } catch {
    return errorResponse('Failed to load community feed', 'INTERNAL_ERROR', 500);
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

    // Pick schema based on whether the body includes a category (extended) or not (simple)
    const schema = body.category
      ? createCommunityPostExtendedSchema
      : createCommunityPostSimpleSchema;
    const parsed = schema.safeParse(body);

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
        category: parsed.data.category,
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
