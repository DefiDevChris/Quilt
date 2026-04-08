import { NextRequest } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { layoutTemplates } from '@/db/schema';
import { getRequiredSession } from '@/lib/auth-helpers';
import { errorResponse, validationErrorResponse, unauthorizedResponse } from '@/lib/api-responses';

export const dynamic = 'force-dynamic';

/** GET — public, returns all published layout templates */
export async function GET() {
  try {
    const rows = await db
      .select({
        id: layoutTemplates.id,
        name: layoutTemplates.name,
        category: layoutTemplates.category,
        templateData: layoutTemplates.templateData,
        thumbnailSvg: layoutTemplates.thumbnailSvg,
        isDefault: layoutTemplates.isDefault,
        createdAt: layoutTemplates.createdAt,
      })
      .from(layoutTemplates)
      .where(eq(layoutTemplates.isPublished, true))
      .orderBy(desc(layoutTemplates.createdAt));

    return Response.json({ success: true, data: { layouts: rows } });
  } catch {
    return errorResponse('Failed to fetch layouts', 'INTERNAL_ERROR', 500);
  }
}

/** POST — authenticated, creates a new layout template */
export async function POST(request: NextRequest) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  try {
    const body = await request.json();

    if (!body.name || !body.shapes) {
      return validationErrorResponse('Name and shapes are required');
    }

    const [created] = await db
      .insert(layoutTemplates)
      .values({
        name: body.name,
        category: body.category ?? 'custom',
        templateData: { shapes: body.shapes },
        isDefault: false,
        isPublished: true,
        userId: session.user.id,
      })
      .returning();

    return Response.json({ success: true, data: created }, { status: 201 });
  } catch {
    return errorResponse('Failed to create layout', 'INTERNAL_ERROR', 500);
  }
}
