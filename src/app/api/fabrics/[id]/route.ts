import { NextRequest } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { userFabrics } from '@/db/schema';
import {
  getRequiredSession,
  unauthorizedResponse,
  notFoundResponse,
  errorResponse,
} from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const { id } = await params;

  try {
    const [fabric] = await db
      .select()
      .from(userFabrics)
      .where(and(eq(userFabrics.id, id), eq(userFabrics.userId, session.user.id)))
      .limit(1);

    if (!fabric) {
      return notFoundResponse('Fabric not found.');
    }

    await db
      .delete(userFabrics)
      .where(and(eq(userFabrics.id, id), eq(userFabrics.userId, session.user.id)));

    return new Response(null, { status: 204 });
  } catch (err) { console.error('[fabrics/[id]]', err);
    return errorResponse('Failed to delete fabric', 'INTERNAL_ERROR', 500);
  }
}
