# Dev → Production Readiness

Everything needed to get the app fully functional in development and ready to migrate to production.

---

## How secrets work

**Local dev:** `AWS_SECRET_NAME=skip` in `.env.local` tells `secrets.ts` to skip Secrets Manager entirely. All secrets are read directly from `.env.local`. Secrets Manager is never contacted in dev.

**Production:** `AWS_SECRET_NAME` defaults to `quiltcorgi/prod`. At startup, `instrumentation.ts` calls `loadSecrets()`, which fetches the secret from AWS Secrets Manager (KMS-encrypted) and injects all values into `process.env` before any request is handled. The only vars that must exist outside Secrets Manager are the two build-time `NEXT_PUBLIC_*` vars, which must be set in the deployment environment at build time.

This means **all secrets live in one place for production** — the `quiltcorgi/prod` Secrets Manager secret. Nothing sensitive goes in environment variables on the server directly.

---

## Part 1 — Local Development (make it fully functional right now)

All of the following are set in `.env.local`. Secrets Manager is not involved in dev.

### 1.1 Cognito — Auth doesn't work without this

The `.env.local` has placeholder values (`us-east-1_XXXXXXXXX`, `your-app-client-id`). Sign in, sign up, verify email, and forgot password all call Cognito and will fail until real values are set.

**What to do:**
- Create an AWS Cognito User Pool for dev (separate from production)
- Enable `USER_PASSWORD_AUTH` flow, email verification, and set a password policy
- Set in `.env.local`:
  ```
  COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
  COGNITO_CLIENT_ID=your-app-client-id
  COGNITO_REGION=us-east-1
  ```

Without this, the entire auth system is non-functional in dev.

---

### 1.2 Database — Run migrations

The Docker container starts empty. Migrations must be applied before any API route works.

```bash
npm run db:local:up    # start the container
npm run db:migrate     # apply all 6 migrations
```

Optionally seed blog posts:
```bash
npm run db:seed:blog
```

---

### 1.3 Stripe — Billing is broken without real test keys

`.env.local` has `STRIPE_SECRET_KEY=sk_test_` (empty) and `STRIPE_WEBHOOK_SECRET=whsec_` (empty). The price IDs are real and already exist in the Stripe account (see below), but the secret key is blank so any Stripe call will throw.

**Stripe products and prices already created (live account):**

| Item | ID |
|------|----|
| Product: QuiltCorgi Pro | `prod_UExZDXTAZMZhXv` |
| Price: $8/month | `price_1TGTePIRtOHyc2V1azzQHUbq` |
| Price: $60/year | `price_1TGTeTIRtOHyc2V1KNPPoybb` |

These price IDs are already written into the `quiltcorgi/prod` Secrets Manager secret and into `.env.local`.

**What to do for local dev:**
- Add a real Stripe **test** secret key (`sk_test_...`) to `.env.local`
- Add a real test webhook secret (from Stripe CLI or dashboard)
- The price IDs in `.env.local` point to the live account — create equivalent test-mode prices if you want to test checkout locally, or use the Stripe CLI to forward events

For local webhook testing, run the Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```
This gives you a local `whsec_` to put in `.env.local`.

---

### 1.4 S3 — File uploads fail silently

`.env.local` has `AWS_ACCESS_KEY_ID=dummy_key` and `AWS_SECRET_ACCESS_KEY=dummy_secret`. The S3 client initialises without error (it only validates at call time), but any presigned URL generation will fail with an auth error.

**Options:**
- **Option A (recommended for dev):** Create a real S3 dev bucket and IAM user with `s3:PutObject` permission. Set real credentials in `.env.local`.
- **Option B:** Leave dummy values and skip testing fabric upload locally. All other features work without S3.

If using Option A, also set `NEXT_PUBLIC_CLOUDFRONT_URL` to either a real CloudFront distribution or the S3 bucket URL directly.

---

### 1.5 ~~Missing font — `material-symbols-outlined` is never loaded~~ ✅ Fixed

Three components previously used `<span className="material-symbols-outlined">` — replaced with Lucide icons (already a dependency):
- `src/app/(public)/contact/page.tsx` — `Mail`, `MessageSquare`
- `src/components/landing/CommunityPreview.tsx` — `ImageIcon`
- `src/components/patterns/PatternCard.tsx` — `Package`

---

### 1.6 Missing public assets

Two files are referenced in metadata but don't exist in `/public`:
- `/public/og-image.png` — referenced in `layout.tsx` OpenGraph. Social shares show a broken image.
- `/public/icon-192.png` — referenced in `layout.tsx` `icons.apple`. The `manifest.json` uses `logo.png` as a workaround but the `<link rel="apple-touch-icon">` tag will 404.

Create both files before testing social sharing or PWA install.

---

### 1.7 Wrong block count in SEO metadata

`src/app/layout.tsx` description says **"6,000+ block library"** — the actual library is **659+ blocks**. This is wrong in both dev and production and will mislead users who read the page source or see it in search results.

~~Fix in `src/app/layout.tsx`:~~
```ts
description: 'A modern, browser-based quilt design studio with a 659+ block library, fabric visualization, and 1:1 PDF pattern export. Free to start.',
```
✅ Done — `layout.tsx` now uses the correct 659+ block count.

---

### 1.8 Upstash Redis not in `.env.example` or env validation

Auth rate limiting silently falls back to in-memory when `UPSTASH_REDIS_REST_URL` is absent. In-memory is fine for local dev (single process), but the vars aren't documented anywhere so they're easy to forget when populating the production Secrets Manager secret.

Add to `.env.example` (optional in dev, required in production Secrets Manager):
```
# --- Rate Limiting (optional in dev, required in production) ---
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

~~Add a warning (not a hard throw) to `src/lib/env-validation.ts` when these are absent in production.~~ ✅ Done — `env-validation.ts` now emits a `console.warn` at startup when these are missing in production.

---

## Part 2 — Before deploying to production

All production secrets go into the `quiltcorgi/prod` AWS Secrets Manager secret (KMS-encrypted). The app loads them at startup via `instrumentation.ts → loadSecrets()`. Nothing sensitive is set as a plain environment variable on the server.

### 2.1 AWS infrastructure to provision

| Resource | Status | Notes |
|----------|--------|-------|
| KMS key | ✅ Done | `alias/quiltcorgi-secrets` — `arn:aws:kms:us-east-1:463564115060:key/572355ff-d314-44cd-98df-8e98d37a0456` |
| Secrets Manager secret | ✅ Partial | `quiltcorgi/prod` — KMS-encrypted. Stripe price IDs written. Remaining secrets need real values (see 2.2). |
| IAM role | ✅ Done | `quiltcorgi-app-role` — `arn:aws:iam::463564115060:role/quiltcorgi-app-role`. Trusted by `ecs-tasks.amazonaws.com` and `lambda.amazonaws.com`. |
| IAM policy | ✅ Done | `quiltcorgi-app-policy` — `arn:aws:iam::463564115060:policy/quiltcorgi-app-policy`. Least-privilege: Secrets Manager, KMS, S3, Cognito. Attached to `quiltcorgi-app-role`. |
| Cognito User Pool (prod) | ⬜ Todo | Separate from dev pool. Enable `USER_PASSWORD_AUTH`, email verification, password policy. |
| RDS PostgreSQL | ⬜ Todo | Same schema as local Docker. Enable automated backups (7-day retention). |
| S3 bucket | ⬜ Todo | `quiltcorgi-uploads-prod` — private, CORS policy allowing PUT from production domain, SSE-KMS encryption. |
| CloudFront distribution | ⬜ Todo | In front of S3. Set `NEXT_PUBLIC_CLOUDFRONT_URL`. Enable access logging. |
| Upstash Redis | ⬜ Todo | Required for distributed rate limiting across instances. |

---

### 2.2 Secrets Manager — populate `quiltcorgi/prod`

The `quiltcorgi/prod` secret already exists, is encrypted with `alias/quiltcorgi-secrets`, and has the Stripe price IDs written. The remaining keys need real production values:

```json
{
  "STRIPE_PRO_PRICE_MONTHLY": "price_1TGTePIRtOHyc2V1azzQHUbq",  ✅ done
  "STRIPE_PRO_PRICE_YEARLY": "price_1TGTeTIRtOHyc2V1KNPPoybb",   ✅ done
  "STRIPE_SECRET_KEY": "sk_live_REPLACE_ME",
  "STRIPE_WEBHOOK_SECRET": "whsec_REPLACE_ME",
  "DATABASE_URL": "postgresql://user:pass@rds-host:5432/quiltcorgi",
  "COGNITO_USER_POOL_ID": "us-east-1_...",
  "COGNITO_CLIENT_ID": "...",
  "COGNITO_REGION": "us-east-1",
  "AWS_ACCESS_KEY_ID": "...",
  "AWS_SECRET_ACCESS_KEY": "...",
  "AWS_REGION": "us-east-1",
  "AWS_S3_BUCKET": "quiltcorgi-uploads-prod",
  "UPSTASH_REDIS_REST_URL": "https://...",
  "UPSTASH_REDIS_REST_TOKEN": "..."
}
```

Update the secret via AWS Console or CLI:
```bash
aws secretsmanager put-secret-value \
  --secret-id quiltcorgi/prod \
  --secret-string '{ ... full JSON ... }' \
  --region us-east-1
```

**These two are build-time only and cannot come from Secrets Manager** — set them in the deployment environment (CI/CD pipeline, ECS task definition, or Amplify environment variables):
```
NEXT_PUBLIC_CLOUDFRONT_URL=https://your-distribution.cloudfront.net
NEXT_PUBLIC_APP_URL=https://quiltcorgi.com
```

**IAM:** The `quiltcorgi-app-role` already has the correct `secretsmanager:GetSecretValue` and `kms:Decrypt` permissions. When deploying, set the task/function execution role to `arn:aws:iam::463564115060:role/quiltcorgi-app-role`.

---

### 2.3 Stripe production setup

**Products and prices are already created in the live Stripe account:**

| Item | ID |
|------|----|
| Product: QuiltCorgi Pro | `prod_UExZDXTAZMZhXv` |
| Price: $8/month | `price_1TGTePIRtOHyc2V1azzQHUbq` |
| Price: $60/year | `price_1TGTeTIRtOHyc2V1KNPPoybb` |

Remaining steps before launch:
- Add `STRIPE_SECRET_KEY=sk_live_...` to the `quiltcorgi/prod` Secrets Manager secret.
- Register the webhook endpoint `https://quiltcorgi.com/api/stripe/webhook` in the Stripe Dashboard → Workbench → Webhooks.
- Subscribe to events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`.
- Copy the live signing secret to `STRIPE_WEBHOOK_SECRET` in the `quiltcorgi/prod` secret.
- Configure the Stripe Customer Portal (return URL: `https://quiltcorgi.com/profile/billing`, cancellation policy, billing address collection).

---

### 2.4 Run database migrations on production RDS

```bash
DATABASE_URL=postgresql://... npm run db:migrate
```

Run this before the first deploy and after any schema change.

---

### 2.5 System fabric images

`seedFabrics.ts` seeds fabrics with placeholder SVG data URIs. The seed script itself notes:
> "In production, these would point to real images on S3/CloudFront."

Upload real fabric swatch images to S3 and update the `imageUrl` / `thumbnailUrl` columns in the `fabrics` table for system fabrics (`isDefault = true`). This affects the fabric library browser for all users.

---

### 2.6 Error tracking

There is no error aggregation. All errors go to `console.error` with no alerting. Add Sentry (or equivalent) before launch:

1. Install `@sentry/nextjs`
2. Add `SENTRY_DSN` to Secrets Manager
3. Instrument `instrumentation.ts` to init Sentry
4. Replace bare `console.error` calls in API routes with structured logging

---

### 2.7 Legal pages — need real content

Both pages exist and render, but the content is minimal placeholder text:
- `/privacy` — 4 short sections, no effective date, no data retention policy, no GDPR/CCPA rights section
- `/terms` — 4 short sections, no governing law, no dispute resolution, no limitation of liability

Have these reviewed by a lawyer or use a reputable generator (Termly, Iubenda) before launch.

---

### 2.8 `about` page — thin content

`/about` is a single paragraph. Fine for launch but worth expanding before driving traffic to it.

---

## Part 3 — Nice to have before launch

- **E2E tests for auth flows** — Playwright config exists, no auth tests written. At minimum: sign up → verify email → sign in → sign out.
- **E2E tests for Stripe checkout** — test the upgrade flow end-to-end in Stripe test mode.
- **Uptime monitoring** — set up on `/` and `/api/auth/cognito/session` before launch.
- **`npm run type-check` in CI** — confirm zero TypeScript errors before every deploy.
- **Lighthouse audit** — run on landing page and dashboard, target 90+ performance.
- **OpenCV WASM lazy-load verification** — confirm the ~8MB WASM is not included in the initial bundle. Check with `npm run build` and inspect the bundle output.
