import { NextRequest } from 'next/server';
import { eq, desc, count } from 'drizzle-orm';
import { db } from '@/lib/db';
import { blogPosts, users, userProfiles } from '@/db/schema';
import { getRequiredSession, unauthorizedResponse, errorResponse } from '@/lib/auth-helpers';
import { forbiddenResponse } from '@/lib/api-responses';

export const dynamic = 'force-dynamic';

function calculateReadTime(content: unknown): number {
  const charCount = JSON.stringify(content ?? '').length;
  return Math.max(1, Math.ceil(charCount / 1500));
}

export async function GET(request: NextRequest) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const role = (session.user as { role?: string }).role ?? 'free';
  if (role !== 'admin') {
    return forbiddenResponse('Admin access required.');
  }

  const url = request.nextUrl;
  const statusFilter = url.searchParams.get('status') ?? undefined;
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(url.searchParams.get('limit') ?? '50', 10) || 50)
  );

  try {
    const whereClause =
      statusFilter && statusFilter !== 'all'
        ? eq(blogPosts.status, statusFilter as 'draft' | 'pending' | 'published' | 'rejected')
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
