import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { fabrics } from '@/db/schema';
import { requireAdminSession } from '@/lib/auth-helpers';
import { errorResponse, validationErrorResponse } from '@/lib/api-responses';
import { adminCreateFabricSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const result = await requireAdminSession();
  if (result instanceof Response) return result;

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
