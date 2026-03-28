import { NextRequest } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { blogPosts } from '@/db/schema';
import { updateBlogPostSchema } from '@/lib/validation';
import {
  getRequiredSession,
  unauthorizedResponse,
  validationErrorResponse,
  errorResponse,
} from '@/lib/auth-helpers';
import { notFoundResponse } from '@/lib/api-responses';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const { id } = await params;

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
