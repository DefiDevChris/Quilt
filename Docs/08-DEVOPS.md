# DevOps & Deployment Guide
**Project:** QuiltCorgi
**Version:** 1.0
**Date:** March 26, 2026
**Purpose:** Local development setup, deployment process, monitoring, and operational procedures.

---

## Local Development Setup

### Prerequisites
- Node.js 20.x LTS
- npm 10.x
- Git
- PostgreSQL 15+ (local instance for development) OR Docker for running PostgreSQL in a container
- AWS CLI (configured with credentials for S3 access)
- Stripe CLI (for webhook testing)

### Step-by-Step Setup

```bash
# 1. Clone the repository
git clone [repo-url] quiltcorgi
cd quiltcorgi

# 2. Install dependencies
npm install

# 3. Set up environment variables
# Create .env.local with your values (→ See 12-ENV-CONFIG.md for template and all variables)
# Set AWS_SECRET_NAME=skip to disable Secrets Manager in local dev

# 4. Start local PostgreSQL (if using Docker)
docker run --name quiltcorgi-db \
  -e POSTGRES_USER=quiltcorgi \
  -e POSTGRES_PASSWORD=localdev \
  -e POSTGRES_DB=quiltcorgi \
  -p 5432:5432 \
  -d postgres:15

# 5. Run database migrations
npx drizzle-kit push

# 6. Seed the database (system blocks and fabrics)
npm run db:seed

# 7. Start Stripe webhook listener (separate terminal)
stripe listen --forward-to localhost:3000/api/stripe/webhook

# 8. Start the development server
npm run dev
```

The app is now running at `http://localhost:3000`.

### Development Scripts
| Script | Command | Purpose |
|--------|---------|---------|
| Dev server | `npm run dev` | Start Next.js dev server with hot reload |
| Build | `npm run build` | Production build |
| Start | `npm start` | Start production server locally |
| Lint | `npm run lint` | Run ESLint |
| Format | `npm run format` | Run Prettier |
| Type check | `npm run typecheck` | Run TypeScript compiler check |
| Test (unit) | `npm run test` | Run Vitest |
| Test (e2e) | `npm run test:e2e` | Run Playwright |
| DB push | `npm run db:push` | Push schema changes to database |
| DB generate | `npm run db:generate` | Generate Drizzle migration files |
| DB seed | `npm run db:seed` | Seed system blocks and fabrics |
| DB studio | `npm run db:studio` | Open Drizzle Studio (database browser) |

---

## Environment Configuration

### Local Development
- **Secrets:** `AWS_SECRET_NAME=skip` in `.env.local` — all config read from `.env.local` file, Secrets Manager not contacted
- **Database:** Local PostgreSQL (Docker or native install)
- **S3:** Real AWS S3 bucket (dev bucket) — local file storage is not supported due to presigned URL architecture
- **Stripe:** Test mode keys + Stripe CLI for webhook forwarding
- **Auth:** AWS Cognito (same user pool as prod, or a separate dev pool). Cognito credentials set directly in `.env.local`.

### Production
- **Secrets:** AWS Secrets Manager (`quiltcorgi/prod`) loaded at startup via `instrumentation.ts` → `loadSecrets()`. KMS-encrypted. Fatal error if fetch fails.
- **Database:** AWS Aurora Serverless v2 (connection string in Secrets Manager)
- **S3:** Production S3 bucket with CloudFront distribution
- **Stripe:** Live mode keys (in Secrets Manager)
- **Auth:** AWS Cognito (`us-east-1_jdtaevYHE`). Config in Secrets Manager.
- **Hosting:** AWS Amplify with auto-deploy from main branch
- **Build-time vars:** `NEXT_PUBLIC_*` vars must be set in Amplify environment variables (not in Secrets Manager — needed at build time)

---

## Deployment Process

### AWS Amplify Deployment

1. Connect the Git repository to AWS Amplify via the Amplify Console.
2. Configure build settings:

```yaml
# amplify.yml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
```

3. Set **build-time** environment variables in Amplify Console: `NEXT_PUBLIC_CLOUDFRONT_URL`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `AWS_SECRET_NAME=quiltcorgi/prod`, `AWS_REGION=us-east-1`. Runtime secrets are loaded from Secrets Manager at startup (→ See [12-ENV-CONFIG.md]).
4. Pushes to `main` branch trigger automatic builds and deployments.
5. Amplify serves the Next.js app with server-side rendering support.

### Database Migrations in Production
1. Before deploying schema changes, run `npx drizzle-kit generate` locally to create migration files.
2. Migration files are committed to the repository.
3. After deploy, run migrations via a one-off script or Amplify post-build command:
   ```bash
   npx drizzle-kit push --config=drizzle.config.prod.ts
   ```
4. Test migrations on a staging Aurora cluster first (when staging environment is added).

### Stripe Webhook Configuration
1. In the Stripe Dashboard, add a webhook endpoint: `https://[domain]/api/stripe/webhook`
2. Subscribe to events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
3. Copy the webhook signing secret to the `STRIPE_WEBHOOK_SECRET` environment variable.

---

## Monitoring & Alerting

### Initial Setup (MVP)
- **Application errors:** Console logging via `console.error` in API route catch blocks. Errors include request context (route, method, user ID if available).
- **AWS CloudWatch:** Aurora Serverless v2 metrics (connections, ACU usage, query latency) are automatically available in CloudWatch.
- **AWS Amplify:** Build and deployment logs available in the Amplify Console.
- **Stripe Dashboard:** Payment success/failure rates, webhook delivery status.

### Future Enhancement (Post-MVP)
- Add Sentry for structured error tracking and alerting
- Add PostHog for product analytics (feature usage, funnel tracking)

---

## Rollback Procedure

1. In the AWS Amplify Console, navigate to the app's deployment history.
2. Identify the last successful deployment.
3. Click "Redeploy this version" to roll back the application code.
4. If a database migration needs to be rolled back:
   - Write a reverse migration script
   - Test on a local database first
   - Apply to production Aurora cluster
5. Verify the rollback by testing critical flows: sign in, create project, open studio, save.

---

## Backup & Recovery

### Database Backups
- **Automated:** AWS Aurora Serverless v2 provides continuous backups with point-in-time recovery (default retention: 7 days).
- **Manual snapshots:** Create a manual snapshot before any migration or major deployment via the AWS RDS Console.

### S3 Backups
- S3 objects are durable by default (99.999999999% durability).
- Enable S3 versioning on the production bucket to protect against accidental deletion.

### Recovery Procedure
1. **Database:** Use AWS RDS point-in-time recovery to restore to any second within the retention window.
2. **S3:** If versioning is enabled, restore previous versions of deleted/overwritten objects.
3. **Application:** Redeploy from any previous Git commit via Amplify.
