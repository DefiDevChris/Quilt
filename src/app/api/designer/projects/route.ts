import { NextRequest } from 'next/server';
import { eq, desc, asc, count, and, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { projects } from '@/db/schema';
import { createProjectSchema, paginationSchema } from '@/lib/validation';
import {
  getRequiredSession,
  unauthorizedResponse,
  validationErrorResponse,
  errorResponse,
} from '@/lib/auth-helpers';
import { checkRateLimit, API_RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';
import { z } from 'zod';

const DESIGNER_TYPE = 'designer';

const designerCreateSchema = createProjectSchema.extend({
  type: z.literal('designer').optional(),
});

/**
 * Filter for designer projects only.
 * Uses JSONB ->> operator to check the nested type field.
 */
function isDesignerProject() {
  return sql`${projects.canvasData} ->> 'type' = ${DESIGNER_TYPE}`;
}

export async function GET(request: NextRequest) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const rl = await checkRateLimit(`designer-projects:${session.user.id}`, API_RATE_LIMITS.projects);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

  const url = request.nextUrl;
  const parsed = paginationSchema.safeParse({
    page: url.searchParams.get('page') ?? undefined,
    limit: url.searchParams.get('limit') ?? undefined,
    sort: url.searchParams.get('sort') ?? undefined,
    order: url.searchParams.get('order') ?? undefined,
  });

  if (!parsed.success) {
    return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid parameters');
  }

  const { page, limit, order } = parsed.data;
  const sort = parsed.data.sort ?? 'updatedAt';
  const offset = (page - 1) * limit;

  const sortColumn =
    sort === 'createdAt'
      ? projects.createdAt
      : sort === 'name'
        ? projects.name
        : projects.updatedAt;

  const orderFn = order === 'asc' ? asc : desc;

  try {
    const [userProjects, [totalRow]] = await Promise.all([
      db
        .select({
          id: projects.id,
          name: projects.name,
          description: projects.description,
          thumbnailUrl: projects.thumbnailUrl,
          unitSystem: projects.unitSystem,
          isPublic: projects.isPublic,
          lastSavedAt: projects.lastSavedAt,
          createdAt: projects.createdAt,
          updatedAt: projects.updatedAt,
        })
        .from(projects)
        .where(and(eq(projects.userId, session.user.id), isDesignerProject()))
        .orderBy(orderFn(sortColumn))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: count() })
        .from(projects)
        .where(and(eq(projects.userId, session.user.id), isDesignerProject())),
    ]);

    const total = totalRow?.count ?? 0;

    return Response.json({
      success: true,
      data: {
        projects: userProjects,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch {
    return errorResponse('Failed to fetch designer projects', 'INTERNAL_ERROR', 500);
  }
}

export async function POST(request: NextRequest) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const rl = await checkRateLimit(`designer-projects:${session.user.id}`, API_RATE_LIMITS.projects);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

  try {
    const body = await request.json();
    const parsed = designerCreateSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid input');
    }

    const {
      name,
      unitSystem,
      canvasWidth: bodyWidth,
      canvasHeight: bodyHeight,
      gridSettings,
    } = parsed.data;

    const canvasWidth = bodyWidth;
    const canvasHeight = bodyHeight;

    const [newProject] = await db
      .insert(projects)
      .values({
        userId: session.user.id,
        name,
        canvasData: { type: DESIGNER_TYPE },
        unitSystem,
        canvasWidth,
        canvasHeight,
        gridSettings,
      })
      .returning();

    return Response.json({ success: true, data: newProject }, { status: 201 });
  } catch {
    return errorResponse('Failed to create designer project', 'INTERNAL_ERROR', 500);
  }
}
