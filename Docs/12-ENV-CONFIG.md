# Environment & Configuration Setup
**Project:** QuiltCorgi
**Version:** 1.0
**Date:** March 26, 2026
**Purpose:** Every environment variable, API key, configuration file, and setup instruction.

---

## Required Accounts & API Keys

| Service | Purpose | Signup URL | Env Variable(s) |
|---------|---------|-----------|-----------------|
| PostgreSQL (local) | Local development database | Docker or local install | `DATABASE_URL` |
| AWS (Aurora, S3, CloudFront, Amplify) | Production database, file storage, CDN, hosting | https://aws.amazon.com | `DATABASE_URL`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET`, `NEXT_PUBLIC_CLOUDFRONT_URL` |
| Google Cloud Console | Google OAuth provider | https://console.cloud.google.com | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| Meta for Developers | Facebook OAuth provider | https://developers.facebook.com | `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET` |
| Apple Developer | Apple OAuth provider | https://developer.apple.com | `APPLE_CLIENT_ID`, `APPLE_CLIENT_SECRET` |
| X Developer Portal | X (Twitter) OAuth provider | https://developer.twitter.com | `TWITTER_CLIENT_ID`, `TWITTER_CLIENT_SECRET` |
| Stripe | Subscription billing | https://dashboard.stripe.com | `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_PRICE_ID` |

---

## Environment Variables

| Variable | Environment | Required | Example Value | Description |
|----------|-------------|----------|---------------|-------------|
| `DATABASE_URL` | All | Yes | `postgresql://user:pass@localhost:5432/quiltcorgi` | PostgreSQL connection string |
| `NEXTAUTH_URL` | All | Yes | `http://localhost:3000` | Base URL of the application (used by NextAuth.js) |
| `NEXTAUTH_SECRET` | All | Yes | `a-random-32-char-string-here123` | Secret for JWT signing (min 32 chars, randomly generated) |
| `GOOGLE_CLIENT_ID` | All | Yes | `123456789.apps.googleusercontent.com` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | All | Yes | `GOCSPX-xxxxxxxxxxxx` | Google OAuth client secret |
| `FACEBOOK_CLIENT_ID` | All | Yes | `1234567890123456` | Facebook OAuth app ID |
| `FACEBOOK_CLIENT_SECRET` | All | Yes | `abcdef1234567890abcdef` | Facebook OAuth app secret |
| `APPLE_CLIENT_ID` | All | Yes | `com.quiltcorgi.auth` | Apple Services ID |
| `APPLE_CLIENT_SECRET` | All | Yes | `eyJhbGciOiJFUzI1NiI...` | Apple client secret (JWT, 6-month expiry) |
| `TWITTER_CLIENT_ID` | All | Yes | `abc123def456` | X (Twitter) OAuth 2.0 client ID |
| `TWITTER_CLIENT_SECRET` | All | Yes | `secret123456` | X (Twitter) OAuth 2.0 client secret |
| `STRIPE_SECRET_KEY` | All | Yes | `sk_test_...` (dev) / `sk_live_...` (prod) | Stripe secret key |
| `STRIPE_PUBLISHABLE_KEY` | All | Yes | `pk_test_...` (dev) / `pk_live_...` (prod) | Stripe publishable key (exposed to client) |
| `STRIPE_WEBHOOK_SECRET` | All | Yes | `whsec_...` | Stripe webhook signing secret |
| `STRIPE_PRO_PRICE_ID` | All | Yes | `price_...` | Stripe Price ID for Pro monthly subscription |
| `AWS_ACCESS_KEY_ID` | All | Yes | `AKIAIOSFODNN7EXAMPLE` | AWS IAM access key for S3 operations |
| `AWS_SECRET_ACCESS_KEY` | All | Yes | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLE` | AWS IAM secret key |
| `AWS_REGION` | All | Yes | `us-east-1` | AWS region for S3 and Aurora |
| `AWS_S3_BUCKET` | All | Yes | `quiltcorgi-uploads-dev` (dev) / `quiltcorgi-uploads` (prod) | S3 bucket name |
| `NEXT_PUBLIC_CLOUDFRONT_URL` | All | Yes | `https://d1234567890.cloudfront.net` | CloudFront distribution URL for serving S3 assets |
| `NEXT_PUBLIC_APP_URL` | All | Yes | `http://localhost:3000` (dev) / `https://quiltcorgi.com` (prod) | Public-facing application URL |

**Note:** Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. All others are server-only.

---

## Configuration Files

### `.env.example`
```env
# Database
DATABASE_URL=postgresql://quiltcorgi:localdev@localhost:5432/quiltcorgi

# NextAuth.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-a-random-32-char-secret-here

# OAuth Providers
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=
APPLE_CLIENT_ID=
APPLE_CLIENT_SECRET=
TWITTER_CLIENT_ID=
TWITTER_CLIENT_SECRET=

# Stripe
STRIPE_SECRET_KEY=sk_test_
STRIPE_PUBLISHABLE_KEY=pk_test_
STRIPE_WEBHOOK_SECRET=whsec_
STRIPE_PRO_PRICE_ID=price_

# AWS
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_S3_BUCKET=quiltcorgi-uploads-dev

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

## OAuth Provider Setup Instructions

### Google
1. Go to https://console.cloud.google.com → Create a new project
2. APIs & Services → Credentials → Create OAuth Client ID
3. Application type: Web application
4. Authorized redirect URI: `http://localhost:3000/api/auth/callback/google` (dev), `https://quiltcorgi.com/api/auth/callback/google` (prod)
5. Copy Client ID and Client Secret to env variables

### Facebook
1. Go to https://developers.facebook.com → Create App → Consumer type
2. Add Facebook Login product
3. Settings → Basic → copy App ID and App Secret
4. Facebook Login → Settings → Valid OAuth Redirect URIs: `http://localhost:3000/api/auth/callback/facebook`

### Apple
1. Go to https://developer.apple.com → Certificates, Identifiers & Profiles
2. Register a new Services ID (this is the Client ID)
3. Enable "Sign In with Apple" and configure the return URL: `https://quiltcorgi.com/api/auth/callback/apple`
4. Create a private key for Sign In with Apple
5. Generate the client secret JWT using the private key (expires every 6 months — set a reminder)

### X (Twitter)
1. Go to https://developer.twitter.com → Developer Portal → Create a project and app
2. Set up OAuth 2.0 authentication
3. Callback URL: `http://localhost:3000/api/auth/callback/twitter`
4. Copy Client ID and Client Secret

### Stripe
1. Go to https://dashboard.stripe.com → Create account
2. Products → Create a product: "QuiltCorgi Pro" → Add a monthly price
3. Copy the Price ID to `STRIPE_PRO_PRICE_ID`
4. Developers → API Keys → Copy publishable and secret keys
5. Developers → Webhooks → Add endpoint: `https://quiltcorgi.com/api/stripe/webhook` → Subscribe to: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
6. Copy webhook signing secret
7. For local dev: install Stripe CLI (`stripe listen --forward-to localhost:3000/api/stripe/webhook`)

### AWS
1. Create an S3 bucket (e.g., `quiltcorgi-uploads-dev`)
2. Configure CORS on the bucket to allow browser uploads from your domain
3. Create a CloudFront distribution pointing to the S3 bucket
4. Create an IAM user with S3 read/write permissions, copy access key and secret
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
- [ ] `.env.local` created from `.env.example` with all values filled
- [ ] At least one OAuth provider configured (Google recommended for initial setup)
- [ ] Stripe test keys added
- [ ] AWS S3 bucket created and credentials added
- [ ] Database tables created (`npx drizzle-kit push`)
- [ ] Block library seeded (`npm run db:seed`)
- [ ] Stripe CLI listening for webhooks (`stripe listen --forward-to localhost:3000/api/stripe/webhook`)
- [ ] Dev server running (`npm run dev`)
- [ ] Can sign in and create a project
