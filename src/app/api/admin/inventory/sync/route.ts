import { NextRequest } from 'next/server';
import { getSession } from '@/lib/cognito-session';
import { db } from '@/lib/db';
import { fabrics } from '@/db/schema/fabrics';
import { eq } from 'drizzle-orm';
import { getInventoryLevels, isShopifyEnabled } from '@/lib/shopify';

/**
 * POST /api/admin/inventory/sync
 * Admin-only endpoint to sync inventory from Shopify
 * Updates inStock flag on matching fabrics based on Shopify inventory levels
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!isShopifyEnabled()) {
      return Response.json({ error: 'Shopify integration is not enabled' }, { status: 500 });
    }

    // Fetch inventory from Shopify
    const inventoryItems = await getInventoryLevels(100);

    let updatedCount = 0;
    let errors = 0;

    // Update local database
    for (const item of inventoryItems) {
      try {
        const inStock = item.inventoryQuantity > 0 && item.availableForSale;

        const result = await db
          .update(fabrics)
          .set({
            inStock,
            updatedAt: new Date(),
          })
          .where(eq(fabrics.shopifyVariantId, item.variantId));

        if (result.rowCount && result.rowCount > 0) {
          updatedCount++;
        }
      } catch (error) {
        console.error(`Failed to update inventory for variant ${item.variantId}:`, error);
        errors++;
      }
    }

    return Response.json({
      success: true,
      data: {
        updatedCount,
        errors,
        totalProcessed: inventoryItems.length,
      },
    });
  } catch (error) {
    console.error('Inventory sync failed:', error);
    return Response.json(
      {
        error: 'Inventory sync failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
