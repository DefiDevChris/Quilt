import { NextRequest } from 'next/server';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { publishedTemplates, projects } from '@/db/schema';
import {
  getRequiredSession,
  unauthorizedResponse,
  validationErrorResponse,
  errorResponse,
} from '@/lib/auth-helpers';
import { checkRateLimit, API_RATE_LIMITS, getClientIp, rateLimitResponse } from '@/lib/rate-limit';
import { templateIdSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = await checkRateLimit(`templates:${ip}`, API_RATE_LIMITS.templates);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  try {
    const body = await request.json();
    const parsed = templateIdSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid input');
    }

    const { templateId } = parsed.data;

    const [template] = await db
      .select()
      .from(publishedTemplates)
      .where(eq(publishedTemplates.id, templateId))
      .limit(1);

    if (!template) {
      return errorResponse('Template not found', 'NOT_FOUND', 404);
    }

    const newProject = await db.transaction(async (tx) => {
      const [created] = await tx
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

      await tx
        .update(publishedTemplates)
        .set({ addToQuiltbookCount: sql`${publishedTemplates.addToQuiltbookCount} + 1` })
        .where(eq(publishedTemplates.id, templateId));

      return created;
    });

    return Response.json({ success: true, data: { projectId: newProject.id } }, { status: 201 });
  } catch {
    return errorResponse('Failed to add to quiltbook', 'INTERNAL_ERROR', 500);
  }
}
