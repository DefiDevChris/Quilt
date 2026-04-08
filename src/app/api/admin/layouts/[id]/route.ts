import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { layoutTemplates } from '@/db/schema';
import { requireAdminSession } from '@/lib/auth-helpers';
import { errorResponse, notFoundResponse } from '@/lib/api-responses';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireAdminSession();
  if (result instanceof Response) return result;

  try {
    const { id } = await params;
    const body = await request.json();

    const [existing] = await db
      .select({ id: layoutTemplates.id })
      .from(layoutTemplates)
      .where(eq(layoutTemplates.id, id))
      .limit(1);

    if (!existing) {
      return notFoundResponse('Layout not found');
    }

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.templateData !== undefined) updateData.templateData = body.templateData;
    if (body.thumbnailSvg !== undefined) updateData.thumbnailSvg = body.thumbnailSvg;
    if (body.isDefault !== undefined) updateData.isDefault = body.isDefault;
    if (body.isPublished !== undefined) updateData.isPublished = body.isPublished;

    const [updated] = await db
      .update(layoutTemplates)
      .set(updateData)
      .where(eq(layoutTemplates.id, id))
      .returning();

    return Response.json({ success: true, data: updated });
  } catch {
    return errorResponse('Failed to update layout', 'INTERNAL_ERROR', 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireAdminSession();
  if (result instanceof Response) return result;

  try {
    const { id } = await params;

    const [existing] = await db
      .select({ id: layoutTemplates.id })
      .from(layoutTemplates)
      .where(eq(layoutTemplates.id, id))
      .limit(1);

    if (!existing) {
      return notFoundResponse('Layout not found');
    }

    const [deleted] = await db
      .delete(layoutTemplates)
      .where(eq(layoutTemplates.id, id))
      .returning({ id: layoutTemplates.id });

    if (!deleted) {
      return notFoundResponse('Layout not found');
    }

    return Response.json({ success: true, data: { deleted: true } });
  } catch {
    return errorResponse('Failed to delete layout', 'INTERNAL_ERROR', 500);
  }
}
