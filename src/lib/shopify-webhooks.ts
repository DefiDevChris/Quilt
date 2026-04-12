/**
 * Shopify Webhook Handler Logic
 * Processes incoming webhook events from Shopify
 */

import { createHmac, timingSafeEqual } from 'crypto';
import { db } from '@/lib/db';
import { orders, orderStatusHistory, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { fabrics } from '@/db/schema/fabrics';
import { mapShopifyOrderStatus, type OrderLineItem, type OrderShippingAddress } from '@/lib/order-utils';

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
export async function handleOrderCreate(payload: any): Promise<void> {
  try {
    const shopifyOrderId = payload.id as string;
    const financialStatus = payload.financial_status as string | null;
    const fulfillmentStatus = payload.fulfillment_status as string | null;
    const status = mapShopifyOrderStatus(financialStatus, fulfillmentStatus);

    // Calculate totals from line items
    const lineItems: OrderLineItem[] = (payload.line_items || []).map((item: any) => ({
      fabricId: item.variant_id?.toString() || '',
      fabricName: item.title || 'Unknown Fabric',
      quantityInYards: item.quantity || 0,
      pricePerYard: Math.round((parseFloat(item.price) || 0) * 100),
      imageUrl: item.image_url || null,
      shopifyVariantId: item.variant_id?.toString(),
    }));

    const totalCents = lineItems.reduce(
      (sum, item) => sum + item.quantityInYards * item.pricePerYard,
      0
    );

    const shippingAddress: OrderShippingAddress | null = payload.shipping_address
      ? {
          name: payload.shipping_address.name || null,
          address1: payload.shipping_address.address1 || null,
          address2: payload.shipping_address.address2 || null,
          city: payload.shipping_address.city || null,
          province: payload.shipping_address.province || null,
          country: payload.shipping_address.country || null,
          zip: payload.shipping_address.zip || null,
          phone: payload.shipping_address.phone || null,
        }
      : null;

    // Try to find user by customer email
    let userId: string | null = null;
    if (payload.customer?.email) {
      const [user] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, payload.customer.email))
        .limit(1);
      userId = user?.id || null;
    }

    // Insert order
    await db.insert(orders).values({
      userId,
      shopifyOrderId,
      status,
      totalCents,
      currency: payload.currency || 'usd',
      subtotalCents: Math.round((parseFloat(payload.subtotal_price) || 0) * 100),
      taxCents: Math.round((parseFloat(payload.total_tax) || 0) * 100),
      shippingCents: Math.round((parseFloat(payload.total_shipping) || 0) * 100),
      lineItems: lineItems as any,
      shippingAddress: shippingAddress as any,
      checkoutUrl: payload.checkout_url || null,
      processedAt: payload.processed_at ? new Date(payload.processed_at) : null,
    });

    console.log(`[Webhook] Order created: ${shopifyOrderId}`);
  } catch (error) {
    console.error(`[Webhook] Failed to handle orders/create:`, error);
  }
}

/**
 * Handle orders/paid webhook event
 */
export async function handleOrderPaid(payload: any): Promise<void> {
  try {
    const shopifyOrderId = payload.id as string;

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
export async function handleOrderUpdated(payload: any): Promise<void> {
  try {
    const shopifyOrderId = payload.id as string;
    const financialStatus = payload.financial_status as string | null;
    const fulfillmentStatus = payload.fulfillment_status as string | null;
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
export async function handleInventoryLevelUpdate(payload: any): Promise<void> {
  try {
    const variantId = payload.variant_id?.toString();
    const available = payload.available as number;

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
      console.log(`[Webhook] Inventory updated for variant ${variantId}: ${inStock ? 'in stock' : 'out of stock'}`);
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
