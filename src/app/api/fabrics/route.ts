import { NextRequest } from 'next/server';
import { eq, and, ilike, count, asc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { fabrics, userFabrics } from '@/db/schema';
import { fabricSearchSchema, createFabricSchema } from '@/lib/validation';
import {
  getRequiredSession,
  unauthorizedResponse,
  validationErrorResponse,
  errorResponse,
} from '@/lib/auth-helpers';
import { checkRateLimit, API_RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

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
    // User scope: query user_fabrics table
    if (scope === 'user') {
      const conditions = [eq(userFabrics.userId, session.user.id)];
      if (manufacturer) conditions.push(eq(userFabrics.manufacturer, manufacturer));
      if (colorFamily) conditions.push(eq(userFabrics.colorFamily, colorFamily));
      if (search) {
        const escaped = search.replace(/[%_\\]/g, '\\$&');
        conditions.push(ilike(userFabrics.name, `%${escaped}%`));
      }

      const whereClause = and(...conditions);

      const [rows, [totalRow]] = await Promise.all([
        db
          .select({
            id: userFabrics.id,
            name: userFabrics.name,
            imageUrl: userFabrics.imageUrl,
            thumbnailUrl: userFabrics.thumbnailUrl,
            manufacturer: userFabrics.manufacturer,
            sku: userFabrics.sku,
            collection: userFabrics.collection,
            colorFamily: userFabrics.colorFamily,
          })
          .from(userFabrics)
          .where(whereClause)
          .orderBy(asc(userFabrics.name))
          .limit(limit)
          .offset(offset),
        db.select({ count: count() }).from(userFabrics).where(whereClause),
      ]);

      const total = totalRow?.count ?? 0;
      return Response.json({
        success: true,
        data: {
          fabrics: rows.map((r) => ({ ...r, isDefault: false as const })),
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        },
      });
    }

    // System scope: query system fabrics table
    const conditions = [eq(fabrics.isDefault, true)];
    if (manufacturer) conditions.push(eq(fabrics.manufacturer, manufacturer));
    if (colorFamily) conditions.push(eq(fabrics.colorFamily, colorFamily));
    if (search) {
      const escaped = search.replace(/[%_\\]/g, '\\$&');
      conditions.push(ilike(fabrics.name, `%${escaped}%`));
    }

    const whereClause = and(...conditions);

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
  } catch (err) { console.error('[fabrics]', err);
    return errorResponse('Failed to fetch fabrics', 'INTERNAL_ERROR', 500);
  }
}

export async function POST(request: NextRequest) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const rl = await checkRateLimit(`fabrics:${session.user.id}`, API_RATE_LIMITS.fabrics);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

  try {
    const body = await request.json();
    const parsed = createFabricSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid fabric data');
    }

    const { name, imageUrl, thumbnailUrl, manufacturer, sku, scaleX, scaleY, rotation } =
      parsed.data;

    const [created] = await db
      .insert(userFabrics)
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
          isDefault: false,
        },
      },
      { status: 201 }
    );
  } catch (err) { console.error('[fabrics]', err);
    return errorResponse('Failed to create fabric', 'INTERNAL_ERROR', 500);
  }
}
