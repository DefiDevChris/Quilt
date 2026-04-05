import { NextRequest } from 'next/server';
import { desc, count } from 'drizzle-orm';
import { db } from '@/lib/db';
import { blogPosts } from '@/db/schema';
import { getRequiredSession } from '@/lib/auth-helpers';
import { errorResponse, unauthorizedResponse, forbiddenResponse, validationErrorResponse } from '@/lib/api-responses';
import { isAdmin } from '@/lib/trust-utils';
import { generateSlug, appendSlugSuffix } from '@/lib/blog-slug';

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
  } catch {
    return errorResponse('Failed to fetch blog posts', 'INTERNAL_ERROR', 500);
  }
}

// POST - Create a new blog post
export async function POST(request: NextRequest) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const userRole = session.user.role as string;
  if (!isAdmin(userRole)) {
    return forbiddenResponse();
  }

  try {
    const body = await request.json();

    if (!body.title) {
      return validationErrorResponse('Title is required');
    }

    let newSlug = generateSlug(body.title);

    // Check for slug conflict
    const conflictRes = await db
      .select({ id: blogPosts.id })
      .from(blogPosts)
      .where(eq(blogPosts.slug, newSlug));

    if (conflictRes.length > 0) {
      newSlug = appendSlugSuffix(newSlug);
    }

    const postData = {
      authorId: session.user.id,
      title: body.title,
      slug: newSlug,
      excerpt: body.excerpt || null,
      content: body.content || null,
      category: body.category || 'Product Updates',
      layout: body.layout || 'standard',
      status: body.status || 'draft',
      tags: body.tags || [],
      featuredImageUrl: body.featuredImageUrl || null,
      ...(body.status === 'published' ? { publishedAt: new Date() } : {}),
    };

    const [inserted] = await db
      .insert(blogPosts)
      .values(postData as any) // Type assertion to handle complex JSON types and enums
      .returning();

    return Response.json({ success: true, data: inserted });
  } catch (error) {
    console.error('Failed to create blog post', error);
    return errorResponse('Failed to create blog post', 'INTERNAL_ERROR', 500);
  }
}
