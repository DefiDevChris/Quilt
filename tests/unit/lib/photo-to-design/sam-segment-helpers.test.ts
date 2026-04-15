import { describe, expect, it } from 'vitest';
import {
  binarize,
  buildPointGrid,
  computeBbox,
  nonMaxSuppress,
} from '@/lib/photo-to-design/stages/sam-segment';
import type { RawSAMMask } from '@/lib/photo-to-design/types';

// ---------------------------------------------------------------------------
// binarize
// ---------------------------------------------------------------------------

describe('binarize', () => {
  it('thresholds Float32Array logits at 0.5', () => {
    const data = new Float32Array([0, 0.4, 0.5, 0.6, 1]);
    const result = binarize(data);
    expect(Array.from(result)).toEqual([0, 0, 0, 255, 255]);
  });

  it('returns a fresh Uint8Array the same length as input', () => {
    const data = new Float32Array([0.1, 0.9, 0.3]);
    const result = binarize(data);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(data.length);
  });
});

// ---------------------------------------------------------------------------
// computeBbox
// ---------------------------------------------------------------------------

describe('computeBbox', () => {
  it('returns zero box for an empty mask', () => {
    const mask = new Uint8Array(16);
    const bbox = computeBbox(mask, 4, 4);
    expect(bbox.width).toBe(0);
    expect(bbox.height).toBe(0);
  });

  it('computes a tight bbox for a single foreground pixel', () => {
    const mask = new Uint8Array(16);
    mask[5] = 255; // (x=1, y=1) in a 4×4 mask
    const bbox = computeBbox(mask, 4, 4);
    expect(bbox.minX).toBe(1);
    expect(bbox.minY).toBe(1);
    expect(bbox.maxX).toBe(1);
    expect(bbox.maxY).toBe(1);
    expect(bbox.width).toBe(1);
    expect(bbox.height).toBe(1);
  });

  it('computes a rectangular bbox for a filled rectangle', () => {
    // 6×4 mask, rectangle from (1,1) to (4,2)
    const mask = new Uint8Array(24);
    for (let y = 1; y <= 2; y++) {
      for (let x = 1; x <= 4; x++) {
        mask[y * 6 + x] = 255;
      }
    }
    const bbox = computeBbox(mask, 6, 4);
    expect(bbox.minX).toBe(1);
    expect(bbox.minY).toBe(1);
    expect(bbox.maxX).toBe(4);
    expect(bbox.maxY).toBe(2);
    expect(bbox.width).toBe(4);
    expect(bbox.height).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// buildPointGrid
// ---------------------------------------------------------------------------

describe('buildPointGrid', () => {
  it('places side*side points strictly inside the image', () => {
    const points = buildPointGrid(100, 100, 4);
    expect(points).toHaveLength(16);
    for (const [x, y] of points) {
      expect(x).toBeGreaterThan(0);
      expect(x).toBeLessThan(100);
      expect(y).toBeGreaterThan(0);
      expect(y).toBeLessThan(100);
    }
  });

  it('produces evenly-spaced x positions on the first row', () => {
    const points = buildPointGrid(100, 100, 4);
    const firstRow = points.slice(0, 4).map(([x]: [number, number]) => x);
    expect(firstRow).toEqual([20, 40, 60, 80]);
  });

  it('handles non-square images', () => {
    const points = buildPointGrid(200, 50, 2);
    expect(points).toHaveLength(4);
    expect(points[0][0]).toBeLessThan(200);
    expect(points[0][1]).toBeLessThan(50);
  });
});

// ---------------------------------------------------------------------------
// nonMaxSuppress
// ---------------------------------------------------------------------------

function maskFromRectangle(
  width: number,
  height: number,
  rect: { x: number; y: number; w: number; h: number },
  score: number
): RawSAMMask {
  const data = new Uint8Array(width * height);
  for (let y = rect.y; y < rect.y + rect.h; y++) {
    for (let x = rect.x; x < rect.x + rect.w; x++) {
      data[y * width + x] = 255;
    }
  }
  return {
    data,
    width,
    height,
    bbox: {
      minX: rect.x,
      minY: rect.y,
      maxX: rect.x + rect.w - 1,
      maxY: rect.y + rect.h - 1,
      width: rect.w,
      height: rect.h,
    },
    score,
  };
}

describe('nonMaxSuppress', () => {
  it('keeps all masks when none overlap', () => {
    const a = maskFromRectangle(10, 10, { x: 0, y: 0, w: 3, h: 3 }, 0.9);
    const b = maskFromRectangle(10, 10, { x: 6, y: 6, w: 3, h: 3 }, 0.8);
    const kept = nonMaxSuppress([a, b], 0.5);
    expect(kept).toHaveLength(2);
  });

  it('suppresses the lower-scoring of two fully-overlapping masks', () => {
    const a = maskFromRectangle(10, 10, { x: 0, y: 0, w: 4, h: 4 }, 0.9);
    const b = maskFromRectangle(10, 10, { x: 0, y: 0, w: 4, h: 4 }, 0.7);
    const kept = nonMaxSuppress([a, b], 0.5);
    expect(kept).toHaveLength(1);
    expect(kept[0].score).toBe(0.9);
  });

  it('keeps partially overlapping masks when IoU is below threshold', () => {
    // 4×4 rect at (0,0) vs 4×4 rect at (2,2) — intersection 2×2=4, union 4+16-4=... wait
    // intersection 2×2=4, areas each 16, union = 16+16-4 = 28 → IoU ~ 0.14
    const a = maskFromRectangle(10, 10, { x: 0, y: 0, w: 4, h: 4 }, 0.9);
    const b = maskFromRectangle(10, 10, { x: 2, y: 2, w: 4, h: 4 }, 0.8);
    const kept = nonMaxSuppress([a, b], 0.5);
    expect(kept).toHaveLength(2);
  });

  it('is stable — returns masks sorted by score desc', () => {
    const a = maskFromRectangle(10, 10, { x: 0, y: 0, w: 2, h: 2 }, 0.5);
    const b = maskFromRectangle(10, 10, { x: 5, y: 5, w: 2, h: 2 }, 0.9);
    const c = maskFromRectangle(10, 10, { x: 8, y: 0, w: 2, h: 2 }, 0.7);
    const kept = nonMaxSuppress([a, b, c], 0.5);
    expect(kept.map((m: RawSAMMask) => m.score)).toEqual([0.9, 0.7, 0.5]);
  });
});
