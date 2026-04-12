import { describe, it, expect } from 'vitest';
import { traceBorder } from '@/lib/contour-trace';
import { labelComponents } from '@/lib/connected-components';

/**
 * Build a label buffer from an ASCII mask. Foreground (`#`) pixels all get
 * the same label, 1. Background stays 0. Bypasses the full CCL machinery
 * so the border-tracer tests stay isolated from `labelComponents`.
 */
function labelsFromAscii(ascii: string): {
  labels: Uint32Array;
  width: number;
  height: number;
} {
  const rows = ascii
    .split('\n')
    .map((r) => r.trim())
    .filter((r) => r.length > 0);
  const height = rows.length;
  const width = rows[0]?.length ?? 0;
  const labels = new Uint32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      labels[y * width + x] = rows[y][x] === '#' ? 1 : 0;
    }
  }
  return { labels, width, height };
}

describe('traceBorder', () => {
  it('traces a 4×4 solid square as a 12-pixel perimeter loop', () => {
    const { labels, width, height } = labelsFromAscii(`
      ####
      ####
      ####
      ####
    `);
    const border = traceBorder(labels, width, height, 1);

    // 4N - 4 = 12 boundary pixels for an N×N filled square, N=4.
    expect(border).toHaveLength(12);

    // First pixel is the top-left corner.
    expect(border[0]).toEqual({ x: 0, y: 0 });

    // Every pixel in the loop must be foreground and lie inside bounds.
    for (const p of border) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThan(width);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThan(height);
      expect(labels[p.y * width + p.x]).toBe(1);
    }

    // The 4 inner pixels (1,1)(2,1)(1,2)(2,2) should NOT appear — they
    // have no background neighbours so they aren't border pixels.
    const visited = new Set(border.map((p) => `${p.x},${p.y}`));
    expect(visited.has('1,1')).toBe(false);
    expect(visited.has('2,1')).toBe(false);
    expect(visited.has('1,2')).toBe(false);
    expect(visited.has('2,2')).toBe(false);
  });

  it('returns a single-point array for a one-pixel component', () => {
    const { labels, width, height } = labelsFromAscii(`
      ...
      .#.
      ...
    `);
    const border = traceBorder(labels, width, height, 1);
    expect(border).toEqual([{ x: 1, y: 1 }]);
  });

  it('returns an empty array when the target id is not present', () => {
    const { labels, width, height } = labelsFromAscii(`
      ####
      ####
    `);
    // Component id 99 was never assigned.
    expect(traceBorder(labels, width, height, 99)).toEqual([]);
  });

  it('traces a 3×3 L-shape visiting all 7 foreground pixels exactly once', () => {
    // Every pixel of this L is on the boundary (each has at least one
    // background or OOB 4-neighbour), so the perimeter count equals the
    // total pixel count.
    const { labels, width, height } = labelsFromAscii(`
      ##.
      ##.
      ###
    `);
    const border = traceBorder(labels, width, height, 1);

    expect(border).toHaveLength(7);
    const visited = new Set(border.map((p) => `${p.x},${p.y}`));
    const expected = new Set(['0,0', '1,0', '0,1', '1,1', '0,2', '1,2', '2,2']);
    expect(visited).toEqual(expected);
  });

  it('traces a component touching the image edge without out-of-bounds reads', () => {
    // The blob is anchored at (0,0) and runs along the top-left edge.
    // If the tracer ever read OOB it would either crash or return
    // garbage — we assert a clean, closed border.
    const { labels, width, height } = labelsFromAscii(`
      ####
      ##..
      ##..
      ....
    `);
    const border = traceBorder(labels, width, height, 1);

    // Border pixels: (0,0), (1,0), (2,0), (3,0) along top edge, and
    // (0,1)(1,1)(0,2)(1,2) in the lower-left L. The outer contour
    // walks every foreground pixel because all of them have background
    // or OOB 4-neighbours.
    expect(border.length).toBeGreaterThan(0);
    const visited = new Set(border.map((p) => `${p.x},${p.y}`));
    expect(visited.has('0,0')).toBe(true);
    expect(visited.has('3,0')).toBe(true);
    expect(visited.has('0,2')).toBe(true);
    // None of the background pixels appear.
    for (const p of border) {
      expect(labels[p.y * width + p.x]).toBe(1);
    }
    // And no pixel is ever emitted out of the image bounds.
    for (const p of border) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThan(width);
      expect(p.y).toBeLessThan(height);
    }
  });

  it('integrates with labelComponents to trace the border of component 1', () => {
    // Smoke test: the real pipeline feeds `labels` from `labelComponents`
    // straight into `traceBorder`. Build a mask, run CCL, pick a component,
    // then trace it — make sure the types and ids line up.
    const width = 5;
    const height = 5;
    const mask = new Uint8Array([
      0, 0, 0, 0, 0,
      0, 1, 1, 1, 0,
      0, 1, 1, 1, 0,
      0, 1, 1, 1, 0,
      0, 0, 0, 0, 0,
    ]);
    const cc = labelComponents(mask, width, height);
    expect(cc.components).toHaveLength(1);

    const border = traceBorder(cc.labels, width, height, cc.components[0].id);
    // 3×3 solid square → 4*3 - 4 = 8 border pixels.
    expect(border).toHaveLength(8);
  });
});
