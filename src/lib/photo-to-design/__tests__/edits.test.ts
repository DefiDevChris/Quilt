import { describe, it, expect } from 'vitest';
import { findSeamPair, labelAt, maxPatchId, mergePatchesImpl } from '../cv/edits';

// ── Synthetic label map helper ────────────────────────────────────────────
//
// These tests cover the pure-JS helpers in cv/edits.ts that operate directly
// on Int32Array label maps. splitPatchImpl / floodFillImpl touch `cv` (for
// line rasterization and connectedComponents), which lives in the WASM
// runtime — those are covered by the Playwright E2E walk-through, not here.
//
// The helper mimics the subset of the OpenCV.js Mat surface the functions
// actually read: data32S.

interface FakeMat {
  data32S: Int32Array;
}

function makeLabelMat(width: number, height: number, fill: (x: number, y: number) => number): FakeMat {
  const data = new Int32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      data[y * width + x] = fill(x, y);
    }
  }
  return { data32S: data };
}

describe('labelAt', () => {
  it('returns the value at integer coords', () => {
    const mat = makeLabelMat(4, 4, (x, y) => y * 4 + x);
    expect(labelAt(mat, 4, 4, 0, 0)).toBe(0);
    expect(labelAt(mat, 4, 4, 3, 3)).toBe(15);
  });

  it('rounds fractional coords and clamps to the image bounds', () => {
    const mat = makeLabelMat(4, 4, (x, y) => y * 4 + x);
    expect(labelAt(mat, 4, 4, 2.4, 2.4)).toBe(2 * 4 + 2);
    expect(labelAt(mat, 4, 4, -5, -5)).toBe(0);
    expect(labelAt(mat, 4, 4, 100, 100)).toBe(15);
  });
});

describe('maxPatchId', () => {
  it('returns the largest non-zero label present in the map', () => {
    const mat = makeLabelMat(8, 8, (x) => (x < 4 ? 3 : 7));
    expect(maxPatchId(mat, 8, 8)).toBe(7);
  });

  it('returns 0 for an all-zero map', () => {
    const mat = makeLabelMat(4, 4, () => 0);
    expect(maxPatchId(mat, 4, 4)).toBe(0);
  });
});

describe('mergePatchesImpl', () => {
  it('relabels every pixel with value bId → aId', () => {
    // Left half = 1, right half = 2.
    const mat = makeLabelMat(8, 4, (x) => (x < 4 ? 1 : 2));
    const changed = mergePatchesImpl(mat, 1, 2, 8, 4);
    expect(changed).toBe(16);
    for (let i = 0; i < 32; i++) expect(mat.data32S[i]).toBe(1);
  });

  it('returns 0 and leaves the map untouched when aId === bId', () => {
    const mat = makeLabelMat(4, 4, (x, y) => y * 4 + x);
    const copy = new Int32Array(mat.data32S);
    expect(mergePatchesImpl(mat, 5, 5, 4, 4)).toBe(0);
    for (let i = 0; i < 16; i++) expect(mat.data32S[i]).toBe(copy[i]);
  });

  it('returns 0 when bId is not present', () => {
    const mat = makeLabelMat(4, 4, () => 1);
    expect(mergePatchesImpl(mat, 1, 99, 4, 4)).toBe(0);
  });
});

describe('findSeamPair', () => {
  it('returns the two dominant IDs around a boundary click', () => {
    // Vertical seam at x = 8 on a 16-wide map.
    const mat = makeLabelMat(16, 16, (x) => (x < 8 ? 1 : 2));
    const pair = findSeamPair(mat, 16, 16, { x: 8, y: 8 }, 6);
    expect(pair).not.toBeNull();
    // Order is largest count first. Both halves are equal so either ordering
    // is acceptable — assert the set instead.
    const ids = new Set([pair!.aId, pair!.bId]);
    expect(ids).toEqual(new Set([1, 2]));
  });

  it('returns null when the click is deep inside a single patch', () => {
    const mat = makeLabelMat(16, 16, () => 5);
    const pair = findSeamPair(mat, 16, 16, { x: 8, y: 8 }, 3);
    expect(pair).toBeNull();
  });

  it('ignores background pixels (0) when counting IDs', () => {
    // Three-band map: background(0) | 1 | 2 — click between 1 and 2.
    const mat = makeLabelMat(30, 10, (x) => (x < 5 ? 0 : x < 15 ? 1 : 2));
    const pair = findSeamPair(mat, 30, 10, { x: 15, y: 5 }, 4);
    expect(pair).not.toBeNull();
    expect(new Set([pair!.aId, pair!.bId])).toEqual(new Set([1, 2]));
  });
});
