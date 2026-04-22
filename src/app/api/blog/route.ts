import { NextRequest } from 'next/server';
import { eq, and, ilike, desc, count, arrayContains } from 'drizzle-orm';
import { db } from '@/lib/db';
import { blogPosts, users } from '@/db/schema';
import { blogSearchSchema, createBlogPostSchema } from '@/lib/validation';
import { escapeLikePattern } from '@/lib/escape-like';
import {
  getRequiredSession,
  unauthorizedResponse,
  validationErrorResponse,
  errorResponse,
} from '@/lib/auth-helpers';
import { checkRateLimit, API_RATE_LIMITS, getClientIp, rateLimitResponse } from '@/lib/rate-limit';
import { generateSlug, appendSlugSuffix } from '@/lib/blog-slug';
import { calculateReadTime } from '@/lib/read-time';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = await checkRateLimit(`blog:${ip}`, API_RATE_LIMITS.blog);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

  const url = request.nextUrl;
  const parsed = blogSearchSchema.safeParse({
    search: url.searchParams.get('search') ?? undefined,
    category: url.searchParams.get('category') ?? undefined,
    tag: url.searchParams.get('tag') ?? undefined,
    page: url.searchParams.get('page') ?? undefined,
    limit: url.searchParams.get('limit') ?? undefined,
  });

  if (!parsed.success) {
    return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid parameters');
  }

  const { search, category, tag, page, limit } = parsed.data;
  const offset = (page - 1) * limit;

  try {
    const conditions = [eq(blogPosts.status, 'published')];

    if (category) {
      conditions.push(eq(blogPosts.category, category));
    }

    if (tag) {
      conditions.push(arrayContains(blogPosts.tags, [tag]));
    }

    if (search) {
      conditions.push(ilike(blogPosts.title, `%${escapeLikePattern(search)}%`));
    }

    const whereClause = and(...conditions);

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
          content: blogPosts.content,
          createdAt: blogPosts.createdAt,
          authorName: users.name,
        })
        .from(blogPosts)
        .leftJoin(users, eq(blogPosts.authorId, users.id))
        .where(whereClause)
        .orderBy(desc(blogPosts.createdAt))
        .limit(limit)
        .offset(offset),
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
      authorName: post.authorName ?? 'QuiltCorgi Team',
      createdAt: post.createdAt,
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
  } catch (err) { console.error('[blog]', err);
    return errorResponse('Failed to fetch blog posts', 'INTERNAL_ERROR', 500);
  }
}

export async function POST(request: NextRequest) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  if (session.user.role !== 'admin') {
    return errorResponse('Only admins can create blog posts', 'FORBIDDEN', 403);
  }

  try {
    const body = await request.json();
    const parsed = createBlogPostSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid post data');
    }

    const { title, content, excerpt, featuredImageUrl, category, tags } = parsed.data;

    let slug = generateSlug(title);

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
  } catch (err) { console.error('[blog]', err);
    return errorResponse('Failed to create blog post', 'INTERNAL_ERROR', 500);
  }
}
