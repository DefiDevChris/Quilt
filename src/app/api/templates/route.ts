import { NextRequest } from 'next/server';
import { desc, eq, and, isNull, or } from 'drizzle-orm';
import { db } from '@/lib/db';
import { layoutTemplates } from '@/db/schema';
import {
  getRequiredSession,
  unauthorizedResponse,
  validationErrorResponse,
} from '@/lib/auth-helpers';
import { errorResponse } from '@/lib/api-responses';

export const dynamic = 'force-dynamic';

/**
 * GET /api/templates
 *
 * Lists templates available to the authenticated user. Supports a `scope`
 * query param:
 *   - `mine`    → only templates this user has saved
 *   - `library` → only system / default templates (isDefault=true)
 *   - omitted   → both, with system templates first then user templates
 *
 * Mirrors the blocks library/mine pattern. Used by the Phase 1 Template
 * catalog tabs in `SelectionShell`.
 */
export async function GET(request: NextRequest) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const url = request.nextUrl;
  const scope = url.searchParams.get('scope');

  try {
    if (scope === 'mine') {
      const rows = await db
        .select()
        .from(layoutTemplates)
        .where(eq(layoutTemplates.userId, session.user.id))
        .orderBy(desc(layoutTemplates.createdAt));
      return Response.json({ success: true, data: { templates: rows } });
    }

    if (scope === 'library') {
      const rows = await db
        .select()
        .from(layoutTemplates)
        .where(eq(layoutTemplates.isDefault, true))
        .orderBy(desc(layoutTemplates.createdAt));
      return Response.json({ success: true, data: { templates: rows } });
    }

    // Default: combined view (system first, then this user's templates)
    const rows = await db
      .select()
      .from(layoutTemplates)
      .where(
        or(
          eq(layoutTemplates.isDefault, true),
          eq(layoutTemplates.userId, session.user.id),
        ),
      )
      .orderBy(desc(layoutTemplates.isDefault), desc(layoutTemplates.createdAt));
    return Response.json({ success: true, data: { templates: rows } });
  } catch (err) {
    console.error('[templates GET]', err);
    return errorResponse('Failed to fetch templates', 'INTERNAL_ERROR', 500);
  }
}

/**
 * POST /api/templates
 *
 * Saves the current design as a reusable template scoped to this user.
 *
 * Expected body:
 *   {
 *     name: string,                 // required
 *     description?: string,
 *     templateData: {               // shape mirrors QuiltTemplate
 *       layoutConfig?: object,
 *       fabricAssignments?: array,
 *       canvasData?: object,        // Fabric.js JSON snapshot
 *       canvasWidth?: number,
 *       canvasHeight?: number,
 *     },
 *     thumbnailSvg?: string,
 *     category?: string,
 *   }
 */
export async function POST(request: NextRequest) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  let body: {
    name?: string;
    description?: string;
    templateData?: Record<string, unknown>;
    thumbnailSvg?: string;
    category?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return validationErrorResponse('Invalid JSON body');
  }

  const name = body.name?.trim();
  if (!name) return validationErrorResponse('Template name is required');

  try {
    const [created] = await db
      .insert(layoutTemplates)
      .values({
        userId: session.user.id,
        name,
        category: body.category ?? 'custom',
        templateData: body.templateData ?? {},
        thumbnailSvg: body.thumbnailSvg ?? null,
        isDefault: false,
        // User-saved templates are private by default; admins promote to
        // system by setting isDefault=true via the admin/layouts route.
        isPublished: false,
      })
      .returning();

    return Response.json({ success: true, data: { template: created } }, { status: 201 });
  } catch (err) {
    console.error('[templates POST]', err);
    return errorResponse('Failed to save template', 'INTERNAL_ERROR', 500);
  }
}
