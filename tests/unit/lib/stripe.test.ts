import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_fake_key_for_testing');
vi.stubEnv('STRIPE_PRO_PRICE_MONTHLY', 'price_test_pro_monthly');
vi.stubEnv('STRIPE_PRO_PRICE_YEARLY', 'price_test_pro_yearly');
vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'whsec_test_secret');

describe('stripe lib', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_fake_key_for_testing');
    vi.stubEnv('STRIPE_PRO_PRICE_MONTHLY', 'price_test_pro_monthly');
    vi.stubEnv('STRIPE_PRO_PRICE_YEARLY', 'price_test_pro_yearly');
  });

  it('getStripePriceId returns monthly price by default', async () => {
    const { getStripePriceId } = await import('@/lib/stripe');
    expect(getStripePriceId()).toBe('price_test_pro_monthly');
    expect(getStripePriceId('monthly')).toBe('price_test_pro_monthly');
  });

  it('getStripePriceId returns yearly price when requested', async () => {
    const { getStripePriceId } = await import('@/lib/stripe');
    expect(getStripePriceId('yearly')).toBe('price_test_pro_yearly');
  });

  it('exports PAYMENT_FAILURE_GRACE_DAYS as 7', async () => {
    const { PAYMENT_FAILURE_GRACE_DAYS } = await import('@/lib/stripe');
    expect(PAYMENT_FAILURE_GRACE_DAYS).toBe(7);
  });

  it('getStripe returns a configured Stripe client', async () => {
    const { getStripe } = await import('@/lib/stripe');
    const stripe = getStripe();
    expect(stripe).toBeDefined();
    expect(typeof stripe.checkout).toBe('object');
    expect(typeof stripe.webhooks).toBe('object');
    expect(typeof stripe.billingPortal).toBe('object');
    expect(typeof stripe.customers).toBe('object');
    expect(typeof stripe.subscriptions).toBe('object');
  });

  it('getStripePriceId throws when STRIPE_SECRET_KEY set but price ID missing', async () => {
    vi.unstubAllEnvs();
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_fake_key_for_testing');
    vi.stubEnv('STRIPE_PRO_PRICE_MONTHLY', '');
    const { getStripePriceId } = await import('@/lib/stripe');
    expect(() => getStripePriceId('monthly')).toThrow('STRIPE_PRO_PRICE_MONTHLY must be set when STRIPE_SECRET_KEY is configured');
  });

  it('getStripePriceId throws when price ID not configured', async () => {
    vi.unstubAllEnvs();
    vi.stubEnv('STRIPE_SECRET_KEY', '');
    vi.stubEnv('STRIPE_PRO_PRICE_MONTHLY', '');
    const { getStripePriceId } = await import('@/lib/stripe');
    expect(() => getStripePriceId('monthly')).toThrow('STRIPE_PRO_PRICE_MONTHLY is not configured');
  });
});
