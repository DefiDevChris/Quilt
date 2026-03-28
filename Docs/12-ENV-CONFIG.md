# Environment & Configuration Setup
**Project:** QuiltCorgi
**Version:** 3.0
**Date:** March 27, 2026
**Purpose:** Every environment variable, API key, configuration file, and setup instruction.

---

## Secret Management Architecture

QuiltCorgi uses **AWS Secrets Manager** (encrypted with AWS KMS) as the single source of truth for all sensitive configuration in production. Secrets are loaded once at server startup via `instrumentation.ts` → `loadSecrets()` and injected into `process.env`. Existing env vars are never overwritten.

| Environment | Secret Source | How It Works |
|-------------|-------------|--------------|
| **Production** | AWS Secrets Manager (`quiltcorgi/prod`) | `loadSecrets()` fetches the secret JSON and injects key/value pairs into `process.env`. Fatal error if the fetch fails. |
| **Local Dev** | `.env.local` file | `AWS_SECRET_NAME=skip` disables Secrets Manager. All vars read from `.env.local` via Next.js built-in `.env` loading. |

**Startup sequence:** `instrumentation.ts` → `loadSecrets()` (Secrets Manager or skip) → `validateEnv()` (checks required vars are present).

### What's Stored in Secrets Manager

The `quiltcorgi/prod` secret (ARN: `arn:aws:secretsmanager:us-east-1:463564115060:secret:quiltcorgi/prod-w7LIM8`) contains:

```json
{
  "DATABASE_URL": "postgresql://...",
  "COGNITO_CLIENT_ID": "kibtuj00q55b62qcsecihcmdj",
  "COGNITO_REGION": "us-east-1",
  "COGNITO_USER_POOL_ID": "us-east-1_jdtaevYHE",
  "STRIPE_SECRET_KEY": "sk_live_...",
  "STRIPE_WEBHOOK_SECRET": "whsec_...",
  "STRIPE_PRO_PRICE_ID": "price_...",
  "AWS_ACCESS_KEY_ID": "...",
  "AWS_SECRET_ACCESS_KEY": "...",
  "AWS_S3_BUCKET": "quiltcorgi-uploads"
}
```

### What's NOT in Secrets Manager

`NEXT_PUBLIC_*` variables are required at **build time** (baked into the client bundle) and must be set as Amplify environment variables or in `.env.local`:

| Variable | Example | Why Not in Secrets Manager |
|----------|---------|---------------------------|
| `NEXT_PUBLIC_CLOUDFRONT_URL` | `https://d1234567890.cloudfront.net` | Build-time, client-visible |
| `NEXT_PUBLIC_APP_URL` | `https://quiltcorgi.com` | Build-time, client-visible |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | Build-time, client-visible |

---

## Required Accounts & Services

| Service | Purpose | Env Variable(s) |
|---------|---------|-----------------|
| PostgreSQL (local) | Local development database | `DATABASE_URL` |
| AWS (Aurora, S3, CloudFront, Amplify, Cognito, Secrets Manager, KMS) | Production database, file storage, CDN, hosting, authentication, secret management | Stored in Secrets Manager (see above) |
| Stripe | Subscription billing | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_PRICE_ID` |

---

## Environment Variables Reference

### Server-side (loaded from Secrets Manager in prod, `.env.local` in dev)

| Variable | Required | Example Value | Description |
|----------|----------|---------------|-------------|
| `DATABASE_URL` | Yes | `postgresql://user:pass@localhost:5432/quiltcorgi` | PostgreSQL connection string |
| `AWS_ACCESS_KEY_ID` | Yes | `AKIAIOSFODNN7EXAMPLE` | AWS IAM access key for S3 operations |
| `AWS_SECRET_ACCESS_KEY` | Yes | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLE` | AWS IAM secret key |
| `AWS_REGION` | Yes | `us-east-1` | AWS region for S3, Aurora, Cognito, Secrets Manager |
| `AWS_S3_BUCKET` | Yes | `quiltcorgi-uploads-dev` (dev) / `quiltcorgi-uploads` (prod) | S3 bucket name |
| `AWS_SECRET_NAME` | No | `quiltcorgi/prod` | Secrets Manager secret name. Default: `quiltcorgi/prod`. Set to `skip` for local dev. |
| `COGNITO_CLIENT_ID` | Yes | `kibtuj00q55b62qcsecihcmdj` | Cognito app client ID (no client secret — public client) |
| `COGNITO_REGION` | No | `us-east-1` | Cognito region. Falls back to `AWS_REGION`, then `us-east-1`. |
| `COGNITO_USER_POOL_ID` | Yes | `us-east-1_jdtaevYHE` | Cognito user pool ID |
| `STRIPE_SECRET_KEY` | Yes | `sk_test_...` (dev) / `sk_live_...` (prod) | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Yes | `whsec_...` | Stripe webhook signing secret |
| `STRIPE_PRO_PRICE_ID` | Yes | `price_...` | Stripe Price ID for Pro monthly subscription |

### Client-side (set as build-time env vars, NOT in Secrets Manager)

| Variable | Required | Example Value | Description |
|----------|----------|---------------|-------------|
| `NEXT_PUBLIC_CLOUDFRONT_URL` | Yes | `https://d1234567890.cloudfront.net` | CloudFront distribution URL for serving S3 assets |
| `NEXT_PUBLIC_APP_URL` | Yes | `http://localhost:3000` (dev) / `https://quiltcorgi.com` (prod) | Public-facing application URL |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes | `pk_test_...` (dev) / `pk_live_...` (prod) | Stripe publishable key (exposed to client) |

**Note:** There is no `COGNITO_CLIENT_SECRET` — the app client is configured as a public client (no secret) for the `USER_PASSWORD_AUTH` flow.

---

## Configuration Files

### `.env.local` (local development only)
```env
# Database
DATABASE_URL=postgresql://quiltcorgi:localdev@localhost:5432/quiltcorgi

# AWS — IAM credentials for S3 operations
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_S3_BUCKET=quiltcorgi-uploads-dev

# Secrets Manager — skip in local dev (use this file instead)
AWS_SECRET_NAME=skip

# Cognito — set directly for local dev (no client secret needed)
COGNITO_CLIENT_ID=
COGNITO_REGION=us-east-1
COGNITO_USER_POOL_ID=

# Stripe
STRIPE_SECRET_KEY=sk_test_
STRIPE_WEBHOOK_SECRET=whsec_
STRIPE_PRO_PRICE_ID=price_

# Public (build-time, client-visible)
NEXT_PUBLIC_CLOUDFRONT_URL=https://your-distribution.cloudfront.net
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_
```

### `drizzle.config.ts`
```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

### `tailwind.config.ts` (theme extension)
```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        corgi: {
          orange: '#D4883C',
          tan: '#C9A06E',
        },
        cream: '#F5F0E8',
        warmWhite: '#FAF8F5',
        charcoal: '#2D2D2D',
        proGold: '#B8860B',
        success: '#4CAF50',
        error: '#E53935',
        warning: '#FF9800',
        link: '#1976D2',
        stitch: '#6B6B6B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
```

### `.prettierrc`
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

### `.eslintrc.json`
```json
{
  "extends": ["next/core-web-vitals", "prettier"],
  "rules": {
    "no-unused-vars": "warn",
    "@typescript-eslint/no-unused-vars": "warn",
    "prefer-const": "error"
  }
}
```

---

## AWS Cognito Setup

### Existing Resources

| Resource | Value |
|----------|-------|
| User Pool | `us-east-1_jdtaevYHE` (region: `us-east-1`, account: `463564115060`) |
| App Client | `kibtuj00q55b62qcsecihcmdj` (no client secret — public client) |
| Auth Flows | `USER_PASSWORD_AUTH`, `REFRESH_TOKEN_AUTH` |
| Token Expiry | ID/access: 1 hour, refresh: 30 days |
| JWKS Endpoint | `https://cognito-idp.us-east-1.amazonaws.com/us-east-1_jdtaevYHE/.well-known/jwks.json` |

### User Pool Configuration
- **Username attribute:** email
- **Required attributes:** email, name
- **Email verification:** enabled (Cognito sends 6-digit codes)
- **Password policy:** uppercase + lowercase + numbers, 8 character minimum
- **No client secret** — the app client uses `USER_PASSWORD_AUTH` (server-side credential submission), not SRP

### Social Login Setup (Future)
To add Google/Apple sign-in:
1. Configure identity providers in Cognito Console → Sign-in experience → Federated identity providers
2. Set up a Cognito domain (required for OAuth redirect flow)
3. Configure App Client OAuth settings: callback URLs, scopes (`openid`, `email`, `profile`)
4. Add a `/api/auth/cognito/callback` route to exchange authorization codes for tokens
5. Add social login buttons to `AuthForm.tsx`

### Secrets Manager Setup

**Already configured:**
- Secret name: `quiltcorgi/prod`
- ARN: `arn:aws:secretsmanager:us-east-1:463564115060:secret:quiltcorgi/prod-w7LIM8`
- Encryption: AWS KMS (default Secrets Manager key)

**How secrets are loaded:**
1. `instrumentation.ts` runs at server startup (Node.js runtime only)
2. Calls `loadSecrets()` from `src/lib/secrets.ts`
3. Fetches secret JSON from Secrets Manager via `GetSecretValueCommand`
4. Injects key/value pairs into `process.env` (does not overwrite existing vars)
5. `validateEnv()` checks all required vars are present
6. Skipped entirely when `AWS_SECRET_NAME=skip` or `NODE_ENV=development`
7. Fatal error in production if fetch fails

**IAM permissions required:**
- `secretsmanager:GetSecretValue` on the secret ARN
- `kms:Decrypt` on the KMS key (if using a customer-managed key)

## Stripe Setup Instructions
1. Go to https://dashboard.stripe.com → Create account
2. Products → Create a product: "QuiltCorgi Pro" → Add a monthly price
3. Copy the Price ID to `STRIPE_PRO_PRICE_ID`
4. Developers → API Keys → Copy publishable and secret keys
5. Developers → Webhooks → Add endpoint: `https://quiltcorgi.com/api/stripe/webhook` → Subscribe to: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
6. Copy webhook signing secret
7. For local dev: install Stripe CLI (`stripe listen --forward-to localhost:3000/api/stripe/webhook`)

## AWS S3 & CloudFront Setup
1. Create an S3 bucket (e.g., `quiltcorgi-uploads-dev`)
2. Configure CORS on the bucket to allow browser uploads from your domain
3. Create a CloudFront distribution pointing to the S3 bucket
4. Create an IAM user with S3 and Secrets Manager read/write permissions, copy access key and secret
5. Create an Aurora Serverless v2 cluster (PostgreSQL 15 compatible) in the AWS RDS console
6. Connect Amplify to your Git repository for auto-deployment

---

## Local Setup Checklist

- [ ] Node.js 20.x installed (`node --version`)
- [ ] npm 10.x installed (`npm --version`)
- [ ] Git installed
- [ ] PostgreSQL 15+ running locally (Docker or native)
- [ ] Repository cloned
- [ ] `npm install` completed
- [ ] `.env.local` created from `.env.example` with all values filled (including Cognito credentials)
- [ ] AWS Cognito user pool created with app client configured
- [ ] Cognito credentials added to `.env.local` (COGNITO_CLIENT_ID, COGNITO_CLIENT_SECRET, etc.)
- [ ] `AWS_SECRET_NAME=skip` in `.env.local` (to skip Secrets Manager in local dev)
- [ ] Stripe test keys added
- [ ] AWS S3 bucket created and credentials added
- [ ] Database tables created (`npx drizzle-kit push`)
- [ ] Block library seeded (`npm run db:seed`)
- [ ] Stripe CLI listening for webhooks (`stripe listen --forward-to localhost:3000/api/stripe/webhook`)
- [ ] Dev server running (`npm run dev`)
- [ ] Can sign up, verify email, and sign in
- [ ] Can create a project
