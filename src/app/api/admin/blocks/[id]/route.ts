import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { blocks } from '@/db/schema';
import { requireAdminSession } from '@/lib/auth-helpers';
import { errorResponse, notFoundResponse } from '@/lib/api-responses';

export const dynamic = 'force-dynamic';

// DELETE - Remove a block
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireAdminSession();
  if (result instanceof Response) return result;
  const { session } = result;

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
