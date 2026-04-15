import { describe, it, expect } from 'vitest';
import {
  rleEncode,
  rleDecode,
  rleDecodeInto,
  LabelMapHistory,
} from '../cv/rle-history';

function randomLabelMap(n: number, maxId: number, seed = 1): Int32Array {
  const out = new Int32Array(n);
  let s = seed;
  for (let i = 0; i < n; i++) {
    s = (s * 1664525 + 1013904223) | 0;
    out[i] = Math.abs(s) % maxId;
  }
  return out;
}

function runLengthLabelMap(n: number, maxId: number, seed = 7): Int32Array {
  // Simulates realistic label maps: a sequence of big runs of identical IDs.
  const out = new Int32Array(n);
  let s = seed;
  let i = 0;
  while (i < n) {
    s = (s * 1103515245 + 12345) | 0;
    const runLen = Math.min(n - i, 1 + (Math.abs(s) % 200));
    s = (s * 1103515245 + 12345) | 0;
    const value = Math.abs(s) % maxId;
    for (let k = 0; k < runLen; k++) out[i + k] = value;
    i += runLen;
  }
  return out;
}

describe('rle-history', () => {
  it('round-trips a small hand-crafted label map exactly', () => {
    const src = new Int32Array([0, 0, 0, 1, 1, 2, 2, 2, 2, 3, 3, 0]);
    const encoded = rleEncode(src);
    const decoded = rleDecode(encoded);
    expect(decoded.length).toBe(src.length);
    for (let i = 0; i < src.length; i++) {
      expect(decoded[i]).toBe(src[i]);
    }
  });

  it('round-trips a 10k-element random map exactly', () => {
    const src = randomLabelMap(10_000, 50, 42);
    const encoded = rleEncode(src);
    const dest = new Int32Array(src.length);
    rleDecodeInto(encoded, dest);
    for (let i = 0; i < src.length; i++) {
      expect(dest[i]).toBe(src[i]);
    }
  });

  it('round-trips a realistic run-length map and compresses it significantly', () => {
    const src = runLengthLabelMap(50_000, 30, 11);
    const encoded = rleEncode(src);
    const dest = new Int32Array(src.length);
    rleDecodeInto(encoded, dest);
    for (let i = 0; i < src.length; i++) {
      expect(dest[i]).toBe(src[i]);
    }
    // Runs of ~100 ids should compress at least 5x vs raw i32 bytes.
    expect(encoded.byteLength).toBeLessThan(src.byteLength / 5);
  });

  it('throws when decoding into a destination of the wrong size', () => {
    const src = new Int32Array([1, 2, 3, 4]);
    const enc = rleEncode(src);
    expect(() => rleDecodeInto(enc, new Int32Array(5))).toThrow();
  });
});

describe('LabelMapHistory', () => {
  function makeMap(fill: number): Int32Array {
    return new Int32Array([fill, fill, fill, fill]);
  }

  it('undo restores the previous snapshot exactly', () => {
    const h = new LabelMapHistory(15);
    h.push(makeMap(1));
    h.push(makeMap(2));
    expect(h.canUndo).toBe(true);
    expect(h.canRedo).toBe(false);

    const dest = new Int32Array(4);
    dest.set(makeMap(2));
    expect(h.undo(dest)).toBe(true);
    expect(Array.from(dest)).toEqual([1, 1, 1, 1]);
    expect(h.canUndo).toBe(false);
    expect(h.canRedo).toBe(true);
  });

  it('redo re-applies the undone snapshot exactly', () => {
    const h = new LabelMapHistory(15);
    h.push(makeMap(1));
    h.push(makeMap(2));
    const dest = new Int32Array(4);
    h.undo(dest);
    expect(h.redo(dest)).toBe(true);
    expect(Array.from(dest)).toEqual([2, 2, 2, 2]);
  });

  it('new push after undo truncates redo history', () => {
    const h = new LabelMapHistory(15);
    h.push(makeMap(1));
    h.push(makeMap(2));
    h.push(makeMap(3));
    const dest = new Int32Array(4);
    h.undo(dest); // now on slot 2 (value=2)
    expect(h.canRedo).toBe(true);
    h.push(makeMap(9)); // kills redo tail
    expect(h.canRedo).toBe(false);
    h.undo(dest);
    expect(Array.from(dest)).toEqual([2, 2, 2, 2]);
  });

  it('evicts oldest snapshots beyond the cap', () => {
    const h = new LabelMapHistory(3);
    for (let i = 0; i < 5; i++) h.push(makeMap(i));
    expect(h.size).toBe(3);
    // Pointer should be at the last pushed, so undo twice == size-3.
    const dest = new Int32Array(4);
    h.undo(dest);
    h.undo(dest);
    expect(h.canUndo).toBe(false);
    // The oldest remaining value should be 2 (0 and 1 were evicted).
    expect(Array.from(dest)).toEqual([2, 2, 2, 2]);
  });
});
