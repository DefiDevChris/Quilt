import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import Stripe from 'stripe';
import { Redis } from '@upstash/redis';
import { db } from '@/lib/db';
import { subscriptions, users } from '@/db/schema';
import { getStripe } from '@/lib/stripe';
import { createNotification } from '@/lib/create-notification';

export const dynamic = 'force-dynamic';

// Fire-and-forget notification wrapper - notification failures should not
// fail the webhook handler (which would cause Stripe to retry repeatedly)
async function sendSafeNotification(params: Parameters<typeof createNotification>[0]) {
  try {
    await createNotification(params);
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
}

// Redis-based deduplication for webhook event IDs using SETNX.
// Ensures each Stripe event.id is processed exactly once across all instances.
const useRedis = !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;
let redisClient: Redis | null = null;

function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return redisClient;
}

async function isDuplicate(eventId: string): Promise<boolean> {
  // Use Redis SETNX for atomic deduplication with 24-hour expiration.
  // Returns true if event was already processed, false if this is first time.
  if (useRedis) {
    const redis = getRedisClient();
    const key = `webhook:${eventId}`;
    const result = await redis.set(key, '1', { ex: 86400, nx: true });
    // SETNX returns 'OK' if key was set (first time), null if key exists (duplicate)
    return result === null;
  }

  // No Redis: pass through - DB operations are idempotent so duplicates are safe
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
  // Map stripe status to plan: active/trialing = pro, everything else = free
  const plan =
    stripeSubscription.status === 'active' || stripeSubscription.status === 'trialing'
      ? 'pro'
      : 'free';
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

  // Atomic upsert using ON CONFLICT on the unique userId constraint
  await db
    .insert(subscriptions)
    .values(values)
    .onConflictDoUpdate({
      target: subscriptions.userId,
      set: {
        stripeCustomerId: values.stripeCustomerId,
        stripeSubscriptionId: values.stripeSubscriptionId,
        stripePriceId: values.stripePriceId,
        plan: values.plan,
        status: values.status,
        currentPeriodStart: values.currentPeriodStart,
        currentPeriodEnd: values.currentPeriodEnd,
        cancelAtPeriodEnd: values.cancelAtPeriodEnd,
        updatedAt: values.updatedAt,
      },
    });

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
      return 'unpaid';
  }
}

async function syncUserRole(userId: string, role: 'free' | 'pro') {
  await db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, userId));
}

async function getUserIdFromCustomerId(customerId: string): Promise<string | null> {
  const [sub] = await db
    .select({ userId: subscriptions.userId })
    .from(subscriptions)
    .where(eq(subscriptions.stripeCustomerId, customerId))
    .limit(1);
  return sub?.userId ?? null;
}

async function handleCheckoutCompleted(checkoutSession: Stripe.Checkout.Session) {
  const userId = checkoutSession.metadata?.userId;
  const customerId = checkoutSession.customer as string;
  const subscriptionId = checkoutSession.subscription as string;

  if (!userId) {
    console.error('Checkout session missing userId metadata');
    return;
  }

  // Retrieve the full subscription
  const stripeSubscription = await getStripe().subscriptions.retrieve(subscriptionId);

  // upsertSubscription uses ON CONFLICT (idempotent), syncUserRole is a simple UPDATE
  await upsertSubscription(userId, customerId, stripeSubscription);
  await syncUserRole(userId, 'pro');

  await sendSafeNotification({
    userId,
    type: 'subscription_activated',
    title: 'Welcome to Pro!',
    message: 'Your Pro subscription is now active. You have access to all QuiltCorgi features.',
  });
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
    await sendSafeNotification({
      userId,
      type: 'subscription_canceled',
      title: 'Subscription canceling',
      message: `Your Pro subscription will end on ${new Date((sub.items.data[0]?.current_period_end ?? 0) * 1000).toLocaleDateString()}. You'll retain Pro access until then.`,
    });
  }
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  const customerId = sub.customer as string;
  const userId = await getUserIdFromCustomerId(customerId);
  if (!userId) return;

  // Atomic: cancel subscription + downgrade role in a single transaction
  await db.transaction(async (tx) => {
    await tx
      .update(subscriptions)
      .set({
        status: 'canceled',
        plan: 'free',
        cancelAtPeriodEnd: false,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.userId, userId));

    await tx.update(users).set({ role: 'free', updatedAt: new Date() }).where(eq(users.id, userId));
  });

  await sendSafeNotification({
    userId,
    type: 'subscription_canceled',
    title: 'Pro subscription ended',
    message:
      'Your Pro subscription has ended. You can upgrade again anytime from the billing page.',
  });
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const userId = await getUserIdFromCustomerId(customerId);
  if (!userId) return;

  // Re-activate subscription after successful payment (e.g. past_due recovery)
  const subscriptionId = (invoice as unknown as Record<string, unknown>).subscription as string;
  if (!subscriptionId) return;

  const stripeSubscription = await getStripe().subscriptions.retrieve(subscriptionId);
  await upsertSubscription(userId, customerId, stripeSubscription);

  if (stripeSubscription.status === 'active') {
    await syncUserRole(userId, 'pro');
  }
}

async function handleTrialWillEnd(sub: Stripe.Subscription) {
  const customerId = sub.customer as string;
  const userId = await getUserIdFromCustomerId(customerId);
  if (!userId) return;

  const trialEnd = sub.trial_end ? new Date(sub.trial_end * 1000) : null;

  await sendSafeNotification({
    userId,
    type: 'trial_ending',
    title: 'Trial ending soon',
    message: trialEnd
      ? `Your Pro trial ends on ${trialEnd.toLocaleDateString()}. Add a payment method to keep your Pro features.`
      : 'Your Pro trial is ending soon. Add a payment method to keep your Pro features.',
  });
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

  await sendSafeNotification({
    userId,
    type: 'payment_failed',
    title: 'Payment failed',
    message:
      'We were unable to process your payment. Please update your payment method within 7 days to keep your Pro access.',
    metadata: { invoiceId: invoice.id },
  });
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
    event = Stripe.webhooks.constructEvent(body, signature, getWebhookSecret());
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return Response.json({ success: false, error: 'Invalid signature' }, { status: 401 });
  }

  if (await isDuplicate(event.id)) {
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
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object as Stripe.Subscription);
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
