import { describe, expect, it } from 'vitest';
import { segmentQuilt, resizeImageDataLike } from '@/lib/quilt-segmentation-engine';
import type { ImageDataLike } from '@/lib/color-quantize';

// ── Test fixtures ────────────────────────────────────────────────────────

/**
 * Build a solid-color `ImageDataLike` of the given dimensions. Alpha is
 * always 255 so nothing in the pipeline treats pixels as transparent.
 */
function solidImage(
  width: number,
  height: number,
  rgb: readonly [number, number, number]
): ImageDataLike {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    data[i * 4] = rgb[0];
    data[i * 4 + 1] = rgb[1];
    data[i * 4 + 2] = rgb[2];
    data[i * 4 + 3] = 255;
  }
  return { data, width, height };
}

/**
 * Fill an axis-aligned rectangle inside an existing `ImageDataLike`. Mutates
 * `image.data` in place — only use on fixtures you control.
 */
function fillRect(
  image: ImageDataLike,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  rgb: readonly [number, number, number]
): void {
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * image.width + x) * 4;
      image.data[i] = rgb[0];
      image.data[i + 1] = rgb[1];
      image.data[i + 2] = rgb[2];
      image.data[i + 3] = 255;
    }
  }
}

/**
 * Four-quadrant 64×64 image: red (top-left), green (top-right),
 * blue (bottom-left), yellow (bottom-right).
 */
function fourQuadrantImage(): ImageDataLike {
  const img = solidImage(64, 64, [0, 0, 0]);
  fillRect(img, 0, 0, 32, 32, [200, 20, 20]);
  fillRect(img, 32, 0, 64, 32, [20, 200, 20]);
  fillRect(img, 0, 32, 32, 64, [20, 20, 200]);
  fillRect(img, 32, 32, 64, 64, [230, 230, 20]);
  return img;
}

// ── Tests ────────────────────────────────────────────────────────────────

describe('segmentQuilt', () => {
  it('returns one palette entry per solid quadrant with valid patches', () => {
    const img = fourQuadrantImage();
    const result = segmentQuilt(img, { fabricCount: 4, seed: 1, maxWorkingDim: 64, gridCellPx: 8 });

    expect(result.palette).toHaveLength(4);
    // Grid decomposition produces rect patches — at least 4 (one per
    // quadrant, possibly more from cell boundaries).
    expect(result.patches.length).toBeGreaterThanOrEqual(4);

    // Every patch should reference a valid cluster index.
    for (const p of result.patches) {
      const refd = result.palette.find((c) => c.index === p.clusterIndex);
      expect(refd).toBeDefined();
    }

    // Grid decomposition produces 4-vertex rects or 3-vertex triangles.
    for (const p of result.patches) {
      expect(p.polygonPx.length === 3 || p.polygonPx.length === 4).toBe(true);
    }
  });

  it('collapses to 2 clusters when fabricCount=2', () => {
    const img = fourQuadrantImage();
    const result = segmentQuilt(img, { fabricCount: 2, seed: 1, maxWorkingDim: 64, gridCellPx: 8 });

    expect(result.palette).toHaveLength(2);
    expect(result.patches.length).toBeGreaterThanOrEqual(2);
    for (const p of result.patches) {
      expect(p.clusterIndex).toBeGreaterThanOrEqual(0);
      expect(p.clusterIndex).toBeLessThan(2);
    }
  });

  it('majority filter swallows isolated speckle before grid decompose', () => {
    // 64×64 red background + a 2×2 blue speck. The majority filter eats
    // the speck before grid decomposition so no blue patches survive.
    const img = solidImage(64, 64, [200, 20, 20]);
    fillRect(img, 30, 30, 32, 32, [20, 20, 200]);

    const result = segmentQuilt(img, {
      fabricCount: 2,
      seed: 1,
      maxWorkingDim: 64,
      minPatchAreaPx: 0,
      gridCellPx: 8,
    });

    // The speck is gone — every patch should be the red cluster.
    const blueCluster = result.palette.find((c) => c.rgb.b > 100);
    const bluePatches = blueCluster
      ? result.patches.filter((p) => p.clusterIndex === blueCluster.index)
      : [];
    expect(bluePatches).toHaveLength(0);
  });

  it('populates libraryFabricId + distance when candidates are supplied', () => {
    const img = fourQuadrantImage();
    const result = segmentQuilt(img, {
      fabricCount: 4,
      seed: 1,
      maxWorkingDim: 64,
      libraryCandidates: [
        { id: 'lib-red', hex: '#c81414' },
        { id: 'lib-green', hex: '#14c814' },
        { id: 'lib-blue', hex: '#1414c8' },
        { id: 'lib-yellow', hex: '#e6e614' },
      ],
    });

    for (const cluster of result.palette) {
      expect(cluster.libraryFabricId).not.toBeNull();
      expect(cluster.libraryFabricDistance).toBeLessThan(30);
    }

    // Palette should cover all four library colors (every cluster matches a
    // different entry, since the image is four well-separated colors).
    const matchedIds = new Set(result.palette.map((c) => c.libraryFabricId));
    expect(matchedIds.size).toBe(4);
  });

  it('leaves libraryFabricId null + distance Infinity when no candidates are supplied', () => {
    const img = fourQuadrantImage();
    const result = segmentQuilt(img, { fabricCount: 4, seed: 1, maxWorkingDim: 64 });
    for (const cluster of result.palette) {
      expect(cluster.libraryFabricId).toBeNull();
      expect(cluster.libraryFabricDistance).toBe(Infinity);
    }
  });

  it('is deterministic under a fixed seed', () => {
    const img = fourQuadrantImage();
    const a = segmentQuilt(img, { fabricCount: 4, seed: 42, maxWorkingDim: 64 });
    const b = segmentQuilt(img, { fabricCount: 4, seed: 42, maxWorkingDim: 64 });

    expect(a.palette.map((c) => c.hex)).toEqual(b.palette.map((c) => c.hex));
    expect(a.patches.map((p) => p.polygonPx.length)).toEqual(
      b.patches.map((p) => p.polygonPx.length)
    );
  });

  it('grid decomposition produces 4 rect patches from a 4-quadrant image', () => {
    const img = fourQuadrantImage();
    const result = segmentQuilt(img, {
      fabricCount: 4,
      seed: 1,
      maxWorkingDim: 64,
      gridCellPx: 8,
    });

    expect(result.palette).toHaveLength(4);
    // Grid decomposition merges same-color cells into maximal rectangles.
    // Each 32×32 quadrant is composed of (32/8)² = 16 same-color cells
    // that merge into one rectangle → 4 patches total.
    expect(result.patches).toHaveLength(4);

    // Every patch should be a 4-vertex axis-aligned rectangle.
    for (const p of result.patches) {
      expect(p.polygonPx).toHaveLength(4);
    }
  });

  it('grid decomposition prevents adjacent same-color regions from merging', () => {
    // Two separate red rectangles with a green strip between them. In the
    // CCL path they would each be a separate component (because the green
    // separates them). The grid path should also keep them separate.
    const img = solidImage(64, 64, [20, 200, 20]); // green background
    fillRect(img, 0, 0, 24, 64, [200, 20, 20]); // left red
    fillRect(img, 40, 0, 64, 64, [200, 20, 20]); // right red

    const result = segmentQuilt(img, {
      fabricCount: 2,
      seed: 1,
      maxWorkingDim: 64,
      gridCellPx: 8,
    });

    // The two red regions should remain separate patches even though
    // they're the same cluster, because the green cells between them
    // break the greedy merge.
    const redCluster = result.palette.find((c) => c.rgb.r > 100);
    expect(redCluster).toBeDefined();
    const redPatches = result.patches.filter((p) => p.clusterIndex === redCluster!.index);
    expect(redPatches.length).toBeGreaterThanOrEqual(2);
  });
});

describe('resizeImageDataLike', () => {
  it('returns a copy unchanged when the image already fits', () => {
    const img = solidImage(32, 32, [100, 100, 100]);
    const out = resizeImageDataLike(img, 64);
    expect(out.width).toBe(32);
    expect(out.height).toBe(32);
    // Should be a fresh buffer so mutations don't leak.
    expect(out.data).not.toBe(img.data);
  });

  it('downsamples when the long edge exceeds maxDim', () => {
    const img = solidImage(200, 100, [50, 50, 50]);
    const out = resizeImageDataLike(img, 100);
    expect(out.width).toBe(100);
    expect(out.height).toBe(50);
    expect(out.data[0]).toBe(50);
  });
});
