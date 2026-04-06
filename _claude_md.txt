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
      admin/        # Admin APIs (blog, blocks, fabrics, templates, comments, users, reports)
      shop/         # Shopify cart API (feature-flagged)
    studio/[projectId]/  # Design canvas (desktop only)
  components/       # React components, organized by domain
  hooks/            # Bridges between engines and Fabric.js canvas
  stores/           # Zustand stores
  lib/              # Pure utilities and engines
    *-engine.ts     # Pure computation — zero React/Fabric/DOM deps
    *-utils.ts      # Domain-specific utilities
  db/schema/        # Drizzle table definitions (18 tables, 10 enums)
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

### Design System

Tailwind CSS v4 with a unified warm cream + orange-rose gradient system. Everything derives from the hero button's DNA: warm gradients, pill shapes, elevation shadows, scale-on-hover.

#### Color Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `text-on-surface` | #4a3b32 | Primary text (dark warm brown) |
| `text-secondary` | #6b5a4d | Supporting text |
| `text-tertiary` | #8a7a6d | Muted/placeholder text |
| `bg-surface` | #ffffff | Page background |
| `bg-surface-container` | #fdfaf7 | Card/input backgrounds |
| `bg-surface-container-high` | #faf6f2 | Elevated containers |
| `bg-surface-container-highest` | #f7f2ed | Badges, tags |
| `border-outline-variant` | #f0e8df | All borders |
| `text-primary` / `bg-primary` | #ffb085 | Brand peach (surfaces) |
| `text-primary-dark` | #c67b5c | Terracotta accent |
| `text-accent` | #ffd166 | Golden highlight |

**Accent colors** (Tailwind built-ins, not CSS vars):
- `orange-400`, `orange-500` — interactive accent
- `rose-400` — gradient endpoint
- `orange-100` — light accent backgrounds
- `from-orange-400 to-rose-400` — THE primary gradient

**Never use**: `text-slate-*`, `bg-slate-*`, `text-gray-*`, `bg-gray-*`, hardcoded hex colors, or the removed `warm-*`/`pattern-*` tokens.

#### Button System (CSS utility classes in globals.css)

All buttons are gradient pills built around the hero CTA style:

| Class | Size | Usage |
|-------|------|-------|
| `btn-primary` | `px-8 py-4 text-lg` | Hero CTAs, page-level actions |
| `btn-primary-sm` | `px-6 py-3 text-base` | Inline actions, form submits |
| `btn-primary-xs` | `px-4 py-2 text-sm` | Compact/tight spaces |
| `btn-secondary` | `px-6 py-3 text-base` | Outlined pill, secondary actions |
| `btn-ghost` | `px-4 py-2 text-sm` | Text-only actions |

```tsx
// Hero CTA
<a className="btn-primary" href="/studio">Start Designing</a>

// Form submit
<button className="btn-primary-sm w-full disabled:opacity-50" disabled={loading}>Submit</button>

// Small action
<button className="btn-primary-xs">Follow</button>
```

Never write gradient button classes inline — always use `btn-primary` variants.

#### Font Size Tokens

| Token | Size | Usage |
|-------|------|-------|
| `text-display-lg` | 3.5rem | Hero headlines |
| `text-display-md` | 2.5rem | Section headlines |
| `text-headline-md` | 1.5rem | Page titles |
| `text-headline-sm` | 1.25rem | Card titles |
| `text-body-lg` | 1rem (16px) | Large body text |
| `text-body-md` | 0.875rem (14px) | Default body/input text |
| `text-body-sm` | 0.75rem (12px) | Small body, labels |
| `text-label-sm` | 0.6875rem (11px) | Section titles, small labels |
| `text-caption` | 0.625rem (10px) | Captions, metadata, badges |

Never use arbitrary `text-[Xpx]` — map to the nearest token. Standard Tailwind sizes (`text-sm`, `text-xs`, `text-base`, `text-lg`, etc.) are also acceptable.

#### Glass / Elevation

| Class | Usage |
|-------|-------|
| `glass-card` | Base glass cards |
| `glass-elevated` | Floating panels, modals, dropdowns |
| `glass-panel` | Landing/marketing cards |
| `glass-panel-social` | Social thread cards (peach glow accent) |
| `glass-inset` | Recessed input wells |
| `shadow-elevation-1` through `shadow-elevation-4` | Depth hierarchy |

#### Input Fields

Use `className="input-standard"` for all standard inputs (defined in globals.css):
```
w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2.5 text-body-md text-on-surface placeholder:text-tertiary focus:border-orange-400 focus:ring-1 focus:ring-orange-400/30
```

Auth forms use a variant with `border-b` underline style — that's the one exception.

#### Border Radius Rules

| Shape | Radius | Components |
|-------|--------|------------|
| `rounded-full` | Pill | All buttons |
| `rounded-xl` | 24px | Modals, large cards |
| `rounded-lg` | 16px | Cards, inputs, containers |
| `rounded-md` | 10px | Small elements, badges |

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
  - 7-step wizard: Upload → Image Prep (straighten/flip/perspective) → Scan Settings → Processing → Results → Dimensions → Export
  - **Perspective tool** in Image Prep: Manual corner-dragging to correct photos taken at an angle (uses OpenCV warpPerspective)
  - OpenCV runs AFTER perspective correction in the processing step
- Studio is desktop-only (`StudioGate` redirects mobile users)
- Mobile shell: Home, Upload FAB, Profile/Sign In — 3 items only
- SVG overlays live in `/quilt_blocks/` (root level), registry in `src/lib/quilt-overlay-registry.ts`
- Onboarding uses simple localStorage flags (no complex tour system)

### Block Creation

- **Simple Drawing**: 4 basic tools (Select, Rectangle, Triangle, Line) on a 12×12 grid canvas
- **Photo Upload**: Upload a photo of a physical block with crop/straighten tools (rotate, draggable corner handles, optional auto-detect)
- **No Complex Features**: Removed tabs, overlays, symmetry tools — just draw or photograph
- **Block Library**: Browse 105 system blocks (SVGs in `/quilt_blocks/`), create custom blocks (draw or photo), manage user collection
- **Mode Switcher**: "Draw | Upload Photo" toggle in BlockDraftingShell — photo mode delegates to SimplePhotoBlockUpload
- **Photo blocks**: Saved with `photoUrl` field, no shape detection or cutting instructions (just the cropped image)

### Fabric.js Block Builder Patterns

```typescript
// Grid lines to filter out
const userObjects = canvas.getObjects().filter((o) => o.stroke !== '#E5E2DD');

// Drawing tool interaction
if (activeTool === 'rectangle') {
  previewShape = new fabric.Rect({
    left: startX,
    top: startY,
    width: 0,
    height: 0,
    fill: 'transparent',
    stroke: strokeColor,
    strokeWidth: 1,
    strokeDashArray: [5, 5],
    selectable: false,
    evented: false,
  });
}

// Save block to API
const res = await fetch('/api/blocks', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: blockName.trim(),
    category: category.trim() || 'Custom',
    svgData,
    fabricJsData,
    tags: tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean),
    photoUrl: imageUrl, // Only for photo blocks
  }),
});
```

### Layout System

- **No Layout** mode: Freeform placement with dedicated Sashing Tool (S) and Border Tool (B) for drawing custom strips, plus background fill color control
- **Select Layout** mode: 9 predefined templates (Grid 3×3–5×5, Sashing 3×3–5×5, On-Point 3×3–5×5) that instantly apply all settings
- Layout library in `src/lib/layout-library.ts`
- Sashing/border shapes tagged with metadata: `data: { type: 'sashing' | 'border' }`
- Background color stored in canvas store, defaults to `#F5F5F0` (neutral cream)

### Database: User Fabrics

- User-uploaded fabrics live in a separate `user_fabrics` table (not the system `fabrics` table)
- `userId` is required (not nullable) with cascade delete
- API routes: `scope=user` queries `user_fabrics`, `scope=system` queries `fabrics`
- Pro-only feature — free users only see system fabrics

### Admin Dashboard

- Admin pages at `src/app/(protected)/admin/` — blog, community, libraries, moderation
- Admin API routes at `src/app/api/admin/` — blocks, blog, comments, community, fabrics, libraries, pattern-templates, reports, users
- All admin endpoints validate session + admin role via `getRequiredSession()` and `isAdmin()`
- User status: `active | suspended | banned` enum on users table
- Blog POST uses Zod validation (`createBlogPostSchema`) with slug conflict retry logic (up to 3 attempts)

### Shopify Integration (Feature-Flagged)

- **Feature flag**: `NEXT_PUBLIC_ENABLE_SHOP=true` enables all Shopify features; disabled by default
- **Client**: `src/lib/shopify.ts` — Shopify Storefront API GraphQL client (cart create, add items, fetch)
- **Store**: `src/stores/cartStore.ts` — Zustand cart state with Shopify sync
- **UI**: `src/components/shop/CartDrawer.tsx` — slide-out cart drawer with quantity controls
- **Shop page**: `src/app/(public)/shop/page.tsx` — displays purchasable fabrics from DB
- **API**: `src/app/api/shop/cart/route.ts` — server-side cart operations
- **Schema**: `fabrics` table has Shopify fields: `isPurchasable`, `shopifyProductId`, `shopifyVariantId`, `pricePerYard` (cents), `inStock`
- **Env vars**: `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN`, `NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN`, `NEXT_PUBLIC_ENABLE_SHOP`
- Check `isShopifyEnabled()` from `@/lib/shopify` before rendering shop features

### Removed Features

These were intentionally removed — do not reintroduce:

- Minimap, Smart Guides, Symmetry Tool, Serendipity Tool, Fussy Cut Dialog, Image Tracing Panel, Quick Color Palette, old Onboarding Tour
- Block builder tabs (Freeform/BlockBuilder/Applique), block overlays, complex drafting modes
- Studio tools: Line, Polygon, Text, Eyedropper — removed for UX simplicity
- Reference Image dialog and `referenceImageOpacity` canvas state
