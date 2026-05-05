import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { fabrics } from '@/db/schema';
import { getRequiredSession, requireAdmin } from '@/lib/auth-helpers';
import { errorResponse, validationErrorResponse } from '@/lib/api-responses';
import { adminCreateFabricSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const session = await getRequiredSession();
  if (!session) return new Response('Unauthorized', { status: 401 });
  const check = requireAdmin(session.user.role);
  if (check instanceof Response) return check;

  try {
    const body = await request.json();

    const parsed = adminCreateFabricSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid fabric data');
    }

    const fabricData = {
      ...parsed.data,
      isDefault: true,
      userId: null,
    };

    const [inserted] = await db.insert(fabrics).values(fabricData).returning();

    return Response.json({ success: true, data: inserted });
  } catch (error) {
    console.error('Failed to create system fabric', error);
    return errorResponse('Failed to create system fabric', 'INTERNAL_ERROR', 500);
  }
}
