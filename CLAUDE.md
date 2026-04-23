# CLAUDE.md

> **Context retrieval:** For detailed feature docs (Studio architecture, PDF export, Shop, Social, Mobile uploads, removed-features list), query **mempalace** (`mempalace_search` with wing `quilt`). Only coding conventions and daily-use commands live here.

## Project Overview

Next.js 16 quilt design app — Fabric.js canvas, Zustand state, PostgreSQL/Drizzle, AWS Cognito auth, Stripe payments. Users pick layouts, assign blocks/fabrics, export print-ready PDF patterns.

**Flagship features:** Design Studio, Block Photo Upload, PDF Pattern Export.

## Commands

```bash
npm install && npm run db:local:up && npm run db:push && npm run dev  # Full local setup
npm run build && npm run type-check && npm run lint && npm run format
npm test                   # Vitest (70% lines/functions/statements, 60% branches)
npm run test:e2e           # Playwright (chromium, firefox, webkit, mobile-chrome, mobile-safari)
npm run db:generate        # Needs DATABASE_URL=postgresql://quiltcorgi:localdev@localhost:5432/quiltcorgi
npm run db:migrate && npm run db:push && npm run db:studio
npm run db:seed:blog && npm run db:seed:layouts
DATABASE_URL=postgresql://quiltcorgi:localdev@localhost:5432/quiltcorgi npx tsx src/db/seed/seedFabrics.ts
DATABASE_URL=postgresql://quiltcorgi:localdev@localhost:5432/quiltcorgi npx tsx src/db/seed/seedBlocksFromFiles.ts
```

Direct SQL: `docker exec -i $(docker ps --filter ancestor=postgres -q | head -1) psql -U quiltcorgi -d quiltcorgi -c "SELECT ..."`

## Architecture

```
src/
  app/              # App Router (pages + API routes)
  components/       # React components by domain
  hooks/            # Bridges between engines and Fabric.js canvas
  stores/           # Zustand stores
  lib/*-engine.ts   # Pure computation — zero DOM deps
  lib/*-utils.ts    # Domain utilities
  db/schema/        # Drizzle table definitions
  types/            # Shared TypeScript types
```

**Core pattern**: Engines are pure computation. Hooks bridge engines to Fabric.js. Components handle UI only.

**Path alias**: `@/*` → `./src/*`

**Auth**: Cognito HTTP-only cookies (`qc_id_token`, `qc_access_token`, `qc_refresh_token`). `src/middleware.ts` verifies JWT via JWKS and runs CSRF guard on `/api/*`. `getSession()` does DB lookup. Roles: `free | pro | admin`.

**Route protection**: `/studio/*` redirects guests. `/admin/*` requires admin. Pro gating: `useAuthStore.isPro` client-side, `session.user.role` + 403 `PRO_REQUIRED` server-side.

**Project modes**: Projects are locked to one of three modes at creation: 'free-form', 'layout', 'template'. Cannot be changed afterward.

## Conventions

### Fabric.js

- Dynamic import only: `const fabric = await import('fabric')`
- Canvas refs: `useRef<unknown>(null)`, cast as `InstanceType<typeof fabric.Canvas>`
- Grid lines: `stroke: '#E5E2DD'` — filter out when extracting user objects
- Overlay objects: `(obj as unknown as { name?: string }).name === 'overlay-ref'`
- SVG loading: `as unknown as Array<InstanceType<typeof fabric.FabricObject>> | null`
- Group options: `as Record<string, unknown>` for custom props
- Always `scaleX === scaleY` for overlays

### TypeScript

No `any` — use `unknown` with proper casts. Type assertions at boundaries only (Fabric.js interop).

### Styling & Design System

Tailwind CSS v4. Full spec in `brand_config.json`.

**Colors:** `--primary: #f08060` | `--secondary: #f5c4b0` | `--accent: #ffc7c7` | `--bg: #faf9f7` | `--surface: #ffffff` | `--text: #1a1a1a` | `--text-dim: #4a4a4a` | `--border: #d4d4d4`. Light mode only.

**Typography:** Headings: **Spline Sans** (400-700). Body: **Inter** (300-700).

**Shape:** Buttons/CTAs/tabs/pills: `rounded-full`. Cards/containers/inputs/dialogs: `rounded-lg` (8px). Shadow: `0 1px 2px rgba(26,26,26,0.08)`.

**Motion:** Hover changes color/background ONLY. 150ms ease-out. No scale/translate/lift on hover. Framer Motion for entry/exit animations only. No spinners (use opacity pulse).

**Buttons:** Primary: `bg-[#f08060] text-[#1a1a1a] px-6 py-2 rounded-full hover:bg-[#d97054]`. Secondary: `border-2 border-[#f08060] text-[#f08060] rounded-full hover:bg-[#f08060]/10`.

**Banned:** `text-gray-*`/`text-slate-*`/`bg-gray-*`/`bg-slate-*`, brown neutrals, `rounded-2xl`/`rounded-xl`, `font-black uppercase tracking-[0.2em]`, AI slop.

### State & API

Zustand in `src/stores/`. Selectors: `(s) => s.field`. New fields need `setFieldName` setters.

API routes: check `session.user.role` for auth. 403 `PRO_REQUIRED` for pro endpoints. Next.js 16 async params: `{ params }: { params: Promise<{ id: string }> }` — must `await params`.

### Interaction patterns

Canvas edits use a floating selection toolbar (`CanvasSelectionToolbar`) as the primary affordance. Right-click `ContextMenu` is a shortcut only. Both share handlers via `src/hooks/useSelectionActions.ts`.

Selection-type → toolbar buttons mapping:

- **block**: Rotate · Swap · Fabric · Recolor patch · Delete
- **border**: Fabric · Width -/+ · Insert · Remove
- **sashing**: Fabric · Width -/+ · Color
- **patch**: Fabric · Color
- **easydraw**: Bend · Rotate · Delete
- **bent**: Edit bend · Make straight · Rotate · Delete

### Block Sizing Invariant

Block Builder and Design Studio share the same inch-based coordinate system. A block saved with widthIn=12 and heightIn=12 in Block Builder appears as exactly 12" × 12" when placed on the quilt canvas (native size, before any layout scaling). Visual zoom levels differ, but the underlying inch units are 1:1. Free-form projects place blocks at native size; Layout/Template projects scale blocks to fill cells.

### EasyDraw + Bend

Phase 8 simplified drawing tools (free-form mode only, no bezier handles):

**EasyDraw**: Continuous polygon drawing tool. Click to add vertices (snapped to grid corners). A dynamic preview line updates as you draw. Click the starting point again to close and complete the shape. Escape or right-click cancels the entire unclosed shape. Segments tagged `__easyDrawSegment = true`, data stored in `__segmentData`.

**Bend**: Click-drag on existing segment. Click down at P1 (snapped to grid), drag to P2 (snapped to grid), release creates quadratic arc. Control point calculated as `C = (P2 - (1-t)²·A - t²·B) / (2·t·(1-t))`. Fall back to midpoint control if t≈0 or t≈1. Bent segments tagged `__bentSegment = true`, data retains A, B, t, P2, controlPoint for re-editing. Re-bending replaces the curve. Make-straight converts back to line.

### Snapping & Grid

Two-mode snapping behavior:

- **Layout/Template mode**: Blocks/fabrics snap to cell centers. Drawing tools constrained to cells.
- **Free-form mode**: Blocks/fabrics snap to grid corners. Drawing tools snap to grid corners. Configurable grid granularity: 1"/½"/¼".

Grid granularity stored in `projects.gridGranularity` (enum: 'inch'|'half'|'quarter'). On granularity change: recompute grid overlay, existing geometry unchanged.

### Other

- **S3 uploads**: `/api/upload/presigned-url` — purposes: `fabric|thumbnail|export|block` (Pro), `mobile-upload` (all auth)
- **Git**: Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`

## Removed (DO NOT REINTRODUCE)

Query `mempalace_search("removed features do not reintroduce", wing="quilt")` for the full list. Key items: FloatingToolbar, LayoutRolePanel, SelectionPanel, PrintlistPanel, ProGate, all `panels/` directory, useLayoutEngine, useLayoutRenderer, layout-renderer, cn, logger, Minimap, Smart Guides, Serendipity Tool, Text Tool, Applique Tab, **user avatars** (`userProfiles.avatarUrl`, corgi mascot picker, `/api/profile/avatar`, `/api/upload/avatar-presign`), **onboarding flow** (profile auto-created on first signin with `displayName = email prefix`), **public project sharing** (`/share/[id]`, `projects.isPublic`, `/api/projects/[id]/public`, `ProjectViewer`), `src/lib/fraction-utils.ts` (merged into `fraction-math.ts`), **canvas setup gating modal on empty-project first visit** — canvas always loads with default 4x4 grid; setup wizard opens only from dashboard New Project or top-bar Edit Layout, **block photo upload from Design Studio** — this feature is now exclusive to Picture-My-Blocks. Studio Blocks tab only offers drafting via '+ Draft new block'. **Top-bar Quilt | Block Builder worktable tabs** — Drafting reached ONLY via Blocks tab '+ Draft new block'; Block Builder is a full-screen take-over.

## PM2

| Port | Name          | Type                                          |
| ---- | ------------- | --------------------------------------------- |
| 3000 | quilt-3000    | Next.js                                       |
| 5432 | quiltcorgi-db | PostgreSQL (Docker via `npm run db:local:up`) |

`pm2 start ecosystem.config.cjs` (first time) / `pm2 start all` / `pm2 stop all` / `pm2 logs` / `pm2 monit`
