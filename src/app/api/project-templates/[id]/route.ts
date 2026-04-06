import { NextRequest } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { projectTemplates } from '@/db/schema';
import { getRequiredSession, unauthorizedResponse, notFoundResponse, validationErrorResponse, errorResponse } from '@/lib/auth-helpers';

const updateTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  unitSystem: z.enum(['imperial', 'metric']).optional(),
  gridSettings: z.object({
    enabled: z.boolean(),
    size: z.number(),
    snapToGrid: z.boolean(),
  }).optional(),
  canvasWidth: z.number().positive().optional(),
  canvasHeight: z.number().positive().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const { id } = await params;

  try {
    const [template] = await db
      .select()
      .from(projectTemplates)
      .where(and(eq(projectTemplates.id, id), eq(projectTemplates.userId, session.user.id)))
      .limit(1);

    if (!template) {
      return notFoundResponse('Project template not found.');
    }

    return Response.json({ success: true, data: template });
  } catch {
    return errorResponse('Failed to fetch template', 'INTERNAL_ERROR', 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = updateTemplateSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid template data');
    }

    const result = await db
      .update(projectTemplates)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(and(eq(projectTemplates.id, id), eq(projectTemplates.userId, session.user.id)))
      .returning();

    if (result.length === 0) {
      return notFoundResponse('Project template not found.');
    }

    return Response.json({ success: true, data: result[0] });
  } catch {
    return errorResponse('Failed to update template', 'INTERNAL_ERROR', 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const { id } = await params;

  try {
    const result = await db
      .delete(projectTemplates)
      .where(and(eq(projectTemplates.id, id), eq(projectTemplates.userId, session.user.id)))
      .returning({ id: projectTemplates.id });

    if (result.length === 0) {
      return notFoundResponse('Project template not found.');
    }

    return Response.json({ success: true, data: { deleted: true } });
  } catch {
    return errorResponse('Failed to delete template', 'INTERNAL_ERROR', 500);
  }
}
