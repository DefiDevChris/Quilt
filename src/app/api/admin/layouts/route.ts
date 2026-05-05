import { NextRequest } from 'next/server';
import { desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { layoutTemplates } from '@/db/schema';
import { getRequiredSession, requireAdmin } from '@/lib/auth-helpers';
import { errorResponse, validationErrorResponse } from '@/lib/api-responses';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getRequiredSession();
  if (!session) return new Response('Unauthorized', { status: 401 });
  const check = requireAdmin(session.user.role);
  if (check instanceof Response) return check;

  try {
    const rows = await db.select().from(layoutTemplates).orderBy(desc(layoutTemplates.createdAt));
    return Response.json({ success: true, data: { layouts: rows } });
  } catch (err) {
    console.error('[admin/layouts]', err);
    return errorResponse('Failed to fetch layouts', 'INTERNAL_ERROR', 500);
  }
}

export async function POST(request: NextRequest) {
  const session = await getRequiredSession();
  if (!session) return new Response('Unauthorized', { status: 401 });
  const check = requireAdmin(session.user.role);
  if (check instanceof Response) return check;

  try {
    const body = await request.json();

    if (!body.name) {
      return validationErrorResponse('Name is required');
    }

    const [created] = await db
      .insert(layoutTemplates)
      .values({
        name: body.name,
        category: body.category ?? 'custom',
        templateData: body.templateData ?? {},
        thumbnailSvg: body.thumbnailSvg ?? null,
        isDefault: body.isDefault ?? false,
        isPublished: body.isPublished ?? true,
        userId: null,
      })
      .returning();

    return Response.json({ success: true, data: created }, { status: 201 });
  } catch (err) {
    console.error('[admin/layouts]', err);
    return errorResponse('Failed to create layout', 'INTERNAL_ERROR', 500);
  }
}
