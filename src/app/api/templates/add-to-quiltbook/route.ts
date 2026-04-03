import { NextRequest } from 'next/server';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { publishedTemplates, projects } from '@/db/schema';
import { getRequiredSession, unauthorizedResponse, errorResponse } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  try {
    const body = await request.json();
    const { templateId } = body;

    if (!templateId) {
      return errorResponse('Template ID is required', 'VALIDATION_ERROR', 400);
    }

    const [template] = await db
      .select()
      .from(publishedTemplates)
      .where(eq(publishedTemplates.id, templateId))
      .limit(1);

    if (!template) {
      return errorResponse('Template not found', 'NOT_FOUND', 404);
    }

    const [newProject] = await db
      .insert(projects)
      .values({
        userId: session.user.id,
        name: `${template.title} (Copy)`,
        description: template.description,
        canvasData: template.snapshotData,
        worktables: [
          {
            id: 'main',
            name: 'Main',
            canvasData: template.snapshotData,
            order: 0,
          },
        ],
      })
      .returning();

    await db
      .update(publishedTemplates)
      .set({ addToQuiltbookCount: sql`${publishedTemplates.addToQuiltbookCount} + 1` })
      .where(eq(publishedTemplates.id, templateId));

    return Response.json({ success: true, data: { projectId: newProject.id } }, { status: 201 });
  } catch (error) {
    console.error('[Add to Quiltbook Error]', error);
    return errorResponse('Failed to add to quiltbook', 'INTERNAL_ERROR', 500);
  }
}
