import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { layoutTemplates } from '@/db/schema';
import { getRequiredSession, requireAdmin } from '@/lib/auth-helpers';
import { errorResponse, notFoundResponse, validationErrorResponse } from '@/lib/api-responses';
import { adminUpdateTemplateSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getRequiredSession();
  if (!session) return new Response('Unauthorized', { status: 401 });
  const check = requireAdmin(session.user.role);
  if (check instanceof Response) return check;

  try {
    const { id } = await params;
    const body = await request.json();

    const parsed = adminUpdateTemplateSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid layout data');
    }
    const updateData = parsed.data;

    const [updated] = await db
      .update(layoutTemplates)
      .set(updateData)
      .where(eq(layoutTemplates.id, id))
      .returning();

    if (!updated) {
      return notFoundResponse('Layout not found');
    }

    return Response.json({ success: true, data: updated });
  } catch (err) {
    console.error('[admin/layouts/[id]]', err);
    return errorResponse('Failed to update layout', 'INTERNAL_ERROR', 500);
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

    const [deleted] = await db
      .delete(layoutTemplates)
      .where(eq(layoutTemplates.id, id))
      .returning({ id: layoutTemplates.id });

    if (!deleted) {
      return notFoundResponse('Layout not found');
    }

    return Response.json({ success: true, data: { deleted: true } });
  } catch (err) {
    console.error('[admin/layouts/[id]]', err);
    return errorResponse('Failed to delete layout', 'INTERNAL_ERROR', 500);
  }
}
