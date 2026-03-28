import { NextRequest } from 'next/server';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { printlists, projects } from '@/db/schema';
import {
  getRequiredSession,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  errorResponse,
} from '@/lib/auth-helpers';

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

  // Pro-gate: printlist is Pro only
  const role = (session.user as { role?: string }).role ?? 'free';
  if (role === 'free') {
    return forbiddenResponse('Printlist requires a Pro subscription.');
  }

  const { id: projectId } = await params;
  const project = await verifyProjectOwner(projectId, session.user.id);
  if (!project) return notFoundResponse('Project not found.');

  try {
    const [printlist] = await db
      .select()
      .from(printlists)
      .where(eq(printlists.projectId, projectId))
      .limit(1);

    if (!printlist) {
      return Response.json({
        success: true,
        data: {
          projectId,
          items: [],
          paperSize: 'letter',
        },
      });
    }

    return Response.json({ success: true, data: printlist });
  } catch {
    return errorResponse('Failed to load printlist', 'INTERNAL_ERROR', 500);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const role = (session.user as { role?: string }).role ?? 'free';
  if (role === 'free') {
    return forbiddenResponse('Printlist requires a Pro subscription.');
  }

  const { id: projectId } = await params;
  const project = await verifyProjectOwner(projectId, session.user.id);
  if (!project) return notFoundResponse('Project not found.');

  try {
    const body = await request.json();

    const printlistItemSchema = z
      .array(
        z.object({
          blockId: z.string().max(100),
          blockName: z.string().max(255),
          quantity: z.number().int().min(1).max(999),
          copies: z.number().int().min(1).max(100).optional(),
        })
      )
      .max(200);

    const parsedItems = printlistItemSchema.safeParse(body.items);
    const items = parsedItems.success ? parsedItems.data : [];
    const paperSize = body.paperSize === 'a4' ? 'a4' : 'letter';

    // Upsert: update if exists, insert if not
    const [existing] = await db
      .select({ id: printlists.id })
      .from(printlists)
      .where(eq(printlists.projectId, projectId))
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(printlists)
        .set({
          items,
          paperSize,
          updatedAt: new Date(),
        })
        .where(eq(printlists.id, existing.id))
        .returning();

      return Response.json({ success: true, data: updated });
    }

    const [created] = await db
      .insert(printlists)
      .values({
        projectId,
        userId: session.user.id,
        items,
        paperSize,
      })
      .returning();

    return Response.json({ success: true, data: created });
  } catch {
    return errorResponse('Failed to save printlist', 'INTERNAL_ERROR', 500);
  }
}
