import { NextRequest } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { blogPosts, users } from '@/db/schema';
import { errorResponse } from '@/lib/auth-helpers';
import { notFoundResponse } from '@/lib/api-responses';
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
  } catch (err) { console.error('[blog/[slug]]', err);
    return errorResponse('Failed to fetch blog post', 'INTERNAL_ERROR', 500);
  }
}
