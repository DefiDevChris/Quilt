# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Next.js 16 quilt design app with Fabric.js canvas, Zustand state, PostgreSQL/Drizzle, AWS Cognito auth, Stripe payments. Consumer hobbyist tool for designing quilts — users pick layouts, assign blocks and fabrics, and export print-ready PDF patterns.

**Flagship features:**

- **Design Studio** — Worktable canvas with layout templates (borders, sashing, cornerstones, block cells), block builder, and fabric assignment
- **Photo-to-Design** — Upload a photo of a quilt, OpenCV extracts individual pieces onto the worktable for redesigning
- **Block Photo Upload** — Upload a photo of a finished sewn block as a non-editable square image in the block library, placeable in layouts
- **PDF Pattern Export** — Full pattern documents like commercial quilt patterns (cover, fabric requirements, cutting directions, block assembly, quilt diagram, individual cutting templates with seam allowance)

## Development Commands

```bash
# Local setup
cp .env.example .env.local          # Configure AWS Cognito, S3, Stripe creds
npm install
npm run db:local:up                  # Start PostgreSQL via Docker (port 5432)
npm run db:push                      # Push schema to local DB
npm run dev                          # http://localhost:3000 (uses Turbopack)

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
npm run db:generate                  # Generate migration from schema changes (requires DATABASE_URL — see below)
# drizzle-kit needs DATABASE_URL: DATABASE_URL=postgresql://quiltcorgi:localdev@localhost:5432/quiltcorgi npm run db:generate
npm run db:migrate                   # Run pending migrations
npm run db:push                      # Push schema directly (no migration file)
npm run db:studio                    # Open Drizzle Studio web UI
npm run db:seed:blog                 # Seed blog posts
DATABASE_URL=postgresql://quiltcorgi:localdev@localhost:5432/quiltcorgi npx tsx src/db/seed/seedFabrics.ts  # Seed fabric library (2,764 solids)
npm run db:seed:layouts              # Seed 8 default layout templates
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
    (public)/       # Public marketing pages (about, contact, privacy, terms, shop)
    admin/          # Admin panel (role-gated)
    api/            # API route handlers
    blog/           # Blog/tutorial pages
    onboarding/     # New user onboarding flow
    socialthreads/  # Social feed
    studio/[projectId]/  # Design canvas (desktop only)
    templates/      # Project templates and sharing
  components/       # React components, organized by domain
  hooks/            # Bridges between engines and Fabric.js canvas
  stores/           # Zustand stores (19 total)
  lib/              # Pure utilities and engines
    *-engine.ts     # Pure computation — zero React/Fabric/DOM deps
    *-utils.ts      # Domain-specific utilities
  db/schema/        # Drizzle table definitions (23 files)
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

- Primary: `bg-gradient-to-r from-orange-500 to-rose-400 text-white rounded-full hover:opacity-90`
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
- `bg-primary text-white` on CTA buttons (use gradient instead: `from-orange-500 to-rose-400`)

### State Management

- Zustand stores in `src/stores/`
- Selectors use `(s) => s.field` pattern
- New state fields need setters following existing naming: `setFieldName`

### API Routes

- Check `session.user.role` for auth
- Return 403 `PRO_REQUIRED` for pro-gated endpoints
- Rate limit all auth endpoints
- Dynamic route params are async in Next.js 16: `{ params }: { params: Promise<{ id: string }> }` — must `await params`

### S3 Upload Purposes

Presigned URL API at `/api/upload/presigned-url` — `purpose` field determines S3 prefix and auth:
- `fabric`, `thumbnail`, `export`, `block` — Pro required
- `mobile-upload` — all authenticated users (Pro gate applies at processing time)

### Dashboard

Bento grid with 6 cards: My Quiltbook, Browse Templates, Mobile Uploads, Community Threads, My Profile, System Settings. Three have in-page sub-views via `DashboardTab = 'my-quilts' | 'templates' | 'mobile-uploads'` — each renders a full-page panel with "Back to Dashboard" header. The rest are `<Link>` navigations.

### Git

- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`

## Design Studio

The studio has two main modes:

- **Worktable** — The full quilt canvas. Users pick a layout template (or none for a free-form canvas) and configure borders, sashing, cornerstones, and block cells. Blocks are placed in block cells, fabrics assigned to all areas. The quilt dimensions define a grid in the center of the canvas.
- **Block Builder** — Two tabs: **Freeform** (free drawing) and **BlockBuilder** (grid-snapped structured drawing). BlockBuilder has a configurable unit grid (4/5/9/12/custom) and four tools: Freedraw (continuous grid-snapped lines, double-click to end chain), Rectangle (two-click corners), Triangle (click cell to split diagonally), Curve (click a straight seam to bend it into an arc). Blocks are saved to the user's block library and can be placed in any layout.

**Worktable types** (in `canvasStore.ts`): `'quilt' | 'layout' | 'block' | 'image'`

Note: `'print'` worktable type exists for the print preview. There is no `'pattern'` worktable — it was renamed to `'layout'`.

### Block Library

- 35 block SVGs in `/quilt_blocks/` (`01_nine_patch.svg` through `35_*.svg`, `viewBox="0 0 300 300"`, grayscale palette)
- Users can also upload photos of sewn blocks — these go into the block library as square image blocks (non-editable, resizable, placeable in layouts like regular blocks)
- Block types: `'svg'` (system), `'custom'` (user-drawn), `'photo'` (uploaded photo) — tracked via `BlockType` in `src/types/block.ts`
- My Blocks tab has filter chips: All | Custom | Photo Blocks
- Photo blocks stored with `fabricJsData: { type: 'photo-block', imageUrl }` and uploaded to S3 via `SimplePhotoBlockUpload`
- Registry: `src/lib/quilt-overlay-registry.ts`

### Block Builder Architecture

- Pure engine: `src/lib/block-builder-engine.ts` — shape generators (`generateTriangle`, `generateRectangle`), grid utilities (`pixelToGridCell`, `findNearestSegment`), grid unit presets
- Planar graph engine: `src/lib/blockbuilder-utils.ts` — `detectPatches()` uses half-edge face traversal to find closed regions from seam-line segments
- Hook: `src/hooks/useBlockBuilder.ts` — bridges engines to Fabric.js, manages segments/patches/patchFills state, handles mouse events per tool mode, redraws grid on unit change
- Toolbar: `src/components/blocks/BlockBuilderToolbar.tsx` — `BlockBuilderMode = 'freedraw' | 'rectangle' | 'triangle' | 'curve'`
- Tab: `src/components/blocks/BlockBuilderTab.tsx` — grid unit selector + toolbar + tool hints
- Shell: `src/components/blocks/BlockDraftingShell.tsx` — modal with Freeform/BlockBuilder tabs, overlay system, save flow

### Layout Templates

Layouts are structural worktables: binding, borders, sashing, cornerstones, block-cells. Each area is separately selectable. Layouts resize in fixed aspect ratio only.

- Stored in `layout_templates` DB table (`templateData` JSONB column)
- API at `/api/templates` and `/api/layout-templates` (public GET)
- Hierarchy: Layout (worktable) → Binding → Borders → Sashing/Cornerstones → Block Cells → Blocks → Pieces
- 8 layout SVGs in `/quilt_layouts/` (generated via `scripts/gen_layouts.py`)
- Layout renderer: `src/lib/layout-renderer.ts` (pure engine: LayoutTemplate + pxPerUnit → LayoutArea[])
- Layout hook: `src/hooks/useLayoutRenderer.ts` (Fabric.js bridge with selectable areas)
- Layout types: `src/types/layout.ts` (LayoutTemplate, TemplateBorderConfig, LayoutArea)
- Seed: `npm run db:seed:layouts` (8 default templates)

### SVG Block Conventions

- Blocks: `viewBox="0 0 300 300"`, grayscale palette (`#F8F8F8` BG, `#E0E0E0` light, `#D0D0D0` med-light, `#B0B0B0` med, `#505050` dark), `stroke="#333" stroke-width="1"`
- Generator scripts in `scripts/gen_blocks_*.py`
- Each block must accurately represent real traditional quilting geometry — research before generating

## PDF Export System

**Target output** matches commercial quilt patterns (like Andover/Fat Quarter Shop PDFs):

1. **Cover page** — Quilt name, finished dimensions, quilt image, branding
2. **Fabric requirements** — Yardage table per fabric, fat quarter/WOF cuts
3. **Cutting directions** — Measurements include seam allowance, organized by fabric
4. **Block assembly** — Step-by-step diagrams showing how to construct each block
5. **Quilt diagram** — Full layout showing all blocks assembled together
6. **Cutting templates** — Each individual piece shape as a black outline with dashed seam allowance line around it, printed at exact 1:1 scale

**Current state**: Only `src/lib/pdf-generator.ts` exists (basic bin-packed pattern pieces). The following engines are planned but **not yet implemented**:
- `cutlist-pdf-engine.ts` — individual cutting templates with seam allowance
- `project-pdf-engine.ts` — full pattern document
- `fpp-pdf-engine.ts` — foundation paper piecing templates
- `pdf-drawing-utils.ts` — shared branding, tables, drawing utilities
- `canvas-snapshot.ts` — capture canvas state for PDF embedding

Existing utilities that support PDF: `yardage-utils.ts`, `cutting-chart-generator.ts`, `fpp-generator.ts` (FPP template generation).

**Line convention**: Solid = cut line (outer, what quilters cut on). Dashed = sew line (inner, finished piece). This matches EQ8 and published patterns.

## Photo-to-Design Pipeline

Upload a photo of any quilt → OpenCV extracts the individual pieces → pieces are placed on the worktable as independent objects. Users can then group pieces into blocks, assign fabrics, create a printlist, or do anything the regular design studio supports.

**Current state**: The full pipeline is implemented — OpenCV web worker (`src/lib/piece-detection.worker.ts`), 7-step wizard UI, and post-processing structure detection:
- `structure-detection-engine.ts` — Orchestrator: grid → sashing → border → role assignment
- `grid-detection-engine.ts` — Block repeat grid from centroid clustering
- `sashing-detection-engine.ts` — Sashing strips + cornerstones between blocks
- `border-detection-engine.ts` — Border layers around the quilt

Piece roles: `block | sashing | cornerstone | border | binding | setting-triangle | unknown`

### Layout Import Pipeline

- `src/lib/layout-import-*.ts` — modular import helpers (canvas, layouts, printlist, helpers, utils, types)
- `src/stores/photoLayoutStore.ts` — state for photo-to-layout flow
- `src/lib/photo-layout-*.ts` — photo layout types and utilities

## Fabric Library

2,764 solid fabric swatches from 16 manufacturers. Data source: QuiltySolid open-source dataset (MIT license).

- Definitions in `src/db/seed/fabricDefinitions.ts`
- Seed script: `src/db/seed/seedFabrics.ts`
- DB columns: `hex` (actual color), `value` (Light/Medium/Dark), `colorFamily`, `manufacturer`, `collection`
- API supports filtering by manufacturer, colorFamily, value + sorting by name/manufacturer/colorFamily/value
- System fabrics: `isDefault=true, userId=null`. User uploads: `isDefault=false, userId=<user>`

## Shop System

The shop is feature-flagged via the `siteSettings` DB table (`shop_enabled` key). When disabled, `/shop` shows "Coming Soon" and no Shop link appears in navigation.

### Shop Architecture

- **DB toggle**: `siteSettings` table (`src/db/schema/siteSettings.ts`) — key/value store for site-wide settings
- **Admin toggle**: `/admin/settings` page — toggle switch with type-to-confirm (`ENABLE SHOP`) guard
- **Admin API**: `POST /api/admin/settings` — requires admin role + confirm string to enable
- **Public settings API**: `GET /api/shop/settings` — returns `{ enabled: boolean }`
- **Shop fabrics API**: `GET /api/shop/fabrics` — public, returns only `isPurchasable=true` fabrics with filters (manufacturer, colorFamily, value, price range, inStock, search, sort)
- **Admin fabric management**: `PATCH /api/admin/fabrics/[id]` — update shop fields (pricePerYard, inStock, isPurchasable, shopifyProductId, shopifyVariantId)
- **Bulk toggle**: `POST /api/admin/fabrics/bulk` — mark all fabrics from a manufacturer as purchasable/not

### Shop Page (`/shop`)

- Client-side rendered, checks shop settings on load
- Filtering sidebar: manufacturer, color family, value, in-stock only
- Search bar, sort (name, price asc/desc, newest)
- Fabric cards show hex swatch, name, manufacturer, price/yd, stock badge, Add to Cart button
- Glassmorphic design tokens throughout

### Cart System

- **Store**: `src/stores/cartStore.ts` — Zustand with Shopify sync, localStorage persistence
- **CartDrawer**: `src/components/shop/CartDrawer.tsx` — slide-out panel with quantity adjusters (¼ yard increments), subtotal, Copy List / Checkout buttons
- **Cart icon**: Appears in AppShell header when shop is enabled and cart has items
- Cart items: fabricId, shopifyVariantId, quantityInYards, pricePerYard, fabricName, fabricImageUrl

### Studio Integration

- **Shop tab**: FabricLibrary has a "Shop" tab (visible when shop is enabled) showing purchasable in-stock fabrics
- **Shop badge**: Small "Shop" badge on purchasable fabric cards in the studio
- **Preview modal**: `FabricPreviewModal` — click a shop fabric to see large swatch, metadata, price, "Open in Shop" (new tab) and "Add to Cart" buttons
- **Hook**: `useShopEnabled` (`src/hooks/useShopEnabled.ts`) — client-side hook with in-memory cache

### Fabrics Schema Shop Fields

Already in `src/db/schema/fabrics.ts`: `pricePerYard` (numeric), `inStock` (boolean), `isPurchasable` (boolean), `shopifyProductId` (varchar), `shopifyVariantId` (varchar)

## Social Feed

Social feed at `/socialthreads`. Users can post, like, comment, bookmark, and follow.

DB table is `socialPosts` (in `src/db/schema/socialPosts.ts`). API at `/api/social`, components in `src/components/social/`. The "community" → "social" rename is complete.

DB tables: `socialPosts`, `likes`, `comments`, `follows`, `reports`, `bookmarks`

### Social API (`GET /api/social`)

- Supports server-side: `sort` (newest|popular), `search` (ilike on title), `category` (enum), `creatorId`, `tab` (discover|saved), `page`, `limit`
- Category enum values: `show-and-tell` | `wip` | `help` | `inspiration` | `general`
- Returns `isLikedByUser` and `isBookmarkedByUser` per post for authenticated users
- `tab=saved` filters to only bookmarked posts
- Social action buttons update state on server success, ignore on failure — no optimistic+rollback needed
- Toggle endpoints (bookmark, follow) use single POST: inserts if not exists, deletes if exists

### Social Components

- `SocialFeedPage` — manages sort/category/tab state, renders SocialLayout + filter UI + FeedContent
- `FeedContent` — fetches and displays posts with pagination, bookmark/like/comment actions
- `CreatePostComposer` — expandable composer with text/image/project modes and category selector
- `PostDetail` — full post view with comments (RedditStyleComments)
- `SocialLayout` — header + sidebar layout
- `SocialQuickViewModal` — portal modal for quick post/blog/fabric preview
- `SocialSplitPane` — split-pane layout with saved/feed/profile panels

### User Profiles

- Page at `/members/[username]` was removed — profile components (`UserProfilePage`, `ProfileEditForm`) remain in `src/components/community/profiles/`
- API at `/api/members/[username]` — returns profile, posts, follower/following counts
- Follow API at `/api/members/[username]/follow` — POST to follow, DELETE to unfollow

### Blog

- Pages at `/blog` (list) and `/blog/[slug]` (detail)
- Admin-only creation, published via `blogPosts` DB table
- Rendered with `TiptapRenderer`

## Mobile Uploads

Cross-device photo pipeline: mobile captures photos into a holding queue, desktop triages and processes them.

### Mobile Flow

- `UploadSheet` (`src/components/mobile/UploadSheet.tsx`) — single "Upload Photo" button + "Share to Social" shortcut
- Compresses via `compressImageForUpload` (HEIC→JPEG, downscale to 2048px, WebP)
- Uploads to S3 with `purpose: 'mobile-upload'` (allowed for all authenticated users, not just Pro)
- Creates a `mobile_uploads` DB record via `POST /api/mobile-uploads`
- Max 50 pending uploads per user (`MOBILE_UPLOADS_MAX_PENDING`)

### Desktop Flow

- Dashboard bento card "Mobile Uploads" shows pending count badge
- `MobileUploadsPanel` (`src/components/uploads/MobileUploadsPanel.tsx`) — grid of pending uploads
- Each `UploadCard` lets user assign type (Fabric / Block / Quilt), then click "Process"
- Processing calls `POST /api/mobile-uploads/[id]/process` (Pro required for all types) then redirects to the appropriate existing pipeline with `preloadUrl` query param
- After pipeline completes, `POST /api/mobile-uploads/[id]/complete` marks the upload as completed

### Architecture

- DB table: `mobile_uploads` (`src/db/schema/mobileUploads.ts`) — status enum: `pending → processing → completed | failed`
- API: `src/app/api/mobile-uploads/` — CRUD + `/[id]/process` + `/[id]/complete`
- Store: `src/stores/mobileUploadStore.ts` — Zustand with fetch, create, updateType, process, complete, delete
- `SimplePhotoBlockUpload` accepts `preloadedImageUrl` prop to skip the upload step

## Product Context

- **Photo-to-Design** is the key differentiator — never scale it back
- Studio is desktop-only (`StudioGate` redirects mobile users)
- Mobile shell: Home, Upload FAB, Profile/Sign In — 3 items only
- Onboarding uses simple localStorage flags (no complex tour system)
- Project templates live at `/templates` — users can browse, preview, and clone starter projects
- Template library shows only admin-published templates (`isPublished=true`)

### Removed Features

These were intentionally removed — do not reintroduce:

- Minimap, Smart Guides, Symmetry Tool, Serendipity Tool, Fussy Cut Dialog, Image Tracing Panel, Quick Color Palette, old Onboarding Tour, Text Tool, Applique Tab

## Build Health

TypeScript: 0 errors. ESLint: 1 pre-existing error in `dashboard/page.tsx` (setState in effect). Tests: 857/857 pass (1 test file fails due to missing `fabricSwatches.json` seed data — pre-existing).

## Key Dependencies

- **Rate limiting**: Upstash Redis + `@upstash/ratelimit` — used on auth endpoints
- **Geometry**: `clipper-lib` — Clipper.js for seam allowance offset polygons in PDF export
- **Sanitization**: `isomorphic-dompurify` — HTML sanitization for user content
- **Photo upload**: `heic2any` — converts iOS HEIC photos to JPEG before upload
- **Animations**: `framer-motion` — page transitions and UI animations
- **PDF**: `pdf-lib` — client-side PDF generation at 1:1 scale

## PM2 Services

| Port | Name | Type |
|------|------|------|
| 3000 | quilt-3000 | Next.js |
| 5432 | quiltcorgi-db | PostgreSQL (Docker Compose) |

**Terminal Commands:**
```bash
pm2 start ecosystem.config.cjs   # First time
pm2 start all                    # After first time
pm2 stop all / pm2 restart all
pm2 start quilt-3000 / pm2 stop quilt-3000
pm2 logs / pm2 status / pm2 monit
pm2 save                         # Save process list
pm2 resurrect                    # Restore saved list
```

**Note:** PostgreSQL is managed via Docker Compose (`npm run db:local:up`), not PM2.
