# Studio Workspace Redesign — Visual QA & Fix Session

## Context

QuiltCorgi is a quilt design web app (Next.js 16 + React 19 + Fabric.js + Tailwind v4). The studio is the core workspace where users design quilts. It lives at `/studio/[projectId]`.

The studio has severe usability issues: low contrast text, poor tool visibility, illogical panel placement, cramped layout, and elements that are hard to discover. Use Playwright (via agent-browser or chrome-devtools MCP) to visually inspect every part of the studio, screenshot each area, then fix the code.

## Current Studio Layout (left to right)

1. **Left toolbar** (`src/components/studio/Toolbar.tsx`) — vertical tool rail with primary tools + expandable advanced column
2. **Block Library** / **Fabric Library** — slide-out panels over canvas
3. **Canvas area** — rulers (top/left), Fabric.js canvas, floating toolbar at bottom
4. **Right context panel** (`src/components/studio/ContextPanel.tsx`, `w-70` = 280px) — Precision controls, Rotate & Shear, Colorway, Text options
5. **Top bar** (`src/components/studio/StudioTopBar.tsx`) — hamburger, worktable switcher (QUILT/BLOCK/IMAGE/PRINT), project name, EXPORT button, Help button

Overlays: `YardagePanel`, `PrintlistPanel`, `PieceInspectorPanel` float on top of the canvas.

## Issues to Fix

### 1. Text Contrast — CRITICAL
- All `text-secondary` labels in the context panel are too light (color `#6B5A4D` at low opacity)
- Section titles like "PRECISION", "ROTATE & SHEAR", "COLORWAY" are barely readable
- Number input labels ("Block Width", "Snaps Horiz") are too faint
- Fix: darken `text-secondary` usages in studio components, or use `text-on-surface` (`#4A3B32`) for labels

### 2. Tool Icon Visibility
- Toolbar icons use `text-secondary` (`#6B5A4D`) which is low contrast against the light background
- Active tool highlight (`bg-primary-container/30`) is too subtle
- The "More Tools" toggle (three dots) is easy to miss
- Fix: use darker idle color, stronger active state (solid background, not 30% opacity)

### 3. PrintlistPanel & YardagePanel Placement
- Currently: float as overlays on top of the canvas (easy to miss, cover the work)
- Should be: docked on the LEFT edge as a slide-out panel (like Block/Fabric Library)
- Top 1/3 of the panel should show a preview + dimensions of the currently selected piece
- Bottom 2/3 should show the list/data
- Files: `src/components/export/PrintlistPanel.tsx`, `src/components/measurement/YardagePanel.tsx`

### 4. Right Context Panel (`ContextPanel.tsx`)
- Content is cramped in 280px with no breathing room
- "APPLY" buttons on Rotate/Shear rows push content too wide (horizontal overflow, now hidden with `overflow-x-hidden`)
- Better: remove APPLY buttons, apply values on Enter/blur instead
- Number inputs need more padding and clearer labels
- The Colorway section collapser is tiny and hard to discover

### 5. Floating Toolbar (bottom center)
- `src/components/studio/FloatingToolbar.tsx` — drawing shape tools at bottom of canvas
- Icons are small and lack labels or tooltips on hover
- Should have better spacing and clearer active states

### 6. General Spacing & Layout
- Everything feels packed together — needs more whitespace
- Panel sections need clear visual separation (not just thin borders)
- The canvas area should feel open, with tools cleanly docked around it
- Studio top bar project name area is cramped

## Design System Reference

- Warm-cream glassmorphic system
- Primary: `#FFB085` (warm peach), dark: `#C67B5C`
- Text on surface: `#4A3B32`, secondary: `#6B5A4D`
- Surfaces: `#FFF9F2` (lightest) → `#E8DCCB` (darkest)
- Glass tiers: `.glass-card`, `.glass-elevated`, `.glass-inset`, `.glass-panel`
- Fonts: Manrope (sans), JetBrains Mono (mono)
- Spacing base: `0.35rem`, radii: sm 6px, md 10px, lg 16px

## Key Files to Modify

| File | What to fix |
|------|------------|
| `src/components/studio/ContextPanel.tsx` | Text contrast, spacing, remove APPLY buttons, apply-on-blur |
| `src/components/studio/Toolbar.tsx` | Icon contrast, active states, spacing |
| `src/components/studio/ToolbarConfig.tsx` | Icon sizes already bumped to 24px, verify contrast |
| `src/components/ui/ToolIcon.tsx` | Active state styling, hover states |
| `src/components/studio/ColorwayTools.tsx` | Section header contrast, expand/collapse affordance |
| `src/components/studio/FloatingToolbar.tsx` | Spacing, icon size, active states |
| `src/components/studio/StudioTopBar.tsx` | Project name spacing |
| `src/components/studio/StudioClient.tsx` | Move PrintlistPanel/YardagePanel to left dock |
| `src/components/export/PrintlistPanel.tsx` | Redesign as left-docked panel with piece preview |
| `src/components/measurement/YardagePanel.tsx` | Redesign as left-docked panel |
| `src/components/ui/NumberInput.tsx` | Label contrast, padding |
| `src/components/ui/SectionTitle.tsx` | Text contrast |
| `src/components/ui/Separator.tsx` | Visibility |

## Workflow

1. Start the dev server: `cd /home/chrishoran/Desktop/Quilt/quiltcorgi && npm run dev`
2. Navigate to `http://localhost:3000/dashboard`, create a project or open an existing one to get to the studio
3. Screenshot the full studio, then each panel area individually
4. For each issue: fix the code, reload, screenshot to verify
5. Test all 4 worktables (QUILT, BLOCK, IMAGE, PRINT)
6. Verify the right context panel has no horizontal scroll
7. Verify the toolbar icons are clearly visible
8. Verify all text is readable at normal viewing distance

## Do NOT

- Change the overall layout paradigm (keep toolbar left, canvas center, context right)
- Add new features beyond what's described
- Change the design system colors/fonts — just use them properly
- Add unnecessary comments or documentation
