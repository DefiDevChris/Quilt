import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { subscriptions } from '@/db/schema';
import { getStripe, getStripePriceId } from '@/lib/stripe';
import {
  getRequiredSession,
  unauthorizedResponse,
  errorResponse,
  validationErrorResponse,
} from '@/lib/auth-helpers';
import { checkRateLimit, API_RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';
import { isPro, type UserRole } from '@/lib/role-utils';

export const dynamic = 'force-dynamic';

const checkoutSchema = z.object({
  interval: z.enum(['monthly', 'yearly']),
});

export async function POST(request: Request) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const rl = await checkRateLimit(`stripe:${session.user.id}`, API_RATE_LIMITS.stripe);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

  if (isPro(session.user.role as UserRole)) {
    return errorResponse('You already have a Pro subscription.', 'FORBIDDEN', 403);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    return errorResponse('Service configuration error', 'INTERNAL_ERROR', 500);
  }

  try {
    let body: { interval?: string };
    try {
      body = await request.json();
    } catch {
      return errorResponse('Invalid request body', 'VALIDATION_ERROR', 422);
    }

    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid interval');
    }
    const interval = parsed.data.interval;

    // Look up or create Stripe customer
    let stripeCustomerId: string;

    const [existing] = await db
      .select({ stripeCustomerId: subscriptions.stripeCustomerId })
      .from(subscriptions)
      .where(eq(subscriptions.userId, session.user.id))
      .limit(1);

    if (existing?.stripeCustomerId) {
      stripeCustomerId = existing.stripeCustomerId;
    } else {
      const customer = await getStripe().customers.create({
        email: session.user.email ?? undefined,
        name: session.user.name ?? undefined,
        metadata: { userId: session.user.id },
      });
      stripeCustomerId = customer.id;

      // Create subscription record with free plan
      await db.insert(subscriptions).values({
        userId: session.user.id,
        stripeCustomerId,
        plan: 'free',
        status: 'active',
      });
    }

    const checkoutSession = await getStripe().checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      line_items: [
        {
          price: getStripePriceId(interval),
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/profile?success=true`,
      cancel_url: `${appUrl}/profile?canceled=true`,
      metadata: { userId: session.user.id },
    });

    return Response.json({
      success: true,
      data: { checkoutUrl: checkoutSession.url },
    });
  } catch {
    return errorResponse('Failed to create checkout session', 'INTERNAL_ERROR', 500);
  }
}
