import { NextRequest } from 'next/server';
import { desc, count } from 'drizzle-orm';
import { db } from '@/lib/db';
import { blogPosts } from '@/db/schema';
import { requireAdminSession } from '@/lib/auth-helpers';
import { errorResponse, validationErrorResponse } from '@/lib/api-responses';
import { adminPaginationSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

// GET - List all blog posts (admin view, includes drafts)
export async function GET(request: NextRequest) {
  const result = await requireAdminSession();
  if (result instanceof Response) return result;

  const url = request.nextUrl;
  const parsed = adminPaginationSchema.safeParse({
    page: url.searchParams.get('page') ?? undefined,
    limit: url.searchParams.get('limit') ?? undefined,
  });

  if (!parsed.success) {
    return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid parameters');
  }

  const { page, limit } = parsed.data;
  const offset = (page - 1) * limit;

  try {

    const [rows, totalCountResult] = await Promise.all([
      db
        .select({
          id: blogPosts.id,
          title: blogPosts.title,
          slug: blogPosts.slug,
          excerpt: blogPosts.excerpt,
          featuredImageUrl: blogPosts.featuredImageUrl,
          category: blogPosts.category,
          status: blogPosts.status,
          createdAt: blogPosts.createdAt,
          updatedAt: blogPosts.updatedAt,
          publishedAt: blogPosts.publishedAt,
        })
        .from(blogPosts)
        .orderBy(desc(blogPosts.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(blogPosts),
    ]);

    const total = totalCountResult[0]?.total ?? 0;

    return Response.json({
      success: true,
      data: {
        posts: rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) { console.error('[admin/blog]', err);
    return errorResponse('Failed to fetch blog posts', 'INTERNAL_ERROR', 500);
  }
}
