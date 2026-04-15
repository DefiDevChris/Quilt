import { eq, and, desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { fabrics, siteSettings } from '@/db/schema';
import type { ShopFabric } from '@/types/fabric';

export async function getShopSettings(): Promise<{ enabled: boolean }> {
  try {
    const [row] = await db
      .select({ value: siteSettings.value })
      .from(siteSettings)
      .where(eq(siteSettings.key, 'shop_enabled'))
      .limit(1);

    return { enabled: row?.value === true };
  } catch {
    return { enabled: false };
  }
}

export async function getShopFabrics(
  options: {
    sort?: 'name' | 'price-asc' | 'price-desc' | 'newest';
    limit?: number;
  } = {}
): Promise<ShopFabric[]> {
  const { sort = 'newest', limit = 24 } = options;

  const orderMap = {
    name: fabrics.name,
    'price-asc': fabrics.pricePerYard,
    'price-desc': fabrics.pricePerYard,
    newest: fabrics.createdAt,
  } as const;

  const orderByColumn = orderMap[sort];
  const orderBy = sort === 'price-desc' || sort === 'newest' ? desc(orderByColumn) : orderByColumn;

  try {
    const rows = await db
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
      .where(and(eq(fabrics.isPurchasable, true), eq(fabrics.inStock, true)))
      .orderBy(orderBy)
      .limit(limit);

    return rows.map((row) => ({
      ...row,
      id: row.id,
      pricePerYard: row.pricePerYard ?? null,
    })) as ShopFabric[];
  } catch {
    return [];
  }
}
