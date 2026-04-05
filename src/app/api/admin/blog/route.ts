import { NextRequest } from 'next/server';
import { eq, desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { blogPosts } from '@/db/schema';
import { getRequiredSession } from '@/lib/auth-helpers';
import { errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api-responses';
import { isAdmin } from '@/lib/trust-utils';

export const dynamic = 'force-dynamic';

// GET - List all blog posts (admin view, includes drafts)
export async function GET(request: NextRequest) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const userRole = session.user.role as string;
  if (!isAdmin(userRole)) {
    return forbiddenResponse();
  }

  try {
    const url = request.nextUrl;
    const page = parseInt(url.searchParams.get('page') ?? '1', 10);
    const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '50', 10), 100);
    const offset = (page - 1) * limit;

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
      db.select().from(blogPosts),
    ]);

    return Response.json({
      success: true,
      data: {
        posts: rows,
        pagination: {
          page,
          limit,
          total: totalCountResult.length,
          totalPages: Math.ceil(totalCountResult.length / limit),
        },
      },
    });
  } catch {
    return errorResponse('Failed to fetch blog posts', 'INTERNAL_ERROR', 500);
  }
}
