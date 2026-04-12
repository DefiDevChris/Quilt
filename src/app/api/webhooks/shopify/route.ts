import { NextRequest } from 'next/server';
import {
  verifyWebhookSignature,
  handleOrderCreate,
  handleOrderPaid,
  handleOrderUpdated,
  handleInventoryLevelUpdate,
} from '@/lib/shopify-webhooks';

/**
 * Shopify Webhook Listener
 * Receives webhook events from Shopify and processes them asynchronously
 *
 * Setup Instructions:
 * 1. Go to Shopify Admin → Settings → Notifications → Webhooks
 * 2. Create webhooks pointing to https://quiltcorgi.com/api/webhooks/shopify
 * 3. Subscribe to: orders/create, orders/updated, orders/paid, inventory_levels/update
 * 4. Copy the webhook secret into .env.local as SHOPIFY_WEBHOOK_SECRET
 *
 * Or use Shopify CLI: shopify app webhook create --topic orders/create --uri /api/webhooks/shopify
 */
export async function POST(request: NextRequest) {
  try {
    // Get webhook headers
    const topic = request.headers.get('x-shopify-topic');
    const hmacHeader = request.headers.get('x-shopify-hmac-sha256');
    const shopDomain = request.headers.get('x-shopify-shop-domain');

    if (!topic || !hmacHeader) {
      console.warn('[Webhook] Missing required headers');
      return Response.json({ error: 'Missing required headers' }, { status: 400 });
    }

    // Read raw body for signature verification
    const rawBody = await request.text();
    const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('[Webhook] SHOPIFY_WEBHOOK_SECRET not configured');
      return Response.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    // Verify signature
    const isValid = verifyWebhookSignature(rawBody, hmacHeader, webhookSecret);
    if (!isValid) {
      console.warn('[Webhook] Invalid webhook signature');
      return Response.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Parse payload
    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      console.error('[Webhook] Invalid JSON payload');
      return Response.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    console.log(`[Webhook] Received ${topic} from ${shopDomain}`);

    // Process webhook based on topic
    // We intentionally don't await these - return 200 immediately
    // Shopify will retry failed webhooks
    switch (topic) {
      case 'orders/create':
        handleOrderCreate(payload).catch((err) =>
          console.error('[Webhook] Async error in orders/create:', err)
        );
        break;

      case 'orders/paid':
        handleOrderPaid(payload).catch((err) =>
          console.error('[Webhook] Async error in orders/paid:', err)
        );
        break;

      case 'orders/updated':
        handleOrderUpdated(payload).catch((err) =>
          console.error('[Webhook] Async error in orders/updated:', err)
        );
        break;

      case 'inventory_levels/update':
        handleInventoryLevelUpdate(payload).catch((err) =>
          console.error('[Webhook] Async error in inventory_levels/update:', err)
        );
        break;

      default:
        console.log(`[Webhook] Unhandled topic: ${topic}`);
        break;
    }

    // Return 200 immediately (async processing)
    return Response.json({ success: true });
  } catch (error) {
    console.error('[Webhook] Unexpected error:', error);
    // Always return 200 to prevent Shopify retries for transient errors
    return Response.json({ success: true });
  }
}
