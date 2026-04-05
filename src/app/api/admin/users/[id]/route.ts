import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/db/schema';
import { getRequiredSession } from '@/lib/auth-helpers';
import { errorResponse, unauthorizedResponse, forbiddenResponse, validationErrorResponse } from '@/lib/api-responses';
import { isAdmin } from '@/lib/trust-utils';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const userRole = session.user.role as string;
  if (!isAdmin(userRole)) {
    return forbiddenResponse();
  }

  try {
    const { id } = await params;
    const body = await request.json();

    if (!['active', 'suspended', 'banned'].includes(body.status)) {
      return validationErrorResponse('Invalid status. Must be active, suspended, or banned.');
    }

    const [updated] = await db
      .update(users)
      .set({ status: body.status })
      .where(eq(users.id, id))
      .returning({ id: users.id, status: users.status });

    if (!updated) {
      return errorResponse('User not found', 'NOT_FOUND', 404);
    }

    return Response.json({ success: true, data: updated });
  } catch (error) {
    console.error('Failed to update user status', error);
    return errorResponse('Failed to update user status', 'INTERNAL_ERROR', 500);
  }
}
