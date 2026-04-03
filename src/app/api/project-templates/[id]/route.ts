import { NextRequest } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { projectTemplates } from '@/db/schema';
import {
  getRequiredSession,
  unauthorizedResponse,
  errorResponse,
} from '@/lib/auth-helpers';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const { id } = await params;

  try {
    await db
      .delete(projectTemplates)
      .where(
        and(
          eq(projectTemplates.id, id),
          eq(projectTemplates.userId, session.user.id)
        )
      );

    return Response.json({ success: true });
  } catch (error) {
    console.error('Failed to delete template:', error);
    return errorResponse('Failed to delete template');
  }
}
