import { NextRequest } from 'next/server';
import { eq, and, or, ilike, gte, lte, asc, desc, count, inArray, type SQL } from 'drizzle-orm';
import { db } from '@/lib/db';
import { fabrics, siteSettings } from '@/db/schema';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Category IDs map to Shopify collection names via ilike matching.
const CATEGORY_COLLECTION_MAP: Record<string, string> = {
  'charm-packs': 'charm pack',
  'jelly-rolls': 'jelly roll',
  'layer-cakes': 'layer cake',
  'by-the-yard': 'fat quarter',
  notions: 'notion',
  batting: 'batting',
  patterns: 'pattern',
  thread: 'thread',
};

const querySchema = z.object({
  search: z.string().optional(),
  manufacturer: z.string().optional(),
  collection: z.string().optional(),
  colorFamily: z.string().optional(),
  value: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  inStock: z.enum(['true', 'false']).optional(),
  sort: z.enum(['name', 'price-asc', 'price-desc', 'newest']).default('name'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(24),
});

/**
 * GET /api/shop/fabrics
 * Public endpoint — returns purchasable fabrics with filtering.
 * Returns 503 if shop is not enabled.
 */
export async function GET(request: NextRequest) {
  try {
    // Check if shop is enabled
    const [setting] = await db
      .select({ value: siteSettings.value })
      .from(siteSettings)
      .where(eq(siteSettings.key, 'shop_enabled'))
      .limit(1);

    if (setting?.value !== true) {
      return Response.json({ success: false, error: 'Shop is not available' }, { status: 503 });
    }

    const url = request.nextUrl;
    const parsed = querySchema.safeParse({
      search: url.searchParams.get('search') ?? undefined,
      manufacturer: url.searchParams.get('manufacturer') ?? undefined,
      collection: url.searchParams.get('collection') ?? undefined,
      colorFamily: url.searchParams.get('colorFamily') ?? undefined,
      value: url.searchParams.get('value') ?? undefined,
      minPrice: url.searchParams.get('minPrice') ?? undefined,
      maxPrice: url.searchParams.get('maxPrice') ?? undefined,
      inStock: url.searchParams.get('inStock') ?? undefined,
      sort: url.searchParams.get('sort') ?? undefined,
      page: url.searchParams.get('page') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
    });

    if (!parsed.success) {
      return Response.json(
        { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid parameters' },
        { status: 422 }
      );
    }

    const {
      search,
      manufacturer,
      collection,
      colorFamily,
      value,
      category,
      minPrice,
      maxPrice,
      inStock,
      sort,
      page,
      limit,
    } = parsed.data;

    // Build filters — always require isPurchasable
    const conditions: SQL[] = [eq(fabrics.isPurchasable, true)];

    if (search) {
      conditions.push(ilike(fabrics.name, `%${search}%`));
    }
    if (manufacturer) {
      const mfgs = manufacturer.split(',').map((s) => s.trim()).filter(Boolean);
      if (mfgs.length === 1) {
        conditions.push(eq(fabrics.manufacturer, mfgs[0]));
      } else if (mfgs.length > 1) {
        conditions.push(inArray(fabrics.manufacturer, mfgs));
      }
    }
    if (colorFamily) {
      const colors = colorFamily.split(',').map((s) => s.trim()).filter(Boolean);
      if (colors.length === 1) {
        conditions.push(eq(fabrics.colorFamily, colors[0]));
      } else if (colors.length > 1) {
        conditions.push(inArray(fabrics.colorFamily, colors));
      }
    }
    if (value) {
      conditions.push(eq(fabrics.value, value));
    }
    if (collection) {
      const colls = collection.split(',').map((s) => s.trim()).filter(Boolean);
      if (colls.length === 1) {
        conditions.push(eq(fabrics.collection, colls[0]));
      } else if (colls.length > 1) {
        conditions.push(inArray(fabrics.collection, colls));
      }
    }
    if (category && CATEGORY_COLLECTION_MAP[category]) {
      conditions.push(ilike(fabrics.collection, `%${CATEGORY_COLLECTION_MAP[category]}%`));
    }
    if (minPrice !== undefined) {
      conditions.push(gte(fabrics.pricePerYard, String(minPrice)));
    }
    if (maxPrice !== undefined) {
      conditions.push(lte(fabrics.pricePerYard, String(maxPrice)));
    }
    if (inStock === 'true') {
      conditions.push(eq(fabrics.inStock, true));
    }

    const whereClause = and(...conditions);

    // Sort
    const orderMap = {
      name: asc(fabrics.name),
      'price-asc': asc(fabrics.pricePerYard),
      'price-desc': desc(fabrics.pricePerYard),
      newest: desc(fabrics.createdAt),
    } as const;
    const orderBy = orderMap[sort];

    const offset = (page - 1) * limit;

    const [rows, [totalRow]] = await Promise.all([
      db
        .select({
          id: fabrics.id,
          name: fabrics.name,
          imageUrl: fabrics.imageUrl,
          thumbnailUrl: fabrics.thumbnailUrl,
          manufacturer: fabrics.manufacturer,
          collection: fabrics.collection,
          colorFamily: fabrics.colorFamily,
          value: fabrics.value,
          hex: fabrics.hex,
          pricePerYard: fabrics.pricePerYard,
          description: fabrics.description,
          inStock: fabrics.inStock,
          shopifyVariantId: fabrics.shopifyVariantId,
        })
        .from(fabrics)
        .where(whereClause)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(fabrics).where(whereClause),
    ]);

    const total = totalRow?.count ?? 0;

    return Response.json({
      success: true,
      data: {
        fabrics: rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch {
    return Response.json(
      { success: false, error: 'Failed to fetch shop fabrics' },
      { status: 500 }
    );
  }
}
