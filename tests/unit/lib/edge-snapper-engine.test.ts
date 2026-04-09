import {
  snapEdges,
  snapToRect,
} from '@/lib/edge-snapper-engine';
import type { Rect } from '@/lib/photo-layout-types';

// ============================================================================
// snapToRect Tests
// ============================================================================

describe('snapToRect', () => {
  it('snaps a near-rectangular contour to a rectangle', () => {
    const contour = [
      { x: 1, y: 1 },
      { x: 99, y: 2 },
      { x: 101, y: 50 },
      { x: 2, y: 99 },
    ];
    const target: Rect = { x: 0, y: 0, width: 100, height: 100 };

    snapToRect(contour, target);

    // Each vertex should snap to its nearest edge
    // (1,1) → snaps to left or top (both dist 1)
    // (99,2) → x snaps to 100 (dist 1, closer than top at 2)
    // (101,50) → x snaps to 100 (dist 1)
    // (2,99) → x snaps to 0 (dist 2, closer than bottom at 1)
    expect(contour[1].x).toBe(100); // right edge (99 closest to 100)
    expect(contour[2].x).toBe(100); // right edge (101 closest to 100)
  });

  it('leaves distant vertices unchanged', () => {
    const contour = [
      { x: 50, y: 50 },
      { x: 60, y: 50 },
      { x: 60, y: 60 },
      { x: 50, y: 60 },
    ];
    const target: Rect = { x: 0, y: 0, width: 100, height: 100 };

    snapToRect(contour, target);

    // All vertices are far from the boundary — should remain unchanged
    expect(contour[0].x).toBe(50);
    expect(contour[0].y).toBe(50);
  });
});

// ============================================================================
// snapEdges Tests
// ============================================================================

describe('snapEdges', () => {
  it('snaps two adjacent squares to share a common edge', () => {
    // Two squares side by side with a 5px gap
    const squareA = [
      { x: 0, y: 0 },
      { x: 98, y: 0 },
      { x: 98, y: 100 },
      { x: 0, y: 100 },
    ];
    const squareB = [
      { x: 103, y: 0 },
      { x: 200, y: 0 },
      { x: 200, y: 100 },
      { x: 103, y: 100 },
    ];

    const contours = [squareA, squareB];
    const canvasBounds: Rect = { x: 0, y: 0, width: 200, height: 100 };

    snapEdges(contours, canvasBounds);

    // The canonical shared edge should be at x = (98 + 103) / 2 = 100.5
    // Both squares' adjacent edges should snap to 100.5
    expect(squareA[1].x).toBe(100.5);
    expect(squareA[2].x).toBe(100.5);
    expect(squareB[3].x).toBe(100.5);
    expect(squareB[0].x).toBe(100.5);
  });

  it('snaps boundary vertices to canvas edges', () => {
    const piece = [
      { x: 3, y: 20 },  // Near left edge only → snaps to x=0
      { x: 97, y: 50 }, // Near right edge only → snaps to x=100
      { x: 50, y: 4 },  // Near top edge only → snaps to y=0
      { x: 50, y: 97 }, // Near bottom edge only → snaps to y=100
    ];
    const canvasBounds: Rect = { x: 0, y: 0, width: 100, height: 100 };

    snapEdges([piece], canvasBounds);

    // Each vertex should snap to its nearest canvas boundary
    expect(piece[0].x).toBe(0);    // left edge (3 < 6)
    expect(piece[1].x).toBe(100);  // right edge (100-97=3 < 6)
    expect(piece[2].y).toBe(0);    // top edge (4 < 6)
    expect(piece[3].y).toBe(100);  // bottom edge (100-97=3 < 6)
  });

  it('handles three pieces in a row', () => {
    // Three squares with small gaps between them
    const pieces = [
      [
        { x: 0, y: 0 },
        { x: 32, y: 0 },
        { x: 32, y: 100 },
        { x: 0, y: 100 },
      ],
      [
        { x: 35, y: 0 },
        { x: 67, y: 0 },
        { x: 67, y: 100 },
        { x: 35, y: 100 },
      ],
      [
        { x: 70, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 70, y: 100 },
      ],
    ];
    const canvasBounds: Rect = { x: 0, y: 0, width: 100, height: 100 };

    snapEdges(pieces, canvasBounds);

    // Shared edges between adjacent pieces should align
    // Piece 0 right edge (was 32) and Piece 1 left edge (was 35) → canonical = 33.5
    expect(pieces[0][1].x).toBeCloseTo(33.5, 0);
    expect(pieces[0][2].x).toBeCloseTo(33.5, 0);
    expect(pieces[1][3].x).toBeCloseTo(33.5, 0);
    expect(pieces[1][0].x).toBeCloseTo(33.5, 0);

    // Piece 1 right edge (was 67) and Piece 2 left edge (was 70) → canonical = 68.5
    expect(pieces[1][1].x).toBeCloseTo(68.5, 0);
    expect(pieces[1][2].x).toBeCloseTo(68.5, 0);
    expect(pieces[2][3].x).toBeCloseTo(68.5, 0);
    expect(pieces[2][0].x).toBeCloseTo(68.5, 0);
  });

  it('returns contours with minimum 3 vertices', () => {
    const piece = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ];
    const canvasBounds: Rect = { x: 0, y: 0, width: 100, height: 100 };

    const result = snapEdges([piece], canvasBounds);

    expect(result[0].length).toBeGreaterThanOrEqual(3);
  });

  it('handles contours without corrupting vertex data', () => {
    const piece = [
      { x: 0, y: 0 },
      { x: 0, y: 0 }, // Exact duplicate
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ];
    const canvasBounds: Rect = { x: 0, y: 0, width: 100, height: 100 };

    const result = snapEdges([piece], canvasBounds);

    // The contour should remain valid — all vertices are finite numbers
    // and at least 3 vertices exist
    expect(result[0].length).toBeGreaterThanOrEqual(3);
    for (const p of result[0]) {
      expect(Number.isFinite(p.x)).toBe(true);
      expect(Number.isFinite(p.y)).toBe(true);
    }
    // Boundary vertices should be snapped
    expect(result[0].some((p) => p.x === 0)).toBe(true);
    expect(result[0].some((p) => p.y === 0)).toBe(true);
    expect(result[0].some((p) => p.x === 100)).toBe(true);
    expect(result[0].some((p) => p.y === 100)).toBe(true);
  });
});
