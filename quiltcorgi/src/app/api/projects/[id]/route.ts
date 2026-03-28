import { NextRequest } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { projects } from '@/db/schema';
import { updateProjectSchema } from '@/lib/validation';
import {
  getRequiredSession,
  unauthorizedResponse,
  notFoundResponse,
  validationErrorResponse,
  errorResponse,
} from '@/lib/auth-helpers';

async function getOwnedProject(projectId: string, userId: string) {
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1);
  return project ?? null;
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const { id } = await params;
  const project = await getOwnedProject(id, session.user.id);

  if (!project) {
    return notFoundResponse('Project not found.');
  }

  return Response.json({ success: true, data: project });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const { id } = await params;
  const project = await getOwnedProject(id, session.user.id);

  if (!project) {
    return notFoundResponse('Project not found.');
  }

  try {
    const body = await request.json();
    const parsed = updateProjectSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid input');
    }

    const updates = {
      ...parsed.data,
      updatedAt: new Date(),
      lastSavedAt: new Date(),
    };

    const [updated] = await db.update(projects).set(updates).where(eq(projects.id, id)).returning();

    return Response.json({ success: true, data: updated });
  } catch {
    return errorResponse('Failed to update project', 'INTERNAL_ERROR', 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const { id } = await params;
  const project = await getOwnedProject(id, session.user.id);

  if (!project) {
    return notFoundResponse('Project not found.');
  }

  await db.delete(projects).where(eq(projects.id, id));

  return new Response(null, { status: 204 });
}
