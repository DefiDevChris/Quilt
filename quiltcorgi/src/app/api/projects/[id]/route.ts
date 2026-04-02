import { NextRequest } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { projects } from '@/db/schema';
import { updateProjectSchema } from '@/lib/validation';
import { uploadCanvasDataToS3, downloadCanvasDataFromS3 } from '@/lib/s3';
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

  // Hydrate from S3 if keys exist
  let canvasData = project.canvasData;
  let worktables = project.worktables;

  if (project.canvasDataS3Key) {
    const s3Data = await downloadCanvasDataFromS3(project.canvasDataS3Key);
    if (s3Data) canvasData = s3Data;
  }

  if (project.worktablesS3Key) {
    const s3Data = await downloadCanvasDataFromS3(project.worktablesS3Key);
    if (s3Data && Array.isArray(s3Data)) worktables = s3Data;
  }

  return Response.json({ success: true, data: { ...project, canvasData, worktables } });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const { id } = await params;
  const project = await getOwnedProject(id, session.user.id);

  if (!project) {
    return notFoundResponse('Project not found.');
  }

  const isPro = session.user.role === 'pro' || session.user.role === 'admin';
  if (!isPro) {
    return errorResponse(
      'Saving projects requires a Pro subscription. Upgrade to Pro for $8/month.',
      'PRO_REQUIRED',
      403
    );
  }

  try {
    const body = await request.json();
    const parsed = updateProjectSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid input');
    }

    // Optimistic concurrency control: check version if provided
    if (parsed.data.version !== undefined) {
      if (project.version !== parsed.data.version) {
        return errorResponse(
          'This project was modified on another device. Please refresh and try again.',
          'VERSION_CONFLICT',
          409
        );
      }
    }

    const updates: Record<string, unknown> = {
      updatedAt: new Date(),
      lastSavedAt: new Date(),
      version: project.version + 1,
    };

    // Upload canvasData to S3 if provided
    if (parsed.data.canvasData) {
      const s3Key = await uploadCanvasDataToS3(session.user.id, id, parsed.data.canvasData);
      updates.canvasDataS3Key = s3Key;
      updates.canvasData = {}; // Clear JSONB to save space
    }

    // Upload worktables to S3 if provided
    if (parsed.data.worktables) {
      const s3Key = await uploadCanvasDataToS3(session.user.id, id, parsed.data.worktables as Record<string, unknown>);
      updates.worktablesS3Key = s3Key;
      updates.worktables = []; // Clear JSONB to save space
    }

    // Copy other fields
    Object.entries(parsed.data).forEach(([key, value]) => {
      if (key !== 'canvasData' && key !== 'worktables' && key !== 'version') {
        updates[key] = value;
      }
    });

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
