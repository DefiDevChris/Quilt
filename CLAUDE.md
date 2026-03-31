# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands run from `quiltcorgi/`:

```bash
npm run dev              # Dev server at localhost:3000
npm run build            # Production build
npm run type-check       # tsc --noEmit
npm test                 # Vitest (all unit tests)
npm test -- --run path   # Single test file
npm run test:e2e         # Playwright (Chrome + Firefox)
npm run lint             # ESLint
npm run format           # Prettier
npm run db:local:up      # Start local Postgres (docker-compose)
npm run db:push          # Push Drizzle schema to DB
npm run db:migrate       # Run migrations
npm run db:generate      # Generate migration from schema diff
npm run db:seed:blog     # Seed blog posts
```

Local dev requires `.env.local` with `AWS_SECRET_NAME=skip` and `DATABASE_URL=postgresql://quiltcorgi:localdev@localhost:5432/quiltcorgi`.

## Architecture

**Stack:** Next.js 16.2.1 (App Router) + React 19 + TypeScript + Tailwind CSS v4 + Fabric.js 7.2 + Zustand + Drizzle ORM + PostgreSQL + AWS Cognito + Stripe

### Engine → Hook → Component Pattern

All computational logic lives in pure `src/lib/*-engine.ts` files with zero React/Fabric.js/DOM dependencies — fully testable in Vitest node environment. Hooks bridge engines to Fabric.js canvas. Components handle UI only. Example: `resize-engine.ts` → `useQuiltResize.ts` → `ResizeDialog.tsx`.

### Auth

Custom AWS Cognito (no NextAuth). HTTP-only cookies: `qc_id_token`, `qc_access_token`, `qc_refresh_token`. JWT verified via JWKS in `src/proxy.ts` (**not** middleware.ts). DB lookup via `cognitoSub` for role. Rate limiting on all auth endpoints. Dashboard is public; protected actions trigger `AuthGateModal`. Studio routes redirect unauthenticated users server-side.

### Pro Gating

$8/month or $60/year. Free users get all studio tools but can't save, export, or access OCR/FPP/cutting charts. Constants: `FREE_BLOCK_LIMIT=20`, `FREE_FABRIC_LIMIT=10`. StudioClient checks `useAuthStore.isPro`; API routes check `session.user.role` and return 403 `PRO_REQUIRED`. Dev mode: `auth-helpers.ts` returns hardcoded pro session (`DEV_SESSION`).

### Four Worktables

Studio has 4 canvas contexts: QUILT, BLOCK, IMAGE, PRINT — each with its own tool rail, context panel, and floating toolbar.

### Mobile

Companion experience only (5-tab nav: Feed, Library, Discover, Profile, Notifications). Studio is desktop-only — `StudioGate` redirects mobile users.

## Brand Voice

Warm, quilter-friendly, conversational — like a knowledgeable friend in a quilt shop. Address quilters directly ("you"/"your"). Use quilting vocabulary naturally (seam allowance, yardage, WOF, fat quarter). Lead with what the quilter gets, not what the software does. Headlines: 2–6 words, punchy, wordplay welcome. **Avoid**: "professional-grade", "comprehensive suite", "cutting-edge", "leverage", "utilize", "enterprise", "robust" — any generic SaaS language.

## Design System

Warm-cream glassmorphic system in `src/app/globals.css` via Tailwind v4 `@theme` (no `tailwind.config.ts`).

- **Fonts:** Manrope (sans), JetBrains Mono (mono), Outfit (display, landing only)
- **Primary:** `#FFB085` (warm peach), dark `#C67B5C`, container `#FFE4D0`
- **Surfaces:** `#FFF9F2` → `#E8DCCB` (6 levels)
- **Text:** `#4A3B32` (on-surface), `#6B5A4D` (secondary)
- **Status:** success `#4a7c59`, error `#D4726A`, warning `#C6942E`
- **Glass tiers:** `.glass-card` (20px blur), `.glass-elevated` (32px blur), `.glass-inset` (8px blur), `.glass-panel` (16px blur)
- **Elevation:** 4-level multi-layer shadows. Radii: sm 6px, md 10px, lg 16px, xl 24px
- **Spacing:** Base `0.35rem` (`--spacing-1x`), scale 0.5x–20x
- **Background:** `AppShell` renders fixed ambient orbs (peach/gold/white) that glass surfaces reveal

Use design system modal pattern (fixed overlay + glass surface) instead of native `confirm()`.

## Gotchas

- **`proxy.ts` not middleware.ts** for JWT verification and route protection
- **Tailwind v4** uses `@theme` in `globals.css` — no `tailwind.config.ts` file
- **Fabric.js must be dynamically imported** — `import('fabric')` in hooks only, for SSR safety
- **`await params`** required in Next.js 16 route handlers
- **Drizzle `pgTable`** returns array as 3rd arg; uses `pgEnum`
- **OpenCV.js** (~8MB WASM) lazy-loaded only for Photo to Pattern. Turbopack aliases shim `fs`/`path`/`crypto` in `next.config.ts`
- **`validationErrorResponse()`** takes a `string`, not a ZodError — use `parsed.error.message`
- **Vitest** can't resolve bare directory imports — use `./block-generators/index` not `./block-generators`
- **`NEXT_PUBLIC_APP_URL`** for all base URL needs — `NEXT_PUBLIC_BASE_URL` was removed
- **`AWS_SECRET_NAME=skip`** in `.env.local` bypasses Secrets Manager for local dev
- **`verifySessionToken()`** returns `{ sub, email }` only — role requires DB lookup via `getSession()`
- **`normalizeColor()`** in `colorway-engine.ts` returns `#000000` for invalid hex (not pass-through)
- **MDX frontmatter parser** is custom (not YAML lib) — arrays must use `[a, b, c]` format
- **Suspense fallbacks:** Always provide a `fallback` prop with a loading skeleton — never `fallback={null}`
- **Default constants:** Use `DEFAULT_CANVAS_WIDTH/HEIGHT`, `DEFAULT_FILL_COLOR/STROKE_COLOR` from `lib/constants.ts` — don't hardcode
- `saveProject()` in `lib/save-project.ts` is shared (keyboard, auto-save, hamburger menu) — don't duplicate
- `calculateReadTime()` in `lib/read-time.ts` is shared — don't duplicate
- `color-math.ts` uses D65 illuminant for sRGB→XYZ→LAB, shared across photo-patchwork, photo-pattern, and OCR modules
- Blog `[slug]/page.tsx` uses React `cache()` to deduplicate between `generateMetadata` and the page component
- Zustand stores use immutable updates (spread/map), module-level abort controllers, and `reset()` methods that clean up private state

## Community Trust System

**3 roles: free → pro → admin.** Implemented in `trust-engine.ts` (pure function) + `trust-guard.ts` (middleware).

### Role Permissions
| Role | canComment | canPost | canModerate | Rate Limits (24h) |
|------|------------|---------|-------------|-------------------|
| free | ✓ | ✗ | ✗ | 20 comments, 3 posts |
| pro | ✓ | ✓ | ✗ | 100 comments, 20 posts |
| admin | ✓ | ✓ | ✓ | Unlimited |

### Key Behaviors
- **Free users** can like, save, and comment on community posts
- **Pro subscription** required to create community posts (paywall, not activity-based)
- **Admins** can moderate content (approve/reject posts, hide comments)
- New community posts from non-admins enter "pending" status for moderation
- Posts are auto-approved only for admin users

### Rate Limiting
Two systems are used:
1. **Redis-based** (per-minute): Used for likes, saves, profile updates, admin actions
2. **DB-based** (per-24h): Used for comments and posts via `trust-guard.ts`

The trust system is **role-based**, not activity-based. Users do not earn elevated privileges through participation.
