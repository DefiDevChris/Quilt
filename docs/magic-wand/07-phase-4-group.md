# Phase 4: Group by Example

## Goal

Let the user build one `FabricGroup` per distinct fabric. Click-to-seed; the system proposes members; the user accepts, merges, or removes.

Grouping is a labeling step, not a search step. The heavy lifting happened in Phase 3.

## Inputs

- `patches: PatchFeature[]` cached in the worker.
- User in stage `group`.

## Outputs

- `groups: FabricGroup[]` where every labeled patch belongs to exactly one group.
- All unlabeled patches either grouped or explicitly dismissed.

## Tasks

### 1. Weighted feature distance

`src/lib/magic-wand/engine/grouping.ts`:

```ts
type FeatureWeights = { color: number; texture: number; shape: number };
const DEFAULT_WEIGHTS: FeatureWeights = { color: 0.45, texture: 0.35, shape: 0.20 };

export function featureDistance(
  a: PatchFeature,
  b: PatchFeature,
  weights = DEFAULT_WEIGHTS
): number {
  const dColor = weightedColorDist(a, b);    // in [0,1]
  const dTexture = chiSquared(a.lbpHistogram, b.lbpHistogram);
  const dShape = shapeSigDist(a.shapeSig, b.shapeSig);
  return weights.color * dColor +
         weights.texture * dTexture +
         weights.shape * dShape;
}

function weightedColorDist(a: PatchFeature, b: PatchFeature): number {
  const dMean = ciede2000(a.meanLab, b.meanLab) / 100;      // normalize
  const dPalette = earthMoversDistance(a.dominantPalette, b.dominantPalette) / 100;
  return 0.6 * dMean + 0.4 * dPalette;
}

function chiSquared(h1: number[], h2: number[]): number {
  let s = 0;
  for (let i = 0; i < h1.length; i++) {
    const d = h1[i] - h2[i];
    const m = h1[i] + h2[i] + 1e-9;
    s += (d * d) / m;
  }
  return 0.5 * s;
}

function shapeSigDist(a: ShapeSig, b: ShapeSig): number {
  const dV = Math.abs(a.vertexCount - b.vertexCount) / 10;
  const dE = a.vertexCount === b.vertexCount
    ? l2(a.edgeLens, b.edgeLens)
    : 0.5;
  const dA = a.vertexCount === b.vertexCount
    ? l2(a.interiorAngles, b.interiorAngles) / 180
    : 0.5;
  return 0.3 * dV + 0.4 * dE + 0.3 * dA;
}
```

All component distances bounded in [0, 1] after normalization. Default pickiness cutoff: 0.18.

### 2. Click-to-seed flow

User clicks a patch in the canvas.

- Main sends `findSimilar` to the worker: `{ seedPatchId, pickiness: 0.18, excludeIds: groupedPatchIds }`.
- Worker computes distance from seed to every unexcluded patch. Returns those with `distance <= pickiness`.
- Main creates a new group with seed + candidates pre-selected as "ghosts" (pending confirmation).

### 3. Ghost layer (`components/GhostLayer.tsx`)

- Semi-transparent outline per candidate patch contour in the group's color.
- Click a ghost -> **remove** from candidates.
- Click an unlabeled patch -> **add** as manual candidate.
- Shift-click another grouped patch -> **merge** its group into the current.
- Right-click a patch -> **dismiss** (excluded from all groups).

Ghost coords are image-space. The overlay canvas inherits the Fabric.js viewport transform so ghosts stay attached to patches under pan/zoom. Do not use CSS transforms — breaks hit-testing.

### 4. Pickiness slider (`components/PickinessSlider.tsx`)

- Per-group slider from 0.05 (strict) to 0.35 (loose).
- On change (debounced 150 ms), re-send `findSimilar`.
- Preserve manual additions and removals across slider changes. User intent beats automatic distance.

### 5. Finalize a group

- "Confirm group" button commits the current candidate set to `groups[i].patchIds`.
- Auto-name: "Fabric 1", "Fabric 2", etc. User edits inline.
- Color: distinct palette (cycle Tableau 10). Do not reuse the patch's own color.

### 6. Repeat until done

- Unlabeled patches remain visible under a neutral grey overlay.
- "Start new group" -> back to click-to-seed mode.
- "Auto-group the rest" runs HDBSCAN on unlabeled patches:
  - `min_cluster_size = 3`, `min_samples = 2`, metric = `featureDistance`.
  - Each cluster becomes a proposed group (highlighted, pending user approval).
  - Noise points flagged as "unknown — review" and remain unlabeled.

### 7. Dismiss patches

- Shadows, quilt labels, background artifacts should be dismissible.
- Right-click or dedicated button. Dismissed patches do not enter any group and do not block output.
- Dismissed patches can be restored from a "Dismissed" tray.

### 8. Minimal undo stack

Stash a `groups` snapshot on every mutating action. Full undo/redo polished in Phase 8. Keep last 50.

## Pitfalls

- **Palette-EMD blows up** when a patch has dropped-out pixels from a bad mask. Require at least 3 effective palette colors; fall back to CIEDE2000 on `meanLab` if palette is degenerate.
- **Canvas coordinate drift.** Every click must convert screen -> Fabric viewport -> image coords. Off-by-zoom is a common bug; write a helper `viewportToImage(event)` and use it everywhere.
- **Perf on 400+ patches.** `findSimilar` is O(n) per seed. Fine up to ~1000. If bigger, precompute a feature k-d-tree during AMG.
- **User corrections lost on slider change.** Track manual adds/removes separately from automatic candidates; reapply after each slider re-run.

## Exit Criteria

- [ ] User can create, edit, merge, split, and delete groups.
- [ ] Pickiness slider updates ghosts within 200 ms (debounced).
- [ ] Auto-group assigns > 70% of remaining patches correctly on the 2-fabric fixture.
- [ ] Dismissed patches cleanly removed from all downstream pipelines.
- [ ] Coordinate transforms are zoom-safe: ghosts stay pinned to patches at all zoom levels.
