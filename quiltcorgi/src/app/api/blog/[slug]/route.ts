import { NextRequest } from 'next/server';
import { eq, and, or } from 'drizzle-orm';
import { db } from '@/lib/db';
import { blogPosts, users, userProfiles } from '@/db/schema';
import {
  getRequiredSession,
  unauthorizedResponse,
  validationErrorResponse,
  errorResponse,
} from '@/lib/auth-helpers';
import { notFoundResponse } from '@/lib/api-responses';
import { updateBlogPostSchema } from '@/lib/validation';
import { calculateReadTime } from '@/lib/read-time';

export const dynamic = 'force-dynamic';


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
      conditions.push(or(eq(blogPosts.status, 'published'), eq(blogPosts.authorId, userId))!);
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

/** Update a blog post by ID (passed as the slug segment). */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const { slug: id } = await params;

  try {
    const body = await request.json();
    const parsed = updateBlogPostSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid post data');
    }

    const [existing] = await db
      .select({
        id: blogPosts.id,
        authorId: blogPosts.authorId,
        status: blogPosts.status,
      })
      .from(blogPosts)
      .where(eq(blogPosts.id, id))
      .limit(1);

    if (!existing) {
      return notFoundResponse('Blog post not found.');
    }

    const role = (session.user as { role?: string }).role ?? 'free';
    const isAdmin = role === 'admin';
    const isOwner = existing.authorId === session.user.id;

    if (!isAdmin && !isOwner) {
      return errorResponse('You can only edit your own posts.', 'FORBIDDEN', 403);
    }

    if (!isAdmin && existing.status !== 'draft' && existing.status !== 'pending') {
      return errorResponse(
        'You can only edit posts that are in draft or pending status.',
        'FORBIDDEN',
        403
      );
    }

    const updateData: Record<string, unknown> = {
      ...parsed.data,
      updatedAt: new Date(),
    };

    const [updated] = await db
      .update(blogPosts)
      .set(updateData)
      .where(eq(blogPosts.id, id))
      .returning();

    return Response.json({ success: true, data: updated });
  } catch {
    return errorResponse('Failed to update blog post', 'INTERNAL_ERROR', 500);
  }
}
