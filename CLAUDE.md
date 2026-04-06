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
DATABASE_URL=postgresql://quiltcorgi:localdev@localhost:5432/quiltcorgi npx tsx src/db/seed/seedFabrics.ts  # Seed fabric library (2,764 solids)
npm run db:local:down                # Stop PostgreSQL container
# Direct SQL queries (psql not installed locally):
# docker exec -i $(docker ps --filter ancestor=postgres -q | head -1) psql -U quiltcorgi -d quiltcorgi -c "SELECT ..."
```

Set `AWS_SECRET_NAME=skip` in `.env.local` for local development (secrets loaded from `.env.local` instead of Secrets Manager).

## Architecture

```
src/
  app/              # Next.js App Router — pages and API routes
    (protected)/    # Auth-gated routes (layout redirects guests)
    (public)/       # Public marketing pages (about, contact, privacy, terms)
    admin/          # Admin panel (role-gated)
    api/            # API route handlers
    blog/           # Blog/tutorial pages
    onboarding/     # New user onboarding flow
    socialthreads/  # Community social feed
    studio/[projectId]/  # Design canvas (desktop only)
    templates/      # Project templates and sharing
  components/       # React components, organized by domain
  hooks/            # Bridges between engines and Fabric.js canvas
  stores/           # Zustand stores
  lib/              # Pure utilities and engines
    *-engine.ts     # Pure computation — zero React/Fabric/DOM deps
    *-utils.ts      # Domain-specific utilities
  db/schema/        # Drizzle table definitions
  types/            # Shared TypeScript type definitions
```

**Core pattern**: All computational logic goes in `src/lib/*-engine.ts` files with zero DOM dependencies (fully testable in Vitest). Hooks bridge engines to Fabric.js canvas. Components handle UI only — no business logic.

**Path alias**: `@/*` maps to `./src/*` (configured in tsconfig.json and vitest.config.ts).

**Auth flow**: Cognito sign-in sets HTTP-only cookies (`qc_id_token`, `qc_access_token`, `qc_refresh_token`). `src/proxy.ts` verifies JWT via JWKS. `getSession()` does DB lookup for role.

**Route protection**:
- `/studio/*` — server layout redirects guests to `/auth/signin?callbackUrl=...`
- `/admin/*` — cookie + role check (`admin` role only)
- `/dashboard` — public, but protected actions trigger `AuthGateModal`

**Pro gating**: Check `useAuthStore.isPro` client-side. API routes check `session.user.role` and return 403 `PRO_REQUIRED`.

**Roles**: `free | pro | admin` — defined in `src/lib/role-utils.ts`, permissions in `src/lib/trust-utils.ts`.

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

### Styling & Design System

Tailwind CSS v4 with Material 3-inspired glassmorphic design system. **All components use the same token set — no hardcoded grays, slates, or hex borders.**

**Text tokens:**
- `text-on-surface` — primary text (headings, names, labels)
- `text-secondary` — muted text (captions, timestamps, meta)
- `text-primary` — accent text (links, highlights)
- `text-primary-dark` — avatar initials, emphasis

**Card surfaces:**
- `glass-panel` — standard card (white/blur + subtle border)
- `glass-elevated` — raised card with more shadow
- `glass-panel-social` — blog/social variant
- Cards use `rounded-2xl` corners

**Buttons:**
- Primary: `bg-primary text-white rounded-full` or `bg-gradient-to-r from-primary to-primary-golden text-white rounded-full`
- Secondary: `bg-white/50 text-secondary rounded-full`
- Active chips: `bg-primary text-white shadow-elevation-1`, inactive: `bg-white/50 text-secondary`

**Borders:** `border-white/40`, `border-white/60`, or `border-outline-variant` — never hardcoded hex/gray

**Shadows:** `shadow-elevation-1` through `shadow-elevation-4`

**Avatars:** `bg-primary-container` circle with `text-primary-dark` initial

**Skeletons:** `bg-primary-container/40`, `bg-primary-container/20`

**Sidebars:** `bg-white/60 backdrop-blur-xl border-r border-white/40` — fixed, glassmorphic

**Banned patterns — do NOT use:**
- `text-gray-*`, `text-slate-*`, `bg-gray-*`, `bg-slate-*`, `border-gray-*`, `border-slate-*`
- `border-[#e5e5e5]`, `bg-[#f5f5f5]`
- `bg-white border border-gray-100` flat cards
- `bg-gray-900 text-white` dark buttons

### State Management

- Zustand stores in `src/stores/`
- Selectors use `(s) => s.field` pattern
- New state fields need setters following existing naming: `setFieldName`

### API Routes

- Check `session.user.role` for auth
- Return 403 `PRO_REQUIRED` for pro-gated endpoints
- Rate limit all auth endpoints

### Community API (`GET /api/community`)

- Supports server-side: `sort` (newest|popular), `search` (ilike on title), `category` (enum), `creatorId`, `page`, `limit`
- Category enum values: `show-and-tell` | `wip` | `help` | `inspiration` | `general` (defined in `src/db/schema/enums.ts`)
- Social action buttons update state on server success, ignore on failure — no optimistic+rollback needed
- Toggle endpoints (bookmark, follow) use single POST: inserts if not exists, deletes if exists

### Git

- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`

## PDF Export System

Four modes in `PdfExportDialog.tsx`, all client-side via pdf-lib:

- **Pattern Pieces** — `pdf-generator.ts`. Bin-packed shapes at scale
- **Cut List** — `cutlist-pdf-engine.ts`. Key block page + one template per shape. Solid line = CUT (outer), dashed = SEW (inner). Per-edge dimensions via `edge-dimension-utils.ts`
- **Print Project** — `project-pdf-engine.ts`. Overview + fabric requirements (yardage from `yardage-utils.ts`) + cutting instructions (from `cutting-chart-generator.ts`) + block pages + totals
- **Foundation Paper Piecing (FPP)** — `fpp-pdf-engine.ts`. Generates FPP templates with numbered sewing order, mirror-image pieces, and trim lines

Shared infrastructure: `pdf-drawing-utils.ts` (branding, tables, polylines, grain lines, validation square). Logo fetched from `/logo.png` at runtime, embedded via `pdfDoc.embedPng()`.

**Line convention**: Solid = cut line (outer, what quilters cut on). Dashed = sew line (inner, finished piece). This matches EQ8 and published patterns.

## Photo-to-Pattern Pipeline

7-step wizard. OpenCV.js runs in Web Worker (`piece-detection.worker.ts`). 15-objective CV pipeline. Post-processing structure detection:

- `grid-detection-engine.ts` — Block repeat grid from centroid clustering
- `sashing-detection-engine.ts` — Sashing strips + cornerstones between blocks
- `border-detection-engine.ts` — Border layers around the quilt
- `structure-detection-engine.ts` — Orchestrator, assigns piece roles

Piece roles: `block | sashing | cornerstone | border | binding | setting-triangle | unknown`

## Fabric Library

2,764 solid fabric swatches from 16 manufacturers. Data source: QuiltySolid open-source dataset (MIT license, `src/db/seed/fabricSwatches.json`).

- Definitions in `src/db/seed/fabricDefinitions.ts` — loads JSON, classifies `colorFamily` (from hue) and `value` (Light/Medium/Dark from lightness)
- Seed script: `src/db/seed/seedFabrics.ts` — clears system fabrics, inserts with SVG placeholder images colored by hex
- DB columns: `hex` (actual color), `value` (Light/Medium/Dark), `colorFamily`, `manufacturer`, `collection`
- API supports filtering by manufacturer, colorFamily, value + sorting by name/manufacturer/colorFamily/value
- System fabrics: `isDefault=true, userId=null`. User uploads: `isDefault=false, userId=<user>`
- Excludes thread lines (DMC, Glide, Aurifil, WonderFil) and Pantone reference colors

## Product Context

- **Photo-to-Pattern** is the key differentiator — never scale it back
- Studio is desktop-only (`StudioGate` redirects mobile users)
- Mobile shell: Home, Upload FAB, Profile/Sign In — 3 items only
- SVG overlays live in `/quilt_blocks/` and `/quilt_layouts/` (root level), registry in `src/lib/quilt-overlay-registry.ts`
- 100 block SVGs (`01_nine_patch.svg` – `100_snowflake.svg`, 300×300 viewBox, grayscale palette) and 10 layout SVGs (proportional viewBox at 10px/inch, structural `data-role` attributes)
- Layouts are the structural worktable: binding, borders, sashing, cornerstones, block-cells. Each area is separately selectable. Layouts resize in fixed aspect ratio only.
- Block name → SVG lookup: `src/lib/block-svg-lookup.ts` (`findBlockSvgPath()`) — used by TemplateCard thumbnails and TemplateDetailDialog previews
- Pattern library shows only admin-published patterns (`isPublished=true`); no client-side filtering needed — if it's in the DB, it should display
- Onboarding uses simple localStorage flags (no complex tour system)
- Project templates live at `/templates` — users can browse, preview, and clone starter projects
- Social DB tables: `community_posts`, `likes`, `comments`, `bookmarks`, `follows`
- See `docs/FEATURES.md` for comprehensive feature documentation

## Template Library

Quilt templates stored in `pattern_templates` DB table (`patternData` JSONB column). Templates contain layouts with blocks, or just bare layouts. API at `/api/templates`. Extracts `blockNames` from JSONB for list view.

- Card thumbnails: `TemplateCard.tsx` renders actual block SVGs from `/quilt_blocks/` matched via `findBlockSvgPath()`
- Detail modal: `TemplateDetailDialog.tsx` — wide (max-w-3xl), shows design preview grid, blocks with SVG thumbnails, layout info, fabric summary. No cutting chart in modal.
- Store: `templateStore.ts` — `fetchTemplates()` for list, `fetchTemplateDetail()` for modal, `importTemplate()` to create project
- No badges/chips on cards — keep info text-only (name, dimensions, block/fabric counts)

### SVG Block/Layout Conventions

- Blocks: `viewBox="0 0 300 300"`, grayscale palette (`#F8F8F8` BG, `#E0E0E0` light, `#D0D0D0` med-light, `#B0B0B0` med, `#505050` dark), `stroke="#333" stroke-width="1"`
- Layouts: proportional viewBox at 10px/inch. Every element has `data-shade` and `data-role` attributes. Roles: `block-cell`, `sashing`, `cornerstone`, `border`, `binding`, `patch`. Stroke widths: `0.5` inner, `1` borders, `1.5` binding.
- Generator scripts in `scripts/gen_blocks_*.py` and `scripts/gen_layouts.py`
- Each block must accurately represent real traditional quilting geometry — research before generating
- Hierarchy: Layout (worktable) → Binding → Borders → Sashing/Cornerstones → Block Cells → Blocks → Pieces

### Removed Features

These were intentionally removed — do not reintroduce:
- Minimap, Smart Guides, Symmetry Tool, Serendipity Tool, Fussy Cut Dialog, Image Tracing Panel, Quick Color Palette, old Onboarding Tour
