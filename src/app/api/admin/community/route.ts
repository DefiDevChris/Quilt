import { NextRequest } from 'next/server';
import { desc, count } from 'drizzle-orm';
import { db } from '@/lib/db';
import { socialPosts, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireAdminSession } from '@/lib/auth-helpers';
import { unauthorizedResponse, validationErrorResponse, errorResponse } from '@/lib/api-responses';
import { formatCreatorName } from '@/lib/format-utils';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export async function GET(request: NextRequest) {
  const result = await requireAdminSession();
  if (result instanceof Response) return result;
  const { session } = result;

  const url = request.nextUrl;
  const parsed = paginationSchema.safeParse({
    page: url.searchParams.get('page') ?? undefined,
    limit: url.searchParams.get('limit') ?? undefined,
  });

  if (!parsed.success) {
    return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid parameters');
  }

  const { page, limit } = parsed.data;
  const offset = (page - 1) * limit;

  try {
    const [postRows, [totalRow]] = await Promise.all([
      db
        .select({
          id: socialPosts.id,
          title: socialPosts.title,
          description: socialPosts.description,
          thumbnailUrl: socialPosts.thumbnailUrl,
          likeCount: socialPosts.likeCount,
          createdAt: socialPosts.createdAt,
          creatorName: users.name,
          userId: socialPosts.userId,
        })
        .from(socialPosts)
        .leftJoin(users, eq(socialPosts.userId, users.id))
        .orderBy(desc(socialPosts.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(socialPosts),
    ]);

    const total = totalRow?.count ?? 0;

    const posts = postRows.map((post) => ({
      id: post.id,
      title: post.title,
      description: post.description,
      thumbnailUrl: post.thumbnailUrl,
      likeCount: post.likeCount,
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
