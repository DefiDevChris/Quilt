import { describe, expect, it } from 'vitest';
import {
  buildShapeKey,
  buildSvgPath,
  canonicalizePatches,
  signedArea,
  snapPointToGrid,
  snapPolygon,
  DEFAULT_SNAP_DIVISOR,
} from '@/lib/photo-to-design/stages/canonicalize';
import type { GridSpec, Patch, Point, VectorizedPatch } from '@/lib/photo-to-design/types';

const GRID_1IN: GridSpec = {
  cellSize: 40, // 40 px per cell
  offsetX: 0,
  offsetY: 0,
  cols: 10,
  rows: 10,
};

const SNAP_STEP = GRID_1IN.cellSize / DEFAULT_SNAP_DIVISOR; // 10 px

function toVectorized(vertices: Point[], score = 0.9): VectorizedPatch {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const v of vertices) {
    if (v.x < minX) minX = v.x;
    if (v.x > maxX) maxX = v.x;
    if (v.y < minY) minY = v.y;
    if (v.y > maxY) maxY = v.y;
  }
  return {
    vertices,
    bbox: { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY },
    score,
  };
}

// ---------------------------------------------------------------------------
// snapPointToGrid
// ---------------------------------------------------------------------------

describe('snapPointToGrid', () => {
  it('rounds to the nearest grid intersection', () => {
    expect(snapPointToGrid({ x: 12, y: 27 }, GRID_1IN, SNAP_STEP)).toEqual({ x: 10, y: 30 });
    expect(snapPointToGrid({ x: 14.9, y: 25.1 }, GRID_1IN, SNAP_STEP)).toEqual({ x: 10, y: 30 });
    expect(snapPointToGrid({ x: 15.1, y: 24.9 }, GRID_1IN, SNAP_STEP)).toEqual({ x: 20, y: 20 });
  });

  it('respects non-zero grid offset', () => {
    const offsetGrid: GridSpec = { ...GRID_1IN, offsetX: 5, offsetY: 5 };
    expect(snapPointToGrid({ x: 16, y: 16 }, offsetGrid, SNAP_STEP)).toEqual({ x: 15, y: 15 });
  });
});

// ---------------------------------------------------------------------------
// snapPolygon
// ---------------------------------------------------------------------------

describe('snapPolygon', () => {
  it('snaps a jittered square to a perfect grid-aligned square', () => {
    const jittered: Point[] = [
      { x: 1, y: 2 },
      { x: 39, y: 1 },
      { x: 41, y: 38 },
      { x: -1, y: 41 },
    ];
    const snapped = snapPolygon(jittered, GRID_1IN, SNAP_STEP);
    expect(snapped).toEqual([
      { x: 0, y: 0 },
      { x: 40, y: 0 },
      { x: 40, y: 40 },
      { x: 0, y: 40 },
    ]);
  });

  it('removes consecutive duplicate vertices produced by snapping', () => {
    const input: Point[] = [
      { x: 0, y: 0 },
      { x: 2, y: 2 }, // snaps to (0, 0) — duplicate of prev
      { x: 20, y: 20 },
      { x: 40, y: 40 },
    ];
    const snapped = snapPolygon(input, GRID_1IN, SNAP_STEP);
    expect(snapped).toEqual([
      { x: 0, y: 0 },
      { x: 20, y: 20 },
      { x: 40, y: 40 },
    ]);
  });

  it('drops the closing duplicate when first === last after snap', () => {
    const input: Point[] = [
      { x: 0, y: 0 },
      { x: 40, y: 0 },
      { x: 40, y: 40 },
      { x: 0, y: 40 },
      { x: 1, y: 1 }, // snaps back to (0, 0)
    ];
    const snapped = snapPolygon(input, GRID_1IN, SNAP_STEP);
    expect(snapped).toHaveLength(4);
    expect(snapped[0]).not.toEqual(snapped[3]);
  });

  it('can collapse a polygon smaller than the snap step', () => {
    const tiny: Point[] = [
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 2, y: 2 },
    ];
    const snapped = snapPolygon(tiny, GRID_1IN, SNAP_STEP);
    expect(snapped.length).toBeLessThan(3);
  });
});

// ---------------------------------------------------------------------------
// signedArea
// ---------------------------------------------------------------------------

describe('signedArea', () => {
  it('returns opposite sign when winding reverses', () => {
    const cw: Point[] = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ];
    const ccw = [...cw].reverse();
    expect(Math.sign(signedArea(cw))).toBe(-Math.sign(signedArea(ccw)));
  });
});

// ---------------------------------------------------------------------------
// buildShapeKey
// ---------------------------------------------------------------------------

describe('buildShapeKey', () => {
  it('is translation invariant — identical shape at different positions share a key', () => {
    const a: Point[] = [
      { x: 0, y: 0 },
      { x: 40, y: 0 },
      { x: 40, y: 40 },
      { x: 0, y: 40 },
    ];
    const b: Point[] = a.map((p) => ({ x: p.x + 100, y: p.y + 50 }));
    expect(buildShapeKey(a)).toBe(buildShapeKey(b));
  });

  it('is starting-vertex invariant', () => {
    const a: Point[] = [
      { x: 0, y: 0 },
      { x: 40, y: 0 },
      { x: 40, y: 40 },
      { x: 0, y: 40 },
    ];
    const rotated = [a[2], a[3], a[0], a[1]];
    expect(buildShapeKey(a)).toBe(buildShapeKey(rotated));
  });

  it('is winding invariant', () => {
    const a: Point[] = [
      { x: 0, y: 0 },
      { x: 40, y: 0 },
      { x: 40, y: 40 },
      { x: 0, y: 40 },
    ];
    const reversed = [...a].reverse();
    expect(buildShapeKey(a)).toBe(buildShapeKey(reversed));
  });

  it('distinguishes different rectangle sizes by one snap step', () => {
    // 4×2 vs 4.25×2 rectangle at the same grid — must be different templates.
    const square4x2: Point[] = [
      { x: 0, y: 0 },
      { x: 160, y: 0 },
      { x: 160, y: 80 },
      { x: 0, y: 80 },
    ];
    const square41x2: Point[] = [
      { x: 0, y: 0 },
      { x: 170, y: 0 }, // 4.25 × 40 px
      { x: 170, y: 80 },
      { x: 0, y: 80 },
    ];
    expect(buildShapeKey(square4x2)).not.toBe(buildShapeKey(square41x2));
  });

  it('distinguishes a 45°-rotated square from an axis-aligned square', () => {
    const axis: Point[] = [
      { x: 0, y: 0 },
      { x: 40, y: 0 },
      { x: 40, y: 40 },
      { x: 0, y: 40 },
    ];
    const diag: Point[] = [
      { x: 20, y: 0 },
      { x: 40, y: 20 },
      { x: 20, y: 40 },
      { x: 0, y: 20 },
    ];
    expect(buildShapeKey(axis)).not.toBe(buildShapeKey(diag));
  });
});

// ---------------------------------------------------------------------------
// buildSvgPath
// ---------------------------------------------------------------------------

describe('buildSvgPath', () => {
  it('produces an M/L/Z closed path', () => {
    const path = buildSvgPath([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
    ]);
    expect(path).toBe('M0 0 L10 0 L10 10 Z');
  });

  it('returns an empty string for no vertices', () => {
    expect(buildSvgPath([])).toBe('');
  });
});

// ---------------------------------------------------------------------------
// canonicalizePatches — the full stage
// ---------------------------------------------------------------------------

describe('canonicalizePatches', () => {
  it('emits one templateId for 50 jittered 2x2 squares', () => {
    const patches: VectorizedPatch[] = [];
    for (let i = 0; i < 50; i++) {
      const jitter = () => (Math.random() - 0.5) * 6; // ±3 px jitter
      const baseX = 40 + (i % 10) * 120; // spread across grid
      const baseY = 40 + Math.floor(i / 10) * 120;
      patches.push(
        toVectorized([
          { x: baseX + jitter(), y: baseY + jitter() },
          { x: baseX + 80 + jitter(), y: baseY + jitter() },
          { x: baseX + 80 + jitter(), y: baseY + 80 + jitter() },
          { x: baseX + jitter(), y: baseY + 80 + jitter() },
        ])
      );
    }
    const result = canonicalizePatches(patches, GRID_1IN);
    expect(result).toHaveLength(50);
    const ids = new Set(result.map((p: Patch) => p.templateId));
    expect(ids.size).toBe(1);
  });

  it('keeps 4.1"×2" and 4.0"×2" rectangles under different templates', () => {
    const a = toVectorized([
      { x: 0, y: 0 },
      { x: 160, y: 0 },
      { x: 160, y: 80 },
      { x: 0, y: 80 },
    ]);
    // 4.1" × 2" — +10 px on one axis (one snap step over)
    const b = toVectorized([
      { x: 200, y: 200 },
      { x: 370, y: 200 },
      { x: 370, y: 280 },
      { x: 200, y: 280 },
    ]);
    const result = canonicalizePatches([a, b], GRID_1IN);
    expect(result).toHaveLength(2);
    expect(result[0].templateId).not.toBe(result[1].templateId);
  });

  it('drops polygons that collapse below three vertices after snap', () => {
    const skinny = toVectorized([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
    ]); // All three snap to (0, 0)
    const result = canonicalizePatches([skinny], GRID_1IN);
    expect(result).toHaveLength(0);
  });

  it('assigns unique patch ids even within the same templateId', () => {
    const square = (dx: number, dy: number) =>
      toVectorized([
        { x: dx + 0, y: dy + 0 },
        { x: dx + 40, y: dy + 0 },
        { x: dx + 40, y: dy + 40 },
        { x: dx + 0, y: dy + 40 },
      ]);
    const result = canonicalizePatches([square(0, 0), square(80, 0), square(160, 0)], GRID_1IN);
    expect(result).toHaveLength(3);
    expect(new Set(result.map((p: Patch) => p.id)).size).toBe(3);
    expect(new Set(result.map((p: Patch) => p.templateId)).size).toBe(1);
  });

  it('emits svgPath for every patch it keeps', () => {
    const square = toVectorized([
      { x: 0, y: 0 },
      { x: 40, y: 0 },
      { x: 40, y: 40 },
      { x: 0, y: 40 },
    ]);
    const [patch] = canonicalizePatches([square], GRID_1IN);
    expect(patch.svgPath).toMatch(/^M.*L.*Z$/);
  });
});
