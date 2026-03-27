import { NextRequest } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { designVariations, projects } from '@/db/schema';
import {
  getRequiredSession,
  unauthorizedResponse,
  notFoundResponse,
  errorResponse,
  validationErrorResponse,
} from '@/lib/auth-helpers';
import { updateVariationSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

async function verifyProjectOwner(projectId: string, userId: string) {
  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1);
  return project ?? null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; variationId: string }> }
) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const { id: projectId, variationId } = await params;
  const project = await verifyProjectOwner(projectId, session.user.id);
  if (!project) return notFoundResponse('Project not found.');

  try {
    const [variation] = await db
      .select()
      .from(designVariations)
      .where(and(eq(designVariations.id, variationId), eq(designVariations.projectId, projectId)))
      .limit(1);

    if (!variation) return notFoundResponse('Variation not found.');

    return Response.json({ success: true, data: variation });
  } catch {
    return errorResponse('Failed to load variation', 'INTERNAL_ERROR', 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; variationId: string }> }
) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const { id: projectId, variationId } = await params;
  const project = await verifyProjectOwner(projectId, session.user.id);
  if (!project) return notFoundResponse('Project not found.');

  try {
    const body = await request.json();
    const parsed = updateVariationSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.message);
    }

    const [updated] = await db
      .update(designVariations)
      .set(parsed.data)
      .where(and(eq(designVariations.id, variationId), eq(designVariations.projectId, projectId)))
      .returning();

    if (!updated) return notFoundResponse('Variation not found.');

    return Response.json({ success: true, data: updated });
  } catch {
    return errorResponse('Failed to update variation', 'INTERNAL_ERROR', 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; variationId: string }> }
) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const { id: projectId, variationId } = await params;
  const project = await verifyProjectOwner(projectId, session.user.id);
  if (!project) return notFoundResponse('Project not found.');

  try {
    const [deleted] = await db
      .delete(designVariations)
      .where(and(eq(designVariations.id, variationId), eq(designVariations.projectId, projectId)))
      .returning({ id: designVariations.id });

    if (!deleted) return notFoundResponse('Variation not found.');

    return new Response(null, { status: 204 });
  } catch {
    return errorResponse('Failed to delete variation', 'INTERNAL_ERROR', 500);
  }
}
