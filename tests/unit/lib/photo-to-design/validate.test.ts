import { describe, expect, it } from 'vitest';
import {
  PolygonInvariantError,
  hasNonAdjacentEdgeContact,
  onSegmentBbox,
  orient,
  segmentsTouch,
  signedArea,
  validatePatches,
  validatePolygon,
} from '@/lib/photo-to-design/stages/validate';
import type { Patch, Point } from '@/lib/photo-to-design/types';

function patch(id: number, vertices: Point[]): Patch {
  return { id, templateId: `t${id}`, vertices, svgPath: '' };
}

// Canonical closed polygons (first !== last by convention).
const CONVEX_SQUARE: Point[] = [
  { x: 0, y: 0 },
  { x: 40, y: 0 },
  { x: 40, y: 40 },
  { x: 0, y: 40 },
];

const CONCAVE_L: Point[] = [
  { x: 0, y: 0 },
  { x: 40, y: 0 },
  { x: 40, y: 20 },
  { x: 20, y: 20 },
  { x: 20, y: 40 },
  { x: 0, y: 40 },
];

const TRIANGLE: Point[] = [
  { x: 0, y: 0 },
  { x: 40, y: 0 },
  { x: 20, y: 40 },
];

// Classic bowtie: rectangle with swapped corners.
const BOWTIE: Point[] = [
  { x: 0, y: 0 },
  { x: 40, y: 0 },
  { x: 0, y: 40 },
  { x: 40, y: 40 },
];

// Figure-8: two lobes crossing in the middle.
const FIGURE_EIGHT: Point[] = [
  { x: 0, y: 0 },
  { x: 40, y: 40 },
  { x: 40, y: 0 },
  { x: 80, y: 0 },
  { x: 80, y: 40 },
  { x: 40, y: 0 }, // reuse vertex — causes wrap touching
];

// ---------------------------------------------------------------------------
// orient
// ---------------------------------------------------------------------------

describe('orient', () => {
  it('returns +1 for a positive cross product', () => {
    expect(orient({ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: 5 })).toBe(1);
  });

  it('returns -1 for a negative cross product', () => {
    expect(orient({ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: -5 })).toBe(-1);
  });

  it('flips sign when the third point flips across the first segment', () => {
    const above = orient({ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: 5 });
    const below = orient({ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: -5 });
    expect(above).toBe(-below);
  });

  it('returns 0 for collinear triplets', () => {
    expect(orient({ x: 0, y: 0 }, { x: 5, y: 5 }, { x: 10, y: 10 })).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// onSegmentBbox
// ---------------------------------------------------------------------------

describe('onSegmentBbox', () => {
  it('detects a midpoint inside the segment bbox', () => {
    expect(onSegmentBbox({ x: 0, y: 0 }, { x: 5, y: 5 }, { x: 10, y: 10 })).toBe(true);
  });

  it('rejects a point outside the segment bbox', () => {
    expect(onSegmentBbox({ x: 0, y: 0 }, { x: 15, y: 5 }, { x: 10, y: 10 })).toBe(false);
  });

  it('includes endpoints', () => {
    expect(onSegmentBbox({ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 10, y: 10 })).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// segmentsTouch
// ---------------------------------------------------------------------------

describe('segmentsTouch', () => {
  it('detects a proper crossing', () => {
    expect(segmentsTouch({ x: 0, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }, { x: 10, y: 0 })).toBe(
      true
    );
  });

  it('reports parallel non-overlapping segments as non-touching', () => {
    expect(segmentsTouch({ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 0, y: 5 }, { x: 10, y: 5 })).toBe(
      false
    );
  });

  it('detects a shared endpoint', () => {
    expect(segmentsTouch({ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 })).toBe(
      true
    );
  });

  it('detects collinear overlap', () => {
    expect(segmentsTouch({ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: 0 }, { x: 15, y: 0 })).toBe(
      true
    );
  });

  it('ignores segments that pass close but do not touch', () => {
    expect(segmentsTouch({ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 4, y: 1 }, { x: 6, y: 1 })).toBe(
      false
    );
  });
});

// ---------------------------------------------------------------------------
// signedArea
// ---------------------------------------------------------------------------

describe('signedArea', () => {
  it('returns nonzero for a square', () => {
    expect(signedArea(CONVEX_SQUARE)).not.toBe(0);
  });

  it('returns zero for collinear vertices', () => {
    expect(
      signedArea([
        { x: 0, y: 0 },
        { x: 5, y: 5 },
        { x: 10, y: 10 },
      ])
    ).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// hasNonAdjacentEdgeContact
// ---------------------------------------------------------------------------

describe('hasNonAdjacentEdgeContact', () => {
  it('is false for a convex square', () => {
    expect(hasNonAdjacentEdgeContact(CONVEX_SQUARE)).toBe(false);
  });

  it('is false for a concave L-shape', () => {
    expect(hasNonAdjacentEdgeContact(CONCAVE_L)).toBe(false);
  });

  it('is false for a triangle (only adjacent edges)', () => {
    expect(hasNonAdjacentEdgeContact(TRIANGLE)).toBe(false);
  });

  it('is true for a bowtie', () => {
    expect(hasNonAdjacentEdgeContact(BOWTIE)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// validatePolygon
// ---------------------------------------------------------------------------

describe('validatePolygon', () => {
  it('accepts a convex square', () => {
    expect(() => validatePolygon(CONVEX_SQUARE)).not.toThrow();
  });

  it('accepts a concave L-shape', () => {
    expect(() => validatePolygon(CONCAVE_L)).not.toThrow();
  });

  it('accepts a triangle', () => {
    expect(() => validatePolygon(TRIANGLE)).not.toThrow();
  });

  it('rejects two-vertex polygons with too-few-vertices', () => {
    try {
      validatePolygon([
        { x: 0, y: 0 },
        { x: 10, y: 10 },
      ]);
      throw new Error('expected validatePolygon to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(PolygonInvariantError);
      expect((err as PolygonInvariantError).reason).toBe('too-few-vertices');
    }
  });

  it('rejects collinear triples with zero-area', () => {
    try {
      validatePolygon([
        { x: 0, y: 0 },
        { x: 5, y: 5 },
        { x: 10, y: 10 },
      ]);
      throw new Error('expected validatePolygon to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(PolygonInvariantError);
      expect((err as PolygonInvariantError).reason).toBe('zero-area');
    }
  });

  it('rejects a bowtie with self-intersecting', () => {
    try {
      validatePolygon(BOWTIE);
      throw new Error('expected validatePolygon to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(PolygonInvariantError);
      expect((err as PolygonInvariantError).reason).toBe('self-intersecting');
    }
  });

  it('rejects a figure-8 with self-intersecting', () => {
    try {
      validatePolygon(FIGURE_EIGHT);
      throw new Error('expected validatePolygon to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(PolygonInvariantError);
      expect((err as PolygonInvariantError).reason).toBe('self-intersecting');
    }
  });

  it('attaches the provided patchId on the thrown error', () => {
    try {
      validatePolygon(BOWTIE, 42);
      throw new Error('expected validatePolygon to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(PolygonInvariantError);
      expect((err as PolygonInvariantError).patchId).toBe(42);
    }
  });
});

// ---------------------------------------------------------------------------
// validatePatches — set-level gate
// ---------------------------------------------------------------------------

describe('validatePatches', () => {
  it('accepts an empty patch list', () => {
    expect(() => validatePatches([])).not.toThrow();
  });

  it('accepts a single valid patch', () => {
    expect(() => validatePatches([patch(1, CONVEX_SQUARE)])).not.toThrow();
  });

  it('accepts multiple patches of the same winding', () => {
    const a = CONVEX_SQUARE;
    const b = CONVEX_SQUARE.map((p) => ({ x: p.x + 100, y: p.y + 100 }));
    expect(() => validatePatches([patch(1, a), patch(2, b)])).not.toThrow();
  });

  it('throws inconsistent-winding when a later patch has opposite winding', () => {
    const cw = [...CONVEX_SQUARE];
    const ccw = [...CONVEX_SQUARE].reverse();
    try {
      validatePatches([patch(1, cw), patch(2, ccw)]);
      throw new Error('expected validatePatches to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(PolygonInvariantError);
      expect((err as PolygonInvariantError).reason).toBe('inconsistent-winding');
      expect((err as PolygonInvariantError).patchId).toBe(2);
    }
  });

  it('surfaces the offending patch id for a bowtie mid-list', () => {
    try {
      validatePatches([patch(7, CONVEX_SQUARE), patch(8, BOWTIE)]);
      throw new Error('expected validatePatches to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(PolygonInvariantError);
      expect((err as PolygonInvariantError).reason).toBe('self-intersecting');
      expect((err as PolygonInvariantError).patchId).toBe(8);
    }
  });
});
