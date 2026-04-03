import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    _stripe = new Stripe(key, {
      apiVersion: '2026-03-25.dahlia',
      typescript: true,
    });
  }
  return _stripe;
}

export function getStripePriceId(interval: 'monthly' | 'yearly' = 'monthly'): string {
  const envKey = interval === 'yearly' ? 'STRIPE_PRO_PRICE_YEARLY' : 'STRIPE_PRO_PRICE_MONTHLY';
  const priceId = process.env[envKey];
  if (process.env.STRIPE_SECRET_KEY && !priceId) {
    throw new Error(`${envKey} must be set when STRIPE_SECRET_KEY is configured`);
  }
  if (!priceId) {
    throw new Error(`${envKey} is not configured`);
  }
  return priceId;
}

export const PAYMENT_FAILURE_GRACE_DAYS = 7;
