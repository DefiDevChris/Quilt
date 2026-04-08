import { NextRequest } from 'next/server';
import { eq, desc, asc, count } from 'drizzle-orm';
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
import { isPro } from '@/lib/role-utils';
import type { UserRole } from '@/lib/role-utils';

export async function GET(request: NextRequest) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const rl = await checkRateLimit(`projects:${session.user.id}`, API_RATE_LIMITS.projects);
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
        .where(eq(projects.userId, session.user.id))
        .orderBy(orderFn(sortColumn))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(projects).where(eq(projects.userId, session.user.id)),
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
    return errorResponse('Failed to fetch projects', 'INTERNAL_ERROR', 500);
  }
}

const duplicateProjectSchema = z.object({
  sourceProjectId: z.string().uuid('Invalid source project ID'),
});

export async function POST(request: NextRequest) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const rl = await checkRateLimit(`projects:${session.user.id}`, API_RATE_LIMITS.projects);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

  try {
    const body = await request.json();

    // --- Duplicate project flow ---
    if (body.sourceProjectId) {
      if (!isPro(session.user.role as UserRole)) {
        return errorResponse(
          'Duplicating projects requires a Pro subscription. Upgrade to Pro for $8/month.',
          'PRO_REQUIRED',
          403
        );
      }

      const duplicateParsed = duplicateProjectSchema.safeParse({
        sourceProjectId: body.sourceProjectId,
      });
      if (!duplicateParsed.success) {
        return validationErrorResponse(
          duplicateParsed.error.issues[0]?.message ?? 'Invalid source project ID'
        );
      }
      const [source] = await db
        .select()
        .from(projects)
        .where(eq(projects.id, duplicateParsed.data.sourceProjectId))
        .limit(1);

      if (!source || source.userId !== session.user.id) {
        return errorResponse('Source project not found', 'NOT_FOUND', 404);
      }

      const [duplicated] = await db
        .insert(projects)
        .values({
          userId: session.user.id,
          name: `${source.name} (copy)`,
          canvasData: source.canvasData,
          canvasWidth: source.canvasWidth,
          canvasHeight: source.canvasHeight,
          unitSystem: source.unitSystem,
          gridSettings: source.gridSettings,
        })
        .returning();

      return Response.json({ success: true, data: duplicated }, { status: 201 });
    }

    // --- Standard create flow (no Pro required) ---
    const parsed = createProjectSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid input');
    }

    const {
      name,
      unitSystem,
      canvasWidth: bodyWidth,
      canvasHeight: bodyHeight,
      gridSettings,
      layoutBuilder,
    } = parsed.data;

    let canvasWidth = bodyWidth;
    let canvasHeight = bodyHeight;

    // --- Wizard: layout builder path ---
    if (layoutBuilder) {
      canvasWidth = layoutBuilder.width;
      canvasHeight = layoutBuilder.height;
      gridSettings.size = layoutBuilder.cellSize;
    }

    const [newProject] = await db
      .insert(projects)
      .values({
        userId: session.user.id,
        name,
        unitSystem,
        canvasWidth,
        canvasHeight,
        gridSettings,
      })
      .returning();

    return Response.json({ success: true, data: newProject }, { status: 201 });
  } catch {
    return errorResponse('Failed to create project', 'INTERNAL_ERROR', 500);
  }
}
