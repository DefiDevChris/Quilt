# Production Readiness Checklist

Audited against the live codebase. Items are grouped by category and ordered by priority within each group.

---

## 🔴 Blockers — Must fix before launch

### Assets
- [x] Create `/public/og-image.png` (1200×630) — generated with corgi + brand colors.
- [x] Create `/public/icon-192.png` — generated from logo.png, circular crop on brand background.

### Copy / Metadata
- [x] Fix SEO description in `src/app/layout.tsx` — says "6,000+ block library" but the actual library is 659+ blocks. This is factually wrong and will mislead users.

### Infrastructure
- [ ] Provision and configure Upstash Redis (`UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`) — auth rate limiting silently falls back to in-memory when Redis is absent. In-memory rate limits do not survive process restarts and do not work across multiple instances. Add these to the `quiltcorgi/prod` Secrets Manager secret. (`env-validation.ts` already emits a startup warning when they are missing in production.)
- [x] Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to `.env.example` — they are used in `rate-limit.ts` but not documented anywhere.
- [ ] Run `npm run db:migrate` against the production RDS instance before first deploy.

### Stripe
- [x] Price IDs stored in `quiltcorgi/prod` Secrets Manager secret (KMS-encrypted via `alias/quiltcorgi-secrets`): `STRIPE_PRO_PRICE_MONTHLY=price_1TGTePIRtOHyc2V1azzQHUbq`, `STRIPE_PRO_PRICE_YEARLY=price_1TGTeTIRtOHyc2V1KNPPoybb`.
- [ ] Replace `STRIPE_SECRET_KEY` placeholder in `quiltcorgi/prod` secret with live key (`sk_live_*`) before launch.
- [ ] Register the Stripe webhook endpoint (`/api/stripe/webhook`) in the Stripe Dashboard → Workbench → Webhooks for the production domain. Subscribe to: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`. Then update `STRIPE_WEBHOOK_SECRET` in `quiltcorgi/prod` with the live signing secret.
- [ ] Verify the Stripe Customer Portal is configured in the Stripe dashboard (return URL, cancellation policy, billing address collection).

### AWS
- [x] KMS customer-managed key created: `alias/quiltcorgi-secrets` (`arn:aws:kms:us-east-1:463564115060:key/572355ff-d314-44cd-98df-8e98d37a0456`).
- [x] `quiltcorgi/prod` Secrets Manager secret updated to use `alias/quiltcorgi-secrets` KMS key. Stripe price IDs written.
- [x] IAM role `quiltcorgi-app-role` (`arn:aws:iam::463564115060:role/quiltcorgi-app-role`) created with trust for `ecs-tasks.amazonaws.com` and `lambda.amazonaws.com`.
- [x] IAM policy `quiltcorgi-app-policy` (`arn:aws:iam::463564115060:policy/quiltcorgi-app-policy`) created and attached — grants least-privilege access to Secrets Manager, KMS, S3, and Cognito.
- [ ] When deploying (ECS task definition or Lambda), set the execution role to `arn:aws:iam::463564115060:role/quiltcorgi-app-role`.
- [ ] Create the production S3 bucket (`quiltcorgi-uploads-prod`) — private, SSE-KMS encryption, CORS policy allowing PUT from the production domain.
- [ ] Set up CloudFront distribution in front of S3. Set `NEXT_PUBLIC_CLOUDFRONT_URL` as a build-time env var in the deployment pipeline.
- [ ] Configure Cognito User Pool for production (separate from dev pool) — `COGNITO_USER_POOL_ID` and `COGNITO_CLIENT_ID` go into Secrets Manager.
- [ ] Set `NEXT_PUBLIC_APP_URL=https://quiltcorgi.com` as a build-time env var in the deployment pipeline (not in Secrets Manager — it's needed at build time).

---

## 🟡 Important — Fix before or shortly after launch

### Observability
- [ ] Add structured error logging / error tracking (e.g. Sentry) — currently all errors go to `console.error` with no aggregation, alerting, or stack trace capture in production.
- [ ] Add `SENTRY_DSN` (or equivalent) to env vars and instrument `instrumentation.ts`.
- [ ] Replace bare `console.error` calls in API routes with a structured logger that includes request ID, route, and user ID (where safe). Affected files: `src/app/api/community/route.ts`, `src/app/api/stripe/webhook/route.ts`, `src/app/api/stripe/checkout/route.ts`, `src/app/api/stripe/portal/route.ts`.

### System fabrics
- [ ] Upload real fabric images to S3/CloudFront and update `imageUrl` / `thumbnailUrl` in the `fabrics` table — `seedFabrics.ts` explicitly notes that production fabrics should point to real S3 images, not the placeholder SVG data URIs currently seeded.

### Database
- [ ] Enable automated RDS backups with a retention period (recommended: 7 days minimum).
- [ ] Set up RDS point-in-time recovery.
- [ ] Review DB connection pool size (`max: 5` in `db.ts`) against expected concurrent load and adjust if needed.

### Security
- [ ] Audit S3 bucket policy — ensure the bucket is not publicly readable; all access should go through CloudFront with signed URLs or presigned upload URLs only.
- [ ] Enable S3 server-side encryption (SSE-S3 or SSE-KMS).
- [ ] Enable CloudFront access logging.
- [ ] Review Cognito password policy (minimum length, complexity) in the User Pool settings.
- [ ] Set `sameSite: 'strict'` on auth cookies if the app will never be embedded in a third-party context (currently `'lax'`).

### PWA / Manifest
- [ ] Update `manifest.json` — currently uses `logo.png` for both 192×192 and 512×512 icons. Create properly sized PWA icons and reference them correctly.

---

## 🟢 Pre-launch polish

### Copy
- [ ] Review all landing page copy against the brand voice guidelines in `README.md` — confirm no SaaS jargon slipped in.
- [ ] Confirm `SUPPORT_EMAIL` (`support@quiltcorgi.com`) is a monitored inbox before launch.
- [ ] Confirm `team@quiltcorgi.com` (used in `seed-blog.ts` as the system blog author) is a real address or update to `SUPPORT_EMAIL`.

### Legal / Compliance
- [ ] Verify the Privacy Policy page (`/privacy`) and Terms of Service page (`/terms`) are complete and reviewed.
- [ ] Add a cookie consent banner if required for your target markets (EU/UK GDPR, CCPA).
- [ ] Confirm data retention policy — how long are user projects, community posts, and notifications kept after account deletion?
- [ ] Implement a GDPR data export / account deletion endpoint if targeting EU users.

### SEO
- [ ] Confirm `NEXT_PUBLIC_APP_URL` is set to `https://quiltcorgi.com` at build time so the sitemap generates correct URLs.
- [ ] Verify `robots.txt` Sitemap URL (`https://quiltcorgi.com/sitemap.xml`) matches the production domain.
- [ ] Submit sitemap to Google Search Console after launch.

### Testing
- [ ] Write and run E2E tests for the critical auth flows (sign up → verify email → sign in → sign out) before launch. The Playwright config exists but no auth E2E tests were found.
- [ ] Write E2E tests for the Stripe checkout and subscription cancellation flows.
- [ ] Run `npm run type-check` and `npm run lint` in CI and confirm zero errors.

### Performance
- [ ] Verify the OpenCV.js WASM (~8MB) is not loaded on initial page load — confirm lazy loading only triggers when the Photo to Pattern modal opens.
- [ ] Set appropriate `Cache-Control` headers on CloudFront for static assets.
- [ ] Run Lighthouse on the landing page and dashboard; target 90+ performance score.

---

## 🔵 Post-launch / Ongoing

- [ ] Set up uptime monitoring (e.g. Better Uptime, Pingdom) on `/` and `/api/auth/cognito/session`.
- [ ] Configure CloudWatch alarms on RDS CPU, connections, and free storage.
- [ ] Set up Stripe payment failure alerting — the webhook handles `invoice.payment_failed` and sends an in-app notification, but no ops alert exists.
- [ ] Implement Stripe webhook dedup in Redis (currently in-memory only — does not survive restarts or span instances). Low risk because DB upserts are idempotent, but worth hardening.
- [ ] Review and tune trust engine thresholds (`TRUST_ACCOUNT_AGE_HOURS`, `TRUST_COMMENTER_APPROVED_COMMENTS`, `TRUST_POSTER_APPROVED_POSTS`) after observing real user behaviour.
- [ ] Set up a moderation workflow / admin notification for the pending post/comment queue.
- [ ] Add virus/malware scanning on S3 uploads (e.g. ClamAV via Lambda trigger or a third-party service).
- [ ] Document the deployment runbook (how to deploy, roll back, run migrations, rotate secrets).
