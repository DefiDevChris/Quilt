import { NextRequest } from 'next/server';
import { eq, desc, count } from 'drizzle-orm';
import { db } from '@/lib/db';
import { blogPosts, users, userProfiles } from '@/db/schema';
import { getRequiredSession, unauthorizedResponse, errorResponse } from '@/lib/auth-helpers';
import { checkTrustLevel } from '@/middleware/trust-guard';
import { blogAdminListSchema } from '@/lib/validation';
import { validationErrorResponse } from '@/lib/api-responses';
import { calculateReadTime } from '@/lib/read-time';

export const dynamic = 'force-dynamic';


export async function GET(request: NextRequest) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const trustCheck = await checkTrustLevel(session.user.id, 'canModerate');
  if (!trustCheck.allowed) {
    return trustCheck.response!;
  }

  const url = request.nextUrl;
  const parsed = blogAdminListSchema.safeParse({
    status: url.searchParams.get('status') ?? undefined,
    page: url.searchParams.get('page') ?? undefined,
    limit: url.searchParams.get('limit') ?? undefined,
  });

  if (!parsed.success) {
    return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid parameters');
  }

  const { status: statusFilter, page, limit } = parsed.data;

  try {
    const whereClause =
      statusFilter && statusFilter !== 'all'
        ? eq(blogPosts.status, statusFilter)
        : undefined;

    const [postRows, [totalRow]] = await Promise.all([
      db
        .select({
          id: blogPosts.id,
          title: blogPosts.title,
          slug: blogPosts.slug,
          excerpt: blogPosts.excerpt,
          featuredImageUrl: blogPosts.featuredImageUrl,
          category: blogPosts.category,
          tags: blogPosts.tags,
          status: blogPosts.status,
          content: blogPosts.content,
          publishedAt: blogPosts.publishedAt,
          createdAt: blogPosts.createdAt,
          authorId: blogPosts.authorId,
          authorName: users.name,
          authorAvatarUrl: userProfiles.avatarUrl,
        })
        .from(blogPosts)
        .leftJoin(users, eq(blogPosts.authorId, users.id))
        .leftJoin(userProfiles, eq(blogPosts.authorId, userProfiles.userId))
        .where(whereClause)
        .orderBy(desc(blogPosts.createdAt))
        .limit(limit)
        .offset((page - 1) * limit),
      db.select({ count: count() }).from(blogPosts).where(whereClause),
    ]);

    const total = totalRow?.count ?? 0;

    const posts = postRows.map((post) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      featuredImageUrl: post.featuredImageUrl,
      category: post.category,
      tags: post.tags,
      status: post.status,
      publishedAt: post.publishedAt,
      createdAt: post.createdAt,
      authorId: post.authorId,
      authorName: post.authorName ?? 'Unknown',
      authorAvatarUrl: post.authorAvatarUrl ?? null,
      readTimeMinutes: calculateReadTime(post.content),
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
    return errorResponse('Failed to fetch blog posts for admin', 'INTERNAL_ERROR', 500);
  }
}
