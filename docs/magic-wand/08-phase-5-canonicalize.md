# Phase 5: Canonicalize Shapes

## Goal

For each fabric group, infer a single `CanonicalShape` (e.g., 2.5" HST) from the group's member contours. Validate against the Clipper.js polygon contract. Snap dimensions to the 1/8" imperial ladder.

This is where we discard raw noisy masks and commit to clean geometry.

## Inputs

- `groups: FabricGroup[]` with member `patchIds`.
- `pxPerInch: number`.

## Outputs

- Each group has `canonical: CanonicalShape` set and Clipper-validated.
- SVG path string cached per group for the printlist stage.

## Tasks

### 1. Median mask selection

Per group: find the patch whose contour is closest (by Hausdorff distance) to the *median* of all group contours. The median contour is the one with the minimum max-distance to all other members.

Do NOT average vertices across patches — averaging warps geometry. Pick a representative.

### 2. Canonicalize via ordered signature

`src/lib/magic-wand/engine/canonicalize.ts`:

```ts
export function canonicalize(
  representativeContour: Vec2[],
  pxPerInch: number
): { canonical: CanonicalShape; residual: number } {
  const simplified = approxPolyDP(representativeContour, 0.015);
  const sig = {
    vertexCount: simplified.length,
    edgeLens: edgeLens(simplified).map((l) => l / pxPerInch),
    interiorAngles: interiorAngles(simplified),
    orientation: firstEdgeAngleDeg(simplified),
  };

  const candidates = canonicalLibrary
    .map((entry) => ({ entry, fit: entry.match(sig) }))
    .filter((x) => x.fit !== null)
    .sort((a, b) => a.fit!.residual - b.fit!.residual);

  if (candidates.length === 0 || candidates[0].fit!.residual > 0.15) {
    return {
      canonical: {
        kind: 'custom',
        vertices: simplified,
        warning: 'Unrecognized shape',
      },
      residual: 1,
    };
  }
  return {
    canonical: candidates[0].fit!.shape,
    residual: candidates[0].fit!.residual,
  };
}
```

### 3. Canonical library

Each library entry exports `{ name, match(sig) -> { shape, residual } | null }`. Residual is 0 for perfect fit, 1 for poor fit.

- **Square**: 4 vertices, 4 right angles (tol ±5°), all edges equal (tol ±5%). `sideIn = mean(edgeLens)`.
- **Rectangle**: 4 vertices, 4 right angles, two pairs of equal edges, aspect != 1.0. `wIn = shorter pair`, `hIn = longer pair`.
- **HST**: 3 vertices, one 90° angle (tol ±5°), two equal legs adjacent to the right angle. `sideIn = mean(legs)`. `rot` from position of right-angle vertex.
- **QST**: right-isoceles with hypotenuse along a block edge. Distinguished from HST by orientation of the right-angle vertex pointing outward from the block.
- **Equilateral triangle**: 3 vertices, all edges equal, all angles 60° ± 5°.
- **Isoceles triangle**: 3 vertices, two equal edges, apex angle ≠ 60°.
- **Hexagon**: 6 vertices, 120° ± 5° interior angles, equal edges. `flat: true` if the first edge is near-horizontal; `false` if near-vertical.
- **Diamond**: 4 vertices, all edges equal, no right angles, opposite angles equal. `tiltDeg = orientation of first edge`.
- **Parallelogram**: 4 vertices, opposite sides equal and parallel, no right angles. Measure skew.
- **Kite**: 4 vertices, two pairs of adjacent equal edges, one axis of symmetry.
- **Tumbler**: 4 vertices, two parallel horizontal edges of different length, two equal slanted sides.
- **Strip**: rectangle with aspect > 4:1. Treat as its own kind for printlist grouping.
- **Arc** (Drunkard's Path quadrant): polygon fit residual > 0.08, but fits a circular arc with RMS < 2%. `radiusIn`, `sweepDeg`.
- **Custom**: nothing fits. Emit `{ kind: 'custom', vertices, warning }`. Surface prominently.

### 4. Snap dimensions to the 1/8" ladder

All inch outputs snap to the nearest 0.125. If snapping moves the value by > 10%, keep the raw value and log a warning — likely a miscalibration or a genuinely odd size.

```ts
function snapToEighth(x: number): number {
  return Math.round(x * 8) / 8;
}

function snapOrWarn(xIn: number): { value: number; warning?: string } {
  const snapped = snapToEighth(xIn);
  if (Math.abs(snapped - xIn) / xIn > 0.10) {
    return { value: xIn, warning: 'Dimension off the 1/8-inch ladder by > 10%' };
  }
  return { value: snapped };
}
```

### 5. Canonical SVG emitter

`src/lib/magic-wand/engine/canonical-svg.ts`: one case per kind. Output rules:

- `viewBox` in inches, no units suffix: `viewBox="0 0 2.5 2.5"`.
- Path: `M ... Z`, closed, CCW.
- No transforms embedded. No stroke, no fill.

HST rot=0 example:

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2.5 2.5">
  <path d="M 0 0 L 2.5 0 L 0 2.5 Z"/>
</svg>
```

### 6. Clipper validation

`src/lib/magic-wand/engine/validators.ts`:

```ts
export function validateForClipper(
  poly: Vec2[]
): { ok: true } | { ok: false; reason: string } {
  if (poly.length < 3) return { ok: false, reason: 'Fewer than 3 vertices' };
  if (!isClosed(poly)) return { ok: false, reason: 'Not closed' };
  if (hasSelfIntersection(poly)) return { ok: false, reason: 'Self-intersecting' };
  if (polygonArea(poly) < 1e-6) return { ok: false, reason: 'Degenerate area' };
  if (!isCCW(poly)) return { ok: false, reason: 'Not counter-clockwise' };
  return { ok: true };
}
```

Every emitted polygon runs through this. Failures block the group from the printlist and raise a UI warning with the reason.

### 7. UI (`stages/CanonicalizeStage.tsx`)

Per group, display:

- Sample of 3-6 member patches as thumbnails.
- Rendered canonical shape next to them at scale.
- Shape kind chip with an override dropdown.
- Dimension fields (editable; validator re-runs).
- Confidence bar (from residual; see Phase 8).
- "Accept" button.

Global "Accept all" when every group has a valid canonical.

### 8. Overrides

If a user changes the shape kind:
- Re-fit against the chosen kind only (not full library search).
- Recompute dimensions from the representative contour under the forced kind.
- Revalidate and update confidence.

## Pitfalls

- **Diamond misclassified as square on on-point layouts.** Distinguish by orientation: if the first edge is not within ±10° of horizontal/vertical, prefer diamond.
- **Rectangle misread as square under noisy masks.** If shorter edge is within 2% of longer, it's a square.
- **Arcs fit as noisy polygons.** When polygon residual > 0.08, attempt arc fit before falling back to custom.
- **Snapping too aggressively.** 1/8" is the ladder for patchwork. Never snap to whole inches.
- **CCW winding.** SAM contours can be CW; always flip in `computeFeatures` before canonicalization sees them.

## Exit Criteria

- [ ] Every canonical library entry has unit tests with synthetic input contours.
- [ ] Validator correctly rejects degenerate, self-intersecting, open, and CW polygons.
- [ ] Every group has either a valid canonical or an explicit `custom` + warning.
- [ ] Emitted SVGs parse cleanly and produce valid polygons when consumed by the existing Clipper.js seam-allowance pipeline.
- [ ] User-initiated shape overrides re-fit correctly.
