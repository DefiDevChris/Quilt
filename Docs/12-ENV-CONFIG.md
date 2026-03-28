# Environment & Configuration Setup
**Project:** QuiltCorgi
**Version:** 2.0
**Date:** March 27, 2026
**Purpose:** Every environment variable, API key, configuration file, and setup instruction.

---

## Required Accounts & API Keys

| Service | Purpose | Signup URL | Env Variable(s) |
|---------|---------|-----------|-----------------|
| PostgreSQL (local) | Local development database | Docker or local install | `DATABASE_URL` |
| AWS (Aurora, S3, CloudFront, Amplify, Cognito, Secrets Manager) | Production database, file storage, CDN, hosting, authentication, secret management | https://aws.amazon.com | `DATABASE_URL`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET`, `NEXT_PUBLIC_CLOUDFRONT_URL`, `COGNITO_CLIENT_ID`, `COGNITO_CLIENT_SECRET`, `COGNITO_REGION`, `COGNITO_USER_POOL_ID`, `COGNITO_DOMAIN`, `AWS_SECRET_NAME` |
| Stripe | Subscription billing | https://dashboard.stripe.com | `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_PRICE_ID` |

---

## Environment Variables

| Variable | Environment | Required | Example Value | Description |
|----------|-------------|----------|---------------|-------------|
| `DATABASE_URL` | All | Yes | `postgresql://user:pass@localhost:5432/quiltcorgi` | PostgreSQL connection string |
| `AWS_ACCESS_KEY_ID` | All | Yes | `AKIAIOSFODNN7EXAMPLE` | AWS IAM access key for S3 and Secrets Manager operations |
| `AWS_SECRET_ACCESS_KEY` | All | Yes | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLE` | AWS IAM secret key |
| `AWS_REGION` | All | Yes | `us-east-1` | AWS region for S3, Aurora, Cognito, Secrets Manager |
| `AWS_S3_BUCKET` | All | Yes | `quiltcorgi-uploads-dev` (dev) / `quiltcorgi-uploads` (prod) | S3 bucket name |
| `AWS_SECRET_NAME` | Prod | Optional | `quiltcorgi/prod` | Secrets Manager secret name. Set to `skip` for local dev (no Secrets Manager lookup). |
| `COGNITO_CLIENT_ID` | All | Yes | `abc123def456ghi789jkl` | Cognito app client ID. In prod, loaded from Secrets Manager. |
| `COGNITO_CLIENT_SECRET` | All | Yes | `secret123456abcdef` | Cognito app client secret. In prod, loaded from Secrets Manager. |
| `COGNITO_REGION` | All | Yes | `us-east-1` | AWS region where Cognito user pool is hosted. In prod, loaded from Secrets Manager. |
| `COGNITO_USER_POOL_ID` | All | Yes | `us-east-1_abc123def456` | Cognito user pool ID. In prod, loaded from Secrets Manager. |
| `COGNITO_DOMAIN` | All | Yes | `quiltcorgi-auth.auth.us-east-1.amazoncognito.com` | Cognito domain for JWKS endpoint. In prod, loaded from Secrets Manager. |
| `STRIPE_SECRET_KEY` | All | Yes | `sk_test_...` (dev) / `sk_live_...` (prod) | Stripe secret key |
| `STRIPE_PUBLISHABLE_KEY` | All | Yes | `pk_test_...` (dev) / `pk_live_...` (prod) | Stripe publishable key (exposed to client) |
| `STRIPE_WEBHOOK_SECRET` | All | Yes | `whsec_...` | Stripe webhook signing secret |
| `STRIPE_PRO_PRICE_ID` | All | Yes | `price_...` | Stripe Price ID for Pro monthly subscription |
| `NEXT_PUBLIC_CLOUDFRONT_URL` | All | Yes | `https://d1234567890.cloudfront.net` | CloudFront distribution URL for serving S3 assets |
| `NEXT_PUBLIC_APP_URL` | All | Yes | `http://localhost:3000` (dev) / `https://quiltcorgi.com` (prod) | Public-facing application URL |

**Note:** Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. All others are server-only. In production, Cognito variables are loaded from Secrets Manager at startup via `instrumentation.ts`.

---

## Configuration Files

### `.env.example`
```env
# Database
DATABASE_URL=postgresql://quiltcorgi:localdev@localhost:5432/quiltcorgi

# AWS
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_S3_BUCKET=quiltcorgi-uploads-dev
AWS_SECRET_NAME=skip

# Cognito (for local dev, set these directly; for prod, loaded from Secrets Manager)
COGNITO_CLIENT_ID=
COGNITO_CLIENT_SECRET=
COGNITO_REGION=us-east-1
COGNITO_USER_POOL_ID=
COGNITO_DOMAIN=

# Stripe
STRIPE_SECRET_KEY=sk_test_
STRIPE_PUBLISHABLE_KEY=pk_test_
STRIPE_WEBHOOK_SECRET=whsec_
STRIPE_PRO_PRICE_ID=price_

# Public
NEXT_PUBLIC_CLOUDFRONT_URL=https://your-distribution.cloudfront.net
NEXT_PUBLIC_APP_URL=http://localhost:3000
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

## AWS Cognito Setup Instructions

### Create User Pool
1. Go to AWS Console → Cognito → Create user pool
2. Pool name: `quiltcorgi-users`
3. **MFA configuration:** Optional (recommended for production)
4. **User account recovery:** Enable email and SMS options
5. **Required attributes:** email, name
6. Click "Create user pool"

### Configure App Client
1. In the user pool → "App integration" → "App clients and analytics" → "Create app client"
2. App client name: `quiltcorgi-web`
3. **Authentication flows:** Enable "ADMIN_NO_SRP_AUTH" and "ALLOW_REFRESH_TOKEN_AUTH"
4. **Token expiration:** ID token 60 minutes, access token 60 minutes, refresh token 30 days
5. Generate client secret: Check "Generate client secret"
6. Save client ID and client secret to `COGNITO_CLIENT_ID` and `COGNITO_CLIENT_SECRET`

### Configure Hosted UI (Optional)
1. In user pool → "App integration" → "Domain" → Create Cognito domain
2. Domain prefix: `quiltcorgi-auth`
3. Configure sign-up and sign-in pages through the hosted UI
4. Under "App client settings":
   - Callback URL: `http://localhost:3000/auth/callback` (dev), `https://quiltcorgi.com/auth/callback` (prod)
   - Sign out URL: `http://localhost:3000/` (dev), `https://quiltcorgi.com/` (prod)

### Retrieve Configuration
1. In user pool → General settings: Copy User Pool ID to `COGNITO_USER_POOL_ID`
2. Copy region to `COGNITO_REGION`
3. In user pool → App integration → Domain: Get domain name for `COGNITO_DOMAIN` (format: `{domain}.auth.{region}.amazoncognito.com`)

### Secrets Manager Setup (Production Only)
1. AWS Console → Secrets Manager → Create secret
2. Secret name: `quiltcorgi/prod` (or value specified in `AWS_SECRET_NAME`)
3. Secret type: Other type of secret
4. Secret key/value pairs:
   ```json
   {
     "COGNITO_CLIENT_ID": "value",
     "COGNITO_CLIENT_SECRET": "value",
     "COGNITO_REGION": "us-east-1",
     "COGNITO_USER_POOL_ID": "value",
     "COGNITO_DOMAIN": "value"
   }
   ```
5. Click "Store secret"
6. Ensure IAM user has permissions: `secretsmanager:GetSecretValue` for the secret ARN

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
