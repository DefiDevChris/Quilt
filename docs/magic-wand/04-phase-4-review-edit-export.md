# Phase 4: Review, Edit, Export

**Sources: `photo-to-design-prompts/prompt5.md`, `prompt6.md`, `prompt7.md` in commit `0ca99e4`.**

## Goal

The user-facing surface of the feature. Render detection results live, let the user tune via sliders and correct via manual tools, then ship the result to the Studio as editable vector shapes. Ship-ready by the end of this phase.

## Inputs

- Phase 3 complete: worker returns `previewResult` / `fullResult` / `editResult`.
- `usePhotoDesignStore` is populated on transitions.

## Outputs

- A Studio project loaded with the quilt as vector polygons at `/studio/[newProjectId]`.
- Worker disposed; object URLs revoked; no memory leak on unmount.

---

## Part 1: Review Screen (from PROMPT 5)

### Layout (`screens/ReviewScreen.tsx`)

Two-column desktop; stacked on mobile with a collapsible control panel.

- **Left (large):** the quilt canvas — photo with patch overlays.
- **Right (sidebar):** sliders, view-mode toggle, template list, status, Send-to-Studio CTA.

### Canvas (`components/QuiltCanvas.tsx`)

Two `<canvas>` elements, absolutely positioned, stacked:

- **Bottom canvas:** the perspective-corrected photo. Redrawn only on zoom/pan changes.
- **Top canvas:** patch overlays (outlines, fills). Redrawn on every slider tick or view-mode toggle.

This separation avoids re-compositing the photo on every slider update.

**Pan & zoom:** mouse wheel (zoom), click-drag (pan), pinch-to-zoom (touch). Track a single transform matrix `(tx, ty, scale)` and apply to both canvases via `ctx.setTransform`. Handle high-DPI via `devicePixelRatio`.

### View modes

| Mode | Photo canvas | Overlay canvas |
|---|---|---|
| `photo+outlines` | full opacity | 20% color fill + black outlines |
| `colorFill` | 15% opacity | 85% color fill + outlines |
| `outlinesOnly` | hidden | black outlines, no fill |
| `photoOnly` | full opacity | hidden |

Radio / segmented control in the sidebar.

### Preview render (fast path)

On `previewResult` with `outlines: Float32Array`:

```ts
ctx.clearRect(...);
let start = true;
for (let i = 0; i < outlines.length; i += 2) {
  const x = outlines[i], y = outlines[i + 1];
  if (Number.isNaN(x)) { ctx.closePath(); ctx.fill(); ctx.stroke(); start = true; continue; }
  if (start) { ctx.beginPath(); ctx.moveTo(x, y); start = false; }
  else ctx.lineTo(x, y);
}
```

Fill with the color at the same index; stroke black.

### Full render (detail path)

On `fullResult`: walk `Patch[]`, fill with `dominantColor`, stroke black. Selected patch: gold outline 3 px + details in sidebar. Hovered patch: white outline 3 px.

### Hit testing

Option A (simple): point-in-polygon winding-number against `pixelPolygon` in screen-to-image space. Fine up to ~500 patches.

Option B (scale-friendly): hidden "ID canvas" same size as overlay. Draw each patch filled with `rgb(id>>16, (id>>8)&0xFF, id&0xFF)`. On click, `getImageData(1,1)` at the cursor → decode ID. O(1) hit-testing.

Pick A for first release; swap to B if perf warrants.

### Slider panel (`components/SliderPanel.tsx`)

Every slider pulls from `store.sliders.*` and, on change:

1. Update store.
2. Call `client.requestPreview(slidersToParams(...))`.
3. When `previewResult` arrives, re-render overlay.

Controls:

- **Lighting** [0-100, default 30]
- **Smoothing** [0-100, default 50]
- **Heavy Prints** [toggle, default off]
- **Colors** [slider; "Auto" + manual 2-30, default Auto] — show "Auto: 8 detected" or "Manual: 12"
- **Min Patch Size** [0-100, default 30]
- **Edge Enhancement** [toggle, default off]
- **Edge Sensitivity** [0-100, default 50, only shown when Edge Enhancement on]
- **Grid Snap** [0-100, default 50]

All sliders use the `rounded-full` CTA style; respect `brand_config` tokens.

### Template list (`components/TemplateList.tsx`)

Shown after `fullResult`:

```
Found: 147 patches, 4 templates
Grid: Rectangular 2" ✓

[■] 2" Square (81×)
[◣] HST 2" (36×)
[▬] 2×4" Rectangle (18×)
[◆] Diamond 2" (12×)
```

Each row: tiny inline SVG of the template polygon, name, instance count. Clicking a row highlights all patches with that `templateId` on the canvas.

### Status bar (`components/StatusBar.tsx`)

- While processing: "Smoothing… 30%" + opacity-pulse progress.
- After `fullResult`: "147 patches found" + grid result.
- Patch count updates live during preview.

### Send-to-Studio CTA

Bottom of sidebar. Disabled until `fullResult` has arrived. On click → Part 3.

---

## Part 2: Manual Correction Tools (from PROMPT 6)

Every edit mutates the **label map** inside the worker, saves a snapshot to the RLE history, recomputes contours for affected patches, and posts `editResult` with a diff.

### Tool: Draw Seam — split a patch (`components/Toolbar.tsx`)

User draws a line across a patch to split it.

UI:
- "Draw Seam" tool in toolbar sets `activeTool = 'drawSeam'`.
- Click start, drag, release end. Show the preview line while dragging.
- On release: snap line angle to `{0°, 45°, 90°, 135°}` if within 15°.
- Hit-test the start point to get `patchId`. Send `splitPatch { patchId, line: [start, end] }`.

Worker (`cv/edits.ts`):
1. `history.push(labelMap)`.
2. Create a mask from the target patch.
3. Draw a 2-px wide line on a temp mask at the given coordinates (in label-map resolution).
4. Subtract line from patch mask.
5. `cv.connectedComponents` on what remains.
6. If ≥ 2 regions: assign new patch IDs to sub-regions in labelMap. Assign line pixels to the nearest sub-region.
7. If not split: post recoverable error "Line didn't split the patch. Draw it all the way across."
8. Re-extract contours for new patches.
9. Post `editResult`.

### Tool: Erase Seam — merge two patches

Click on or near a boundary. Determine the two patch IDs on either side; send `mergePatches { aId, bId }`.

Worker:
1. `history.push`.
2. For every pixel in labelMap with value `bId`, set to `aId`.
3. Re-extract contour for `aId`.
4. Post `editResult` with updated `a` and `removedIds: [bId]`.

### Tool: Flood Fill — reassign a region

Click inside the misassigned region; click a neighbor patch to transfer to it.

Worker:
1. `history.push`.
2. Get current ID at click point.
3. Build a mask of labelMap == that ID.
4. `cv.connectedComponents` on the mask to find the specific component at the click point (a patch may have disconnected pieces; only reassign the one the user clicked).
5. Relabel those pixels to the target ID.
6. Re-extract contours for both affected patches.
7. Post `editResult`.

### RLE-compressed undo (`cv/rle-history.ts`)

Label map for a 4000×3000 image is 48 MB as raw `Int32Array`. Raw snapshots are infeasible. RLE compresses ~50:1 to 200:1.

```ts
export class LabelMapHistory {
  private stack: Uint8Array[] = [];
  private pointer = -1;
  private readonly maxSnapshots = 15;

  push(labelMap: Int32Array) {
    this.stack = this.stack.slice(0, this.pointer + 1);
    this.stack.push(rleEncode(labelMap));
    if (this.stack.length > this.maxSnapshots) this.stack.shift();
    this.pointer = this.stack.length - 1;
  }

  undo(dest: Int32Array): boolean {
    if (this.pointer <= 0) return false;
    this.pointer--;
    rleDecodeInto(this.stack[this.pointer], dest);
    return true;
  }

  redo(dest: Int32Array): boolean {
    if (this.pointer >= this.stack.length - 1) return false;
    this.pointer++;
    rleDecodeInto(this.stack[this.pointer], dest);
    return true;
  }

  get canUndo() { return this.pointer > 0; }
  get canRedo() { return this.pointer < this.stack.length - 1; }
}
```

RLE encoding: walk the `Int32Array`; for each run of identical values, store `(value, runLength)`. Pack into a `DataView` with `Int32` pairs. Patch IDs have long runs (rectangular regions) so compression is high.

After every `push/undo/redo`, post `undoRedoState { canUndo, canRedo }` so the toolbar enables/disables correctly.

### Toolbar UI

```
[Select] [Draw Seam] [Erase Seam] [Flood Fill] | [↩ Undo] [↪ Redo]
```

- One tool active at a time.
- Select is default.
- Cursor: default / crosshair / crosshair / crosshair.
- Keyboard: `Ctrl/Cmd+Z` = undo, `Ctrl/Cmd+Shift+Z` = redo. Respect `input:focus`.

---

## Part 3: Studio Export (from PROMPT 7)

### Payload shape

`StudioImportPayload` type is defined in `00-overview.md §Key Types`. Build it from store state:

- `metadata.quiltWidth` = max `x` across all `patches[i].polygon`.
- `metadata.quiltHeight` = max `y` across all `patches[i].polygon`.
- `patches` use real-world `polygon` (not `pixelPolygon`). IDs become strings.
- `templates` copied as-is.
- `correctedImageUrl` optional — include it if a Studio "source photo reference" layer is supported.

### Export flow

On Send-to-Studio click:

1. Build payload.
2. **Dispose first** (critical — prevents worker WASM leak):
   - Send `dispose` to worker.
   - Worker calls `matRegistry.deleteAll()` and self-closes.
   - Main terminates the worker.
   - Revoke every object URL (source + corrected).
   - Reset store to initial values.
3. Write the payload into a new `Project`:
   - POST to the existing project-create endpoint with `canvasData.photoToDesign = payload` and whatever bootstrap `initialSetup` the Studio requires (see `src/types/project.ts`).
   - If existing endpoints don't fit, write via IndexedDB and pass the key through `router.push('/studio/[newProjectId]?bootstrap=ptd-<key>')`. Studio bootstrap reads and clears.
4. Navigate to `/studio/[newProjectId]`.

### Studio side

When the Studio mounts and sees `canvasData.photoToDesign`:

1. Set artboard dimensions to `quiltWidth × quiltHeight` in the payload unit.
2. For each patch: create a Fabric.js polygon at `patch.polygon` coordinates with `fill: patch.fill`. Attach `colorPalette` and `swatch` as `metadata`.
3. Register templates in the Studio's pattern library.
4. Enable standard tools: select, move, recolor, resize, group, duplicate, export.
5. Clear `canvasData.photoToDesign` from the project once the canvas is hydrated — one-shot import.

### Optional: source photo reference layer

Toggle in the Studio: "Show source photo". Renders `correctedImageUrl` at 15% opacity behind the patch layer. Adds ~1-5 MB to the payload, so gate the inclusion behind a user setting.

### Error handling (full table)

| When | User sees | Recovery |
|---|---|---|
| OpenCV fails to load | "Your browser doesn't support this feature. Please use Chrome, Firefox, Safari, or Edge." | Link to supported browsers. |
| `RangeError` during mat creation | "Image is very large. Reducing size…" | Auto-downscale to 2048 long edge; retry pipeline. |
| K-means doesn't converge | "Color detection struggled — try adjusting the Colors slider." | Fall back to K=8; show result. |
| 0 patches found | "No patches detected — try increasing the Colors slider or check your photo." | Show sliders. |
| 500+ patches found | "Found many small patches — try increasing Smoothing or Min Patch Size." | Show sliders. |
| Worker crashes (`onerror`) | "Processing crashed. Restarting…" | Terminate dead worker, spawn fresh, re-init OpenCV, re-send image, retry. |
| HEIC decode fails | "iPhone photo format not supported. Please share as JPEG and try again." | Instructions. |
| User navigates away during processing | silent | `dispose()` on unmount. |

Main-thread: wrap every message handler in try/catch. Worker: `finally { reg.deleteAll() }`. Main: `worker.onerror = (e) => { terminate; respawn; restore }`.

### Cleanup on unmount

```ts
useEffect(() => {
  return () => usePhotoDesignStore.getState().dispose();
}, []);
```

`dispose()` must:
- Send `dispose` to worker and await / terminate.
- Revoke every object URL the store created (source image, corrected image, fabric swatches if any are blob URLs).
- Reset all store state.

Apply to the top-level Photo-to-Design layout so it fires on any exit path (route change, tab close, back button).

---

## Pitfalls

- **Two-canvas compositing.** Drawing the overlay on top of the photo must preserve alpha correctly. Use `ctx.globalCompositeOperation = 'source-over'` (default). Mis-composited overlays look fine until you toggle view modes.
- **Retina scaling.** `canvas.width = cssWidth * devicePixelRatio; ctx.scale(dpr, dpr);` — without this, overlays are blurry on Retina displays.
- **Snap angles on Draw Seam** must happen on release, not during drag, or the line jumps while drawing.
- **Merge across the whole labelMap** is O(n). For a 4000×3000 image that's 12 million pixel checks — still fast, but don't do it in a tight loop.
- **RLE round-trip must be exact.** One off-by-one and undo corrupts the map. Unit-test encode/decode with random label maps.
- **Studio import must not accept stale payloads.** Clear `canvasData.photoToDesign` after hydration.
- **Dispose before navigation** — if you navigate first, React unmounts the component and the effect runs too late; the worker can leak 200+ MB that never frees until the tab closes.
- **Object-URL leaks.** Every `URL.createObjectURL` needs a matching `URL.revokeObjectURL`, including the fabric swatch PNGs if you use blob URLs.

---

## Shipping Checklist

### Unit tests

- `cv/pipeline.ts` per stage — smoke-test each with a fixture input.
- `cv/grid-detect.ts` — rectangular, hexagonal, none.
- `cv/shape-classify.ts` — square, HST, hexagon, parallelogram.
- `cv/rle-history.ts` — encode/decode round-trip, push-undo-redo, eviction at 15.
- `sliders.ts` — every mapping rule.

### Integration tests

- Worker init → loadImage → process(preview) → process(full) round-trip.
- splitPatch → editResult diff is correct.
- mergePatches → editResult diff is correct.
- floodFill with a disconnected patch → only the clicked component reassigns.
- undo → state exactly restored; new edit kills redo history.

### E2E tests (Playwright)

- Full flow on `rectangular-6-fabric.jpg` → Studio opens with ≥ 20 patches.
- Mobile viewport: touch drag of corners and crosshairs works.
- Tab close during processing → no orphaned worker (check `navigator.serviceWorker` / `Worker` count via DevTools snapshot).
- 3 sequential runs without refresh → no memory growth in the browser task manager.

### Performance

| Target | Budget |
|---|---|
| OpenCV.js load (cold) | ≤ 8 s |
| OpenCV.js load (warm) | ≤ 500 ms |
| Preview pipeline (1024 px) | ≤ 500 ms |
| Full pipeline (4000×3000) | ≤ 5 s |
| Slider → overlay re-render | ≤ 700 ms end-to-end |
| Manual edit round-trip | ≤ 300 ms |
| RLE snapshot push | ≤ 100 ms |

### Cross-browser matrix

- Chrome desktop, Firefox desktop, Safari desktop, Chrome Android, Safari iOS — full flow works on each.

### Rollout

1. **Internal** (flag `photo_design_internal`): admin role only. Team dogfoods with their own photos.
2. **Beta** (flag `photo_design_beta`): opt-in Pro users. Feedback via existing channel.
3. **GA**: flag removed, visible to all Pro users from the Studio "New Project" menu.

Graduation gates at each step: error rate < 5% per session, median time-to-export < 3 minutes on the three fixtures, zero memory-leak reports.

### Known limitations (document in help)

- Works best on flat, evenly-lit photos with the quilt filling the frame.
- Printed fabrics with busy patterns may need a higher Smoothing value or Heavy Prints toggle.
- Non-standard shapes may classify as `custom` — Studio-editable either way.
- Photo-to-Design does not detect quilting stitches, applique, or curved piecing other than detected arcs.

## Exit Criteria

- [ ] Review screen renders preview and full results correctly in all 4 view modes.
- [ ] Slider drag produces a new preview overlay within 700 ms end-to-end.
- [ ] Manual tools (Draw, Erase, Flood) work on desktop and mobile; `editResult` updates exactly the expected patches.
- [ ] Undo/Redo operates up to 15 levels; redo history is killed by a new edit.
- [ ] Send-to-Studio disposes the worker, writes the payload, and lands the user on `/studio/[id]` with patches visible.
- [ ] All error-table rows exercised and the UI shows the expected recovery.
- [ ] Unit, integration, and E2E suites pass.
- [ ] Performance budgets met on mid-range hardware.
- [ ] Three sequential full-flow runs show no memory growth.
