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
import { FREE_FABRIC_LIMIT } from '@/lib/constants';
import { checkRateLimit, API_RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const userRole = session.user.role;
  const isPro = userRole === 'pro' || userRole === 'admin';

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
    const effectiveLimit = isPro ? limit : Math.min(limit, FREE_FABRIC_LIMIT);

    // User scope: query user_fabrics table (Pro only)
    if (isPro && scope === 'user') {
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
          .limit(effectiveLimit)
          .offset(offset),
        db.select({ count: count() }).from(userFabrics).where(whereClause),
      ]);

      const total = totalRow?.count ?? 0;
      return Response.json({
        success: true,
        data: {
          fabrics: rows.map((r) => ({ ...r, isDefault: false as const })),
          upgradeRequired: false,
          pagination: { page, limit: effectiveLimit, total, totalPages: Math.ceil(total / limit) },
        },
      });
    }

    // System scope or free users: query system fabrics table
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
        .limit(effectiveLimit)
        .offset(isPro ? offset : 0),
      db.select({ count: count() }).from(fabrics).where(whereClause),
    ]);

    const total = isPro
      ? (totalRow?.count ?? 0)
      : Math.min(totalRow?.count ?? 0, FREE_FABRIC_LIMIT);

    return Response.json({
      success: true,
      data: {
        fabrics: fabricRows,
        upgradeRequired: !isPro,
        pagination: {
          page: isPro ? page : 1,
          limit: effectiveLimit,
          total,
          totalPages: isPro ? Math.ceil(total / limit) : 1,
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

  const rl = await checkRateLimit(`fabrics:${session.user.id}`, API_RATE_LIMITS.fabrics);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

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
  } catch {
    return errorResponse('Failed to create fabric', 'INTERNAL_ERROR', 500);
  }
}
