import { NextRequest } from 'next/server';
import { eq, desc, and } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { layoutTemplates } from '@/db/schema';
import {
  getRequiredSession,
  unauthorizedResponse,
  validationErrorResponse,
  errorResponse,
} from '@/lib/auth-helpers';
import { checkRateLimit, API_RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';
import type { TemplateDataPayload, UserLayoutTemplate } from '@/types/layoutTemplate';

/**
 * Body schema for `POST /api/templates`. Mirrors the shape produced by
 * SaveAsTemplateModal in the Studio top bar. Strict-validates the inner
 * templateData payload so we never persist garbage.
 */
const createTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  category: z.string().min(1).max(100).default('custom'),
  description: z.string().max(2000).optional(),
  isPublished: z.boolean().optional(),
  thumbnailSvg: z.string().max(200_000).optional(),
  templateData: z
    .object({
      canvasJson: z.record(z.unknown()),
      canvasWidth: z.number().positive(),
      canvasHeight: z.number().positive(),
      layoutConfig: z
        .object({
          layoutType: z.string(),
          rows: z.number().int().nonnegative(),
          cols: z.number().int().nonnegative(),
          blockSize: z.number().nonnegative(),
          sashing: z
            .object({
              width: z.number().nonnegative(),
              color: z.string().optional(),
              fabricId: z.string().nullable().optional(),
            })
            .optional(),
          borders: z
            .array(
              z.object({
                width: z.number().nonnegative(),
                color: z.string().optional(),
                fabricId: z.string().nullable().optional(),
              })
            )
            .optional(),
          hasCornerstones: z.boolean().optional(),
          bindingWidth: z.number().nonnegative().optional(),
        })
        .passthrough(),
    })
    .passthrough(),
});

interface DbLayoutTemplateRow {
  id: string;
  userId: string | null;
  name: string;
  category: string;
  templateData: unknown;
  thumbnailSvg: string | null;
  isDefault: boolean;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function toUserLayoutTemplate(row: DbLayoutTemplateRow): UserLayoutTemplate {
  // templateData is jsonb — coerce defensively
  const td = (row.templateData ?? {}) as Partial<TemplateDataPayload> & {
    description?: string;
  };

  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    category: row.category,
    description: td.description ?? null,
    thumbnailSvg: row.thumbnailSvg,
    isPublished: row.isPublished,
    isDefault: row.isDefault,
    canvasWidth:
      typeof td.canvasWidth === 'number' && Number.isFinite(td.canvasWidth) ? td.canvasWidth : 60,
    canvasHeight:
      typeof td.canvasHeight === 'number' && Number.isFinite(td.canvasHeight)
        ? td.canvasHeight
        : 72,
    templateData: {
      canvasJson: (td.canvasJson ?? {}) as Record<string, unknown>,
      layoutConfig: (td.layoutConfig ?? {
        layoutType: 'free-form',
        rows: 1,
        cols: 1,
        blockSize: 12,
      }) as TemplateDataPayload['layoutConfig'],
      canvasWidth:
        typeof td.canvasWidth === 'number' ? td.canvasWidth : 60,
      canvasHeight:
        typeof td.canvasHeight === 'number' ? td.canvasHeight : 72,
    },
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : undefined,
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : undefined,
  };
}

/**
 * GET /api/templates
 *
 * Query params (mutually exclusive in normal usage):
 *   - `mine=true`      → user's own saved templates (any isPublished value)
 *   - `published=true` → all rows where isPublished=true (Library augment)
 *
 * Without either flag the route returns the user's own templates,
 * which is the safer default for an authenticated endpoint.
 */
export async function GET(request: NextRequest) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const rl = await checkRateLimit(`templates:${session.user.id}`, API_RATE_LIMITS.projects);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

  const url = request.nextUrl;
  const mine = url.searchParams.get('mine') === 'true';
  const published = url.searchParams.get('published') === 'true';

  try {
    let rows: DbLayoutTemplateRow[] = [];

    if (published && !mine) {
      rows = (await db
        .select()
        .from(layoutTemplates)
        .where(eq(layoutTemplates.isPublished, true))
        .orderBy(desc(layoutTemplates.updatedAt))
        .limit(200)) as DbLayoutTemplateRow[];
    } else {
      rows = (await db
        .select()
        .from(layoutTemplates)
        .where(eq(layoutTemplates.userId, session.user.id))
        .orderBy(desc(layoutTemplates.updatedAt))
        .limit(200)) as DbLayoutTemplateRow[];
    }

    return Response.json({
      success: true,
      data: rows.map(toUserLayoutTemplate),
    });
  } catch (err) {
    console.error('[templates GET]', err);
    return errorResponse('Failed to load templates', 'INTERNAL_ERROR', 500);
  }
}

/**
 * POST /api/templates
 *
 * Persists a snapshot of the current Studio canvas as a reusable template.
 * The body shape is enforced by `createTemplateSchema` above. New rows are
 * private by default (`isPublished: false`); the Library tab surfaces only
 * `isPublished=true` rows.
 */
export async function POST(request: NextRequest) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const rl = await checkRateLimit(`templates:${session.user.id}`, API_RATE_LIMITS.save);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

  try {
    const body = await request.json();
    const parsed = createTemplateSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid template');
    }

    const { name, category, description, isPublished, thumbnailSvg, templateData } = parsed.data;

    // Persist description inside templateData so we don't have to add a
    // dedicated column. The layoutTemplates schema already keeps
    // templateData as a jsonb blob.
    const persistedTemplateData = {
      ...templateData,
      ...(description ? { description } : {}),
    };

    const [inserted] = (await db
      .insert(layoutTemplates)
      .values({
        userId: session.user.id,
        name,
        category,
        templateData: persistedTemplateData,
        thumbnailSvg: thumbnailSvg ?? null,
        isDefault: false,
        isPublished: isPublished ?? false,
      })
      .returning()) as DbLayoutTemplateRow[];

    return Response.json(
      { success: true, data: toUserLayoutTemplate(inserted) },
      { status: 201 }
    );
  } catch (err) {
    console.error('[templates POST]', err);
    return errorResponse('Failed to save template', 'INTERNAL_ERROR', 500);
  }
}
