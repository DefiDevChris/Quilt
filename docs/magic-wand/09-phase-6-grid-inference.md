# Phase 6: Grid Inference (Optional)

## Goal

Detect whether all patches lie on a regular grid. If yes, emit grid metadata for optional Studio handoff. If no, skip silently — the printlist still works without a grid.

This phase never blocks output. It enriches it.

## Inputs

- `groups: FabricGroup[]` with canonicals set.
- All patches have centroids in image space.
- `pxPerInch: number`.

## Outputs

- `grid: Grid | null`.
- If grid detected: "Import as Studio block" CTA unlocks in Phase 7.

## Tasks

### 1. Collect centroids

Pull centroids from every patch in every group (exclude dismissed). Convert to inches using `pxPerInch`.

### 2. Pitch detection via pairwise difference histogram

Build a histogram of pairwise inter-centroid distances along each axis. The smallest dominant peak is the grid pitch.

```ts
function dominantPitch(coords: number[]): number | null {
  const diffs: number[] = [];
  for (let i = 0; i < coords.length; i++) {
    for (let j = i + 1; j < coords.length; j++) {
      const d = Math.abs(coords[i] - coords[j]);
      if (d > 0.25) diffs.push(d);    // ignore zero-pair noise
    }
  }
  const binSize = 0.125;
  const maxVal = 24;
  const bins = new Array(Math.ceil(maxVal / binSize)).fill(0);
  for (const d of diffs) {
    const idx = Math.floor(d / binSize);
    if (idx < bins.length) bins[idx]++;
  }
  // Find peaks; skip harmonics of smaller peaks
  return findFundamentalPeak(bins, binSize, 0.6);
}
```

`findFundamentalPeak` walks bins in increasing order; a candidate is a fundamental if:
- Count > 60% of the median of non-zero bins.
- No smaller bin X exists whose multiples 2X, 3X explain the candidate.

### 3. Rotation search

Run pitch detection on the centroids in both the identity basis and the 45° rotated basis. If 45° yields a cleaner peak (lower relative residual variance), the quilt is on-point.

Do not search continuous rotations. Real quilts are axis-aligned or 45°. Further rotation is out of scope.

### 4. Origin fitting

With pitch and rotation chosen, solve for origin offset that minimizes the sum of squared residuals between centroids and the nearest grid node.

```ts
function fitOrigin(
  centroidsIn: Vec2[],
  pitchIn: number,
  rotationDeg: 0 | 45
): Vec2 {
  const rotated = rotateCentroids(centroidsIn, rotationDeg);
  const ox = fitOffset1D(rotated.map((p) => p.x), pitchIn);
  const oy = fitOffset1D(rotated.map((p) => p.y), pitchIn);
  return unrotate({ x: ox, y: oy }, rotationDeg);
}

function fitOffset1D(values: number[], pitch: number): number {
  let best = 0;
  let bestErr = Infinity;
  for (let o = 0; o < pitch; o += 0.125) {
    const err = values.reduce((s, v) => {
      const rem = ((v - o) % pitch + pitch) % pitch;
      const d = Math.min(rem, pitch - rem);
      return s + d * d;
    }, 0);
    if (err < bestErr) { bestErr = err; best = o; }
  }
  return best;
}
```

### 5. Confidence

`confidence = 1 - (meanResidualIn / (pitchIn / 2))`, clamped to [0, 1].

If `confidence < 0.6`, emit `grid: null`. Do not force a false grid.

### 6. UI (`stages/CanonicalizeStage.tsx` extension)

On grid detection:

- Overlay the detected grid on the image.
- Banner: "Detected grid: 2.5" pitch, axis-aligned. [Accept] [Override]".
- Override opens inputs for pitch and a 0°/45° toggle.
- Accept commits `grid` to store.

On no grid:
- Render nothing. No banner, no warning. Not every quilt has a grid.

### 7. Studio handoff mapping (only if grid accepted)

Pure function in `src/lib/magic-wand/engine/grid-output.ts`:

```ts
export function gridOutputToProject(out: MagicWandOutput): Project {
  // Map FabricGroup -> fabric assignment in project
  // Map CanonicalShape -> block shape entry
  // Map grid.pitchIn + origin -> layout spacing
  // Return a Project suitable for /studio/[id]
}
```

Cover with tests against the 5×5 grid fixture.

### 8. Studio CTA in Phase 7

Phase 7 renders "Send to Studio" as a secondary CTA only if `grid != null`. Calls `gridOutputToProject` and navigates.

## Pitfalls

- **On-point confused for axis-aligned with odd pitch.** If axis-aligned confidence is < 0.7, always try 45° before accepting.
- **Sashing and borders distort pitch detection.** Optional refinement: compute the centroid convex hull, discard points outside a 5% inset, rerun pitch inference on the interior. Do this only if the first pass fails.
- **Medallion quilts look grid-like locally.** The confidence gate rejects these naturally — do not force a grid.
- **Do not over-specify.** Grid found -> user may send to Studio. Grid not found -> they still get a printlist. No pressure.

## Exit Criteria

- [ ] Grid detection passes on the 5×5 uniform grid fixture.
- [ ] Grid detection returns `null` on the medallion fixture.
- [ ] Grid detection returns `{ rotationDeg: 45 }` on the on-point fixture.
- [ ] `gridOutputToProject` round-trips: output loads in Studio with correct block count and spacing.
- [ ] Failure of grid detection does not block the printlist path.
