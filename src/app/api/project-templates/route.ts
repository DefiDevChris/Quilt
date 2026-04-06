import { NextRequest } from 'next/server';
import { eq, desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { projectTemplates } from '@/db/schema';
import {
  getRequiredSession,
  unauthorizedResponse,
  validationErrorResponse,
  errorResponse,
} from '@/lib/auth-helpers';
import { z } from 'zod';

const createTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  unitSystem: z.enum(['imperial', 'metric']).default('imperial'),
  gridSettings: z.object({
    enabled: z.boolean(),
    size: z.number(),
    snapToGrid: z.boolean(),
  }),
  canvasWidth: z.number().positive(),
  canvasHeight: z.number().positive(),
});

export async function GET() {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  try {
    const templates = await db
      .select()
      .from(projectTemplates)
      .where(eq(projectTemplates.userId, session.user.id))
      .orderBy(desc(projectTemplates.updatedAt));

    return Response.json({ success: true, data: templates });
  } catch (error) {
    console.error('Failed to fetch templates:', error);
    return errorResponse('Failed to fetch templates', 'INTERNAL_ERROR', 500);
  }
}

export async function POST(request: NextRequest) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  try {
    const body = await request.json();
    const parsed = createTemplateSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid template data');
    }

    const template = await db
      .insert(projectTemplates)
      .values({
        ...parsed.data,
        userId: session.user.id,
      })
      .returning();

    return Response.json({ success: true, data: template[0] }, { status: 201 });
  } catch (error) {
    console.error('Failed to create template:', error);
    return errorResponse('Failed to create template', 'INTERNAL_ERROR', 500);
  }
}
