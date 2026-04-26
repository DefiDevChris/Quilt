# Quilt – AI Coding Guidelines

## Project Overview
Quilt is a Next.js 14 (App Router) quilting-design application. Users pick a project mode (template, layout, or freeform), configure their quilt on a **SelectionShell**, and then land in a **StudioLayout** canvas where they can design their quilt.

---

## Architecture

### Tech Stack
- **Framework**: Next.js 14 App Router (`src/app/`)
- **Language**: TypeScript (strict)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Canvas**: Fabric.js (`fabric` npm package) – always dynamically imported
- **State**: Zustand stores (`src/stores/`)
- **Auth / DB**: Supabase (`@supabase/supabase-js`, `@supabase/ssr`)
- **Payments**: Stripe
- **Fonts**: `next/font` (Geist)

---

## Studio Flow (Three Modes)

The studio has **one locked-choice flow**: the user picks a mode in `SelectionShell` and cannot change it once they click **Start Designing**.

```
/studio?mode=template   → SelectionShell (template picker)
/studio?mode=layout     → SelectionShell (layout size picker)
/studio?mode=freeform   → SelectionShell (freeform size picker)
       ↓  "Start Designing" locks the choice
   StudioLayout  (canvas + chrome)
```

### Phase 1 – SelectionShell (`src/components/studio/SelectionShell.tsx`)
Handles **all three modes** before the canvas opens:
- **template** – shows My Templates / Template Library sub-tabs; picking a template locks size + fabric list
- **layout** – shows a size-picker (standard quilt sizes via `quilt-size-presets`)
- **freeform** – shows width × height numeric inputs

Once the user clicks "Start Designing", `projectStore` is written and the shell is dismissed.

### Phase 2 – StudioLayout (`src/components/studio/StudioLayout.tsx`)
Mounts the live Fabric.js canvas. Receives the locked project config from `projectStore`.
- Canvas is initialised with the correct pixel dimensions
- Toolbar and top-bar chrome are rendered around the canvas
- **Block Builder tab** is shown only for `layout` and `freeform` modes (NOT `template`)

---

## Key Components

| File | Purpose |
|------|---------|
| `src/components/studio/SelectionShell.tsx` | Pre-canvas mode/size/template picker |
| `src/components/studio/StudioLayout.tsx` | Canvas mount + studio chrome |
| `src/components/studio/StudioClient.tsx` | Top-level client wrapper, manages shell↔canvas phase |
| `src/components/studio/StudioTopBar.tsx` | Top navigation bar inside studio |
| `src/components/studio/Toolbar.tsx` | Left/right toolbar; Block Builder tab gated to layout+freeform |
| `src/components/studio/SaveAsTemplateModal.tsx` | Save current canvas state as a user template |
| `src/components/studio/ProjectModeModal.tsx` | (Legacy / informational modal – may be removed) |
| `src/components/studio/StudioDropZone.tsx` | Drag-and-drop fabric swatch handler |

---

## Stores

### `projectStore` (`src/stores/projectStore.ts`)
Holds the **locked** project configuration:
```ts
{
  mode: 'template' | 'layout' | 'freeform' | null
  width: number        // inches
  height: number       // inches
  templateId?: string
  fabricIds: string[]  // locked-in fabrics (template mode)
  isLocked: boolean    // true once "Start Designing" is clicked
}
```

### `layoutStore` (`src/stores/layoutStore.ts`)
Manages the Fabric.js canvas state:
- Selected objects, zoom, pan
- Block definitions for layout mode
- `clearAllFabrics()` action – removes all fabric swatches from canvas

---

## Hooks

| Hook | Purpose |
|------|---------|
| `useTemplateHydration` | Loads a saved template into the canvas on mount |
| `useUserTemplates` | Fetches the authenticated user's saved templates |

---

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/templates` | GET | List user templates |
| `/api/templates` | POST | Save new template |
| `/api/templates/[id]` | GET | Fetch single template |
| `/api/templates/[id]` | PUT | Update template |
| `/api/templates/[id]` | DELETE | Delete template |

---

## Lib Utilities

| File | Purpose |
|------|---------|
| `src/lib/quilt-size-presets.ts` | Standard quilt size lookup table (name → inches) |
| `src/lib/layout-size-utils.ts` | Convert inches → canvas pixels, aspect-ratio helpers |
| `src/lib/clear-canvas-fabrics.ts` | Pure helper – removes fabric objects from a Fabric.js canvas |

---

## Types

| File | Purpose |
|------|---------|
| `src/types/userTemplate.ts` | `UserTemplate` interface for saved templates |

---

## Coding Conventions

1. **No `LayoutSelector`** – that component was removed. Size/layout selection lives in `SelectionShell`.
2. **Mode is locked after Start Designing** – never render a mode-change UI inside `StudioLayout`.
3. **Block Builder tab** – only render for `mode !== 'template'`.
4. **Dynamic imports for Fabric.js** – always use `dynamic(() => import('fabric'), { ssr: false })`.
5. **Supabase clients** – use `createServerClient` (server components / route handlers) and `createBrowserClient` (client components).
6. **Tailwind only** – no CSS modules or inline styles except for canvas pixel dimensions.
7. **shadcn/ui** – prefer shadcn primitives (Button, Dialog, Tabs, etc.) over custom implementations.
8. **Zustand** – keep stores flat; avoid nested objects where possible.

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
```

---

## Commands

```bash
npm run dev      # Start dev server (port 3000)
npm run build    # Production build
npm run lint     # ESLint
npm run type-check  # tsc --noEmit
```
