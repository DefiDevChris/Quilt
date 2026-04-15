import { NextRequest } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { blogPosts, users } from '@/db/schema';
import {
  getRequiredSession,
  unauthorizedResponse,
  validationErrorResponse,
  errorResponse,
} from '@/lib/auth-helpers';
import { notFoundResponse } from '@/lib/api-responses';
import { updateBlogPostSchema, BLOG_POST_CATEGORIES } from '@/lib/validation';
import { calculateReadTime } from '@/lib/read-time';
import { checkRateLimit, API_RATE_LIMITS, getClientIp, rateLimitResponse } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const ip = getClientIp(request);
  const rl = await checkRateLimit(`blog-slug:${ip}`, API_RATE_LIMITS.publicRead);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

  const { slug } = await params;

  try {
    const conditions = [eq(blogPosts.slug, slug)];

    const [post] = await db
      .select({
        id: blogPosts.id,
        authorId: blogPosts.authorId,
        title: blogPosts.title,
        slug: blogPosts.slug,
        content: blogPosts.content,
        excerpt: blogPosts.excerpt,
        featuredImageUrl: blogPosts.featuredImageUrl,
        category: blogPosts.category,
        tags: blogPosts.tags,
        createdAt: blogPosts.createdAt,
        updatedAt: blogPosts.updatedAt,
        authorName: users.name,
      })
      .from(blogPosts)
      .leftJoin(users, eq(blogPosts.authorId, users.id))
      .where(and(...conditions))
      .limit(1);

    if (!post) {
      return notFoundResponse('Blog post not found.');
    }

    const data = {
      id: post.id,
      authorId: post.authorId,
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt,
      featuredImageUrl: post.featuredImageUrl,
      category: post.category,
      tags: post.tags,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      readTimeMinutes: calculateReadTime(post.content),
      author: {
        name: post.authorName ?? 'QuiltCorgi Team',
      },
    };

    return Response.json({ success: true, data });
  } catch {
    return errorResponse('Failed to fetch blog post', 'INTERNAL_ERROR', 500);
  }
}

/** Update a blog post by slug. */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const { slug } = await params;

  try {
    const body = await request.json();
    const parsed = updateBlogPostSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid post data');
    }

    const [existing] = await db
      .select({ id: blogPosts.id, authorId: blogPosts.authorId })
      .from(blogPosts)
      .where(eq(blogPosts.slug, slug))
      .limit(1);

    if (!existing) {
      return notFoundResponse('Blog post not found.');
    }

    if (session.user.role !== 'admin') {
      return errorResponse('Only admins can edit blog posts.', 'FORBIDDEN', 403);
    }

    // Explicitly pick only allowed fields to prevent injection
    type BlogCategory = (typeof BLOG_POST_CATEGORIES)[number];
    const updateData: {
      title?: string;
      content?: unknown;
      excerpt?: string;
      featuredImageUrl?: string;
      category?: BlogCategory;
      tags?: string[];
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
    if (parsed.data.content !== undefined) updateData.content = parsed.data.content;
    if (parsed.data.excerpt !== undefined) updateData.excerpt = parsed.data.excerpt;
    if (parsed.data.featuredImageUrl !== undefined)
      updateData.featuredImageUrl = parsed.data.featuredImageUrl;
    if (parsed.data.category !== undefined) updateData.category = parsed.data.category;
    if (parsed.data.tags !== undefined) updateData.tags = parsed.data.tags;

    const [updated] = await db
      .update(blogPosts)
      .set(updateData)
      .where(eq(blogPosts.id, existing.id))
      .returning();

    return Response.json({ success: true, data: updated });
  } catch {
    return errorResponse('Failed to update blog post', 'INTERNAL_ERROR', 500);
  }
}
