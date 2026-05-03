import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { blocks } from '@/db/schema';
import { getRequiredSession } from '@/lib/auth-helpers';
import {
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  errorResponse,
} from '@/lib/api-responses';

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
