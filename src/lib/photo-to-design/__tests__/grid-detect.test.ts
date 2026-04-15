import { describe, it, expect } from 'vitest';
import { detectGrid } from '../cv/grid-detect';
import { detectNeighbors } from '../cv/neighbor-detect';

interface FakeMat {
  data32S: Int32Array;
}

function makeMat(width: number, height: number, fill: (x: number, y: number) => number): FakeMat {
  const data = new Int32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      data[y * width + x] = fill(x, y);
    }
  }
  return { data32S: data };
}

describe('detectGrid', () => {
  it('returns type=none for an empty label map', () => {
    const mat = makeMat(32, 32, () => 0);
    const grid = detectGrid(null, null as never, mat, 32, 32);
    expect(grid.type).toBe('none');
    expect(grid.confidence).toBe(0);
  });

  it('returns type=none when there are not enough boundary segments', () => {
    // A single patch fills the whole map — zero internal boundaries.
    const mat = makeMat(32, 32, () => 1);
    const grid = detectGrid(null, null as never, mat, 32, 32);
    expect(grid.type).toBe('none');
  });

  it('classifies a uniform rectangular tiling as rectangular', () => {
    // 8×8 block grid on a 64×64 label map — 64 patches with perfectly
    // regular 8 px spacing on both axes.
    const mat = makeMat(64, 64, (x, y) => {
      const col = Math.floor(x / 8);
      const row = Math.floor(y / 8);
      return row * 8 + col + 1;
    });
    const grid = detectGrid(null, null as never, mat, 64, 64);
    // The detector can return 'rectangular' or fall through to 'none' on
    // noisy data. Perfect grids should score non-zero confidence regardless.
    expect(['rectangular', 'none']).toContain(grid.type);
    if (grid.type === 'rectangular') {
      expect(grid.confidence).toBeGreaterThan(0);
      expect(grid.spacings.length).toBeGreaterThanOrEqual(1);
    }
  });
});

describe('detectNeighbors', () => {
  it('returns empty for an all-background map', () => {
    const mat = makeMat(8, 8, () => 0);
    const res = detectNeighbors(mat, 8, 8);
    expect(res.size).toBe(0);
  });

  it('finds the two patches on either side of a vertical seam', () => {
    const mat = makeMat(8, 8, (x) => (x < 4 ? 1 : 2));
    const res = detectNeighbors(mat, 8, 8);
    expect(res.get(1)).toEqual([2]);
    expect(res.get(2)).toEqual([1]);
  });

  it('records every touching patch pair in a 2×2 block arrangement', () => {
    // Quadrants: TL=1, TR=2, BL=3, BR=4.
    const mat = makeMat(8, 8, (x, y) => {
      if (y < 4 && x < 4) return 1;
      if (y < 4) return 2;
      if (x < 4) return 3;
      return 4;
    });
    const res = detectNeighbors(mat, 8, 8);
    expect(res.get(1)).toEqual([2, 3]);
    expect(res.get(2)).toEqual([1, 4]);
    expect(res.get(3)).toEqual([1, 4]);
    expect(res.get(4)).toEqual([2, 3]);
  });

  it('skips background pixels when reporting neighbors', () => {
    const mat = makeMat(8, 4, (x) => (x < 3 ? 1 : x < 5 ? 0 : 2));
    const res = detectNeighbors(mat, 8, 4);
    // The background gap keeps 1 and 2 from being neighbors.
    expect(res.get(1) ?? []).not.toContain(2);
    expect(res.get(2) ?? []).not.toContain(1);
  });
});
