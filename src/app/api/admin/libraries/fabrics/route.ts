import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { fabrics } from '@/db/schema';
import { getRequiredSession } from '@/lib/auth-helpers';
import { errorResponse, unauthorizedResponse, forbiddenResponse, validationErrorResponse } from '@/lib/api-responses';
import { isAdmin } from '@/lib/trust-utils';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const userRole = session.user.role as string;
  if (!isAdmin(userRole)) {
    return forbiddenResponse();
  }

  try {
    const body = await request.json();

    if (!body.name || !body.imageUrl) {
      return validationErrorResponse('Name and Image URL are required');
    }

    const fabricData = {
      name: body.name,
      imageUrl: body.imageUrl,
      thumbnailUrl: body.thumbnailUrl || null,
      manufacturer: body.manufacturer || null,
      sku: body.sku || null,
      collection: body.collection || null,
      colorFamily: body.colorFamily || null,
      scaleX: parseFloat(body.scaleX) || 1.0,
      scaleY: parseFloat(body.scaleY) || 1.0,
      rotation: parseFloat(body.rotation) || 0.0,
      isDefault: true,
      userId: null,
    };

    const [inserted] = await db
      .insert(fabrics)
      .values(fabricData)
      .returning();

    return Response.json({ success: true, data: inserted });
  } catch (error) {
    console.error('Failed to create system fabric', error);
    return errorResponse('Failed to create system fabric', 'INTERNAL_ERROR', 500);
  }
}
