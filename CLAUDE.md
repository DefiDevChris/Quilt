# CLAUDE.md

> **IMPORTANT:** This file MUST stay identical to `QWEN.md` at all times.

## Project Overview

Next.js 16 quilt design app with Fabric.js canvas, Zustand state, PostgreSQL/Drizzle, AWS Cognito auth, Stripe payments. Consumer hobbyist tool — users pick layouts, assign blocks and fabrics, and export print-ready PDF patterns.

**Flagship features:** Design Studio (canvas + fence layouts + block builder), Photo-to-Design (OpenCV piece extraction), Block Photo Upload, PDF Pattern Export (commercial-grade patterns with seam allowance).

## Development Commands

```bash
npm install && npm run db:local:up && npm run db:push && npm run dev  # Full local setup
npm run build              # Production build
npm run type-check         # tsc --noEmit
npm run lint && npm run format
npm test                   # Vitest (coverage: 70% lines/functions/statements, 60% branches)
npm run test:e2e           # Playwright (chromium, firefox, webkit, mobile-chrome, mobile-safari)
npm run db:generate        # Needs DATABASE_URL=postgresql://quiltcorgi:localdev@localhost:5432/quiltcorgi
npm run db:migrate         # Run pending migrations
npm run db:push            # Push schema directly
npm run db:studio          # Drizzle Studio
npm run db:seed:blog && npm run db:seed:layouts
DATABASE_URL=postgresql://quiltcorgi:localdev@localhost:5432/quiltcorgi npx tsx src/db/seed/seedFabrics.ts
DATABASE_URL=postgresql://quiltcorgi:localdev@localhost:5432/quiltcorgi npx tsx src/db/seed/seedBlocksFromFiles.ts
```

Set `AWS_SECRET_NAME=skip` in `.env.local` for local dev. Direct SQL: `docker exec -i $(docker ps --filter ancestor=postgres -q | head -1) psql -U quiltcorgi -d quiltcorgi -c "SELECT ..."`

## Architecture

```
src/
  app/              # App Router (pages + API routes)
  components/       # React components by domain
  hooks/            # Bridges between engines and Fabric.js canvas
  stores/           # Zustand stores (17 total)
  lib/*-engine.ts   # Pure computation — zero DOM deps (testable in Vitest)
  lib/*-utils.ts    # Domain-specific utilities
  db/schema/        # Drizzle table definitions (21 files)
  types/            # Shared TypeScript types
```

**Core pattern**: Engines (`*-engine.ts`) are pure computation with zero DOM deps. Hooks bridge engines to Fabric.js. Components handle UI only.

**Path alias**: `@/*` maps to `./src/*`.

**Auth**: Cognito sets HTTP-only cookies (`qc_id_token`, `qc_access_token`, `qc_refresh_token`). `src/proxy.ts` verifies JWT via JWKS. `getSession()` does DB lookup for role. Roles: `free | pro | admin`.

**Route protection**: `/studio/*` redirects guests. `/admin/*` requires admin role. `/dashboard` is public but protected actions trigger `AuthGateModal`. Pro gating: `useAuthStore.isPro` client-side, `session.user.role` + 403 `PRO_REQUIRED` server-side.

## Critical Conventions

### Fabric.js

- Always dynamic import: `const fabric = await import('fabric')`
- Canvas refs: `useRef<unknown>(null)`, cast as `InstanceType<typeof fabric.Canvas>`
- Grid lines use `stroke: '#E5E2DD'` — filter out when extracting user objects
- Overlay objects: `(obj as unknown as { name?: string }).name === 'overlay-ref'`
- SVG loading objects param: `as unknown as Array<InstanceType<typeof fabric.FabricObject>> | null`
- Group options: `as Record<string, unknown>` cast for custom props
- Always `scaleX === scaleY` for overlays

### TypeScript

No `any` — use `unknown` with proper casts. Type assertions at boundaries only (Fabric.js interop).

### Styling & Design System

Tailwind CSS v4. Full spec in `brand_config.json`. BrandGuard agent enforces consistency.

**Colors:** `--primary: #ff8d49` | `--secondary: #ffc8a6` | `--accent: #ffc7c7` | `--bg: #fdfaf7` | `--surface: #ffffff` | `--text: #2d2a26` | `--text-dim: #6b655e` | `--border: #e8e1da`. Light mode only.

**Typography:** Headings: **Spline Sans** (400-700). Body: **Inter** (300-700). Scale: h1 40/52, h2 32/40, h3 24/32, body 18/28, small 16/24, label 14/20.

**Shape:** Buttons/CTAs/tabs/filters/pills: `rounded-full` (pill shape) everywhere. Cards/containers/inputs/dialogs: `rounded-lg` (8px). Avatar containers: `rounded-full`. Shadow: `0 1px 2px rgba(45,42,38,0.08)` only.

**Motion:** Hover changes color/background ONLY. 150ms ease-out on color/opacity. No scale, translate, lift, shift, or transforms on hover. Framer Motion is allowed for entry/exit animations, drawer slides, and component transitions. No spinners (use opacity pulse).

**Buttons:** Primary: `bg-[#ff8d49] text-[#2d2a26] px-6 py-2 rounded-full hover:bg-[#e67d3f]`. Secondary: `border-2 border-[#ff8d49] text-[#ff8d49] rounded-full hover:bg-[#ff8d49]/10`.

**Banned:** `text-gray-*`/`text-slate-*`/`bg-gray-*`/`bg-slate-*`, brown neutrals, `rounded-2xl`/`rounded-xl`, gradients, glassmorphism, `hover:scale-*`/`hover:-translate-*`, `shadow-elevation-*`, hard offset shadows, `font-black uppercase tracking-[0.2em]`, AI slop.

### State Management

Zustand in `src/stores/`. Selectors: `(s) => s.field`. New fields need `setFieldName` setters.

### API Routes

Check `session.user.role` for auth. 403 `PRO_REQUIRED` for pro endpoints. Rate limit auth endpoints. Next.js 16 async params: `{ params }: { params: Promise<{ id: string }> }` — must `await params`.

### Other Conventions

- **S3 uploads**: `/api/upload/presigned-url` — purposes: `fabric|thumbnail|export|block` (Pro), `mobile-upload` (all auth users)
- **Dashboard**: Bento grid with 6 cards, 3 have in-page sub-views via `DashboardTab`
- **Git**: Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`

## Design Studio (SSSOT)

### Three-Pane Workspace

```
┌──────────────────────────────────────────────────────┐
│ StudioTopBar                                          │
├──────┬────────────────────────────┬──────────────────┤
│ Tool │ CanvasWorkspace            │ ContextPanel     │
│ bar  │ + Fence Overlay            │ (320px)          │
│ 88px │ + User Blocks              │ Layouts/Blocks/  │
│      │                            │ Fabrics          │
├──────┴────────────────────────────┴──────────────────┤
│ BottomBar                                             │
└──────────────────────────────────────────────────────┘
```

- **Toolbar (left, 88px)**: Select, Pan, Easydraw, Bend, Rectangle, Triangle, Undo, Redo, Zoom In/Out. No advanced tiers, no pinned tools, no transform tools (those live in right-pane inspectors).
- **CanvasWorkspace**: Single Fabric.js canvas, never unmounted. Dimensions from `src/lib/quilt-sizing.ts`.
- **ContextPanel (right, 320px)**: Library tabs only. Never auto-switches on selection.

### Worktable Types

`WorktableType = 'quilt' | 'block-builder'` in `canvasStore.ts`. Tabs in `canvasStore.worktableTabs[]`. Layout Creator worktable has been removed — users pick presets from `LayoutSelector` and configure via `LayoutSettingsPanel`.

### Fence System (Layout Mode)

A layout is a **fence** — areas that accept specific drop types:
- `block-cell` → blocks only (snaps to exact position/scale/rotation)
- `sashing|cornerstone|border|binding|edging` → fabrics only (pattern fill)
- Drops outside valid areas → rejected silently (`not-allowed` cursor)

**Renderer**: `useFenceRenderer.ts` (hook) + `fence-engine.ts` (pure engine: LayoutTemplate + dimensions → FenceArea[]). Each area tagged with `_fenceElement`, `_fenceAreaId`, `_fenceRole`.

**Block drop** (`useBlockDrop.ts`): Temporarily disables `evented` on user blocks → `findTarget()` reads fence cells → snaps block → tags with `_inFenceCellId`. Overwrite semantics on occupied cells.

**Fabric drop** (`useFabricDrop` from `useFabricLayout.ts`): Fence chrome → pattern fill. Block group (`__isBlockGroup`) → per-patch `fabric.Pattern` fill via group-local coords.

### Shade System

Patches carry `__shade: 'dark' | 'light' | 'background' | 'unknown'`. Bulk assignment via `useShadeAssignment` + `shade-assignment-engine.ts`. Shade view toggle in BottomBar (non-destructive recolor, auto-deactivates on worktable switch/undo). `ShadeBreakdownPanel` appears above ContextPanel tabs when a block group is selected.

### Block Library

50 SVGs in `/quilt_blocks/` (`viewBox="0 0 300 300"`, grayscale). Types: `svg` (system), `custom` (user-drawn), `photo` (uploaded). Photo blocks via `SimplePhotoBlockUpload` → S3. Seeded from `src/db/seed/seedBlocksFromFiles.ts`.

### Block Builder

Engine: `block-builder-engine.ts` (shape generators, grid utils) + `blockbuilder-utils.ts` (`detectPatches()` via half-edge face traversal). Hook: `useBlockBuilder.ts`. Tools: `select|pencil|rectangle|triangle|circle|bend`. Worktable: `BlockBuilderWorktable.tsx` (600x600 canvas).

### Layout Templates

Stored in `layout_templates` DB table (`templateData` JSONB). API: `/api/templates`, `/api/layout-templates`. Types: `src/types/layout.ts`. Library: `src/lib/layout-library.ts` (`LAYOUT_PRESETS[]`, currently empty).

### SVG Block Conventions

`viewBox="0 0 300 300"`, palette: `#F8F8F8` BG, `#E0E0E0` light, `#D0D0D0` med-light, `#B0B0B0` med, `#505050` dark. `stroke="#333" stroke-width="1"`. Generator scripts in `scripts/gen_blocks_*.py`. Must represent real traditional quilting geometry.

## PDF Export

Commercial-grade output: cover, fabric requirements, cutting directions, block assembly, quilt diagram, cutting templates (1:1 scale with seam allowance). Solid = cut line, dashed = sew line.

Engines: `project-pdf-engine.ts` (full document), `cutlist-pdf-engine.ts` (cutting templates), `pdf-generator.ts` (bin-packed pieces), `pdf-drawing-utils.ts`, `canvas-snapshot.ts`. Supporting: `yardage-utils.ts`, `cutting-chart-generator.ts`.

## Photo-to-Design Pipeline

Photo → OpenCV web worker (15-step: sharpen, CLAHE, bilateral, adaptive threshold, watershed, contours) → `orphan-filter.ts` (remove noise) → `shape-normalizer-engine.ts` (cluster, regularize, equalize) → `edge-snapper-engine.ts` (snap shared edges, eliminate gaps) → `usePhotoPatternImport` (fabric.Polygon per piece with dominant color).

No grid detection, no block matching. Pieces are just "Piece 1", "Piece 2", etc. `perspective-utils.ts` handles angled photos.

## Fabric Library

2,764 solids from 16 manufacturers (QuiltySolid dataset, MIT). DB columns: `hex`, `value`, `colorFamily`, `manufacturer`, `collection`. System: `isDefault=true`. User: `isDefault=false, userId=<user>`.

## Shop System

Feature-flagged via `siteSettings` DB table (`shop_enabled`). Admin toggle at `/admin/settings` with type-to-confirm guard. Shop fabrics: `isPurchasable=true` with price/stock fields. Cart: `cartStore.ts` (Zustand + localStorage). Studio integration: "Shop" tab in FabricLibrary, `FabricPreviewModal`, `useShopEnabled` hook.

## Social Feed

At `/socialthreads`. Tables: `socialPosts`, `likes`, `comments`, `follows`, `reports`, `bookmarks`. API: `GET /api/social` with sort (newest|popular), search, category (`show-and-tell|wip|help|inspiration|general`), tab (discover|saved), pagination. Action buttons update on server success, no optimistic rollback. Toggle endpoints (bookmark, follow): single POST inserts or deletes.

Blog at `/blog` + `/blog/[slug]`, admin-only, `TiptapRenderer`. Profiles at `/api/members/[username]`.

## Mobile Uploads

Mobile → `UploadSheet` (compress HEIC→JPEG, upload S3 `mobile-upload`) → `mobile_uploads` DB record. Desktop → `MobileUploadsPanel` (assign type, process) → redirects to pipeline with `preloadUrl`. Max 50 pending per user. Status: `pending → processing → completed | failed`.

## Product Context

- **Photo-to-Design** is the key differentiator — never scale it back
- Studio is desktop-only (`StudioGate` redirects mobile)
- Mobile shell: Home, Upload FAB, Profile — 3 items only
- Templates at `/templates` (admin-published only)

## Key Dependencies

`clipper-lib` (seam allowance geometry), `isomorphic-dompurify` (HTML sanitization), `heic2any` (iOS photo conversion), `framer-motion` (animations), `pdf-lib` (PDF generation), `@upstash/ratelimit` (rate limiting).

## Removed (DO NOT REINTRODUCE)

**Components:** FloatingToolbar, ToolsMenu, LayoutRolePanel, SelectionPanel, BackgroundColorControl, KeyboardShortcutsModal, NewBlockSetupModal, PrintOptionsPanel, BlockDraftingErrorBoundary, PhotoPatternErrorBoundary, TourOverlay, FollowListModal, BlockSizePicker, ExportOptionsDialog, ResponsivePublicShell, Checkbox, NumberInput, SegmentedToggle, ProGate, PrintlistPanel, CommunityPreview, YardagePanel, BlogContent, ReportModal, BlockDraftingShell, BlockDraftingModal, LayoutBuilderShell, NewLayoutSetupModal, QuiltDimensionsPanel, all `panels/` directory.

**Hooks:** useLayoutEngine (replaced by fence engine), useLayoutRenderer (never existed — use `useFenceRenderer`), useBlockBuilderCanvas (never existed — use `useBlockBuilder`).

**Libs:** layout-renderer (replaced by fence-engine), layout-import-* (6 orphaned files), layout-block-matcher, layout-fabric-matcher, layout-parser-types, cn, colortheme-utils, logger.

**Types:** quilt-ocr, wizard, api (ApiResponse/PaginatedResponse).

**Features:** Minimap, Smart Guides, Symmetry Tool, Serendipity Tool, Fussy Cut Dialog, Image Tracing Panel, Quick Color Palette, old Onboarding Tour, Text Tool, Applique Tab.

**Dead state:** `projectStore.worktables[]` — superseded by `canvasStore.worktableTabs[]`.

## PM2

| Port | Name | Type |
|------|------|------|
| 3000 | quilt-3000 | Next.js |
| 5432 | quiltcorgi-db | PostgreSQL (Docker Compose via `npm run db:local:up`) |

`pm2 start ecosystem.config.cjs` (first time) / `pm2 start all` / `pm2 stop all` / `pm2 logs` / `pm2 monit`
