/**
 * AWS Secrets Manager loader.
 *
 * Fetches secrets from Secrets Manager and injects them into process.env.
 * Falls back to existing env vars (e.g., from .env.local in development).
 *
 * Usage: Call `loadSecrets()` once at server startup (from instrumentation.ts).
 *
 * Secret name is controlled by `AWS_SECRET_NAME` env var (default: "quiltcorgi/prod").
 * Set `AWS_SECRET_NAME=skip` to disable Secrets Manager and rely on .env files.
 */

import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const SECRET_NAME = process.env.AWS_SECRET_NAME ?? 'quiltcorgi/prod';
const REGION = process.env.AWS_REGION ?? 'us-east-1';

const _global = globalThis as typeof globalThis & { __secretsLoaded?: boolean };

export async function loadSecrets(): Promise<void> {
  if (_global.__secretsLoaded) return;
  _global.__secretsLoaded = true;

  // Skip Secrets Manager in development or when explicitly disabled
  if (SECRET_NAME === 'skip' || process.env.NODE_ENV === 'development') {
    return;
  }

  try {
    const client = new SecretsManagerClient({ region: REGION });
    const command = new GetSecretValueCommand({ SecretId: SECRET_NAME });
    const response = await client.send(command);

    if (!response.SecretString) {
      console.error(`[secrets] Secret "${SECRET_NAME}" has no string value`);
      return;
    }

    const secrets: Record<string, string> = JSON.parse(response.SecretString);

    // Inject into process.env (don't overwrite existing env vars)
    for (const [key, value] of Object.entries(secrets)) {
      if (value && !process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch (err) {
    // In production, failing to load secrets is fatal
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        `Failed to load secrets from "${SECRET_NAME}": ${err instanceof Error ? err.message : String(err)}`
      );
    }
    // In other environments, warn but continue (secrets may come from .env)
    console.error(
      `[secrets] Failed to load from Secrets Manager (non-fatal): ${err instanceof Error ? err.message : String(err)}`
    );
  }
}
