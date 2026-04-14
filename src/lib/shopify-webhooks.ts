/**
 * Shopify Webhook Handler Logic
 * Processes incoming webhook events from Shopify
 */

import { createHmac, timingSafeEqual } from 'crypto';
import { db } from '@/lib/db';
import { orders, orderStatusHistory, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { fabrics } from '@/db/schema/fabrics';
import {
  mapShopifyOrderStatus,
  type OrderLineItem,
  type OrderShippingAddress,
} from '@/lib/order-utils';

/**
 * Verify Shopify webhook HMAC signature
 */
export function verifyWebhookSignature(
  rawBody: string,
  hmacHeader: string,
  secret: string
): boolean {
  const hash = createHmac('sha256', secret).update(rawBody).digest('base64');
  return timingSafeEqual(Buffer.from(hash), Buffer.from(hmacHeader));
}

/**
 * Handle orders/create webhook event
 */
export async function handleOrderCreate(payload: unknown): Promise<void> {
  try {
    const p = payload as Record<string, unknown>;
    const shopifyOrderId = p.id as string;
    const financialStatus = p.financial_status as string | null;
    const fulfillmentStatus = p.fulfillment_status as string | null;
    const status = mapShopifyOrderStatus(financialStatus, fulfillmentStatus);

    // Calculate totals from line items
    const lineItems: OrderLineItem[] = ((p.line_items ?? []) as Array<Record<string, unknown>>).map(
      (item) => ({
        fabricId: (item.variant_id as string)?.toString() || '',
        fabricName: (item.title as string) || 'Unknown Fabric',
        quantityInYards: (item.quantity as number) || 0,
        pricePerYard: Math.round((parseFloat(item.price as string) || 0) * 100),
        imageUrl: (item.image_url as string) || null,
        shopifyVariantId: (item.variant_id as string)?.toString(),
      })
    );

    const totalCents = lineItems.reduce(
      (sum, item) => sum + item.quantityInYards * item.pricePerYard,
      0
    );

    const shippingAddress: OrderShippingAddress | null = p.shipping_address
      ? {
          name: ((p.shipping_address as Record<string, unknown>).name as string | null) || null,
          address1:
            ((p.shipping_address as Record<string, unknown>).address1 as string | null) || null,
          address2:
            ((p.shipping_address as Record<string, unknown>).address2 as string | null) || null,
          city: ((p.shipping_address as Record<string, unknown>).city as string | null) || null,
          province:
            ((p.shipping_address as Record<string, unknown>).province as string | null) || null,
          country:
            ((p.shipping_address as Record<string, unknown>).country as string | null) || null,
          zip: ((p.shipping_address as Record<string, unknown>).zip as string | null) || null,
          phone: ((p.shipping_address as Record<string, unknown>).phone as string | null) || null,
        }
      : null;

    // Try to find user by customer email
    let userId: string | null = null;
    const customer = p.customer as Record<string, unknown> | undefined;
    if (customer?.email) {
      const [user] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, customer.email as string))
        .limit(1);
      userId = user?.id || null;
    }

    // Insert order
    await db.insert(orders).values({
      userId,
      shopifyOrderId,
      status,
      totalCents,
      currency: (p.currency as string) || 'usd',
      subtotalCents: Math.round((parseFloat(p.subtotal_price as string) || 0) * 100),
      taxCents: Math.round((parseFloat(p.total_tax as string) || 0) * 100),
      shippingCents: Math.round((parseFloat(p.total_shipping as string) || 0) * 100),
      lineItems: lineItems as unknown[],
      shippingAddress: shippingAddress as Record<string, unknown> | null,
      checkoutUrl: (p.checkout_url as string) || null,
      processedAt: p.processed_at ? new Date(p.processed_at as string) : null,
    });

    console.log(`[Webhook] Order created: ${shopifyOrderId}`);
  } catch (error) {
    console.error(`[Webhook] Failed to handle orders/create:`, error);
  }
}

/**
 * Handle orders/paid webhook event
 */
export async function handleOrderPaid(payload: unknown): Promise<void> {
  try {
    const p = payload as Record<string, unknown>;
    const shopifyOrderId = p.id as string;

    await db
      .update(orders)
      .set({
        status: 'confirmed',
        updatedAt: new Date(),
      })
      .where(eq(orders.shopifyOrderId, shopifyOrderId));

    // Log status change
    await logStatusChange(shopifyOrderId, null, 'confirmed', 'Payment received');

    console.log(`[Webhook] Order paid: ${shopifyOrderId}`);
  } catch (error) {
    console.error(`[Webhook] Failed to handle orders/paid:`, error);
  }
}

/**
 * Handle orders/updated webhook event
 */
export async function handleOrderUpdated(payload: unknown): Promise<void> {
  try {
    const p = payload as Record<string, unknown>;
    const shopifyOrderId = p.id as string;
    const financialStatus = p.financial_status as string | null;
    const fulfillmentStatus = p.fulfillment_status as string | null;
    const newStatus = mapShopifyOrderStatus(financialStatus, fulfillmentStatus);

    // Get current order to track status change
    const [existingOrder] = await db
      .select({ status: orders.status, id: orders.id })
      .from(orders)
      .where(eq(orders.shopifyOrderId, shopifyOrderId))
      .limit(1);

    if (!existingOrder) {
      // Order doesn't exist, create it (might have missed the create event)
      await handleOrderCreate(payload);
      return;
    }

    await db
      .update(orders)
      .set({
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(orders.shopifyOrderId, shopifyOrderId));

    // Log status change if different
    if (existingOrder.status !== newStatus) {
      await logStatusChange(
        shopifyOrderId,
        existingOrder.status,
        newStatus,
        'Shopify webhook update'
      );
    }

    console.log(`[Webhook] Order updated: ${shopifyOrderId} -> ${newStatus}`);
  } catch (error) {
    console.error(`[Webhook] Failed to handle orders/updated:`, error);
  }
}

/**
 * Handle inventory_levels/update webhook event
 */
export async function handleInventoryLevelUpdate(payload: unknown): Promise<void> {
  try {
    const p = payload as Record<string, unknown>;
    const variantId = (p.variant_id as string | number | undefined)?.toString();
    const available = p.available as number;

    if (!variantId) {
      console.warn('[Webhook] inventory_levels/update missing variant_id');
      return;
    }

    // Update inStock flag based on availability
    const inStock = available > 0;

    const result = await db
      .update(fabrics)
      .set({
        inStock,
        updatedAt: new Date(),
      })
      .where(eq(fabrics.shopifyVariantId, variantId));

    if (result.rowCount && result.rowCount > 0) {
      console.log(
        `[Webhook] Inventory updated for variant ${variantId}: ${inStock ? 'in stock' : 'out of stock'}`
      );
    }
  } catch (error) {
    console.error(`[Webhook] Failed to handle inventory_levels/update:`, error);
  }
}

/**
 * Log status change to order_status_history table
 */
async function logStatusChange(
  shopifyOrderId: string,
  fromStatus: string | null,
  toStatus: string,
  reason?: string
): Promise<void> {
  try {
    const [order] = await db
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.shopifyOrderId, shopifyOrderId))
      .limit(1);

    if (!order) return;

    await db.insert(orderStatusHistory).values({
      orderId: order.id,
      fromStatus,
      toStatus,
      reason: reason || null,
    });
  } catch (error) {
    console.error('[Webhook] Failed to log status change:', error);
  }
}
