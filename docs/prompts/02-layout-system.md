# Workstream 2: Layout System & Templates

## Goal

Build the layout template system so users can pick a layout when starting a quilt, then configure borders, sashing, cornerstones, and block cells within their chosen dimensions.

## Context

The project is a Next.js 16 quilt design app at `/home/chrishoran/Desktop/Quilt`. Read `CLAUDE.md` in the repo root for full architecture. The canvas uses Fabric.js 7.2 (always dynamic import). State is in Zustand stores (`src/stores/`).

**How layouts work in quilting**: A quilt layout defines the structural grid of the quilt top. Common layouts include:

- **Straight set** — Blocks arranged in a simple grid (rows x columns)
- **Sashing** — Strips of fabric between blocks, with small cornerstone squares where sashing strips meet
- **On-point / diagonal** — Blocks rotated 45 degrees, with setting triangles filling the edges
- **Medallion** — A center block surrounded by concentric borders
- **Strippy** — Alternating vertical columns of blocks and fabric strips

Each layout has configurable areas:
- **Block cells** — Where quilt blocks are placed
- **Sashing** — Strips between blocks (configurable width)
- **Cornerstones** — Small squares where sashing strips intersect
- **Borders** — One or more border frames around the entire quilt (configurable width)
- **Binding** — The narrow outermost edge

## Current State

- `WorktableType` includes `'layout'` in `src/stores/canvasStore.ts`
- `layout_templates` table exists in DB (`src/db/schema/layoutTemplates.ts`) with `templateData` JSONB column
- `/api/templates` route exists
- `src/stores/layoutStore.ts` exists (check its current state)
- `src/components/studio/LayoutSettingsPanel.tsx` exists
- `/quilt_layouts/` directory is empty — no layout SVGs exist yet
- `TemplateLibrary` component needs to be built (currently a stub from workstream 1)

## Tasks

### 1. Define Layout Data Model

Create a TypeScript type for layout template data in `src/types/layout.ts`:

```typescript
interface LayoutTemplate {
  id: string;
  name: string;                    // "Straight Set 3x3", "On-Point 4x4"
  category: 'straight' | 'sashing' | 'on-point' | 'medallion' | 'strippy';
  gridRows: number;
  gridCols: number;
  defaultBlockSize: number;        // inches
  sashingWidth: number;            // inches, 0 = no sashing
  hasCornerstones: boolean;
  borders: BorderConfig[];
  bindingWidth: number;            // inches
  thumbnailSvg: string;            // SVG string for preview
}

interface BorderConfig {
  width: number;                   // inches
  position: number;                // 0 = innermost
}

interface LayoutArea {
  id: string;
  role: 'block-cell' | 'sashing' | 'cornerstone' | 'border' | 'binding';
  row?: number;
  col?: number;
  borderIndex?: number;
  x: number;                       // canvas position
  y: number;
  width: number;
  height: number;
  assignedBlockId?: string;        // for block cells
  assignedFabricId?: string;       // for sashing/borders/binding
  rotation?: number;               // for on-point blocks
}
```

### 2. Create Layout SVG Templates

Generate SVG templates for common quilt layouts in `/quilt_layouts/`. Start with these essential layouts:

1. `straight_3x3.svg` — 3x3 grid, no sashing
2. `straight_4x4.svg` — 4x4 grid, no sashing
3. `straight_5x5.svg` — 5x5 grid, no sashing
4. `sashing_3x3.svg` — 3x3 grid with sashing and cornerstones
5. `sashing_4x4.svg` — 4x4 grid with sashing and cornerstones
6. `on_point_3x3.svg` — 3x3 diagonal set with setting triangles
7. `medallion_center.svg` — Center block with 2 borders
8. `strippy_5col.svg` — 5-column alternating strip layout

SVG conventions (match block SVGs):
- Proportional viewBox at 10px per inch
- Every element gets `data-role` attribute: `block-cell`, `sashing`, `cornerstone`, `border`, `binding`
- Every element gets `data-shade` attribute for grayscale preview
- Stroke widths: `0.5` inner lines, `1` border outlines, `1.5` binding

Use Python generator scripts in `scripts/gen_layouts.py` (create if missing).

### 3. Build Layout Selector

When a user creates a new project or switches to the layout worktable, show a layout picker:

**`src/components/studio/LayoutSelector.tsx`** — Modal or panel showing:
- Grid of layout thumbnails (rendered from the SVGs)
- "No Layout (Free Canvas)" option at the top
- Click to apply layout to the current canvas
- Shows layout name, grid size, and whether it includes sashing

Wire this into the `NewProjectDialog` and the layout worktable tab.

### 4. Build Layout Renderer

**`src/lib/layout-renderer.ts`** — Pure engine that:
- Takes a `LayoutTemplate` + quilt dimensions (width x height in inches)
- Calculates the position and size of every `LayoutArea` (block cells, sashing, cornerstones, borders, binding)
- Returns an array of `LayoutArea` objects with canvas coordinates

**`src/hooks/useLayoutRenderer.ts`** — Hook that:
- Reads the active layout from `layoutStore`
- Calls the engine to compute areas
- Renders Fabric.js rectangles for each area on the canvas
- Makes each area selectable (click to assign block or fabric)
- Areas are colored by role: block cells = white, sashing = light gray, cornerstones = medium gray, borders = light blue, binding = dark outline

### 5. Layout Configuration Panel

Update `src/components/studio/LayoutSettingsPanel.tsx` to allow:
- Changing the number of rows/columns (re-renders the layout)
- Adjusting sashing width (0 = remove sashing)
- Toggle cornerstones on/off
- Add/remove borders (each with configurable width)
- Set binding width
- All changes re-render the layout on canvas in real-time

### 6. Fabric & Block Assignment to Areas

When a user clicks a layout area:
- **Block cell** — Opens block library picker. Selected block SVG fills the cell.
- **Sashing / Cornerstone / Border / Binding** — Opens fabric picker. Selected fabric color fills the area.
- The selection panel (`ContextPanel.tsx`) should show what's assigned to the selected area.

### 7. Seed Default Layout Templates

Create `src/db/seed/seedLayouts.ts`:
- Insert the 8 layout templates as system templates (`isPublished: true`)
- Each has the `templateData` JSONB with full layout configuration
- Run via `npm run db:seed:layouts` (add script to package.json)

### 8. Template Library Component

Build the full `TemplateLibrary` component (replacing the stub from workstream 1):
- Fetches templates from `/api/templates`
- Shows a grid of template cards with SVG thumbnails
- Click opens a detail modal with preview
- "Use This Template" button creates a new project with the layout applied

## Architecture Notes

- Layout engine (`layout-renderer.ts`) must be a pure function — no Fabric.js or DOM imports. It just computes geometry.
- The hook bridges the engine to Fabric.js canvas objects.
- Layout state goes in `src/stores/layoutStore.ts` — check what already exists there and extend it.
- Don't break free-form mode — when no layout is selected, the canvas should work exactly as it does now.
- Follow the design system tokens in CLAUDE.md (no hardcoded grays).

## Verification

```bash
npm run type-check    # 0 errors
npm run build         # succeeds
```

Test manually:
- Create new project → select "Straight Set 3x3" → layout renders on canvas
- Click a block cell → block library opens → select a block → block fills the cell
- Click sashing area → fabric picker opens → select fabric → color fills the sashing
- Adjust sashing width in settings → layout re-renders
- Select "No Layout" → free-form canvas works normally
