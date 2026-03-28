import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import Stripe from 'stripe';
import { db } from '@/lib/db';
import { subscriptions, users, notifications } from '@/db/schema';
import { stripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

// In-memory dedup guard for webhook event IDs (handles immediate retries).
// NOTE: Stripe webhooks are idempotent by design — each event has a unique ID
// and Stripe recommends making handlers idempotent. This in-memory dedup is
// defense-in-depth for immediate retries within the same process. It does NOT
// survive process restarts or span multiple instances, which is acceptable
// because our DB upserts (upsertSubscription, syncUserRole) are themselves
// idempotent. A duplicate webhook will simply re-write the same data.
const processedEvents = new Map<string, number>();
const DEDUP_TTL_MS = 5 * 60 * 1000; // 5 minutes

function isDuplicate(eventId: string): boolean {
  const now = Date.now();
  // Prune stale entries
  for (const [id, ts] of processedEvents) {
    if (now - ts > DEDUP_TTL_MS) processedEvents.delete(id);
  }
  if (processedEvents.has(eventId)) return true;
  processedEvents.set(eventId, now);
  return false;
}

function getWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('STRIPE_WEBHOOK_SECRET environment variable is required');
  }
  return secret;
}

async function upsertSubscription(
  userId: string,
  stripeCustomerId: string,
  stripeSubscription: Stripe.Subscription
) {
  const plan = stripeSubscription.status === 'active' ? 'pro' : 'free';
  const firstItem = stripeSubscription.items.data[0];
  const values = {
    userId,
    stripeCustomerId,
    stripeSubscriptionId: stripeSubscription.id,
    stripePriceId: stripeSubscription.items.data[0]?.price.id ?? null,
    plan: plan as 'free' | 'pro',
    status: mapStripeStatus(stripeSubscription.status),
    currentPeriodStart: new Date(firstItem.current_period_start * 1000),
    currentPeriodEnd: new Date(firstItem.current_period_end * 1000),
    cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
    updatedAt: new Date(),
  };

  const [existing] = await db
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  if (existing) {
    await db.update(subscriptions).set(values).where(eq(subscriptions.userId, userId));
  } else {
    await db.insert(subscriptions).values(values);
  }

  return values;
}

function mapStripeStatus(
  status: Stripe.Subscription.Status
): 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing' {
  switch (status) {
    case 'active':
      return 'active';
    case 'canceled':
      return 'canceled';
    case 'past_due':
      return 'past_due';
    case 'unpaid':
      return 'unpaid';
    case 'trialing':
      return 'trialing';
    default:
      return 'active';
  }
}

async function syncUserRole(userId: string, role: 'free' | 'pro') {
  await db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, userId));
}

async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  metadata?: Record<string, unknown>
) {
  await db.insert(notifications).values({
    userId,
    type,
    title,
    message,
    metadata: metadata ?? null,
  });
}

async function getUserIdFromCustomerId(customerId: string): Promise<string | null> {
  const [sub] = await db
    .select({ userId: subscriptions.userId })
    .from(subscriptions)
    .where(eq(subscriptions.stripeCustomerId, customerId))
    .limit(1);
  return sub?.userId ?? null;
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (!userId) {
    console.error('Checkout session missing userId metadata');
    return;
  }

  // Retrieve the full subscription
  const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);

  await upsertSubscription(userId, customerId, stripeSubscription);
  await syncUserRole(userId, 'pro');
  await createNotification(
    userId,
    'subscription_activated',
    'Welcome to Pro!',
    'Your Pro subscription is now active. You have access to all QuiltCorgi features.'
  );
}

async function handleSubscriptionUpdated(sub: Stripe.Subscription) {
  const customerId = sub.customer as string;
  const userId = await getUserIdFromCustomerId(customerId);
  if (!userId) return;

  const updated = await upsertSubscription(userId, customerId, sub);

  if (sub.status === 'active' && !sub.cancel_at_period_end) {
    await syncUserRole(userId, 'pro');
  } else if (sub.cancel_at_period_end) {
    // User canceled but still has access until period end — keep Pro
    await syncUserRole(userId, 'pro');
  }

  if (sub.cancel_at_period_end && updated.status === 'active') {
    await createNotification(
      userId,
      'subscription_canceled',
      'Subscription canceling',
      `Your Pro subscription will end on ${new Date((sub.items.data[0]?.current_period_end ?? 0) * 1000).toLocaleDateString()}. You'll retain Pro access until then.`
    );
  }
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  const customerId = sub.customer as string;
  const userId = await getUserIdFromCustomerId(customerId);
  if (!userId) return;

  await db
    .update(subscriptions)
    .set({
      status: 'canceled',
      plan: 'free',
      cancelAtPeriodEnd: false,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.userId, userId));

  await syncUserRole(userId, 'free');
  await createNotification(
    userId,
    'subscription_canceled',
    'Pro subscription ended',
    'Your Pro subscription has ended. You can upgrade again anytime from the billing page.'
  );
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const userId = await getUserIdFromCustomerId(customerId);
  if (!userId) return;

  await db
    .update(subscriptions)
    .set({
      status: 'past_due',
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.userId, userId));

  await createNotification(
    userId,
    'payment_failed',
    'Payment failed',
    'We were unable to process your payment. Please update your payment method within 7 days to keep your Pro access.',
    { invoiceId: invoice.id }
  );
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return Response.json(
      { success: false, error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, getWebhookSecret());
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return Response.json({ success: false, error: 'Invalid signature' }, { status: 401 });
  }

  if (isDuplicate(event.id)) {
    return Response.json({ success: true, data: { received: true, deduplicated: true } });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        // Unhandled event type — acknowledge receipt
        break;
    }
  } catch (error) {
    console.error(`Webhook handler error for ${event.type}:`, error);
    return Response.json({ success: false, error: 'Webhook handler failed' }, { status: 500 });
  }

  return Response.json({ success: true });
}
