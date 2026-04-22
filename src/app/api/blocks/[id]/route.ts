import { NextRequest } from 'next/server';
import { eq, asc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { blocks } from '@/db/schema';
import {
  getRequiredSession,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  errorResponse,
} from '@/lib/auth-helpers';
import { FREE_BLOCK_LIMIT } from '@/lib/constants';
import { isPro, type UserRole } from '@/lib/role-utils';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const { id } = await params;

  try {
    const [block] = await db.select().from(blocks).where(eq(blocks.id, id)).limit(1);

    if (!block) {
      return notFoundResponse('Block not found.');
    }

    // Check if free user is trying to access a locked block
    if (!isPro(session.user.role as UserRole) && block.isDefault) {
      // Check if this block is within the free limit
      const freeBlocks = await db
        .select({ id: blocks.id })
        .from(blocks)
        .where(eq(blocks.isDefault, true))
        .orderBy(asc(blocks.name))
        .limit(FREE_BLOCK_LIMIT);

      const freeBlockIds = new Set(freeBlocks.map((b) => b.id));
      if (!freeBlockIds.has(block.id)) {
        return errorResponse('This block requires a Pro subscription.', 'PRO_REQUIRED', 403);
      }
    }

    // For user-created blocks, verify ownership
    if (!block.isDefault && block.userId && block.userId !== session.user.id) {
      return notFoundResponse('Block not found.');
    }

    return Response.json({
      success: true,
      data: {
        id: block.id,
        name: block.name,
        category: block.category,
        subcategory: block.subcategory,
        svgData: block.svgData,
        fabricJsData: block.fabricJsData,
        tags: block.tags ?? [],
        isDefault: block.isDefault,
      },
    });
  } catch (err) { console.error('[blocks/[id]]', err);
    return errorResponse('Failed to fetch block', 'INTERNAL_ERROR', 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const { id } = await params;

  try {
    const [block] = await db.select().from(blocks).where(eq(blocks.id, id)).limit(1);

    if (!block) {
      return notFoundResponse('Block not found.');
    }

    if (block.isDefault) {
      return forbiddenResponse('System blocks cannot be deleted.');
    }

    if (block.userId !== session.user.id) {
      return notFoundResponse('Block not found.');
    }

    await db.delete(blocks).where(eq(blocks.id, id));

    return new Response(null, { status: 204 });
  } catch (err) { console.error('[blocks/[id]]', err);
    return errorResponse('Failed to delete block', 'INTERNAL_ERROR', 500);
  }
}
