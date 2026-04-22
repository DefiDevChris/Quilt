# CLAUDE.md — Quilt Design Studio: AI Agent Guidelines

This file is the authoritative reference for **Claude** working inside this repository. Read it fully before touching any file.

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
| Fonts | `next/font/google` (Geist Sans / Geist Mono) |

---

## 2. Brand & design rules — **non-negotiable**

### Colors

All color references **must** go through CSS variables:

```
--color-surface          #FAFAF8   page / panel background
--color-surface-alt      #F4F3F0   secondary backgrounds, card fills
--color-text             #1A1A1A   primary text
--color-text-muted       #6B6B6B   secondary text, placeholders
--color-text-on-primary  #FFFFFF   text on primary-colored surfaces
--color-border           #E8E6E1   default borders
--color-border-strong    #C8C5BE   hover / focus borders
--color-primary          #4A90D5   brand blue (buttons, links, focus rings)
--color-primary-hover    #5AA0D5   primary hover state
--color-primary-light    #EBF4FF   tinted primary backgrounds
--color-primary-dark     #3A7BC8   (legacy alias — prefer --color-primary-hover)
--color-accent           #8B5E3C   warm brown accent
--color-accent-light     #F5EDE4   tinted accent backgrounds
```

Never use raw hex codes in `className` attributes. Never use `bg-white`, `text-black`, etc.

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

## 8. Commit message format

```
<type>(<scope>): <short summary>

- Bullet list of changes
- Each bullet describes one logical change
```

Types: `feat`, `fix`, `refactor`, `style`, `docs`, `chore`.

---

*Last updated: see git log.*
