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
import { checkRateLimit, API_RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';
import { isPro, type UserRole } from '@/lib/role-utils';

const DESIGNER_TYPE = 'designer';

async function getOwnedDesignerProject(projectId: string, userId: string) {
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1);

  if (!project) return null;

  // Verify this is a designer project
  const canvasData = project.canvasData as Record<string, unknown>;
  if (canvasData.type !== DESIGNER_TYPE) return null;

  return project;
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const rl = await checkRateLimit(`designer-projects:${session.user.id}`, API_RATE_LIMITS.projects);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

  const { id } = await params;
  const project = await getOwnedDesignerProject(id, session.user.id);

  if (!project) {
    return notFoundResponse('Designer project not found.');
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

  const rl = await checkRateLimit(`designer-save:${session.user.id}`, API_RATE_LIMITS.save);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

  const { id } = await params;
  const project = await getOwnedDesignerProject(id, session.user.id);

  if (!project) {
    return notFoundResponse('Designer project not found.');
  }

  if (!isPro(session.user.role as UserRole)) {
    return errorResponse(
      'Saving designer projects requires a Pro subscription. Upgrade to Pro for $8/month.',
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
          'CONFLICT',
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
      try {
        const s3Key = await uploadCanvasDataToS3(session.user.id, id, parsed.data.canvasData);
        updates.canvasDataS3Key = s3Key;
        updates.canvasData = {};
      } catch (err) {
        console.warn('[designer/projects PUT] S3 upload failed, storing canvasData in JSONB:', err);
        updates.canvasData = parsed.data.canvasData;
        updates.canvasDataS3Key = null;
      }
    }

    // Upload worktables to S3 if provided
    if (parsed.data.worktables) {
      try {
        const s3Key = await uploadCanvasDataToS3(
          session.user.id,
          id,
          parsed.data.worktables as unknown as Record<string, unknown>
        );
        updates.worktablesS3Key = s3Key;
        updates.worktables = [];
      } catch (err) {
        console.warn('[designer/projects PUT] S3 upload failed, storing worktables in JSONB:', err);
        updates.worktables = parsed.data.worktables;
        updates.worktablesS3Key = null;
      }
    }

    // Copy allowed fields only
    const ALLOWED_FIELDS = [
      'name',
      'unitSystem',
      'canvasWidth',
      'canvasHeight',
      'gridSettings',
      'fabricPresets',
      'thumbnailUrl',
      'isPublic',
      'activeWorktable',
    ];
    for (const key of ALLOWED_FIELDS) {
      if (key in parsed.data) {
        updates[key] = (parsed.data as Record<string, unknown>)[key];
      }
    }

    const [updated] = await db.update(projects).set(updates).where(eq(projects.id, id)).returning();

    return Response.json({ success: true, data: updated });
  } catch (err) {
    console.error('[designer/projects PUT] Failed to update project:', err);
    return errorResponse('Failed to update designer project', 'INTERNAL_ERROR', 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const { id } = await params;
  const project = await getOwnedDesignerProject(id, session.user.id);

  if (!project) {
    return notFoundResponse('Designer project not found.');
  }

  await db.delete(projects).where(and(eq(projects.id, id), eq(projects.userId, session.user.id)));

  return new Response(null, { status: 204 });
}
