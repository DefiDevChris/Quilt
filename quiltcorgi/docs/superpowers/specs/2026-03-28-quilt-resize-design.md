# Quilt Resize Feature — Design Spec

**Date:** 2026-03-28
**Status:** Approved

## Overview

Allow users to resize an entire quilt (e.g., 4'x4' to 5'x5') with all pieces, sashing, borders, and layout elements scaling proportionally. Cuts, prints, yardage, and printlist recalculate automatically.

## Core Behavior

The resize operation is a proportional scale of every element on the canvas. Compute the width/height ratio, multiply through all object dimensions and positions.

### Two Resize Modes

Users choose via a confirmation modal:

1. **Resize Current Pattern (scale mode)** — all pieces scale proportionally to fit the new dimensions
2. **Add Empty Blocks** — canvas expands, existing pieces keep their size, new cells added at edges (structured layouts) or extra canvas space (free-form)

### What Does NOT Change on Resize

- **Seam allowance** — user-configured (default 1/4"), independent of resize
- **Grid settings** — spacing, snap-to-grid are purely design tool aids
- **Fabric assignments** — which fabric is on which piece
- **Fussy cut offsets** — pattern positioning scales with the piece

## Data Model

### Resize Engine Input

```typescript
interface ResizeInput {
  currentWidth: number          // in units (inches/cm)
  currentHeight: number         // in units
  newWidth: number
  newHeight: number
  unitSystem: 'imperial' | 'metric'
  mode: 'scale' | 'add-blocks'
  lockAspectRatio: boolean
  layoutType: LayoutType        // free-form, grid, sashing, on-point, medallion, lone-star
  layoutSettings: LayoutSettings
  objects: CanvasObjectData[]   // extracted from canvas JSON
  tilePattern: boolean          // add-blocks mode: tile existing pattern or leave empty
}
```

### Resize Engine Output

```typescript
interface ResizeResult {
  newCanvasWidth: number
  newCanvasHeight: number
  objects: TransformedObject[]    // position + scale changes per object
  layoutSettings: LayoutSettings | null
  addedCells: LayoutCell[]        // new cells (add-blocks mode only)
}
```

## Scale Mode Logic

1. Compute `scaleFactorX = newWidth / currentWidth`
2. Compute `scaleFactorY = newHeight / currentHeight`
3. For each canvas object:
   - `left = left * scaleFactorX`
   - `top = top * scaleFactorY`
   - `scaleX = scaleX * scaleFactorX`
   - `scaleY = scaleY * scaleFactorY`
4. Pattern fills: update `patternTransform` so fabric textures scale with the piece

## Add-Blocks Mode Logic

1. Compute new rows/cols: `newCols = floor(newWidth / blockSize)` (same for rows)
2. Call layout engine with updated rows/cols for new cell positions
3. Existing objects keep their dimensions, repositioned to their original cells
4. New cells either empty or tiled from existing pattern (user's choice)

### Per-Layout-Type Behavior (Add Blocks)

| Layout | Behavior |
|--------|----------|
| grid | Add rows/cols at edges |
| sashing | Add rows/cols, extend sashing strips |
| on-point | Add diagonal cells at edges, recalculate setting triangles |
| free-form | Expand canvas only (label: "Expand Canvas") |
| medallion | Add outer border ring(s) (label: "Expand Background") |
| lone-star | Expand background, star stays centered (label: "Expand Background") |

## UI Components

### Toolbar Button

In `src/components/studio/Toolbar.tsx`:
- "Resize Quilt" button with expand/arrows icon
- Opens ResizeDialog on click

### Resize Dialog — `src/components/studio/ResizeDialog.tsx`

**Input fields:**
- Width and height number inputs (in current unit system)
- Lock/unlock aspect ratio toggle (when locked, changing one auto-calculates the other)
- Current dimensions shown as reference

**Confirmation modal (on submit):**

```
"This changes the entire quilt dimensions from 48" x 48" to 60" x 60"."

[Resize Current Pattern]  [Add Empty Blocks]  [Keep 48" x 48"]
```

- "Resize Current Pattern" triggers scale mode
- "Add Empty Blocks" triggers add-blocks mode (with optional "Tile existing pattern" checkbox)
- "Keep {current}" cancels and closes

**Per-layout label adjustments:**
- Free-form: "Add Empty Blocks" becomes "Expand Canvas"
- Medallion/lone-star: "Add Empty Blocks" becomes "Expand Background"

**Validation:**
- Minimum: 1" x 1" (or 1cm x 1cm)
- Maximum: 200" x 200"
- Same-as-current dimensions: submit button disabled

## Hook: `src/hooks/useQuiltResize.ts`

Bridges resize engine to canvas:

1. Read current canvas state via `useCanvasStore`
2. Extract all objects from `fabricCanvas.getObjects()`
3. Push single undo snapshot (entire resize = one undo step)
4. Call `computeResize()` from engine
5. Apply `ResizeResult` to canvas:
   - Update each object's `left`, `top`, `scaleX`, `scaleY`
   - For add-blocks: create new Fabric.js objects for tiled/empty cells
   - Update `canvasWidth`/`canvasHeight` in `projectStore`
   - Update `layoutSettings` in `layoutStore` (if structured)
   - Recalculate `fitToScreenZoom()` for viewport fit
6. Sync printlist (see below)
7. Trigger auto-save

## Printlist Sync

After canvas update, printlist items update immediately:

1. Each printlist item has a `shapeId` referencing a canvas object
2. Look up the corresponding resized canvas object
3. Re-extract SVG: `object.toSVG()`
4. Recalculate cutting dimensions: `newFinishedSize + (2 x seamAllowance)`
5. Update printlist store in place
6. Yardage estimates recalculate automatically (hook reads from canvas state)
7. Items referencing deleted shapes are skipped (existing behavior)

## Edge Cases

**Empty canvas:** Update `canvasWidth`/`canvasHeight` and re-fit zoom. Nothing to scale.

**Grouped objects:** Scale the group as a whole. Fabric.js propagates `scaleX`/`scaleY` to children internally. Don't recurse into group children.

**Non-uniform scaling (aspect ratio unlocked):** Objects get different `scaleFactorX` vs `scaleFactorY`. Squares can become rectangles. This is expected when the user explicitly unlocks aspect ratio.

**Repeated resizes:** Each resize computes from current actual dimensions. No accumulated drift — we read `scaleX`/`scaleY` directly from canvas objects each time.

## Architecture

Follows existing engine + hook + component pattern:

| Layer | File | Responsibility |
|-------|------|----------------|
| Engine | `src/lib/resize-engine.ts` | Pure resize math, no React/Fabric deps |
| Hook | `src/hooks/useQuiltResize.ts` | Bridge engine to canvas + stores |
| Component | `src/components/studio/ResizeDialog.tsx` | UI (dialog + confirmation modal) |
| Toolbar | `src/components/studio/Toolbar.tsx` | Button to open dialog (modification) |

## Undo Behavior

Single undo step reverts the entire resize:
- Canvas dimensions
- All object transforms (position + scale)
- Layout settings
- Printlist items

Implemented by pushing one JSON snapshot before the resize applies.
