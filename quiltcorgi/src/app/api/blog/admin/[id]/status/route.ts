import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { blogPosts } from '@/db/schema';
import { blogAdminStatusSchema } from '@/lib/validation';
import {
  getRequiredSession,
  unauthorizedResponse,
  validationErrorResponse,
  errorResponse,
} from '@/lib/auth-helpers';
import { forbiddenResponse, notFoundResponse } from '@/lib/api-responses';
import { createNotification } from '@/lib/create-notification';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const role = (session.user as { role?: string }).role ?? 'free';
  if (role !== 'admin') {
    return forbiddenResponse('Admin access required.');
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = blogAdminStatusSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid status');
    }

    const { status } = parsed.data;

    const [existing] = await db
      .select({
        id: blogPosts.id,
        authorId: blogPosts.authorId,
        title: blogPosts.title,
        slug: blogPosts.slug,
      })
      .from(blogPosts)
      .where(eq(blogPosts.id, id))
      .limit(1);

    if (!existing) {
      return notFoundResponse('Blog post not found.');
    }

    const updateData: Record<string, unknown> = {
      status,
      updatedAt: new Date(),
    };

    if (status === 'published') {
      updateData.publishedAt = new Date();
    }

    const [updated] = await db
      .update(blogPosts)
      .set(updateData)
      .where(eq(blogPosts.id, id))
      .returning();

    const notificationTitle =
      status === 'published'
        ? 'Blog post published!'
        : 'Blog post update';

    const notificationMessage =
      status === 'published'
        ? `Your blog post "${existing.title}" has been published.`
        : `Your blog post "${existing.title}" has been rejected.`;

    await createNotification({
      userId: existing.authorId,
      type: 'blog_status',
      title: notificationTitle,
      message: notificationMessage,
      metadata: {
        postId: existing.id,
        slug: existing.slug,
        status,
      },
    });

    return Response.json({ success: true, data: updated });
  } catch {
    return errorResponse('Failed to update blog post status', 'INTERNAL_ERROR', 500);
  }
}
