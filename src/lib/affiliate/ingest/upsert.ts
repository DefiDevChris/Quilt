import { eq, and, lt, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { fabrics } from '@/db/schema';
import { rehostImage } from './rehostImage';
import type { NormalizedFabric, Retailer } from './types';

const CONFLICT_UPDATE_SET = {
  name: sql`excluded.name`,
  imageUrl: sql`excluded.image_url`,
  thumbnailUrl: sql`excluded.thumbnail_url`,
  pricePerYard: sql`excluded.price_per_yard`,
  deeplinkOverride: sql`excluded.deeplink_override`,
  retailerProductUrl: sql`excluded.retailer_product_url`,
  isInStockAtRetailer: sql`excluded.is_in_stock_at_retailer`,
  lastVerifiedAt: sql`excluded.last_verified_at`,
  isActive: sql`true`,
  updatedAt: sql`now()`,
};

export async function upsertFabric(
  normalized: NormalizedFabric,
  retailer: Retailer,
): Promise<{ created: boolean; fabricId: string }> {
  const { imageUrl, thumbnailUrl } = await rehostImage(normalized.imageUrl);

  const result = await db
    .insert(fabrics)
    .values({
      name: normalized.name,
      imageUrl,
      thumbnailUrl,
      manufacturer: normalized.manufacturer,
      collection: normalized.collection,
      colorFamily: normalized.colorFamily,
      pricePerYard: normalized.pricePerYard.toFixed(2),
      description: normalized.description ?? null,
      isDefault: true,
      isAffiliate: true,
      retailerId: retailer.id,
      retailerProductSku: normalized.retailerProductSku,
      retailerProductUrl: normalized.retailerProductUrl,
      deeplinkOverride: normalized.deeplinkOverride,
      isInStockAtRetailer: normalized.isInStockAtRetailer,
      lastVerifiedAt: new Date(),
      isActive: true,
    })
    .onConflictDoUpdate({
      target: [fabrics.retailerId, fabrics.retailerProductSku],
      set: CONFLICT_UPDATE_SET,
    })
    .returning({
      id: fabrics.id,
      xmaxIsZero: sql<boolean>`(xmax = 0)`,
    });

  return {
    created: result[0].xmaxIsZero,
    fabricId: result[0].id,
  };
}

export async function sweepStale(
  retailerId: string,
  staleDays: number,
): Promise<{ deactivated: number }> {
  const cutoff = new Date(Date.now() - staleDays * 86400 * 1000);
  const result = await db
    .update(fabrics)
    .set({ isActive: false, updatedAt: new Date() })
    .where(
      and(
        eq(fabrics.retailerId, retailerId),
        eq(fabrics.isAffiliate, true),
        lt(fabrics.lastVerifiedAt, cutoff),
        eq(fabrics.isActive, true),
      ),
    );
  return { deactivated: result.rowCount ?? 0 };
}
