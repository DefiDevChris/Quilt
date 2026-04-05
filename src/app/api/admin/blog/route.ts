import { NextRequest } from 'next/server';
import { eq, desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { blogPosts } from '@/db/schema';
import { getRequiredSession } from '@/lib/auth-helpers';
import { errorResponse, unauthorizedResponse, forbiddenResponse, validationErrorResponse } from '@/lib/api-responses';
import { isAdmin } from '@/lib/trust-utils';
import { createBlogPostSchema } from '@/lib/validation';
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
    const parsed = createBlogPostSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid post data');
    }

    const { title, content, excerpt, featuredImageUrl, category, tags } = parsed.data;

    let slug = generateSlug(title);

    // Check for slug conflict
    const [existing] = await db
      .select({ id: blogPosts.id })
      .from(blogPosts)
      .where(eq(blogPosts.slug, slug))
      .limit(1);

    if (existing) {
      slug = appendSlugSuffix(slug);
    }

    // Attempt insert with retry logic for race condition handling
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const [created] = await db
          .insert(blogPosts)
          .values({
            authorId: session.user.id,
            title,
            slug,
            content: content ?? null,
            excerpt: excerpt ?? null,
            featuredImageUrl: featuredImageUrl ?? null,
            category,
            tags,
          })
          .returning();

        return Response.json({ success: true, data: created }, { status: 201 });
      } catch (err) {
        // Check for unique constraint violation (PostgreSQL error code 23505)
        if (err && typeof err === 'object' && 'code' in err && err.code === '23505') {
          attempts++;
          if (attempts >= maxAttempts) {
            break;
          }
          // Generate new slug with different suffix and retry
          slug = appendSlugSuffix(slug);
        } else {
          throw err;
        }
      }
    }

    return errorResponse('Failed to create blog post: slug conflict', 'SLUG_CONFLICT', 409);
  } catch {
    return errorResponse('Failed to create blog post', 'INTERNAL_ERROR', 500);
  }
}
