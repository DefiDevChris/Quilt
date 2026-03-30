# Tech Stack

## Core

- **Next.js 16.2.1** — App Router, TypeScript. Use `await params` in route handlers. Routing via `proxy.ts` (not `middleware.ts`).
- **React 19** — Server Components by default. Add `"use client"` only when using browser APIs or hooks.
- **TypeScript ~5** — strict mode. Run `npm run type-check` to validate.
- **Tailwind CSS v4** — CSS-based config via `@theme` in `globals.css`. No `tailwind.config.ts`.

## Data & Auth

- **Drizzle ORM 0.45** — `pgTable` 3rd arg returns array. Uses `pgEnum`. Migrations in `src/db/migrations/`.
- **PostgreSQL** — local via Docker, production via AWS RDS.
- **AWS Cognito** — email/password auth. Sessions in HTTP-only cookies (`qc_id_token`, `qc_access_token`, `qc_refresh_token`). JWT verified via JWKS.
- **AWS Secrets Manager** — production secrets loaded at startup via `instrumentation.ts`. Set `AWS_SECRET_NAME=skip` for local dev.
- **AWS S3 + CloudFront** — image/fabric uploads and CDN delivery.

## Canvas & UI

- **Fabric.js 7.2.0** — always `import('fabric')` dynamically in hooks (SSR safety).
- **Zustand 5** — global state. 17 stores in `src/stores/`.
- **Framer Motion** — animations and transitions.
- **Lucide React** — icons.

## Other Libraries

- **Zod 4.3** — `z.record()` requires two args. `z.url()`/`z.uuid()` show cosmetic deprecation warnings.
- **Stripe ~21** — subscription billing.
- **pdf-lib** — client-side 1:1 scale PDF export.
- **next-mdx-remote** — MDX in App Router server components. Tutorials in `src/content/tutorials/`.
- **@techstark/opencv-js** — WASM (~8MB), lazy-loaded for photo-to-pattern.
- **@upstash/ratelimit + @upstash/redis** — API rate limiting.
- **ESLint 9** — flat config in `eslint.config.mjs`.
- **Prettier** — config in `.prettierrc`.

## Testing

- **Vitest** — unit tests. Environment: `node` for pure engine tests, `jsdom` for component tests.
- **Playwright** — E2E tests (`playwright.config.ts`).

## Commands

```bash
# Dev
npm run dev             # Start dev server (http://localhost:3000)
npm run build           # Production build
npm run lint            # ESLint
npm run format          # Prettier (src/**/*.{ts,tsx,css,json})
npm run type-check      # TypeScript (no emit)

# Testing
npm test                # Vitest (single run)
npm run test:watch      # Vitest watch mode
npm run test:coverage   # Vitest with coverage
npm run test:e2e        # Playwright E2E

# Database
npm run db:local:up     # Start PostgreSQL Docker container
npm run db:local:down   # Stop container
npm run db:generate     # Generate Drizzle migration from schema changes
npm run db:migrate      # Run pending migrations
npm run db:push         # Push schema directly (no migration file)
npm run db:studio       # Open Drizzle Studio web UI
npm run db:seed:blog    # Seed blog posts only
```

## Environment

Set `AWS_SECRET_NAME=skip` in `.env.local` to bypass Secrets Manager locally. `DATABASE_URL` defaults to the local Docker PostgreSQL instance. `NEXT_PUBLIC_*` vars are build-time only. Dev mode returns a hardcoded pro session (`DEV_SESSION`) — all features unlocked locally.
