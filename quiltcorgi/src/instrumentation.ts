/**
 * Next.js instrumentation hook — runs once at server startup.
 *
 * Loads secrets from AWS Secrets Manager, then validates env vars.
 * This runs before any request is handled.
 */

export async function register() {
  // Only load secrets on the server (not in edge runtime or client)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { loadSecrets } = await import('@/lib/secrets');
    await loadSecrets();

    const { validateEnv } = await import('@/lib/env-validation');
    // Don't validate during build — env vars may not be present
    if (process.env.NEXT_PHASE !== 'phase-production-build') {
      validateEnv();
    }
  }
}
