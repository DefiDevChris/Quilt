import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { blocks } from '@/db/schema';
import { requireAdminSession } from '@/lib/auth-helpers';
import { errorResponse, notFoundResponse } from '@/lib/api-responses';

export const dynamic = 'force-dynamic';

// PATCH - Update a block
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const result = await requireAdminSession();
  if (result instanceof Response) return result;

  try {
    const { id } = await params;
    const body = await request.json();

    const [existing] = await db
      .select({ id: blocks.id })
      .from(blocks)
      .where(eq(blocks.id, id))
      .limit(1);

    if (!existing) {
      return notFoundResponse('Block not found');
    }

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.subcategory !== undefined) updateData.subcategory = body.subcategory;
    if (body.svgData !== undefined) updateData.svgData = body.svgData;
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.thumbnailUrl !== undefined) updateData.thumbnailUrl = body.thumbnailUrl;
    if (body.fabricJsData !== undefined) updateData.fabricJsData = body.fabricJsData;

    const [updated] = await db.update(blocks).set(updateData).where(eq(blocks.id, id)).returning();

    return Response.json({ success: true, data: updated });
  } catch {
    return errorResponse('Failed to update block', 'INTERNAL_ERROR', 500);
  }
}

// DELETE - Remove a block
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireAdminSession();
  if (result instanceof Response) return result;

  try {
    const { id } = await params;

    const [existing] = await db
      .select({ id: blocks.id })
      .from(blocks)
      .where(eq(blocks.id, id))
      .limit(1);

    if (!existing) {
      return notFoundResponse('Block not found');
    }

    const [deleted] = await db.delete(blocks).where(eq(blocks.id, id)).returning({ id: blocks.id });

    if (!deleted) {
      return notFoundResponse('Block not found');
    }

    return Response.json({
      success: true,
      data: { deleted: true },
    });
  } catch {
    return errorResponse('Failed to delete block', 'INTERNAL_ERROR', 500);
  }
}
