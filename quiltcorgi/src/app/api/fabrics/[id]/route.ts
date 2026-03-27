import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { fabrics } from '@/db/schema';
import {
  getRequiredSession,
  unauthorizedResponse,
  forbiddenResponse,
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
    const [fabric] = await db.select().from(fabrics).where(eq(fabrics.id, id)).limit(1);

    if (!fabric) {
      return notFoundResponse('Fabric not found.');
    }

    if (fabric.isDefault) {
      return forbiddenResponse('System fabrics cannot be deleted.');
    }

    if (fabric.userId !== session.user.id) {
      return notFoundResponse('Fabric not found.');
    }

    await db.delete(fabrics).where(eq(fabrics.id, id));

    return new Response(null, { status: 204 });
  } catch {
    return errorResponse('Failed to delete fabric', 'INTERNAL_ERROR', 500);
  }
}
