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
  it('returns one palette entry + one patch per solid quadrant', () => {
    const img = fourQuadrantImage();
    const result = segmentQuilt(img, { fabricCount: 4, seed: 1, maxWorkingDim: 64 });

    expect(result.palette).toHaveLength(4);
    expect(result.patches).toHaveLength(4);

    // Every patch should reference a valid cluster index.
    for (const p of result.patches) {
      const refd = result.palette.find((c) => c.index === p.clusterIndex);
      expect(refd).toBeDefined();
    }

    // Each patch should simplify to roughly 4 corners (the quadrant outline)
    // plus one to close the loop — DP + snap may leave 3–6 points.
    for (const p of result.patches) {
      expect(p.polygonPx.length).toBeGreaterThanOrEqual(3);
      expect(p.polygonPx.length).toBeLessThanOrEqual(6);
    }
  });

  it('collapses to 2 clusters when fabricCount=2, preserving 2 patches', () => {
    const img = fourQuadrantImage();
    const result = segmentQuilt(img, { fabricCount: 2, seed: 1, maxWorkingDim: 64 });

    expect(result.palette).toHaveLength(2);
    // With 2 clusters over 4 flat quadrants, we still get at most 4 connected
    // components but each cluster likely contains ≥ 1 patch.
    expect(result.patches.length).toBeGreaterThanOrEqual(2);
    for (const p of result.patches) {
      expect(p.clusterIndex).toBeGreaterThanOrEqual(0);
      expect(p.clusterIndex).toBeLessThan(2);
    }
  });

  it('filters out tiny noise blobs via minPatchAreaPx', () => {
    // 64×64 background red + a 2×2 blue speck. With a 5 px² threshold the
    // speck should be dropped — the only surviving patch is the background.
    // The majority filter would also eat this speck, so we disable it
    // here to test `minPatchAreaPx` in isolation.
    const img = solidImage(64, 64, [200, 20, 20]);
    fillRect(img, 30, 30, 32, 32, [20, 20, 200]);

    const result = segmentQuilt(img, {
      fabricCount: 2,
      seed: 1,
      maxWorkingDim: 64,
      minPatchAreaPx: 5,
      majorityFilterIterations: 0,
    });

    // 1 background patch + 0 speck patches.
    const specks = result.patches.filter((p) => p.areaPx < 10);
    expect(specks).toHaveLength(0);

    // Without a threshold we'd also see the speck as its own patch.
    const permissive = segmentQuilt(img, {
      fabricCount: 2,
      seed: 1,
      maxWorkingDim: 64,
      minPatchAreaPx: 0,
      majorityFilterIterations: 0,
    });
    const specksPermissive = permissive.patches.filter((p) => p.areaPx < 10);
    expect(specksPermissive.length).toBeGreaterThanOrEqual(1);
  });

  it('majority filter swallows isolated single-pixel speckle', () => {
    // 64×64 red background with a 2×2 blue speck. With the default
    // majority filter on (2 iterations), the speck should be reassigned
    // to red before CCL even runs — producing zero speck patches even
    // with minPatchAreaPx=0.
    const img = solidImage(64, 64, [200, 20, 20]);
    fillRect(img, 30, 30, 32, 32, [20, 20, 200]);

    const filtered = segmentQuilt(img, {
      fabricCount: 2,
      seed: 1,
      maxWorkingDim: 64,
      minPatchAreaPx: 0,
    });
    const specks = filtered.patches.filter((p) => p.areaPx < 10);
    expect(specks).toHaveLength(0);
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
