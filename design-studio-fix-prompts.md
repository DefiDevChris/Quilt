# Design Studio Fix Prompts -- 7-Phase Plan

Each prompt below is self-contained and ready to hand to an agent. They reference specific files, functions, types, and architectural patterns already present in the codebase.

---

## Phase 1: Unified Coordinate System (computeCanvasGeometry)

**Branch name:** `fix/phase1-unified-coordinates`

### Context

PR #24 introduced `computeCanvasGeometry()` in `src/lib/canvas-utils.ts` as a single source of truth for coordinate mapping between the HTML5 grid canvas (`src/lib/canvas-grid.ts`) and the Fabric.js fence overlay (`src/hooks/useFenceRenderer.ts`). A review found the following bugs that need fixing before this phase is complete:

1. **Setting triangle `points` not scaled in `computeFenceAreas`**: In `src/lib/fence-engine.ts`, the final scaling pass at lines ~502-508 scales `x`, `y`, `width`, `height` but does NOT scale the `points` array. Since `useFenceRenderer.ts` passes `area.points` directly to `fabric.Polygon`, setting triangles render at pre-scale coordinates when `finalScaleX`/`finalScaleY` differ from 1. Fix the `areas.map(...)` return at line 502 to also map `points` through the same scale factors.

2. **Dead `getPixelsPerUnit` imports**: `src/lib/canvas-grid.ts` line 1 and `src/hooks/useFenceRenderer.ts` line 8 both import `getPixelsPerUnit` from `canvas-utils`, but neither file uses it directly after the refactor to `computeCanvasGeometry`. Remove the unused imports.

3. **`handleDragOver` invalid-drop flash fires continuously**: In `src/hooks/useBlockDrop.ts`, the `handleDragOver` callback (line ~52) fires ~60 times/sec during drag. Each invocation at line ~87 adds the `invalid-drop-flash` CSS class and schedules a `setTimeout` to remove it after 400ms. After the first timeout fires, the next dragOver re-adds the class, creating a repeating blink loop. Fix by guarding -- skip adding the class if it's already present, or store the timeout ID in a ref and clear the previous timeout before scheduling a new one.

### Instructions

- Fix all 3 issues above on the feature branch
- Run `npm test` to verify all existing tests pass (59 tests across 3 files)
- Add a test in `tests/unit/lib/fence-engine.test.ts` that verifies `points` are properly scaled when the quilt dimensions don't match the template footprint (i.e. `finalScaleX !== 1`)
- Commit with message `fix: phase 1 unified coordinates - scale polygon points, clean imports, debounce flash`

### Key files
- `src/lib/fence-engine.ts` -- `computeFenceAreas()` final scaling pass
- `src/lib/canvas-utils.ts` -- `computeCanvasGeometry()` (source of truth)
- `src/lib/canvas-grid.ts` -- imports
- `src/hooks/useFenceRenderer.ts` -- imports, polygon rendering
- `src/hooks/useBlockDrop.ts` -- `handleDragOver` flash logic
- `tests/unit/lib/fence-engine.test.ts`
- `tests/unit/lib/canvas-utils.test.ts`

---

## Phase 2: Tool Constraints via useFenceConstraints Hook

**Branch name:** `fix/phase2-fence-constraints`

### Context

When a layout is applied (`layoutStore.hasAppliedLayout === true`), drawing tools (`rectangle`, `circle`, `triangle`, `polygon`, `easydraw`, `bend`) should be constrained to operate only within valid fence areas. Currently, tools like `useDrawingTool` (`src/hooks/useDrawingTool.ts`), `useEasyDrawTool` (`src/hooks/useEasyDrawTool.ts`), `usePolygonTool` (`src/hooks/usePolygonTool.ts`), and `useBendTool` (`src/hooks/useBendTool.ts`) have no awareness of the fence system and allow drawing anywhere on the canvas.

### Instructions

1. **Create `src/hooks/useFenceConstraints.ts`** -- a new hook that:
   - Reads `hasAppliedLayout` from `useLayoutStore`
   - Reads fence areas from `useFenceRenderer`'s `getFenceAreas()` (returned by the hook)
   - Exports a `isPointInFenceArea(x: number, y: number, role?: FenceArea['role']): boolean` function that checks if a canvas scene point falls within any fence area of the given role (default: `'block-cell'`)
   - Exports a `getContainingFenceArea(x: number, y: number): FenceArea | null` function
   - When `hasAppliedLayout` is false, both functions should allow everything (return true / return a synthetic area)

2. **Wire into drawing tools**:
   - In `useDrawingTool.ts`: on `mouse:down`, check if the pointer is inside a valid fence area before starting the shape. If not, ignore the click.
   - In `useEasyDrawTool.ts`: similarly gate the `path:created` event -- if the path's bounding box doesn't overlap any `block-cell` fence area, remove it immediately
   - In `useBendTool.ts`: the `findClosestEdge` function already skips `_fenceElement` objects. No changes needed unless bend should be restricted to objects within fence cells.
   - In `usePolygonTool.ts`: gate each click-to-add-vertex against fence bounds

3. **Add tests** in `tests/unit/hooks/` for the constraint logic (pure function tests, no canvas needed)

4. Commit: `feat: phase 2 - useFenceConstraints hook gates drawing tools to fence areas`

### Key files
- `src/hooks/useFenceConstraints.ts` (new)
- `src/hooks/useDrawingTool.ts`
- `src/hooks/useEasyDrawTool.ts`
- `src/hooks/usePolygonTool.ts`
- `src/hooks/useBendTool.ts`
- `src/hooks/useFenceRenderer.ts` -- `getFenceAreas()` return value
- `src/stores/layoutStore.ts` -- `hasAppliedLayout`
- `src/types/fence.ts` -- `FenceArea` type

---

## Phase 3: Fence Rendering Fixes (Triangles, Z-Layers, No Flicker)

**Branch name:** `fix/phase3-fence-rendering`

### Context

The fence renderer (`src/hooks/useFenceRenderer.ts`) has several rendering issues:

1. **Setting triangle rendering**: Phase 1 added polygon support but the label positioning for triangles uses the bounding box center (`area.x + area.width / 2`, `area.y + area.height / 2`), which for right-angle corner triangles places the label on the hypotenuse edge rather than inside the triangle. Labels should use the triangle's centroid instead.

2. **Z-layer ordering**: The current approach calls `canvas.sendObjectToBack(shape)` for each fence area, then `canvas.bringObjectToFront(obj)` for user blocks. This is O(n*m) and can cause visual flicker during rapid layout changes (e.g. slider adjustments). The rAF debounce helps but doesn't eliminate it.

3. **Flicker during layout parameter changes**: When `applyFence` runs, it removes all old fence objects and re-creates them. During the removal-to-recreation gap, the canvas briefly shows no fence. Consider diffing the old and new areas by `area.id` and updating in-place where possible (position/size changes only) rather than full remove-and-recreate.

### Instructions

1. **Fix triangle label centroid**: For areas with `points`, compute the centroid as the average of all point coordinates: `centroidX = avg(points.map(p => p.x))`, `centroidY = avg(points.map(p => p.y))`. Use this instead of the bounding box center for label positioning (lines ~226-230 in `useFenceRenderer.ts`).

2. **Optimize z-ordering**: After all fence shapes are added, do a single pass to sort canvas objects: fence objects at the back, user blocks on top. Replace the per-object `sendObjectToBack` + `bringObjectToFront` loop with a single `canvas.getObjects().sort(...)` followed by `canvas.renderAll()`.

3. **Incremental fence updates** (optional, stretch goal): Instead of `canvas.remove(...oldObjects)` followed by full re-creation, match old and new areas by `area.id`. For matching IDs, update position/size/fill in-place via `shape.set({...})` + `shape.setCoords()`. Only create/remove objects for areas that were added/removed. This eliminates the visual gap.

4. **Add tests**: Test that triangle label centroid computation produces points strictly inside the triangle for both side and corner triangle shapes.

5. Commit: `fix: phase 3 - triangle label centroids, z-layer optimization, reduced flicker`

### Key files
- `src/hooks/useFenceRenderer.ts` -- main rendering loop, label positioning, z-ordering
- `src/lib/fence-engine.ts` -- FenceArea computation
- `src/types/fence.ts` -- FenceArea type
- `brand_config.json` -- fence colors including setting-triangle

---

## Phase 4: Block Drop Scaling and Visual Feedback

**Branch name:** `fix/phase4-block-drop`

### Context

The block drop system (`src/hooks/useBlockDrop.ts`) needs improvements:

1. **Block scaling on drop**: When a block is dropped into a fence cell, it should be scaled to exactly fit the cell dimensions. Currently (lines ~200+), the block group is positioned at the cell center but the scaling logic may not account for non-square fence cells or blocks with different aspect ratios than the target cell.

2. **Invalid drop feedback**: Phase 1 added the red flash animation but it has the continuous-fire bug (fixed in Phase 1). Beyond that fix, the feedback should also include:
   - A brief toast/notification explaining why the drop was rejected (e.g. "Blocks can only be placed in block cells")
   - The cursor should show `not-allowed` during drag over invalid areas (currently shows `none` via `dropEffect`)

3. **Fabric drop into structural areas**: `src/hooks/useFabricLayout.ts` handles fabric image drops. When a layout is applied, fabric drops should target structural areas (sashing, border, binding, cornerstone, setting-triangle) rather than block cells. Currently there's no fence-aware targeting for fabric drops.

### Instructions

1. **Scale blocks to cell size**: In `useBlockDrop.ts` `handleDrop`, after positioning the block group at the fence cell center, calculate the scale factor as `min(cellWidth / groupWidth, cellHeight / groupHeight)` and apply it to the group. Ensure `scaleX === scaleY` per project conventions (see `CLAUDE.md` Fabric.js section).

2. **Improve invalid drop UX**: Add a brief message to the user when a drop is rejected. Use the existing `useToast` pattern from `src/components/ui/ToastProvider.tsx` if available, or a simple console-level notification. Ensure `e.dataTransfer.dropEffect = 'none'` is properly communicated to the browser.

3. **Fence-aware fabric drops**: In `useFabricLayout.ts`, add fence area awareness similar to `useBlockDrop.ts`. When `hasAppliedLayout`, fabric drops should target objects with `_fenceElement === true` and `_fenceRole` in `['sashing', 'border', 'binding', 'cornerstone', 'setting-triangle']`.

4. **Add tests**: Unit tests for the scale calculation logic (extracted as a pure function).

5. Commit: `fix: phase 4 - block drop scaling, improved invalid drop feedback, fence-aware fabric drops`

### Key files
- `src/hooks/useBlockDrop.ts` -- block drop handling, scaling, feedback
- `src/hooks/useFabricLayout.ts` -- fabric pattern drops
- `src/hooks/useFenceRenderer.ts` -- fence marker properties
- `src/components/studio/StudioDropZone.tsx` -- drop zone wrapper
- `src/app/globals.css` -- `invalidDropFlash` animation
- `src/lib/drop-highlight.ts` -- highlight utilities

---

## Phase 5: Layout Application Synchronization

**Branch name:** `fix/phase5-layout-sync`

### Context

Layout application involves multiple stores and hooks that need to stay synchronized:

- `layoutStore` (`src/stores/layoutStore.ts`) holds layout parameters (rows, cols, blockSize, borders, etc.) and `hasAppliedLayout` flag
- `projectStore` (`src/stores/projectStore.ts`) holds `canvasWidth`/`canvasHeight` and the dirty flag
- `canvasStore` (`src/stores/canvasStore.ts`) holds zoom, pan, unit system
- `useFenceRenderer` subscribes to both `layoutStore` and `projectStore` and recomputes fence areas on changes

Issues:
1. **Quilt resize breaks fence**: When the user resizes the quilt via `useQuiltResize` (`src/hooks/useQuiltResize.ts`), `projectStore.canvasWidth`/`canvasHeight` change, but the fence areas may not recompute correctly if the layout template footprint no longer matches the new quilt dimensions.

2. **Layout parameter changes during applied state**: When `hasAppliedLayout` is true and the user modifies layout parameters (rows, cols, blockSize via the LayoutSelector), fence areas update but existing block assignments (blocks already placed in cells) may reference cell IDs that no longer exist after the grid changes.

3. **Undo/redo across layout changes**: The undo stack (`canvasStore.undoStack`) stores canvas JSON snapshots. Undoing past a layout application doesn't restore the layout state in `layoutStore`, leading to a desync where the canvas shows the old state but `layoutStore` still says `hasAppliedLayout: true`.

### Instructions

1. **Quilt resize fence sync**: In `useQuiltResize.ts`, after updating `projectStore` dimensions, trigger a fence recomputation. The `useFenceRenderer` already subscribes to `projectStore`, so verify the subscription fires correctly. Add a test that changes quilt dimensions and asserts fence areas are recomputed with the new dimensions.

2. **Preserve block assignments on layout change**: When layout parameters change while `hasAppliedLayout` is true, fence areas get new IDs (e.g. `cell-0-0` stays but `cell-3-3` disappears if grid shrinks). Add logic in `useFenceRenderer.ts` to detect blocks that were assigned to now-removed cells and either: (a) move them to freeform placement, or (b) place them in the closest available cell. The current `preservedFills` mechanism (lines ~131-142) already tracks fills by area ID -- extend this to also track `_inFenceCellId` assignments on user block objects.

3. **Layout-aware undo**: This is the hardest piece. Consider storing a layout snapshot alongside canvas JSON in the undo stack, or using a separate layout undo stack. At minimum, when an undo restores a canvas state that was created without a layout, `layoutStore.clearLayout()` should be called. Detect this by checking if the restored canvas JSON contains any objects with `_fenceElement: true`.

4. Commit: `fix: phase 5 - layout application sync, resize handling, block reassignment, layout-aware undo`

### Key files
- `src/stores/layoutStore.ts` -- layout state, `applyLayout`, `clearLayout`
- `src/stores/projectStore.ts` -- canvas dimensions
- `src/stores/canvasStore.ts` -- undo/redo stack
- `src/hooks/useFenceRenderer.ts` -- fence recomputation, block preservation
- `src/hooks/useQuiltResize.ts` -- resize logic
- `src/lib/fence-engine.ts` -- `computeFenceAreas`

---

## Phase 6: Drawing Tool Improvements (Snap-to-Grid EasyDraw, True Bezier Bend)

**Branch name:** `fix/phase6-drawing-tools`

### Context

Two drawing tools need improvements:

1. **EasyDraw snap-to-grid**: `src/hooks/useEasyDrawTool.ts` uses Fabric.js's built-in `PencilBrush` for freehand drawing. It does NOT snap to grid. The sibling `useDrawingTool.ts` (line ~7) uses `maybeSnap()` from `src/lib/canvas-utils.ts` to snap shape endpoints to the grid. EasyDraw should offer an optional snap mode that quantizes the final path points to grid positions, producing cleaner shapes.

2. **Bend tool -- true Bezier curves**: `src/hooks/useBendTool.ts` currently approximates curves by subdividing a quadratic Bezier into 12 line segments (see `SUBDIVISIONS = 12` at line 74 and the Bezier subdivision loop at lines ~141-149). This creates jagged curves at high zoom. The tool should instead produce a true SVG-compatible Bezier path. Fabric.js `Path` objects support SVG path data with `Q` (quadratic) and `C` (cubic) Bezier commands. Replace the polygon-point subdivision with a `fabric.Path` that uses actual curve commands.

### Instructions

1. **EasyDraw snap-to-grid**:
   - In `useEasyDrawTool.ts`, after `path:created` fires (line ~73), post-process the path's points using `maybeSnap()` from `canvas-utils.ts`
   - Read `gridSettings` and `unitSystem` from `canvasStore` (via the existing `stateRef` pattern used in `useDrawingTool.ts`)
   - For each point in the path data, snap x/y to the grid using `maybeSnap(val, gridSettings, unitSystem)`
   - Only apply snapping when `gridSettings.snapToGrid === true`
   - Update the path object after snapping and call `setCoords()`

2. **Bend tool true Bezier**:
   - Replace the polygon subdivision approach with a `fabric.Path` approach
   - When `onMouseUp` fires, instead of leaving the target as a Polygon with extra subdivision points, convert the bent edge into a `Q` (quadratic Bezier) SVG path command
   - This requires converting the target Polygon into a Path: build an SVG path string from the polygon points, replacing the bent segment with a `Q controlX,controlY endX,endY` command
   - Create a new `fabric.Path` from the SVG string and replace the original polygon on the canvas
   - Preserve all custom properties (`_fenceElement`, etc.) during the conversion
   - This is a significant refactor -- if the conversion is too complex, an alternative is to increase `SUBDIVISIONS` to 24-32 for smoother approximation as an interim fix

3. **Add tests**: Test EasyDraw snap logic as a pure function (snap path points array). Test Bezier path string generation.

4. Commit: `feat: phase 6 - easydraw snap-to-grid, bend tool bezier curves`

### Key files
- `src/hooks/useEasyDrawTool.ts` -- freehand drawing, path:created handler
- `src/hooks/useBendTool.ts` -- bend/warp tool, Bezier subdivision
- `src/hooks/useDrawingTool.ts` -- reference for snap-to-grid pattern
- `src/lib/canvas-utils.ts` -- `maybeSnap()`
- `src/stores/canvasStore.ts` -- `gridSettings`, `unitSystem`

---

## Phase 7: UX Polish (Edit/Preview Toggle, Block Rotation, Cell Swap)

**Branch name:** `fix/phase7-ux-polish`

### Context

Final UX improvements for the Design Studio:

1. **Edit/Preview toggle**: `layoutStore.previewMode` (line ~18 in `src/stores/layoutStore.ts`) controls whether fence areas render with transparent dashed strokes (preview) or solid fills (applied). There should be a toggle button in the Studio UI that lets users switch between edit mode (full fence visible, blocks selectable) and preview mode (fence faded, blocks locked, WYSIWYG view). Currently `previewMode` is set internally but there's no user-facing control.

2. **Block rotation in cells**: When a block is placed in a fence cell, users should be able to rotate it in 90-degree increments (0, 90, 180, 270) without removing it. Currently `lockRotation: true` is set on fence areas (line ~189 in `useFenceRenderer.ts`), but user blocks placed inside cells should allow rotation. Add a keyboard shortcut (R key) or context action to rotate the selected block within its cell.

3. **Cell swap**: Users should be able to swap blocks between two fence cells by selecting both cells and triggering a swap action. This requires multi-select support for fence cell objects and a swap operation that exchanges the assigned blocks (and their visual representations) between two cells.

### Instructions

1. **Edit/Preview toggle button**:
   - Add a toggle button to `src/components/studio/StudioTopBar.tsx` or `src/components/studio/Toolbar.tsx` (whichever has the layout-related controls)
   - The button should call `useLayoutStore.getState().setPreviewMode(!previewMode)`
   - Only show the toggle when `hasAppliedLayout` is true
   - Use an eye/eye-off icon pattern consistent with the existing toolbar buttons (see `src/components/studio/ToolbarConfig.tsx` for icon patterns)
   - In preview mode, show a subtle banner or indicator so users know they're in preview

2. **Block rotation in cells**:
   - In `src/hooks/useCanvasKeyboard.ts`, add a handler for the `R` key
   - When pressed with a single selected object that has `_inFenceCellId`, rotate the object by 90 degrees (`obj.angle = (obj.angle + 90) % 360`)
   - Call `obj.setCoords()` and `canvas.requestRenderAll()` after rotation
   - Push an undo state after rotation
   - Ensure the rotation doesn't move the block out of its cell (rotate around center)

3. **Cell swap**:
   - Add a swap action triggered by selecting two fence cell objects (Shift+click multi-select) and pressing `S` key or a context menu action
   - When two `block-cell` fence areas are selected and both have assigned blocks:
     - Read the block objects from each cell (find by `_inFenceCellId`)
     - Swap their positions (set each block's `left`/`top` to the other cell's center)
     - Update `_inFenceCellId` references
     - Push undo state
   - When only one cell has a block, move it to the other cell

4. Commit: `feat: phase 7 - edit/preview toggle, block rotation in cells, cell swap`

### Key files
- `src/stores/layoutStore.ts` -- `previewMode`, `setPreviewMode`
- `src/hooks/useFenceRenderer.ts` -- fence rendering, preview mode styling
- `src/hooks/useCanvasKeyboard.ts` -- keyboard shortcuts
- `src/components/studio/StudioTopBar.tsx` -- toolbar UI
- `src/components/studio/Toolbar.tsx` -- tool buttons
- `src/components/studio/ToolbarConfig.tsx` -- toolbar configuration
- `src/hooks/useBlockDrop.ts` -- block placement, `_inFenceCellId` assignments
