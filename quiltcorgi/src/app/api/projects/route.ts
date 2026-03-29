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

    const isPro = session.user.role === 'pro' || session.user.role === 'admin';
    if (!isPro) {
      return errorResponse(
        'Saving projects requires a Pro subscription. Upgrade to Pro for $8/month.',
        'PRO_REQUIRED',
        403
      );
    }

    const { name, unitSystem, canvasWidth, canvasHeight, gridSettings } = parsed.data;

    const [newProject] = await db
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

    return Response.json({ success: true, data: newProject }, { status: 201 });
  } catch {
    return errorResponse('Failed to create project', 'INTERNAL_ERROR', 500);
  }
}
