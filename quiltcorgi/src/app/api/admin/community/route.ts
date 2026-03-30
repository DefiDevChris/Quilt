import { NextRequest } from 'next/server';
import { eq, desc, count } from 'drizzle-orm';
import { db } from '@/lib/db';
import { communityPosts, users } from '@/db/schema';
import { adminModerationListSchema } from '@/lib/validation';
import {
  getRequiredSession,
  unauthorizedResponse,
  validationErrorResponse,
  errorResponse,
} from '@/lib/auth-helpers';
import { checkTrustLevel } from '@/middleware/trust-guard';
import { formatCreatorName } from '@/lib/format-utils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const trustCheck = await checkTrustLevel(session.user.id, 'canModerate');
  if (!trustCheck.allowed) return trustCheck.response!;

  const url = request.nextUrl;
  const parsed = adminModerationListSchema.safeParse({
    status: url.searchParams.get('status') ?? undefined,
    page: url.searchParams.get('page') ?? undefined,
    limit: url.searchParams.get('limit') ?? undefined,
  });

  if (!parsed.success) {
    return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid parameters');
  }

  const { status, page, limit } = parsed.data;
  const offset = (page - 1) * limit;

  try {
    const whereClause = status && status !== 'all' ? eq(communityPosts.status, status) : undefined;

    const [postRows, [totalRow]] = await Promise.all([
      db
        .select({
          id: communityPosts.id,
          title: communityPosts.title,
          description: communityPosts.description,
          thumbnailUrl: communityPosts.thumbnailUrl,
          likeCount: communityPosts.likeCount,
          status: communityPosts.status,
          createdAt: communityPosts.createdAt,
          creatorName: users.name,
          userId: communityPosts.userId,
        })
        .from(communityPosts)
        .leftJoin(users, eq(communityPosts.userId, users.id))
        .where(whereClause)
        .orderBy(desc(communityPosts.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(communityPosts).where(whereClause),
    ]);

    const total = totalRow?.count ?? 0;

    const posts = postRows.map((post) => ({
      id: post.id,
      title: post.title,
      description: post.description,
      thumbnailUrl: post.thumbnailUrl,
      likeCount: post.likeCount,
      status: post.status,
      creatorName: post.creatorName ? formatCreatorName(post.creatorName) : 'Anonymous',
      userId: post.userId,
      createdAt: post.createdAt,
    }));

    return Response.json({
      success: true,
      data: {
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
    return errorResponse('Failed to fetch community posts for moderation', 'INTERNAL_ERROR', 500);
  }
}
