/**
 * Runtime environment variable validation.
 *
 * Called after secrets are loaded (from Secrets Manager or .env).
 * Validates that required configuration is present before serving requests.
 */

export function validateEnv(): void {
  const errors: string[] = [];
  const warnings: string[] = [];

  // CRITICAL: DEV_AUTH_BYPASS must never be active in production
  if (process.env.DEV_AUTH_BYPASS === 'true' && process.env.NODE_ENV === 'production') {
    errors.push(
      'DEV_AUTH_BYPASS=true is set in production. This disables ALL authentication. ' +
        'Remove DEV_AUTH_BYPASS from production environment variables immediately.'
    );
  }

  // DATABASE_URL — always required
  if (!process.env.DATABASE_URL) {
    errors.push('DATABASE_URL must be set');
  }

  // Cognito — required for auth
  if (!process.env.COGNITO_USER_POOL_ID) {
    errors.push('COGNITO_USER_POOL_ID must be set');
  }
  if (!process.env.COGNITO_CLIENT_ID) {
    errors.push('COGNITO_CLIENT_ID must be set');
  }

  // Stripe — price IDs required when STRIPE_SECRET_KEY is present
  if (process.env.STRIPE_SECRET_KEY) {
    if (!process.env.STRIPE_PRO_PRICE_MONTHLY) {
      errors.push('STRIPE_PRO_PRICE_MONTHLY must be set when STRIPE_SECRET_KEY is configured');
    }
    if (!process.env.STRIPE_PRO_PRICE_YEARLY) {
      errors.push('STRIPE_PRO_PRICE_YEARLY must be set when STRIPE_SECRET_KEY is configured');
    }
  }

  // AWS S3 — all three vars must be set together
  const awsKeyId = process.env.AWS_ACCESS_KEY_ID;
  const awsSecret = process.env.AWS_SECRET_ACCESS_KEY;
  const awsBucket = process.env.AWS_S3_BUCKET;
  const awsVarsPresent = awsKeyId || awsSecret || awsBucket;

  if (awsVarsPresent) {
    if (!awsKeyId) errors.push('AWS_ACCESS_KEY_ID must be set when any AWS variable is configured');
    if (!awsSecret)
      errors.push('AWS_SECRET_ACCESS_KEY must be set when any AWS variable is configured');
    if (!awsBucket) errors.push('AWS_S3_BUCKET must be set when any AWS variable is configured');
  }

  // Upstash Redis — required in production for distributed rate limiting and webhook dedup.
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      errors.push(
        'UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set in production. ' +
          'Without Redis, rate limiting is per-instance (ineffective in serverless) and ' +
          'webhook deduplication is disabled. Add these to the quiltcorgi/prod Secrets Manager secret.'
      );
    }
  }

  // NEXT_PUBLIC_APP_URL — required for Stripe redirect URLs
  if (!process.env.NEXT_PUBLIC_APP_URL) {
    if (process.env.NODE_ENV === 'production') {
      errors.push('NEXT_PUBLIC_APP_URL must be set in production (used for Stripe redirect URLs)');
    } else {
      warnings.push('NEXT_PUBLIC_APP_URL is not set — Stripe checkout redirects may fail');
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Server startup failed — missing or invalid environment variables:\n  - ${errors.join('\n  - ')}`
    );
  }
}
