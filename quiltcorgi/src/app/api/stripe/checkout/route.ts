import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { subscriptions } from '@/db/schema';
import { stripe, getStripePriceId } from '@/lib/stripe';
import { getRequiredSession, unauthorizedResponse, errorResponse } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  if (session.user.role === 'pro' || session.user.role === 'admin') {
    return errorResponse('You already have a Pro subscription.', 'FORBIDDEN', 403);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    return errorResponse('Service configuration error', 'INTERNAL_ERROR', 500);
  }

  try {
    const body = await request.json().catch(() => ({}));
    const interval: 'monthly' | 'yearly' =
      body.interval === 'yearly' ? 'yearly' : 'monthly';

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
      const customer = await stripe.customers.create({
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

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      line_items: [
        {
          price: getStripePriceId(interval),
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/profile/billing?success=true`,
      cancel_url: `${appUrl}/profile/billing?canceled=true`,
      metadata: { userId: session.user.id },
    });

    return Response.json({
      success: true,
      data: { checkoutUrl: checkoutSession.url },
    });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return errorResponse('Failed to create checkout session', 'INTERNAL_ERROR', 500);
  }
}
