/**
 * Runtime environment variable validation.
 *
 * Called after secrets are loaded (from Secrets Manager or .env).
 * Validates that required configuration is present before serving requests.
 */

export function validateEnv(): void {
  const errors: string[] = [];
  const warnings: string[] = [];

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

  // Upstash Redis — required in production for distributed rate limiting.
  // Falls back to in-memory in dev (single process), but in production this
  // means rate limits don't survive restarts or span multiple instances.
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      warnings.push(
        'UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are not set. ' +
          'Auth rate limiting will fall back to in-memory (does not survive restarts or span instances). ' +
          'Add these to the quiltcorgi/prod Secrets Manager secret.'
      );
    }
  }

  if (warnings.length > 0) {
    for (const warning of warnings) {
      console.warn(`[env] WARNING: ${warning}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Server startup failed — missing or invalid environment variables:\n  - ${errors.join('\n  - ')}`
    );
  }
}
