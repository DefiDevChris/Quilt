import { NextRequest } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { fabrics } from '@/db/schema';
import { notFoundResponse, errorResponse } from '@/lib/api-responses';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const [fabric] = await db
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
        description: fabrics.description,
        isDefault: fabrics.isDefault,
      retailerId: fabrics.retailerId,
      deeplinkOverride: fabrics.deeplinkOverride,
      isAffiliate: fabrics.isAffiliate,
      isInStockAtRetailer: fabrics.isInStockAtRetailer,
        pricePerYard: fabrics.pricePerYard,
        isActive: fabrics.isActive,
      })
      .from(fabrics)
      .where(and(eq(fabrics.id, id), eq(fabrics.isDefault, true), eq(fabrics.isActive, true)))
      .limit(1);

    if (!fabric) {
      return notFoundResponse('Fabric not found.');
    }

    return Response.json({
      success: true,
      data: { ...fabric, retailerName: null as string | null },
    });
  } catch (err) {
    console.error('[fabrics/public/[id]]', err);
    return errorResponse('Failed to fetch fabric', 'INTERNAL_ERROR', 500);
  }
}
