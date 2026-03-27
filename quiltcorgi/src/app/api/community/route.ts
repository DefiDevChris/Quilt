import { NextRequest } from 'next/server';
import { eq, and, ilike, desc, count, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { communityPosts, likes, users, projects } from '@/db/schema';
import { communitySearchSchema, createCommunityPostSchema } from '@/lib/validation';
import {
  getRequiredSession,
  unauthorizedResponse,
  validationErrorResponse,
  errorResponse,
} from '@/lib/auth-helpers';
import { COMMUNITY_PAGINATION_DEFAULT_LIMIT } from '@/lib/constants';

export const dynamic = 'force-dynamic';

function formatCreatorName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return parts[0] ?? '';
  return `${parts[0]} ${parts[1]![0]}.`;
}

export async function GET(request: NextRequest) {
  const session = await getRequiredSession();

  const url = request.nextUrl;
  const parsed = communitySearchSchema.safeParse({
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
    const conditions = [eq(communityPosts.status, 'approved')];

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
          createdAt: communityPosts.createdAt,
          creatorName: users.name,
        })
        .from(communityPosts)
        .leftJoin(users, eq(communityPosts.userId, users.id))
        .where(whereClause)
        .orderBy(...orderBy)
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(communityPosts).where(whereClause),
    ]);

    const total = totalRow?.count ?? 0;

    let likedPostIds = new Set<string>();
    if (session) {
      const postIds = postRows.map((p) => p.id);
      if (postIds.length > 0) {
        const userLikes = await db
          .select({ communityPostId: likes.communityPostId })
          .from(likes)
          .where(
            and(
              eq(likes.userId, session.user.id),
              sql`${likes.communityPostId} = ANY(${postIds})`
            )
          );
        likedPostIds = new Set(userLikes.map((l) => l.communityPostId));
      }
    }

    const postsWithLikes = postRows.map((post) => ({
      id: post.id,
      title: post.title,
      description: post.description,
      thumbnailUrl: post.thumbnailUrl,
      likeCount: post.likeCount,
      creatorName: post.creatorName ? formatCreatorName(post.creatorName) : 'Anonymous',
      createdAt: post.createdAt,
      isLikedByUser: likedPostIds.has(post.id),
    }));

    return Response.json({
      success: true,
      data: {
        posts: postsWithLikes,
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

  const role = (session.user as { role?: string }).role ?? 'free';
  const isPro = role === 'pro' || role === 'admin';
  if (!isPro) {
    return errorResponse('Sharing to the community requires a Pro subscription.', 'PRO_REQUIRED', 403);
  }

  try {
    const body = await request.json();
    const parsed = createCommunityPostSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid post data');
    }

    const { projectId, title, description } = parsed.data;

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

    const [created] = await db
      .insert(communityPosts)
      .values({
        userId: session.user.id,
        projectId,
        title,
        description: description ?? null,
        thumbnailUrl: project.thumbnailUrl ?? '',
        status: 'pending',
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
