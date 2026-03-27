import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock environment variables before importing
vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_fake_key_for_testing');
vi.stubEnv('STRIPE_PRO_PRICE_ID', 'price_test_pro_monthly');
vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'whsec_test_secret');

describe('stripe lib', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_fake_key_for_testing');
    vi.stubEnv('STRIPE_PRO_PRICE_ID', 'price_test_pro_monthly');
  });

  it('exports STRIPE_PRO_PRICE_ID from env', async () => {
    const { STRIPE_PRO_PRICE_ID } = await import('@/lib/stripe');
    expect(STRIPE_PRO_PRICE_ID).toBe('price_test_pro_monthly');
  });

  it('exports PAYMENT_FAILURE_GRACE_DAYS as 7', async () => {
    const { PAYMENT_FAILURE_GRACE_DAYS } = await import('@/lib/stripe');
    expect(PAYMENT_FAILURE_GRACE_DAYS).toBe(7);
  });

  it('exports stripe client instance', async () => {
    const { stripe } = await import('@/lib/stripe');
    expect(stripe).toBeDefined();
    expect(typeof stripe.checkout).toBe('object');
    expect(typeof stripe.webhooks).toBe('object');
    expect(typeof stripe.billingPortal).toBe('object');
    expect(typeof stripe.customers).toBe('object');
    expect(typeof stripe.subscriptions).toBe('object');
  });
});
