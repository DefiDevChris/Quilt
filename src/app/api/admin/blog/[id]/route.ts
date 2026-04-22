import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { blogPosts } from '@/db/schema';
import { requireAdminSession } from '@/lib/auth-helpers';
import { errorResponse, validationErrorResponse } from '@/lib/api-responses';
import { updateBlogPostSchema } from '@/lib/validation';
import { generateSlug, appendSlugSuffix } from '@/lib/blog-slug';

export const dynamic = 'force-dynamic';

// GET - Get a single blog post by ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const result = await requireAdminSession();
  if (result instanceof Response) return result;

  try {
    const { id } = await params;

    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1);

    if (!post) {
      return errorResponse('Blog post not found', 'NOT_FOUND', 404);
    }

    return Response.json({ success: true, data: post });
  } catch (err) { console.error('[admin/blog/[id]]', err);
    return errorResponse('Failed to fetch blog post', 'INTERNAL_ERROR', 500);
  }
}

// PUT - Update a blog post
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const result = await requireAdminSession();
  if (result instanceof Response) return result;

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updateBlogPostSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid post data');
    }

    // Check if post exists
    const [existing] = await db
      .select({ slug: blogPosts.slug, title: blogPosts.title })
      .from(blogPosts)
      .where(eq(blogPosts.id, id))
      .limit(1);

    if (!existing) {
      return errorResponse('Blog post not found', 'NOT_FOUND', 404);
    }

    const updateData: Record<string, unknown> = { ...parsed.data };

    // Handle slug regeneration if title changes
    if (parsed.data.title && parsed.data.title !== existing.title) {
      let newSlug = generateSlug(parsed.data.title);

      // Check for slug conflict (excluding current post)
      const [conflict] = await db
        .select({ id: blogPosts.id })
        .from(blogPosts)
        .where(eq(blogPosts.slug, newSlug))
        .limit(1);

      if (conflict && conflict.id !== id) {
        newSlug = appendSlugSuffix(newSlug);
      }

      updateData.slug = newSlug;
    }

    // Handle status change to published
    if ('status' in parsed.data && parsed.data.status === 'published') {
      updateData.publishedAt = new Date();
    }

    const [updated] = await db
      .update(blogPosts)
      .set(updateData)
      .where(eq(blogPosts.id, id))
      .returning();

    return Response.json({ success: true, data: updated });
  } catch (err) { console.error('[admin/blog/[id]]', err);
    return errorResponse('Failed to update blog post', 'INTERNAL_ERROR', 500);
  }
}

// DELETE - Delete a blog post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireAdminSession();
  if (result instanceof Response) return result;

  try {
    const { id } = await params;

    const [deleted] = await db.delete(blogPosts).where(eq(blogPosts.id, id)).returning();

    if (!deleted) {
      return errorResponse('Blog post not found', 'NOT_FOUND', 404);
    }

    return Response.json({ success: true, data: { id: deleted.id } });
  } catch (err) { console.error('[admin/blog/[id]]', err);
    return errorResponse('Failed to delete blog post', 'INTERNAL_ERROR', 500);
  }
}
