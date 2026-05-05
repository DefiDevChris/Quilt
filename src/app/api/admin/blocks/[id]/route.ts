import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { blocks } from '@/db/schema';
import { getRequiredSession, requireAdmin } from '@/lib/auth-helpers';
import { errorResponse, notFoundResponse, validationErrorResponse } from '@/lib/api-responses';
import { adminUpdateBlockSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getRequiredSession();
  if (!session) return new Response('Unauthorized', { status: 401 });
  const check = requireAdmin(session.user.role);
  if (check instanceof Response) return check;

  try {
    const { id } = await params;
    const body = await request.json();

    const parsed = adminUpdateBlockSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid block data');
    }
    const updateData = parsed.data;

    const [updated] = await db.update(blocks).set(updateData).where(eq(blocks.id, id)).returning();

    if (!updated) {
      return notFoundResponse('Block not found');
    }

    return Response.json({ success: true, data: updated });
  } catch (err) {
    console.error('[admin/blocks/[id]]', err);
    return errorResponse('Failed to update block', 'INTERNAL_ERROR', 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getRequiredSession();
  if (!session) return new Response('Unauthorized', { status: 401 });
  const check = requireAdmin(session.user.role);
  if (check instanceof Response) return check;

  try {
    const { id } = await params;

    const [deleted] = await db.delete(blocks).where(eq(blocks.id, id)).returning({ id: blocks.id });

    if (!deleted) {
      return notFoundResponse('Block not found');
    }

    return Response.json({ success: true, data: { deleted: true } });
  } catch (err) {
    console.error('[admin/blocks/[id]]', err);
    return errorResponse('Failed to delete block', 'INTERNAL_ERROR', 500);
  }
}
