import { NextRequest } from 'next/server';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { designVariations, projects } from '@/db/schema';
import {
  getRequiredSession,
  unauthorizedResponse,
  notFoundResponse,
  errorResponse,
  validationErrorResponse,
} from '@/lib/auth-helpers';
import { createVariationSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

async function verifyProjectOwner(projectId: string, userId: string) {
  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1);
  return project ?? null;
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const { id: projectId } = await params;
  const project = await verifyProjectOwner(projectId, session.user.id);
  if (!project) return notFoundResponse('Project not found.');

  try {
    const variations = await db
      .select()
      .from(designVariations)
      .where(eq(designVariations.projectId, projectId))
      .orderBy(desc(designVariations.createdAt));

    return Response.json({ success: true, data: variations });
  } catch {
    return errorResponse('Failed to load variations', 'INTERNAL_ERROR', 500);
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const isPro = session.user.role === 'pro' || session.user.role === 'admin';
  if (!isPro) {
    return errorResponse('Saving requires a Pro subscription.', 'PRO_REQUIRED', 403);
  }

  const { id: projectId } = await params;
  const project = await verifyProjectOwner(projectId, session.user.id);
  if (!project) return notFoundResponse('Project not found.');

  try {
    const body = await request.json();
    const parsed = createVariationSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid input');
    }

    const [created] = await db
      .insert(designVariations)
      .values({
        projectId,
        userId: session.user.id,
        name: parsed.data.name,
        canvasData: parsed.data.canvasData,
      })
      .returning();

    return Response.json({ success: true, data: created }, { status: 201 });
  } catch {
    return errorResponse('Failed to create variation', 'INTERNAL_ERROR', 500);
  }
}
