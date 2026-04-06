import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { layoutTemplates } from '@/db/schema';
import { getRequiredSession, unauthorizedResponse, errorResponse, notFoundResponse } from '@/lib/auth-helpers';
import { isAdmin } from '@/lib/trust-utils';

export const dynamic = 'force-dynamic';

// DELETE - Remove a pattern template
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const userRole = session.user.role as string;
  if (!isAdmin(userRole)) {
    return errorResponse('Forbidden', 'FORBIDDEN', 403);
  }

  try {
    const { id } = await params;

    const [existing] = await db
      .select({ id: layoutTemplates.id })
      .from(layoutTemplates)
      .where(eq(layoutTemplates.id, id))
      .limit(1);

    if (!existing) {
      return notFoundResponse('Pattern template not found');
    }

    const [deleted] = await db
      .delete(layoutTemplates)
      .where(eq(layoutTemplates.id, id))
      .returning({ id: layoutTemplates.id });

    if (!deleted) {
      return notFoundResponse('Pattern template not found');
    }

    return Response.json({
      success: true,
      data: { deleted: true },
    });
  } catch {
    return errorResponse('Failed to delete pattern template', 'INTERNAL_ERROR', 500);
  }
}
