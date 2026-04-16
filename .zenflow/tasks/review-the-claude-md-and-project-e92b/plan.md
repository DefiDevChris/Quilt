# Design Studio Fix Plan

## Configuration
- **Artifacts Path**: `.zenflow/tasks/review-the-claude-md-and-project-e92b`

## Summary of Bugs Found & Fixed

### [x] Step 1: Investigation & Root Cause Analysis
Investigated the full studio pipeline: StudioLayout → StudioDropZone → CanvasWorkspace → hooks.

Bugs found:
- Duplicate `const obj` in `useCanvasInit.ts` broke all movement constraints
- Z-ordering broken in `useFenceRenderer.ts` (sorting a Fabric.js copy = no-op)
- Freeform block drops not scaled to blockSize
- TypeScript filter errors in `useDrawingTool.ts`, `useEasyDrawTool.ts`, `usePolygonTool.ts`
- All tool cursors identical (all used `crosshair`)
- Bend tool used `setBoundingBox()` (invalid in Fabric.js v7)
- Border/binding fence areas rendered at negative coordinates (outside quilt rectangle)

### [x] Step 2: Fix Movement Constraints & Z-Ordering
- Removed duplicate `const obj` declaration in `useCanvasInit.ts` onObjectMoving handler
- Fixed z-ordering in `useFenceRenderer.ts`: replaced broken array sort with `canvas.sendObjectToBack()` loop

### [x] Step 3: Fix Block Drop Scaling & TypeScript Errors
- Applied `blockSize * pxPerUnit` scaling to freeform block drops in `useBlockDrop.ts`
- Fixed TypeScript filter callback types in `useDrawingTool.ts`, `useEasyDrawTool.ts`, `usePolygonTool.ts`

### [x] Step 4: Fix Tool Cursors & Bend Tool
- Added `cursorForTool()` helper in `canvas-utils.ts` mapping each tool to a distinct cursor
- Updated `useCanvasZoomPan.ts` to restore tool-appropriate cursor after pan/space-pan
- Updated `useDrawingTool.ts` to set tool-specific cursor on activation
- Fixed bend tool in `useBendTool.ts`: cursor changed to `alias`, replaced invalid `setBoundingBox()` with `dirty = true`

### [x] Step 5: Fix Border/Binding Coordinate Offset
- Fixed `renderFenceTemplate()` in `fence-engine.ts` to apply `(totalBorderWidth + bindingWidth) * pxPerUnit` offset
- All fence areas now start at x=0 (outer binding edge), matching the white quilt rectangle in the grid canvas
- Medallion and strippy layouts unaffected (they already start at 0)
- Fixed remaining `any` casts in `useDrawingTool.ts` to use proper `unknown` casts

## Verification
- `npx tsc --noEmit` → 0 errors ✓
- `npm run lint` → 0 new errors (4 pre-existing errors in unrelated files) ✓
