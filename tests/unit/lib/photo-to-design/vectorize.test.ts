import { describe, expect, it } from 'vitest';
import { matToPoints } from '@/lib/photo-to-design/stages/vectorize';

/**
 * Only the pure helper is unit-testable — everything else in `vectorize.ts`
 * calls OpenCV WASM which isn't available under jsdom. Integration coverage
 * for the full stage lives in U8's Playwright sweep.
 */

describe('matToPoints', () => {
  it('returns an empty array for zero rows', () => {
    expect(matToPoints({ data32S: new Int32Array(0), rows: 0 })).toEqual([]);
  });

  it('unpacks a single CV_32SC2 row into one Point', () => {
    const mat = { data32S: new Int32Array([7, 13]), rows: 1 };
    expect(matToPoints(mat)).toEqual([{ x: 7, y: 13 }]);
  });

  it('reads every row even when the backing Int32Array has trailing storage', () => {
    // Simulates cv.js's convention of a flat Int32Array [x0,y0,x1,y1,...]
    // where the buffer may be larger than 2*rows.
    const data32S = new Int32Array([1, 2, 3, 4, 5, 6, 99, 99]);
    const mat = { data32S, rows: 3 };
    expect(matToPoints(mat)).toEqual([
      { x: 1, y: 2 },
      { x: 3, y: 4 },
      { x: 5, y: 6 },
    ]);
  });

  it('handles a quad — the common output of approxPolyDP on a square mask', () => {
    // Typical cv.approxPolyDP output for a rectangle: four (x, y) corners.
    const data32S = new Int32Array([0, 0, 10, 0, 10, 10, 0, 10]);
    const mat = { data32S, rows: 4 };
    const pts = matToPoints(mat);
    expect(pts).toHaveLength(4);
    expect(pts[0]).toEqual({ x: 0, y: 0 });
    expect(pts[2]).toEqual({ x: 10, y: 10 });
  });

  it('preserves negative coordinates', () => {
    // Not expected from real OpenCV output, but matToPoints is pure — shouldn't filter.
    const mat = { data32S: new Int32Array([-1, -2, 3, -4]), rows: 2 };
    expect(matToPoints(mat)).toEqual([
      { x: -1, y: -2 },
      { x: 3, y: -4 },
    ]);
  });
});
