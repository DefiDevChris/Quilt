import { NextRequest } from 'next/server';
import { eq, and, ilike, count, asc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { fabrics } from '@/db/schema';
import { validationErrorResponse, errorResponse } from '@/lib/auth-helpers';
import {
  FABRICS_PAGINATION_DEFAULT_LIMIT,
  FABRICS_PAGINATION_MAX_LIMIT,
  COLOR_FAMILIES,
} from '@/lib/constants';
import { checkRateLimit, API_RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const publicFabricSearchSchema = z.object({
  search: z.string().optional(),
  manufacturer: z.string().optional(),
  colorFamily: z.string().optional(),
  value: z.enum(['Light', 'Medium', 'Dark']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(FABRICS_PAGINATION_MAX_LIMIT)
    .default(FABRICS_PAGINATION_DEFAULT_LIMIT),
});

export async function GET(request: NextRequest) {
  const rl = await checkRateLimit('fabrics:public', API_RATE_LIMITS.fabrics);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

  const url = request.nextUrl;
  const parsed = publicFabricSearchSchema.safeParse({
    search: url.searchParams.get('search') ?? undefined,
    manufacturer: url.searchParams.get('manufacturer') ?? undefined,
    colorFamily: url.searchParams.get('colorFamily') ?? undefined,
    value: url.searchParams.get('value') ?? undefined,
    page: url.searchParams.get('page') ?? undefined,
    limit: url.searchParams.get('limit') ?? undefined,
  });

  if (!parsed.success) {
    return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid parameters');
  }

  const { search, manufacturer, colorFamily, value, page, limit } = parsed.data;
  const offset = (page - 1) * limit;

  try {
    const conditions = [eq(fabrics.isDefault, true), eq(fabrics.isActive, true)];
    if (manufacturer) conditions.push(eq(fabrics.manufacturer, manufacturer));
    if (colorFamily && (COLOR_FAMILIES as readonly string[]).includes(colorFamily)) {
      conditions.push(eq(fabrics.colorFamily, colorFamily));
    }
    if (value) conditions.push(eq(fabrics.value, value));
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
          value: fabrics.value,
          hex: fabrics.hex,
          isDefault: fabrics.isDefault,
          retailerId: fabrics.retailerId,
          affiliateUrl: fabrics.affiliateUrl,
          affiliateDeeplink: fabrics.affiliateDeeplink,
          pricePerYard: fabrics.pricePerYard,
          isActive: fabrics.isActive,
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
        fabrics: fabricRows.map((f) => ({
          ...f,
          retailerName: null as string | null,
        })),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (err) {
    console.error('[fabrics/public]', err);
    return errorResponse('Failed to fetch fabrics', 'INTERNAL_ERROR', 500);
  }
}
