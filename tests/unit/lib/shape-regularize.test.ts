import { describe, expect, it } from 'vitest';
import { regularizeSegmentation } from '@/lib/shape-regularize';
import type { DetectedPatch, SegmentationResult } from '@/lib/quilt-segmentation-engine';
import type { Point2D } from '@/lib/photo-layout-types';

// ── Fixtures ─────────────────────────────────────────────────────────────

/**
 * 480 px warped image at 40 px/inch = 12" block — mirrors the real
 * Review step defaults. `snapIncrementInches: 0.5` puts grid lines every
 * 20 px, which makes test expectations legible.
 */
const PX_PER_INCH = 40;
const SNAP_INCREMENT_INCHES = 0.5;

function makeResult(patches: DetectedPatch[]): SegmentationResult {
  return { palette: [], patches, width: 480, height: 480 };
}

function makePatch(
  id: string,
  polygon: readonly Point2D[],
  opts: { areaPx?: number } = {}
): DetectedPatch {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of polygon) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  const bboxArea = (maxX - minX) * (maxY - minY);
  return {
    id,
    clusterIndex: 0,
    polygonPx: polygon,
    centroidPx: {
      x: polygon.reduce((s, p) => s + p.x, 0) / polygon.length,
      y: polygon.reduce((s, p) => s + p.y, 0) / polygon.length,
    },
    areaPx: opts.areaPx ?? bboxArea,
    bboxPx: { minX, minY, maxX, maxY },
  };
}

function isMultipleOf(value: number, increment: number, epsilon = 1e-6): boolean {
  const mod = value / increment;
  return Math.abs(mod - Math.round(mod)) < epsilon;
}

// ── Tests ────────────────────────────────────────────────────────────────

describe('regularizeSegmentation', () => {
  it('passes through empty input unchanged', () => {
    const empty = makeResult([]);
    const out = regularizeSegmentation(empty, { pxPerInch: PX_PER_INCH });
    expect(out).toEqual(empty);
  });

  it('passes through when pxPerInch is non-positive', () => {
    const patch = makePatch('p0', [
      { x: 5.3, y: 6.7 },
      { x: 25.1, y: 6.7 },
      { x: 25.1, y: 26.2 },
      { x: 5.3, y: 26.2 },
    ]);
    const result = makeResult([patch]);
    const out = regularizeSegmentation(result, { pxPerInch: 0 });
    expect(out).toBe(result);
  });

  it('replaces a jagged square with a clean axis-aligned rect on the grid', () => {
    // Jagged 0.5"-ish square with vertices noisy inside a ~20×20 px bbox.
    // Fill ratio is high because areaPx ≈ bbox area.
    const patch = makePatch(
      'sq',
      [
        { x: 4.3, y: 5.7 },
        { x: 24.1, y: 5.7 },
        { x: 24.1, y: 24.8 },
        { x: 4.3, y: 24.8 },
      ],
      { areaPx: (24.1 - 4.3) * (24.8 - 5.7) * 0.98 }
    );

    const out = regularizeSegmentation(makeResult([patch]), {
      pxPerInch: PX_PER_INCH,
      snapIncrementInches: SNAP_INCREMENT_INCHES,
    });

    expect(out.patches).toHaveLength(1);
    const poly = out.patches[0].polygonPx;
    expect(poly).toHaveLength(4);

    // Every vertex sits on a 20-px (= 0.5") grid intersection.
    const pxPerIncrement = PX_PER_INCH * SNAP_INCREMENT_INCHES;
    for (const p of poly) {
      expect(isMultipleOf(p.x, pxPerIncrement)).toBe(true);
      expect(isMultipleOf(p.y, pxPerIncrement)).toBe(true);
    }

    // Four corners with right angles and equal side lengths — i.e. an
    // axis-aligned rectangle.
    expect(poly[0].y).toBe(poly[1].y); // top edge horizontal
    expect(poly[2].y).toBe(poly[3].y); // bottom edge horizontal
    expect(poly[0].x).toBe(poly[3].x); // left edge vertical
    expect(poly[1].x).toBe(poly[2].x); // right edge vertical
  });

  it('regularizes a TL-right triangle into a clean right triangle', () => {
    // Right angle at TL (0,0); legs along +x and +y.
    const patch = makePatch(
      'tri',
      [
        { x: 4.1, y: 5.9 },
        { x: 24.8, y: 5.9 },
        { x: 4.1, y: 24.3 },
      ],
      // Half the bbox area — classic right-triangle fill ratio.
      { areaPx: 0.5 * (24.8 - 4.1) * (24.3 - 5.9) }
    );

    const out = regularizeSegmentation(makeResult([patch]), {
      pxPerInch: PX_PER_INCH,
      snapIncrementInches: SNAP_INCREMENT_INCHES,
    });

    const poly = out.patches[0].polygonPx;
    expect(poly).toHaveLength(3);

    const pxPerIncrement = PX_PER_INCH * SNAP_INCREMENT_INCHES;
    for (const p of poly) {
      expect(isMultipleOf(p.x, pxPerIncrement)).toBe(true);
      expect(isMultipleOf(p.y, pxPerIncrement)).toBe(true);
    }

    // The right angle corner should have both legs axis-aligned. For a
    // TL right angle, exactly two vertices share its X and two share
    // its Y.
    const rightAngle = poly.find((p) => {
      const sharesX = poly.filter((q) => q.x === p.x).length >= 2;
      const sharesY = poly.filter((q) => q.y === p.y).length >= 2;
      return sharesX && sharesY;
    });
    expect(rightAngle).toBeDefined();
  });

  it('detects all four right-triangle orientations', () => {
    const cases: Array<[string, Point2D[]]> = [
      [
        'tl',
        [
          { x: 4, y: 6 },
          { x: 24, y: 6 },
          { x: 4, y: 24 },
        ],
      ],
      [
        'tr',
        [
          { x: 4, y: 6 },
          { x: 24, y: 6 },
          { x: 24, y: 24 },
        ],
      ],
      [
        'br',
        [
          { x: 24, y: 6 },
          { x: 24, y: 24 },
          { x: 4, y: 24 },
        ],
      ],
      [
        'bl',
        [
          { x: 4, y: 6 },
          { x: 24, y: 24 },
          { x: 4, y: 24 },
        ],
      ],
    ];

    for (const [label, verts] of cases) {
      const patch = makePatch(`tri-${label}`, verts, {
        areaPx: 0.5 * (24 - 4) * (24 - 6),
      });
      const out = regularizeSegmentation(makeResult([patch]), {
        pxPerInch: PX_PER_INCH,
        snapIncrementInches: SNAP_INCREMENT_INCHES,
      });
      expect(out.patches[0].polygonPx, label).toHaveLength(3);
    }
  });

  it('averages near-identical squares into one canonical dimension', () => {
    // Three squares with slightly different sizes that all bucket into
    // the same 0.5" group. The canonical dims come from the mean.
    const patches: DetectedPatch[] = [
      makePatch(
        'a',
        [
          { x: 0, y: 0 },
          { x: 19, y: 0 },
          { x: 19, y: 19 },
          { x: 0, y: 19 },
        ],
        { areaPx: 19 * 19 * 0.99 }
      ),
      makePatch(
        'b',
        [
          { x: 100, y: 100 },
          { x: 121, y: 100 },
          { x: 121, y: 121 },
          { x: 100, y: 121 },
        ],
        { areaPx: 21 * 21 * 0.99 }
      ),
      makePatch(
        'c',
        [
          { x: 200, y: 200 },
          { x: 220, y: 200 },
          { x: 220, y: 220 },
          { x: 200, y: 220 },
        ],
        { areaPx: 20 * 20 * 0.99 }
      ),
    ];

    const out = regularizeSegmentation(makeResult(patches), {
      pxPerInch: PX_PER_INCH,
      snapIncrementInches: SNAP_INCREMENT_INCHES,
    });

    // Every output square should have identical dimensions — the
    // averaged canonical size. Mean(19, 21, 20) = 20 px = 0.5" — which
    // rounds to 0.5" and back to 20 px.
    const sizes = out.patches.map((p) => ({
      w: p.bboxPx.maxX - p.bboxPx.minX,
      h: p.bboxPx.maxY - p.bboxPx.minY,
    }));
    expect(new Set(sizes.map((s) => s.w)).size).toBe(1);
    expect(new Set(sizes.map((s) => s.h)).size).toBe(1);
    expect(sizes[0].w).toBe(20);
    expect(sizes[0].h).toBe(20);
  });

  it('groups rects and triangles into separate buckets', () => {
    const rect = makePatch(
      'r',
      [
        { x: 0, y: 0 },
        { x: 20, y: 0 },
        { x: 20, y: 20 },
        { x: 0, y: 20 },
      ],
      { areaPx: 20 * 20 }
    );
    const tri = makePatch(
      't',
      [
        { x: 100, y: 100 },
        { x: 120, y: 100 },
        { x: 100, y: 120 },
      ],
      { areaPx: 0.5 * 20 * 20 }
    );

    const out = regularizeSegmentation(makeResult([rect, tri]), {
      pxPerInch: PX_PER_INCH,
      snapIncrementInches: SNAP_INCREMENT_INCHES,
    });

    expect(out.patches).toHaveLength(2);
    expect(out.patches[0].polygonPx).toHaveLength(4); // rect
    expect(out.patches[1].polygonPx).toHaveLength(3); // triangle
  });

  it('passes free-form polygons through but still grid-snaps their vertices', () => {
    // Fill ratio well below the rect threshold and not near 0.5 — so it
    // falls through to `'other'` and passes through with grid-snapped
    // vertices.
    const patch = makePatch(
      'free',
      [
        { x: 3.2, y: 4.7 },
        { x: 50.1, y: 5.3 },
        { x: 60.4, y: 45.9 },
        { x: 25.8, y: 60.2 },
        { x: 5.5, y: 40.1 },
      ],
      { areaPx: 500 } // small area vs bbox area ~3100 → fill ≈ 0.16
    );

    const out = regularizeSegmentation(makeResult([patch]), {
      pxPerInch: PX_PER_INCH,
      snapIncrementInches: SNAP_INCREMENT_INCHES,
    });

    expect(out.patches).toHaveLength(1);
    const poly = out.patches[0].polygonPx;
    expect(poly).toHaveLength(5); // vertex count preserved

    const pxPerIncrement = PX_PER_INCH * SNAP_INCREMENT_INCHES;
    for (const p of poly) {
      expect(isMultipleOf(p.x, pxPerIncrement)).toBe(true);
      expect(isMultipleOf(p.y, pxPerIncrement)).toBe(true);
    }
  });

  it('preserves the palette and image dimensions untouched', () => {
    const input: SegmentationResult = {
      palette: [
        {
          index: 0,
          lab: { l: 50, a: 20, b: -30 },
          rgb: { r: 100, g: 50, b: 200 },
          hex: '#6432c8',
          pixelCount: 1000,
          libraryFabricId: null,
          libraryFabricDistance: Infinity,
        },
      ],
      patches: [
        makePatch('p', [
          { x: 0, y: 0 },
          { x: 20, y: 0 },
          { x: 20, y: 20 },
          { x: 0, y: 20 },
        ]),
      ],
      width: 480,
      height: 360,
    };
    const out = regularizeSegmentation(input, { pxPerInch: PX_PER_INCH });
    expect(out.palette).toEqual(input.palette);
    expect(out.width).toBe(480);
    expect(out.height).toBe(360);
  });

  it('keeps the first patch below the snap increment from collapsing to zero', () => {
    // A rect that would round down to 0 without the min-clamp. 8-px bbox
    // is 0.2" × 0.2" at 40 px/inch; default 0.5" snap rounds to 0.
    const patch = makePatch(
      'tiny',
      [
        { x: 0, y: 0 },
        { x: 8, y: 0 },
        { x: 8, y: 8 },
        { x: 0, y: 8 },
      ],
      { areaPx: 8 * 8 }
    );
    const out = regularizeSegmentation(makeResult([patch]), {
      pxPerInch: PX_PER_INCH,
      snapIncrementInches: SNAP_INCREMENT_INCHES,
    });
    const p = out.patches[0];
    expect(p.bboxPx.maxX - p.bboxPx.minX).toBeGreaterThan(0);
    expect(p.bboxPx.maxY - p.bboxPx.minY).toBeGreaterThan(0);
  });
});
