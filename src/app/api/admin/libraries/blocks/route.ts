import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { blocks } from '@/db/schema';
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

    if (!body.name || !body.category || !body.svgData) {
      return validationErrorResponse('Name, Category, and SVG Data are required');
    }

    const blockData = {
      name: body.name,
      category: body.category,
      subcategory: body.subcategory || null,
      svgData: body.svgData,
      fabricJsData: body.fabricJsData || null,
      tags: body.tags || [],
      thumbnailUrl: body.thumbnailUrl || null,
      isDefault: true,
      userId: null,
    };

    const [inserted] = await db
      .insert(blocks)
      .values(blockData)
      .returning();

    return Response.json({ success: true, data: inserted });
  } catch (error) {
    console.error('Failed to create system block', error);
    return errorResponse('Failed to create system block', 'INTERNAL_ERROR', 500);
  }
}
