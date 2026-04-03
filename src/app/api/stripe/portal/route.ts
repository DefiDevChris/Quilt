import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { subscriptions } from '@/db/schema';
import { getStripe } from '@/lib/stripe';
import { getRequiredSession, unauthorizedResponse, errorResponse } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

export async function POST() {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  try {
    const [sub] = await db
      .select({ stripeCustomerId: subscriptions.stripeCustomerId })
      .from(subscriptions)
      .where(eq(subscriptions.userId, session.user.id))
      .limit(1);

    if (!sub?.stripeCustomerId) {
      return errorResponse('No subscription found.', 'NOT_FOUND', 404);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      return errorResponse('Service configuration error', 'INTERNAL_ERROR', 500);
    }

    const portalSession = await getStripe().billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: `${appUrl}/profile`,
    });

    return Response.json({
      success: true,
      data: { portalUrl: portalSession.url },
    });
  } catch (error) {
    console.error('Stripe portal error:', error);
    return errorResponse('Failed to create portal session', 'INTERNAL_ERROR', 500);
  }
}
