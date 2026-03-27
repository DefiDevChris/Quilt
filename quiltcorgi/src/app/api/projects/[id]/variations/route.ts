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
import { FREE_VARIATION_LIMIT } from '@/lib/constants';

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

  const { id: projectId } = await params;
  const project = await verifyProjectOwner(projectId, session.user.id);
  if (!project) return notFoundResponse('Project not found.');

  try {
    const body = await request.json();
    const parsed = createVariationSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.message);
    }

    // Enforce tier limits for free users
    const role = (session.user as { role?: string }).role ?? 'free';
    if (role === 'free') {
      const existing = await db
        .select({ id: designVariations.id })
        .from(designVariations)
        .where(eq(designVariations.projectId, projectId));

      if (existing.length >= FREE_VARIATION_LIMIT) {
        return errorResponse(
          `Free plan allows up to ${FREE_VARIATION_LIMIT} variations per project. Upgrade to Pro for unlimited.`,
          'PRO_REQUIRED',
          403
        );
      }
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
