/**
 * Runtime environment variable validation.
 *
 * Called after secrets are loaded (from Secrets Manager or .env).
 * Validates that required configuration is present before serving requests.
 */

export function validateEnv(): void {
  const errors: string[] = [];

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

  // Stripe — STRIPE_PRO_PRICE_ID is required when STRIPE_SECRET_KEY is present
  if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_PRO_PRICE_ID) {
    errors.push(
      'STRIPE_PRO_PRICE_ID must be set when STRIPE_SECRET_KEY is configured'
    );
  }

  // AWS S3 — all three vars must be set together
  const awsKeyId = process.env.AWS_ACCESS_KEY_ID;
  const awsSecret = process.env.AWS_SECRET_ACCESS_KEY;
  const awsBucket = process.env.AWS_S3_BUCKET;
  const awsVarsPresent = awsKeyId || awsSecret || awsBucket;

  if (awsVarsPresent) {
    if (!awsKeyId) errors.push('AWS_ACCESS_KEY_ID must be set when any AWS variable is configured');
    if (!awsSecret) errors.push('AWS_SECRET_ACCESS_KEY must be set when any AWS variable is configured');
    if (!awsBucket) errors.push('AWS_S3_BUCKET must be set when any AWS variable is configured');
  }

  if (errors.length > 0) {
    throw new Error(
      `Server startup failed — missing or invalid environment variables:\n  - ${errors.join('\n  - ')}`
    );
  }
}
