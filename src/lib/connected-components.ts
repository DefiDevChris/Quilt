/**
 * Connected Components — two-pass Rosenfeld-Pfaltz labeling with union-find.
 *
 * Takes a binary mask (the foreground of a single cluster from
 * `quantizeImage`) and splits it into disjoint blobs. Every emitted component
 * carries its pixel count and axis-aligned bounding box so the contour
 * tracer downstream can seed its walk and skip tiny specks.
 *
 * Pure computation — zero DOM, zero Fabric.js, zero React. 4-connectivity
 * only (up + left), which matches how quilt patches actually butt against
 * each other: diagonal touches almost always come from jpeg artifacts or
 * quantizer noise and should stay separate.
 *
 * Design notes:
 *   - First pass assigns provisional labels using just the up + left
 *     neighbors. Equivalences (two provisional labels that turn out to be
 *     the same blob) are recorded in a weighted union-find.
 *   - Second pass flattens each provisional label to its union-find root
 *     and compacts roots down to a dense 1..N numbering. Component stats
 *     (area, bbox) are accumulated in the same sweep.
 *   - Background stays labelled `0`; foreground labels start at `1`.
 */

// ─── Public types ──────────────────────────────────────────────────────────

export interface Component {
  /** 1-indexed; 0 is reserved for background in the `labels` buffer. */
  readonly id: number;
  /** Pixel count after flattening. */
  readonly area: number;
  /** Inclusive axis-aligned bounding box in mask coordinates. */
  readonly bbox: {
    readonly minX: number;
    readonly minY: number;
    readonly maxX: number;
    readonly maxY: number;
  };
}

export interface CCLResult {
  /** Row-major, same shape as input mask. 0 = background, 1..N = component id. */
  readonly labels: Uint32Array;
  /** Components in discovery order (first encountered → first in array). */
  readonly components: readonly Component[];
  readonly width: number;
  readonly height: number;
}

// ─── Top-level API ─────────────────────────────────────────────────────────

/**
 * Label the connected components in a binary mask.
 *
 * `mask[i]` nonzero = foreground, zero = background. First pass assigns
 * provisional labels and records equivalences in a union-find. Second pass
 * flattens labels and accumulates area + bbox per final component.
 */
export function labelComponents(
  mask: Uint8Array,
  width: number,
  height: number
): CCLResult {
  const total = width * height;
  if (total === 0) {
    return { labels: new Uint32Array(0), components: [], width, height };
  }

  // Provisional labels from pass 1. Grows on demand — we don't know up
  // front how many labels we'll allocate, so we start modest and push.
  const provisional = new Uint32Array(total);

  // Union-find. parent[i] = i for roots; size[i] = subtree weight for
  // weighted-union. Index 0 is a sentinel root so real labels start at 1.
  const parent: number[] = [0];
  const rank: number[] = [0];

  const find = (x: number): number => {
    // Path compression via two-pointer pass.
    let root = x;
    while (parent[root] !== root) root = parent[root];
    let cur = x;
    while (parent[cur] !== cur) {
      const next = parent[cur];
      parent[cur] = root;
      cur = next;
    }
    return root;
  };

  const union = (a: number, b: number): number => {
    const ra = find(a);
    const rb = find(b);
    if (ra === rb) return ra;
    if (rank[ra] < rank[rb]) {
      parent[ra] = rb;
      return rb;
    }
    if (rank[ra] > rank[rb]) {
      parent[rb] = ra;
      return ra;
    }
    parent[rb] = ra;
    rank[ra]++;
    return ra;
  };

  // ─── Pass 1: provisional labelling ──────────────────────────────────────
  let nextLabel = 1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      if (mask[i] === 0) continue;

      const upLabel = y > 0 ? provisional[i - width] : 0;
      const leftLabel = x > 0 ? provisional[i - 1] : 0;

      if (upLabel === 0 && leftLabel === 0) {
        // Fresh label.
        provisional[i] = nextLabel;
        parent.push(nextLabel);
        rank.push(0);
        nextLabel++;
      } else if (upLabel !== 0 && leftLabel === 0) {
        provisional[i] = upLabel;
      } else if (upLabel === 0 && leftLabel !== 0) {
        provisional[i] = leftLabel;
      } else {
        // Both neighbours foreground — copy the smaller and merge.
        const smaller = upLabel < leftLabel ? upLabel : leftLabel;
        provisional[i] = smaller;
        if (upLabel !== leftLabel) union(upLabel, leftLabel);
      }
    }
  }

  // ─── Pass 2: flatten + collect stats ────────────────────────────────────
  // Map each union-find root → dense 1..N id, in first-encounter order so
  // the caller sees components in a stable scan order.
  const rootToDenseId = new Map<number, number>();
  const components: Component[] = [];
  // Mutable stat buffers, one entry per dense id (index 0 unused).
  const areas: number[] = [0];
  const minXs: number[] = [0];
  const minYs: number[] = [0];
  const maxXs: number[] = [0];
  const maxYs: number[] = [0];

  const labels = new Uint32Array(total);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const prov = provisional[i];
      if (prov === 0) continue;

      const root = find(prov);
      let denseId = rootToDenseId.get(root);
      if (denseId === undefined) {
        denseId = components.length + 1;
        rootToDenseId.set(root, denseId);
        areas.push(0);
        minXs.push(x);
        minYs.push(y);
        maxXs.push(x);
        maxYs.push(y);
        // Placeholder bbox — updated below on every pixel so the
        // Component record we freeze at the end reflects final bounds.
        components.push({
          id: denseId,
          area: 0,
          bbox: { minX: x, minY: y, maxX: x, maxY: y },
        });
      }

      labels[i] = denseId;
      areas[denseId]++;
      if (x < minXs[denseId]) minXs[denseId] = x;
      if (x > maxXs[denseId]) maxXs[denseId] = x;
      if (y < minYs[denseId]) minYs[denseId] = y;
      if (y > maxYs[denseId]) maxYs[denseId] = y;
    }
  }

  // Rewrite components with the final accumulated stats.
  const finalComponents: Component[] = components.map((c) => ({
    id: c.id,
    area: areas[c.id],
    bbox: {
      minX: minXs[c.id],
      minY: minYs[c.id],
      maxX: maxXs[c.id],
      maxY: maxYs[c.id],
    },
  }));

  return { labels, components: finalComponents, width, height };
}

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * Extract the binary mask for a single cluster from a `labelMap` (the
 * output of `quantizeImage`). Returns a fresh `Uint8Array` with `1` where
 * the pixel belongs to `clusterIndex` and `0` everywhere else.
 */
export function maskFromLabelMap(
  labelMap: Uint16Array,
  clusterIndex: number
): Uint8Array {
  const mask = new Uint8Array(labelMap.length);
  for (let i = 0; i < labelMap.length; i++) {
    if (labelMap[i] === clusterIndex) mask[i] = 1;
  }
  return mask;
}
