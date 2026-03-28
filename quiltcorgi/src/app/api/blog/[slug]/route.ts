import { NextRequest } from 'next/server';
import { eq, and, or } from 'drizzle-orm';
import { db } from '@/lib/db';
import { blogPosts, users, userProfiles } from '@/db/schema';
import { getRequiredSession, errorResponse } from '@/lib/auth-helpers';
import { notFoundResponse } from '@/lib/api-responses';

export const dynamic = 'force-dynamic';

function calculateReadTime(content: unknown): number {
  const charCount = JSON.stringify(content ?? '').length;
  return Math.max(1, Math.ceil(charCount / 1500));
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const session = await getRequiredSession();
    const userId = session?.user?.id ?? null;

    const conditions = [eq(blogPosts.slug, slug)];

    if (userId) {
      conditions.push(
        or(eq(blogPosts.status, 'published'), eq(blogPosts.authorId, userId))!
      );
    } else {
      conditions.push(eq(blogPosts.status, 'published'));
    }

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
        status: blogPosts.status,
        publishedAt: blogPosts.publishedAt,
        createdAt: blogPosts.createdAt,
        updatedAt: blogPosts.updatedAt,
        authorName: users.name,
        authorAvatarUrl: userProfiles.avatarUrl,
        authorBio: userProfiles.bio,
        authorUsername: userProfiles.username,
      })
      .from(blogPosts)
      .leftJoin(users, eq(blogPosts.authorId, users.id))
      .leftJoin(userProfiles, eq(blogPosts.authorId, userProfiles.userId))
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
      status: post.status,
      publishedAt: post.publishedAt,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      readTimeMinutes: calculateReadTime(post.content),
      author: {
        name: post.authorName ?? 'QuiltCorgi Team',
        avatarUrl: post.authorAvatarUrl ?? null,
        bio: post.authorBio ?? null,
        username: post.authorUsername ?? null,
      },
    };

    return Response.json({ success: true, data });
  } catch {
    return errorResponse('Failed to fetch blog post', 'INTERNAL_ERROR', 500);
  }
}
