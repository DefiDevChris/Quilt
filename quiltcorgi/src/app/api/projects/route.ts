import { NextRequest } from 'next/server';
import { eq, desc, asc, count, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { projects } from '@/db/schema';
import { createProjectSchema, paginationSchema } from '@/lib/validation';
import {
  getRequiredSession,
  unauthorizedResponse,
  validationErrorResponse,
  errorResponse,
} from '@/lib/auth-helpers';
import { FREE_PROJECT_LIMIT } from '@/lib/constants';

export async function GET(request: NextRequest) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

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
}

export async function POST(request: NextRequest) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  try {
    const body = await request.json();
    const parsed = createProjectSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid input');
    }

    const { name, unitSystem, canvasWidth, canvasHeight, gridSettings } = parsed.data;

    const newProject = await db.transaction(async (tx) => {
      if (session.user.role === 'free') {
        const [countRow] = await tx
          .select({ count: count() })
          .from(projects)
          .where(eq(projects.userId, session.user.id));

        if ((countRow?.count ?? 0) >= FREE_PROJECT_LIMIT) {
          return null;
        }
      }

      const [created] = await tx
        .insert(projects)
        .values({
          userId: session.user.id,
          name,
          unitSystem,
          canvasWidth,
          canvasHeight,
          gridSettings,
          canvasData: {},
        })
        .returning();

      return created;
    });

    if (!newProject) {
      return errorResponse(
        'Free plan allows up to 3 projects. Upgrade to Pro for unlimited projects.',
        'PROJECT_LIMIT_REACHED',
        403
      );
    }

    return Response.json({ success: true, data: newProject }, { status: 201 });
  } catch {
    return errorResponse('Failed to create project', 'INTERNAL_ERROR', 500);
  }
}
