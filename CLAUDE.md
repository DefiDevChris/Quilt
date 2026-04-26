# CLAUDE.md — Quilt Design Studio: AI Agent Guidelines

This file is the authoritative reference for **Claude** working inside this repository. Read it fully before touching any file.

> **Context retrieval:** For detailed feature docs (Studio architecture, PDF export, Shop, Social, Mobile uploads, removed-features list), query **mempalace** (`mempalace_search` with wing `quilt`). Only coding conventions and daily-use commands live here.

---

## 1. Repository overview

Quilt is a Next.js 15 (App Router) web app for designing quilts. The stack is:

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15, React 19, TypeScript strict |
| Styling | Tailwind CSS v4 (`@theme` tokens, no `tailwind.config.js`) |
| Canvas | Fabric.js 6 (wrapped in `useCanvasStore`) |
| State | Zustand (one store per domain) |
| Icons | `lucide-react` only |
| Toasts | `sonner` only |
| Fonts | Google Fonts via `<link>` in `layout.tsx` — Montserrat (body) / Noto Sans (headings) |

---

## 2. Brand & design rules — **non-negotiable**

### Colors

All color references **must** go through CSS variables (Easter-spring light-blue SSOT):

```
--color-bg               #FEFDFB   page background (warm off-white)
--color-surface          #ffffff   cards, dialogs, elevated panels
--color-text             #36312D   primary text (warm near-black)
--color-text-dim         #7A726C   secondary text, placeholders
--color-text-on-primary  #ffffff   text on primary-colored surfaces
--color-border           #E6E1DC   default borders
--color-border-strong    #7A726C   hover / focus borders
--color-primary          #7CB9E8   brand sky blue (buttons, links, focus rings)
--color-primary-hover    #5AA0D5   primary hover state
<<<<<<< HEAD
--color-primary-light    #EBF4FF   tinted primary backgrounds
--color-primary-dark     #3A7BC8   (legacy alias — prefer --color-primary-hover)
--color-accent-light     #F5EDE4   tinted accent backgrounds
=======
--color-secondary        #C5DFF3   pale sky — dividers, inactive tabs, tinted primary bg
--color-accent           #FFE08A   buttercup — rare highlights, featured/new
--color-accent-blush     #F6C6C8   blush — sparing community/warmth moments
--color-success          #4CAF50
--color-warning          #FFE08A   (aligned with accent/buttercup)
--color-error            #EF5350
>>>>>>> ecc74e122bc821f9430c9372f3f4928a12183268
```

**Removed legacy aliases** (do not use, previously aliased for migration):
`--color-background` → `--color-bg`
`--color-surface-alt` → `--color-bg`
`--color-text-muted` → `--color-text-dim`
`--color-primary-light` → `--color-secondary`
`--color-primary-dark` → `--color-primary-hover`
`--color-accent-light` → `--color-accent`

Typography tokens:

```
--font-sans        'Montserrat', system-ui, sans-serif   (body)
--font-heading     'Noto Sans', system-ui, sans-serif    (h1–h6)
```

Never use raw hex codes in `className` attributes. Never use `bg-white`, `text-black`, `font-['Noto_Serif']`, or `font-['Spline_Sans']`.

### Radius

`rounded-lg` is the standard radius for cards, modals, buttons, and inputs.  
`rounded-full` is allowed for avatars/badges only.  
**Banned:** `rounded-xl`, `rounded-2xl`, `rounded-3xl`.

### Shadows

Use the `shadow-elevated` utility (defined in `globals.css`).  
**Banned:** `shadow-elevation-*` (undefined), `shadow-lg`, `drop-shadow-*`.

### Transitions

All transitions **must** be `transition-colors duration-150`.  
**Banned:** `transition-all`, any duration other than `150`ms, `hover:scale-*`, `hover:shadow-lg`, `hover:-translate-*`, `active:translate-*`.

### Buttons

```tsx
// Primary button — correct
<button className="btn-primary transition-colors duration-150">Save</button>
// hover handled by .btn-primary:hover { background-color: var(--color-primary-hover); }

// Secondary button — correct
<button className="btn-secondary">Cancel</button>
```

---

## 3. State management conventions

- **One Zustand store per domain.** Current stores: `canvasStore`, `layoutStore`, `projectStore`, `uiStore`.
- Access state inside components via `useXxxStore(selector)`. Call `.getState()` only in event handlers or utilities outside React.
- The `fabricCanvas` ref lives in `canvasStore`; treat its type as `unknown` at store boundaries and cast only where needed with a minimal structural type.
- `useLayoutStore` holds the current layout configuration. Call `store.applyLayout()` **after** all setters.

---

## 4. Canvas conventions

- The Fabric.js instance is created inside `CanvasWorkspace` and stored via `useCanvasStore.setState({ fabricCanvas: canvas })`.
- To clear the canvas, use the `clearFabricCanvas` helper (`src/lib/canvas/clearFabricCanvas.ts`).
- To apply a layout, use the `applyLayoutConfig` helper (`src/lib/layout/applyLayoutConfig.ts`).
- Never import Fabric.js types directly in components. Always go through the store.
- `centerAndFitViewport()` is available on the canvas store. Call it **after** confirming `fabricCanvas` is non-null (subscribe via Zustand selector, not RAF).

---

## 5. File & component conventions

- Components live under `src/components/<domain>/`. One component per file, PascalCase filename.
- Utility helpers live under `src/lib/<domain>/`. One concern per file, camelCase filename.
- Never create barrel `index.ts` files (they break tree-shaking in the App Router).
- `'use client'` is required for any file that uses hooks, event handlers, or browser APIs.
- Server Components are the default for page-level layouts; pass only serialisable props from Server → Client boundaries.

---

## 6. Restricted patterns

| Banned | Use instead |
|--------|-------------|
| `rounded-xl / 2xl / 3xl` | `rounded-lg` |
| `bg-white` / `text-black` | CSS variable equivalents |
| `shadow-elevation-*` | `shadow-elevated` |
| `transition-all` | `transition-colors duration-150` |
| `hover:scale-*` / `hover:shadow-lg` | color-only hover |
| `hover:-translate-*` / `active:translate-*` | color-only hover |
| Raw hex in `className` | `bg-[var(--color-xxx)]` |
| Barrel `index.ts` | Direct named imports |
| Importing Fabric types in components | Structural cast via store |

---

## 7. Testing checklist (before every PR)

- [ ] `next build` passes with zero TS errors and zero unused-import warnings.
- [ ] No `console.error` / `console.warn` in the browser after a cold load.
- [ ] New project flow: canvas fits to default dimensions on first frame (not at ZOOM_DEFAULT).
- [ ] Existing project load: layout state restored without re-triggering default-layout bootstrap.
- [ ] StrictMode double-mount: viewport fit fires exactly once.
- [ ] All interactive elements have visible focus rings and meet WCAG AA contrast.
- [ ] No banned Tailwind classes appear in any changed file (`grep -R "rounded-xl\|transition-all" src/`).

---

## 8. Design Studio modes (the three-mode spec)

Studio is the heart of the app. There are exactly **three project modes**, picked once via `ProjectModeModal` and locked for the project's life.

| Mode | Phase 1 (configuring) | Phase 2 (designing) | Block Builder tab |
|------|----------------------|---------------------|-------------------|
| Template | Pick a pre-built quilt; binding-width slider | Pre-stamped fabrics + shapes; "Clear fabrics" button strips back to bare shapes | **No** (template is pre-baked; nothing to build) |
| Layout | Pick layout family + preset; grid/sashing/border sliders | Drag blocks into block cells, fabrics onto sashing/border/edging | Yes |
| Freeform | Pick a quilt-size preset (or custom); width/height sliders | Blank canvas + full drawing tools | Yes (author standalone blocks for reuse) |

Phase 1 UI is `SelectionShell`; Phase 2 UI is `StudioLayout`. Confirmation is "Start Designing" at the bottom of the right rail. After commit, `useLayoutStore.layoutLocked === true` and every layout setter is a no-op — to change a project's mode/layout, the user creates a new project.

Phase 2 chrome:
- Left = `Toolbar` (mode-aware: drawing tools hidden when fence is applied)
- Center = `StudioDropZone` → `CanvasWorkspace`, OR `BlockBuilderWorktable` when on the Block Builder tab
- Right = `ContextPanel` with **Blocks** + **Fabrics** tabs
- Top tab strip switches Quilt ⇄ Block Builder (layout/freeform only)

Template hydration (background fabric stamp) runs once via `useTemplateHydration` on `pendingTemplateId`. Block placement requires seeded library blocks and is currently a TODO inside that hook.

### Templates: system vs user

Templates have two sources:
- **Template Library** — `QUILT_TEMPLATES` in `src/lib/templates.ts`, defined in code, ships with the app.
- **My Templates** — rows in the `layoutTemplates` table (DB), scoped to a `userId`. Saved via the "Save as Template" button in `StudioTopBar`. Listed via `GET /api/templates?scope=mine`.

`TemplateCatalog` in `SelectionShell` exposes both sources as a tab toggle, mirroring the Blocks library/mine pattern. The user-facing routes are `src/app/api/templates/route.ts` (GET list, POST save) and `src/app/api/templates/[id]/route.ts` (GET one, DELETE). They use the project's existing `getRequiredSession` (Cognito) and Drizzle `db` — same auth/DB stack as the rest of the app.

---

## 9. Commit message format

```
<type>(<scope>): <short summary>

- Bullet list of changes
- Each bullet describes one logical change
```

Types: `feat`, `fix`, `refactor`, `style`, `docs`, `chore`.

---

*Last updated: see git log.*
