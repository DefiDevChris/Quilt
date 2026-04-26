import { NextRequest } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { layoutTemplates } from '@/db/schema';
import {
  getRequiredSession,
  unauthorizedResponse,
  notFoundResponse,
} from '@/lib/auth-helpers';
import { errorResponse } from '@/lib/api-responses';

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/templates/[id]
 *
 * Deletes a user-owned template. Users cannot delete system templates
 * (isDefault=true) — those are managed via the admin/layouts route.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const { id } = await params;

  try {
    const result = await db
      .delete(layoutTemplates)
      .where(
        and(
          eq(layoutTemplates.id, id),
          eq(layoutTemplates.userId, session.user.id),
        ),
      )
      .returning();

    if (result.length === 0) {
      return notFoundResponse('Template not found or not owned by you');
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error('[templates DELETE]', err);
    return errorResponse('Failed to delete template', 'INTERNAL_ERROR', 500);
  }
}

/**
 * GET /api/templates/[id]
 *
 * Fetches a single template by id. Returns 404 if the template is neither
 * a system template (isDefault=true) nor owned by the requesting user.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const { id } = await params;

  try {
    const [row] = await db
      .select()
      .from(layoutTemplates)
      .where(eq(layoutTemplates.id, id))
      .limit(1);

    if (!row) return notFoundResponse('Template not found');

    const accessible = row.isDefault || row.userId === session.user.id;
    if (!accessible) return notFoundResponse('Template not found');

    return Response.json({ success: true, data: { template: row } });
  } catch (err) {
    console.error('[templates GET id]', err);
    return errorResponse('Failed to fetch template', 'INTERNAL_ERROR', 500);
  }
}
