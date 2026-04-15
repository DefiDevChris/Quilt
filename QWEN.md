# CLAUDE.md

> **IMPORTANT:** This file MUST stay identical to `QWEN.md` at all times.

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

Set `AWS_SECRET_NAME=skip` in `.env.local` for local dev. Direct SQL: `docker exec -i $(docker ps --filter ancestor=postgres -q | head -1) psql -U quiltcorgi -d quiltcorgi -c "SELECT ..."`

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

**Auth**: Cognito HTTP-only cookies (`qc_id_token`, `qc_access_token`, `qc_refresh_token`). `src/proxy.ts` verifies JWT via JWKS. `getSession()` does DB lookup. Roles: `free | pro | admin`.

**Route protection**: `/studio/*` redirects guests. `/admin/*` requires admin. Pro gating: `useAuthStore.isPro` client-side, `session.user.role` + 403 `PRO_REQUIRED` server-side.

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

**Colors:** `--primary: #ff8d49` | `--secondary: #ffc8a6` | `--accent: #ffc7c7` | `--bg: #faf9f7` | `--surface: #ffffff` | `--text: #1a1a1a` | `--text-dim: #4a4a4a` | `--border: #d4d4d4`. Light mode only.

**Typography:** Headings: **Spline Sans** (400-700). Body: **Inter** (300-700).

**Shape:** Buttons/CTAs/tabs/pills: `rounded-full`. Cards/containers/inputs/dialogs: `rounded-lg` (8px). Shadow: `0 1px 2px rgba(26,26,26,0.08)`.

**Motion:** Hover changes color/background ONLY. 150ms ease-out. No scale/translate/lift on hover. Framer Motion for entry/exit animations only. No spinners (use opacity pulse).

**Buttons:** Primary: `bg-[#ff8d49] text-[#1a1a1a] px-6 py-2 rounded-full hover:bg-[#e67d3f]`. Secondary: `border-2 border-[#ff8d49] text-[#ff8d49] rounded-full hover:bg-[#ff8d49]/10`.

**Banned:** `text-gray-*`/`text-slate-*`/`bg-gray-*`/`bg-slate-*`, brown neutrals, `rounded-2xl`/`rounded-xl`, `font-black uppercase tracking-[0.2em]`, AI slop.

### State & API

Zustand in `src/stores/`. Selectors: `(s) => s.field`. New fields need `setFieldName` setters.

API routes: check `session.user.role` for auth. 403 `PRO_REQUIRED` for pro endpoints. Next.js 16 async params: `{ params }: { params: Promise<{ id: string }> }` — must `await params`.

### Other

- **S3 uploads**: `/api/upload/presigned-url` — purposes: `fabric|thumbnail|export|block` (Pro), `mobile-upload` (all auth)
- **Git**: Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`

## Removed (DO NOT REINTRODUCE)

Query `mempalace_search("removed features do not reintroduce", wing="quilt")` for the full list. Key items: FloatingToolbar, LayoutRolePanel, SelectionPanel, PrintlistPanel, ProGate, all `panels/` directory, useLayoutEngine, useLayoutRenderer, layout-renderer, cn, logger, Minimap, Smart Guides, Serendipity Tool, Text Tool, Applique Tab.

## PM2

| Port | Name          | Type                                          |
| ---- | ------------- | --------------------------------------------- |
| 3000 | quilt-3000    | Next.js                                       |
| 5432 | quiltcorgi-db | PostgreSQL (Docker via `npm run db:local:up`) |

`pm2 start ecosystem.config.cjs` (first time) / `pm2 start all` / `pm2 stop all` / `pm2 logs` / `pm2 monit`
