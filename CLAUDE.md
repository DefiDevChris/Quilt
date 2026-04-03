# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Next.js 16 quilt design app with Fabric.js canvas, Zustand state, PostgreSQL/Drizzle, AWS Cognito auth, Stripe payments. Consumer hobbyist tool — Photo-to-Pattern (7-step wizard with OpenCV) is the flagship feature.

## Development Commands

```bash
# Local setup
cp .env.example .env.local          # Configure AWS Cognito, S3, Stripe creds
npm install
npm run db:local:up                  # Start PostgreSQL via Docker (port 5432)
npm run db:push                      # Push schema to local DB
npm run dev                          # http://localhost:3000

# Build & check
npm run build                        # Production build
npm run type-check                   # tsc --noEmit
npm run lint                         # ESLint
npm run format                       # Prettier

# Unit tests (Vitest)
npm test                             # Run all unit tests
npm test -- tests/unit/lib/trust-engine.test.ts   # Single test file
npm test -- -t "test name pattern"   # Run by test name
npm run test:watch                   # Watch mode
npm run test:coverage                # Coverage (thresholds: 70% lines/functions/statements, 60% branches)

# E2E tests (Playwright)
npm run test:e2e                     # All browsers (chromium, firefox, webkit, mobile-chrome, mobile-safari)
npx playwright test tests/e2e/studio.spec.ts                # Single spec
npx playwright test --project=chromium tests/e2e/auth.spec.ts  # Single browser

# Database (Drizzle + PostgreSQL)
npm run db:generate                  # Generate migration from schema changes
npm run db:migrate                   # Run pending migrations
npm run db:push                      # Push schema directly (no migration file)
npm run db:studio                    # Open Drizzle Studio web UI
npm run db:seed:blog                 # Seed blog posts
npm run db:local:down                # Stop PostgreSQL container
```

Set `AWS_SECRET_NAME=skip` in `.env.local` for local development (secrets loaded from `.env.local` instead of Secrets Manager).

## Architecture

```
src/
  app/              # Next.js App Router — pages and API routes
    (protected)/    # Auth-gated routes (layout redirects guests)
    (public)/       # Public marketing pages
    api/            # API route handlers
    studio/[projectId]/  # Design canvas (desktop only)
  components/       # React components, organized by domain
  hooks/            # Bridges between engines and Fabric.js canvas
  stores/           # Zustand stores (17 files)
  lib/              # Pure utilities and engines
    *-engine.ts     # Pure computation — zero React/Fabric/DOM deps
    *-utils.ts      # Domain-specific utilities
  db/schema/        # Drizzle table definitions (17 tables)
  types/            # Shared TypeScript type definitions
```

**Core pattern**: All computational logic goes in `src/lib/*-engine.ts` files with zero DOM dependencies (fully testable in Vitest). Hooks bridge engines to Fabric.js canvas. Components handle UI only — no business logic.

**Path alias**: `@/*` maps to `./src/*` (configured in tsconfig.json and vitest.config.ts).

**Auth flow**: Cognito sign-in sets HTTP-only cookies (`qc_id_token`, `qc_access_token`, `qc_refresh_token`). `proxy.ts` verifies JWT via JWKS. `getSession()` does DB lookup for role.

**Route protection**:
- `/studio/*` — server layout redirects guests to `/auth/signin?callbackUrl=...`
- `/admin/*` — cookie + role check (`admin` role only)
- `/dashboard` — public, but protected actions trigger `AuthGateModal`

**Pro gating**: Check `useAuthStore.isPro` client-side. API routes check `session.user.role` and return 403 `PRO_REQUIRED`.

**Roles**: `free | pro | admin` — defined in `src/lib/trust-engine.ts`.

## Critical Conventions

### Fabric.js Usage

- Always dynamic import: `const fabric = await import('fabric')`
- Canvas refs are `useRef<unknown>(null)`, cast as `InstanceType<typeof fabric.Canvas>`
- Grid lines use `stroke: '#E5E2DD'` — filter these out when extracting user objects
- Overlay objects use `(obj as unknown as { name?: string }).name === 'overlay-ref'` tag
- SVG loading: `fabric.loadSVGFromString()` — objects param needs `as unknown as Array<InstanceType<typeof fabric.FabricObject>> | null`
- Group options need `as Record<string, unknown>` cast for custom props
- Always maintain aspect ratio: `scaleX === scaleY` for overlays

### TypeScript

- No `any` — use `unknown` with proper casts
- Type assertions at boundaries only (Fabric.js interop)

### Styling

- Tailwind CSS v4 with Material 3-inspired design system
- Use design tokens: `bg-surface`, `text-on-surface`, `bg-primary`, `shadow-elevation-4`
- Don't use hardcoded colors — use the cream palette system
- Social components use separate design system (hardcoded slate+orange Tailwind, NOT main CSS variables)

### State Management

- Zustand stores in `src/stores/`
- Selectors use `(s) => s.field` pattern
- New state fields need setters following existing naming: `setFieldName`

### API Routes

- Check `session.user.role` for auth
- Return 403 `PRO_REQUIRED` for pro-gated endpoints
- Rate limit all auth endpoints

### Git

- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`

## Product Context

- **Photo-to-Pattern** is the key differentiator — never scale it back
- Studio is desktop-only (`StudioGate` redirects mobile users)
- Mobile shell: Home, Upload FAB, Profile/Sign In — 3 items only
- SVG overlays live in `/quilt_blocks/` and `/quilt_patterns/` (root level), registry in `src/lib/quilt-overlay-registry.ts`
- Onboarding uses simple localStorage flags (no complex tour system)

### Removed Features

These were intentionally removed — do not reintroduce:
- Minimap, Smart Guides, Symmetry Tool, Serendipity Tool, Fussy Cut Dialog, Image Tracing Panel, Quick Color Palette, old Onboarding Tour
