import { NextRequest } from 'next/server';
import { eq, and, ilike, or, count, asc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { fabrics } from '@/db/schema';
import { fabricSearchSchema, createFabricSchema } from '@/lib/validation';
import {
  getRequiredSession,
  unauthorizedResponse,
  validationErrorResponse,
  errorResponse,
} from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const userRole = session.user.role;
  const isPro = userRole === 'pro' || userRole === 'admin';
  if (!isPro) {
    return errorResponse('Fabric library requires a Pro subscription.', 'PRO_REQUIRED', 403);
  }

  const url = request.nextUrl;
  const parsed = fabricSearchSchema.safeParse({
    search: url.searchParams.get('search') ?? undefined,
    manufacturer: url.searchParams.get('manufacturer') ?? undefined,
    colorFamily: url.searchParams.get('colorFamily') ?? undefined,
    scope: url.searchParams.get('scope') ?? undefined,
    page: url.searchParams.get('page') ?? undefined,
    limit: url.searchParams.get('limit') ?? undefined,
  });

  if (!parsed.success) {
    return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid parameters');
  }

  const { search, manufacturer, colorFamily, scope, page, limit } = parsed.data;
  const offset = (page - 1) * limit;

  try {
    const conditions = [];

    if (scope === 'system') {
      conditions.push(eq(fabrics.isDefault, true));
    } else if (scope === 'user') {
      conditions.push(eq(fabrics.userId, session.user.id));
    } else {
      conditions.push(or(eq(fabrics.isDefault, true), eq(fabrics.userId, session.user.id)));
    }

    if (manufacturer) {
      conditions.push(eq(fabrics.manufacturer, manufacturer));
    }

    if (colorFamily) {
      conditions.push(eq(fabrics.colorFamily, colorFamily));
    }

    if (search) {
      const searchPattern = `%${search}%`;
      conditions.push(ilike(fabrics.name, searchPattern));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [fabricRows, [totalRow]] = await Promise.all([
      db
        .select({
          id: fabrics.id,
          name: fabrics.name,
          imageUrl: fabrics.imageUrl,
          thumbnailUrl: fabrics.thumbnailUrl,
          manufacturer: fabrics.manufacturer,
          sku: fabrics.sku,
          collection: fabrics.collection,
          colorFamily: fabrics.colorFamily,
          isDefault: fabrics.isDefault,
        })
        .from(fabrics)
        .where(whereClause)
        .orderBy(asc(fabrics.name))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(fabrics).where(whereClause),
    ]);

    const total = totalRow?.count ?? 0;

    return Response.json({
      success: true,
      data: {
        fabrics: fabricRows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch {
    return errorResponse('Failed to fetch fabrics', 'INTERNAL_ERROR', 500);
  }
}

export async function POST(request: NextRequest) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const userRole = session.user.role;
  const isPro = userRole === 'pro' || userRole === 'admin';
  if (!isPro) {
    return errorResponse('Fabric upload requires a Pro subscription.', 'PRO_REQUIRED', 403);
  }

  try {
    const body = await request.json();
    const parsed = createFabricSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid fabric data');
    }

    const { name, imageUrl, thumbnailUrl, manufacturer, sku, scaleX, scaleY, rotation } =
      parsed.data;

    const [created] = await db
      .insert(fabrics)
      .values({
        userId: session.user.id,
        name,
        imageUrl,
        thumbnailUrl: thumbnailUrl ?? null,
        manufacturer: manufacturer ?? null,
        sku: sku ?? null,
        scaleX,
        scaleY,
        rotation,
        isDefault: false,
      })
      .returning();

    return Response.json(
      {
        success: true,
        data: {
          id: created.id,
          name: created.name,
          imageUrl: created.imageUrl,
          thumbnailUrl: created.thumbnailUrl,
          manufacturer: created.manufacturer,
          sku: created.sku,
          collection: created.collection,
          colorFamily: created.colorFamily,
          isDefault: created.isDefault,
        },
      },
      { status: 201 }
    );
  } catch {
    return errorResponse('Failed to create fabric', 'INTERNAL_ERROR', 500);
  }
}
