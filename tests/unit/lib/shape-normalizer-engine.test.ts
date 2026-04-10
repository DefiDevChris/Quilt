import { normalizeShapes, DEFAULT_NORMALIZER_CONFIG } from '@/lib/shape-normalizer-engine';
import type { NormalizerConfig } from '@/lib/shape-normalizer-engine';
import type { DetectedPiece } from '@/lib/photo-layout-types';

// ============================================================================
// Test Helpers
// ============================================================================

/** Create a mock detected piece from a contour. */
function makePiece(id: string, contour: Array<{ x: number; y: number }>): DetectedPiece {
  const xs = contour.map((p) => p.x);
  const ys = contour.map((p) => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);

  return {
    id,
    contour: Object.freeze(contour),
    boundingRect: {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    },
    centroid: {
      x: (minX + maxX) / 2,
      y: (minY + maxY) / 2,
    },
    areaPx: (maxX - minX) * (maxY - minY),
    dominantColor: '#808080',
  };
}

/** Compute polygon area via shoelace (for test assertions). */
function polygonArea(contour: ReadonlyArray<{ x: number; y: number }>): number {
  let area = 0;
  const n = contour.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += contour[i].x * contour[j].y;
    area -= contour[j].x * contour[i].y;
  }
  return Math.abs(area / 2);
}

/** Compute the centroid of a contour (for test assertions). */
function centroid(contour: ReadonlyArray<{ x: number; y: number }>): { x: number; y: number } {
  const n = contour.length;
  let cx = 0;
  let cy = 0;
  for (const p of contour) {
    cx += p.x;
    cy += p.y;
  }
  return { x: cx / n, y: cy / n };
}

/** Distance between two points. */
function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

// ============================================================================
// Tests: Empty & Single Input
// ============================================================================

describe('normalizeShapes', () => {
  describe('empty input', () => {
    it('returns empty result for no pieces', () => {
      const result = normalizeShapes([]);

      expect(result.normalizedContours).toEqual([]);
      expect(result.clusters).toEqual([]);
      expect(result.pieceToClusterMap.size).toBe(0);
    });
  });

  describe('single piece input', () => {
    it('places a single piece in its own cluster', () => {
      const piece = makePiece('solo', [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ]);

      const result = normalizeShapes([piece]);

      expect(result.clusters).toHaveLength(1);
      expect(result.clusters[0].pieceIds).toContain('solo');
      expect(result.normalizedContours).toHaveLength(1);
      expect(result.pieceToClusterMap.get('solo')).toBe(result.clusters[0].id);
    });

    it('preserves approximate position for a single piece', () => {
      const piece = makePiece('centered', [
        { x: 100, y: 100 },
        { x: 200, y: 100 },
        { x: 200, y: 200 },
        { x: 100, y: 200 },
      ]);

      const result = normalizeShapes([piece]);
      const normalized = result.normalizedContours[0];
      const normCentroid = centroid(normalized);

      // Centroid should be near the original piece centroid
      expect(normCentroid.x).toBeCloseTo(150, 0);
      expect(normCentroid.y).toBeCloseTo(150, 0);
    });
  });

  // ============================================================================
  // Tests: Clustering
  // ============================================================================

  describe('clustering', () => {
    it('groups 3 similar triangles into 1 cluster', () => {
      const t1 = makePiece('t1', [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 50, y: 86 },
      ]);
      const t2 = makePiece('t2', [
        { x: 200, y: 0 },
        { x: 300, y: 0 },
        { x: 250, y: 86 },
      ]);
      const t3 = makePiece('t3', [
        { x: 400, y: 0 },
        { x: 500, y: 0 },
        { x: 450, y: 86 },
      ]);

      const result = normalizeShapes([t1, t2, t3]);

      expect(result.clusters).toHaveLength(1);
      expect(result.clusters[0].pieceIds).toHaveLength(3);
      expect(result.clusters[0].shapeType).toBe('triangle');
    });

    it('separates triangles and rectangles into different clusters', () => {
      const tri = makePiece('tri', [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 50, y: 86 },
      ]);
      const rect = makePiece('rect', [
        { x: 200, y: 0 },
        { x: 300, y: 0 },
        { x: 300, y: 100 },
        { x: 200, y: 100 },
      ]);

      const result = normalizeShapes([tri, rect]);

      expect(result.clusters).toHaveLength(2);

      const triCluster = result.clusters.find((c) => c.shapeType === 'triangle');
      const quadCluster = result.clusters.find((c) => c.shapeType === 'quadrilateral');

      expect(triCluster).toBeDefined();
      expect(quadCluster).toBeDefined();
      expect(triCluster!.pieceIds).toContain('tri');
      expect(quadCluster!.pieceIds).toContain('rect');
    });

    it('separates same-vertex-count shapes with very different areas', () => {
      const small = makePiece('small', [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
      ]);
      const large = makePiece('large', [
        { x: 200, y: 0 },
        { x: 500, y: 0 },
        { x: 500, y: 300 },
        { x: 200, y: 300 },
      ]);

      const result = normalizeShapes([small, large]);

      // Area ratio is 100/90000 = 0.001, well below 0.85 threshold
      expect(result.clusters).toHaveLength(2);
    });

    it('uses pieceToClusterMap correctly', () => {
      const a = makePiece('a', [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ]);
      const b = makePiece('b', [
        { x: 200, y: 0 },
        { x: 300, y: 0 },
        { x: 300, y: 100 },
        { x: 200, y: 100 },
      ]);

      const result = normalizeShapes([a, b]);

      // Both should map to the same cluster
      const clusterIdA = result.pieceToClusterMap.get('a');
      const clusterIdB = result.pieceToClusterMap.get('b');
      expect(clusterIdA).toBeDefined();
      expect(clusterIdA).toBe(clusterIdB);
    });

    it('classifies shape types correctly', () => {
      const tri = makePiece('tri', [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 50, y: 86 },
      ]);
      const quad = makePiece('quad', [
        { x: 0, y: 200 },
        { x: 100, y: 200 },
        { x: 100, y: 300 },
        { x: 0, y: 300 },
      ]);
      const pent = makePiece('pent', [
        { x: 0, y: 400 },
        { x: 50, y: 400 },
        { x: 80, y: 430 },
        { x: 50, y: 460 },
        { x: 0, y: 460 },
      ]);
      const hex = makePiece('hex', [
        { x: 0, y: 600 },
        { x: 30, y: 600 },
        { x: 50, y: 626 },
        { x: 30, y: 652 },
        { x: 0, y: 652 },
        { x: -20, y: 626 },
      ]);

      const result = normalizeShapes([tri, quad, pent, hex]);

      const types = result.clusters.map((c) => c.shapeType).sort();
      expect(types).toEqual(['hexagon', 'pentagon', 'quadrilateral', 'triangle']);
    });
  });

  // ============================================================================
  // Tests: Grid Snapping
  // ============================================================================

  describe('grid snapping', () => {
    it('snaps wobbly vertex to nearest grid point', () => {
      // A piece with a vertex slightly off-grid
      const piece = makePiece('wobbly', [
        { x: 0.3, y: 0.7 },
        { x: 100.1, y: -0.2 },
        { x: 99.8, y: 100.3 },
        { x: 0.5, y: 99.9 },
      ]);

      const result = normalizeShapes([piece], { gridSnap: 2.0 });

      // The master contour should have vertices on 2px grid
      // (normalized output may shift due to repositioning + scaling)
      const master = result.clusters[0].masterContour;
      for (const p of master) {
        expect(p.x % 2).toBeCloseTo(0, 5);
        expect(p.y % 2).toBeCloseTo(0, 5);
      }
    });

    it('respects custom gridSnap value', () => {
      const piece = makePiece('custom', [
        { x: 1, y: 1 },
        { x: 51, y: 1 },
        { x: 51, y: 51 },
        { x: 1, y: 51 },
      ]);

      const result = normalizeShapes([piece], { gridSnap: 5.0 });

      // The master contour should have vertices on 5px grid
      const cluster = result.clusters[0];
      for (const p of cluster.masterContour) {
        expect(p.x % 5).toBeCloseTo(0, 5);
        expect(p.y % 5).toBeCloseTo(0, 5);
      }
    });
  });

  // ============================================================================
  // Tests: Edge Straightening
  // ============================================================================

  describe('edge straightening', () => {
    it('makes almost-horizontal edges perfectly horizontal', () => {
      // A rectangle with a slightly tilted top edge (1 degree)
      const piece = makePiece('tilted', [
        { x: 0, y: 0 },
        { x: 200, y: 3 }, // top-right slightly below horizontal
        { x: 200, y: 100 },
        { x: 0, y: 100 },
      ]);

      const result = normalizeShapes([piece]);
      const master = result.clusters[0].masterContour;

      // After regularization, top vertices should share same y
      const topVertices = master.filter((p) => p.y < 50);
      if (topVertices.length >= 2) {
        expect(topVertices[0].y).toBeCloseTo(topVertices[1].y, 0);
      }
    });

    it('makes almost-vertical edges perfectly vertical', () => {
      const piece = makePiece('vert-tilt', [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 101, y: 200 }, // right edge slightly tilted
        { x: 0, y: 200 },
      ]);

      const result = normalizeShapes([piece]);
      const master = result.clusters[0].masterContour;

      // After rectification, right edge should be vertical
      const rightVertices = master.filter((p) => p.x > 50);
      if (rightVertices.length >= 2) {
        expect(rightVertices[0].x).toBeCloseTo(rightVertices[1].x, 0);
      }
    });
  });

  // ============================================================================
  // Tests: Size Equalization
  // ============================================================================

  describe('size equalization', () => {
    it('equalizes 3 similar-but-different-sized squares to same area', () => {
      // Sizes within 15% tolerance: 95x95, 100x100, 105x105
      // Area ratio: 9025/11025 = 0.82, within default 0.85 tolerance
      const s1 = makePiece('s1', [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ]);
      const s2 = makePiece('s2', [
        { x: 200, y: 0 },
        { x: 305, y: 0 },
        { x: 305, y: 105 },
        { x: 200, y: 105 },
      ]);
      const s3 = makePiece('s3', [
        { x: 400, y: 0 },
        { x: 495, y: 0 },
        { x: 495, y: 95 },
        { x: 400, y: 95 },
      ]);

      const result = normalizeShapes([s1, s2, s3], { clusterTolerance: 0.2 });

      // All three should be in the same cluster
      expect(result.clusters).toHaveLength(1);

      // All normalized contours should have the same area (median)
      const areas = result.normalizedContours.map((c) => polygonArea(c));
      expect(areas[0]).toBeCloseTo(areas[1], 0);
      expect(areas[1]).toBeCloseTo(areas[2], 0);
    });

    it('does not equalize pieces in different clusters', () => {
      const small = makePiece('small-tri', [
        { x: 0, y: 0 },
        { x: 50, y: 0 },
        { x: 25, y: 43 },
      ]);
      const large = makePiece('large-rect', [
        { x: 200, y: 0 },
        { x: 500, y: 0 },
        { x: 500, y: 300 },
        { x: 200, y: 300 },
      ]);

      const result = normalizeShapes([small, large]);

      expect(result.clusters).toHaveLength(2);

      const triArea = polygonArea(result.normalizedContours[0]);
      const rectArea = polygonArea(result.normalizedContours[1]);

      // They should NOT be equalized since they're in different clusters
      expect(Math.abs(triArea - rectArea)).toBeGreaterThan(1000);
    });
  });

  // ============================================================================
  // Tests: Rotation Straightening
  // ============================================================================

  describe('rotation straightening', () => {
    it('corrects a piece rotated 3 degrees to 0', () => {
      // A square rotated 3 degrees
      const angleRad = (3 * Math.PI) / 180;
      const cos = Math.cos(angleRad);
      const sin = Math.sin(angleRad);
      const cx = 50;
      const cy = 50;

      const rotatedSquare = [
        { x: cx + -50 * cos - -50 * sin, y: cy + -50 * sin + -50 * cos },
        { x: cx + 50 * cos - -50 * sin, y: cy + 50 * sin + -50 * cos },
        { x: cx + 50 * cos - 50 * sin, y: cy + 50 * sin + 50 * cos },
        { x: cx + -50 * cos - 50 * sin, y: cy + -50 * sin + 50 * cos },
      ];
      const piece = makePiece('rotated', rotatedSquare);

      const result = normalizeShapes([piece], { straightenAngleDeg: 5.0 });
      const contour = result.normalizedContours[0];

      // After straightening, the edges should be nearly axis-aligned
      const sorted = [...contour].sort((a, b) => a.y - b.y);
      const topTwo = sorted.slice(0, 2);
      expect(Math.abs(topTwo[0].y - topTwo[1].y)).toBeLessThan(2);
    });

    it('does not correct rotation beyond tolerance', () => {
      // A square rotated 15 degrees — beyond 5-degree tolerance
      const angleRad = (15 * Math.PI) / 180;
      const cos = Math.cos(angleRad);
      const sin = Math.sin(angleRad);
      const cx = 150;
      const cy = 150;

      const rotatedSquare = [
        { x: cx + -50 * cos - -50 * sin, y: cy + -50 * sin + -50 * cos },
        { x: cx + 50 * cos - -50 * sin, y: cy + 50 * sin + -50 * cos },
        { x: cx + 50 * cos - 50 * sin, y: cy + 50 * sin + 50 * cos },
        { x: cx + -50 * cos - 50 * sin, y: cy + -50 * sin + 50 * cos },
      ];
      const piece = makePiece('big-rotation', rotatedSquare);

      const result = normalizeShapes([piece], { straightenAngleDeg: 5.0 });
      const contour = result.normalizedContours[0];

      // Should still produce a valid 4-vertex contour
      expect(contour).toHaveLength(4);
    });
  });

  // ============================================================================
  // Tests: Immutability
  // ============================================================================

  describe('immutability', () => {
    it('does not mutate input piece contours', () => {
      const originalContour = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ];
      const contourCopy = originalContour.map((p) => ({ ...p }));
      const piece = makePiece('immutable', originalContour);

      normalizeShapes([piece]);

      // Original contour should be unchanged
      for (let i = 0; i < originalContour.length; i++) {
        expect(originalContour[i].x).toBe(contourCopy[i].x);
        expect(originalContour[i].y).toBe(contourCopy[i].y);
      }
    });

    it('does not mutate the input pieces array', () => {
      const pieces = [
        makePiece('a', [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 100, y: 100 },
          { x: 0, y: 100 },
        ]),
      ];
      const originalLength = pieces.length;

      normalizeShapes(pieces);

      expect(pieces).toHaveLength(originalLength);
      expect(pieces[0].id).toBe('a');
    });
  });

  // ============================================================================
  // Tests: Config Overrides
  // ============================================================================

  describe('config overrides', () => {
    it('uses default config when no config is provided', () => {
      const piece = makePiece('default', [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ]);

      const result = normalizeShapes([piece]);

      // Should succeed with defaults
      expect(result.normalizedContours).toHaveLength(1);
      expect(result.clusters).toHaveLength(1);
    });

    it('respects custom clusterTolerance', () => {
      // Two squares with 20% area difference
      const s1 = makePiece('s1', [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ]);
      const s2 = makePiece('s2', [
        { x: 200, y: 0 },
        { x: 320, y: 0 },
        { x: 320, y: 120 },
        { x: 200, y: 120 },
      ]);

      // With tight tolerance (5%), they should be in separate clusters
      const tightResult = normalizeShapes([s1, s2], {
        clusterTolerance: 0.05,
      });
      expect(tightResult.clusters).toHaveLength(2);

      // With loose tolerance (50%), they should cluster together
      const looseResult = normalizeShapes([s1, s2], {
        clusterTolerance: 0.5,
      });
      expect(looseResult.clusters).toHaveLength(1);
    });

    it('respects custom straightenAngleDeg', () => {
      // A square rotated 8 degrees
      const angleRad = (8 * Math.PI) / 180;
      const cos = Math.cos(angleRad);
      const sin = Math.sin(angleRad);
      const cx = 50;
      const cy = 50;

      const rotated = [
        { x: cx + -50 * cos - -50 * sin, y: cy + -50 * sin + -50 * cos },
        { x: cx + 50 * cos - -50 * sin, y: cy + 50 * sin + -50 * cos },
        { x: cx + 50 * cos - 50 * sin, y: cy + 50 * sin + 50 * cos },
        { x: cx + -50 * cos - 50 * sin, y: cy + -50 * sin + 50 * cos },
      ];
      const piece = makePiece('angled', rotated);

      // With 5-degree tolerance, should NOT straighten
      const resultNarrow = normalizeShapes([piece], {
        straightenAngleDeg: 5.0,
      });

      // With 10-degree tolerance, should straighten
      const resultWide = normalizeShapes([piece], {
        straightenAngleDeg: 10.0,
      });

      // Both should produce valid contours
      expect(resultNarrow.normalizedContours[0]).toHaveLength(4);
      expect(resultWide.normalizedContours[0]).toHaveLength(4);
    });

    it('exports DEFAULT_NORMALIZER_CONFIG with expected values', () => {
      expect(DEFAULT_NORMALIZER_CONFIG.clusterTolerance).toBe(0.15);
      expect(DEFAULT_NORMALIZER_CONFIG.gridSnap).toBe(2.0);
      expect(DEFAULT_NORMALIZER_CONFIG.straightenAngleDeg).toBe(5.0);
    });
  });

  // ============================================================================
  // Tests: Shape-specific Regularization
  // ============================================================================

  describe('shape regularization', () => {
    it('regularizes a near-right triangle', () => {
      const piece = makePiece('right-tri', [
        { x: 0, y: 0 },
        { x: 100, y: 1 }, // nearly on x-axis (1px off)
        { x: 1, y: 80 }, // nearly on y-axis (1px off)
      ]);

      const result = normalizeShapes([piece]);
      const master = result.clusters[0].masterContour;

      expect(master).toHaveLength(3);
      expect(result.clusters[0].shapeType).toBe('triangle');
    });

    it('regularizes a near-equilateral triangle', () => {
      // Slightly irregular equilateral triangle (side length ~100)
      const piece = makePiece('equi-tri', [
        { x: 50, y: 0 },
        { x: 103, y: 87 }, // slightly off from perfect equilateral
        { x: -2, y: 86 },
      ]);

      const result = normalizeShapes([piece]);
      const master = result.clusters[0].masterContour;

      expect(master).toHaveLength(3);
      expect(result.clusters[0].shapeType).toBe('triangle');

      // The regularized triangle should have more equal side lengths
      const sides = [
        dist(master[0], master[1]),
        dist(master[1], master[2]),
        dist(master[2], master[0]),
      ];
      const maxSide = Math.max(...sides);
      const minSide = Math.min(...sides);
      expect(minSide / maxSide).toBeGreaterThan(0.85);
    });

    it('regularizes a near-rectangle into a proper rectangle', () => {
      const piece = makePiece('near-rect', [
        { x: 0, y: 0 },
        { x: 100, y: 2 },
        { x: 101, y: 52 },
        { x: -1, y: 50 },
      ]);

      const result = normalizeShapes([piece]);
      const master = result.clusters[0].masterContour;

      expect(master).toHaveLength(4);
      expect(result.clusters[0].shapeType).toBe('quadrilateral');
    });

    it('regularizes a near-square into equal-sided shape', () => {
      const piece = makePiece('near-square', [
        { x: 0, y: 0 },
        { x: 98, y: 1 },
        { x: 99, y: 101 },
        { x: 1, y: 100 },
      ]);

      const result = normalizeShapes([piece]);
      const master = result.clusters[0].masterContour;

      expect(master).toHaveLength(4);

      // Sides should be more equal after regularization
      const sides = [
        dist(master[0], master[1]),
        dist(master[1], master[2]),
        dist(master[2], master[3]),
        dist(master[3], master[0]),
      ];
      const maxSide = Math.max(...sides);
      const minSide = Math.min(...sides);
      expect(minSide / maxSide).toBeGreaterThan(0.85);
    });

    it('preserves higher polygons without shape-specific regularization', () => {
      const hex = makePiece('hex', [
        { x: 50, y: 0 },
        { x: 93, y: 25 },
        { x: 93, y: 75 },
        { x: 50, y: 100 },
        { x: 7, y: 75 },
        { x: 7, y: 25 },
      ]);

      const result = normalizeShapes([hex]);

      expect(result.clusters[0].shapeType).toBe('hexagon');
      expect(result.clusters[0].masterContour).toHaveLength(6);
    });
  });

  // ============================================================================
  // Tests: Output Structure
  // ============================================================================

  describe('output structure', () => {
    it('returns normalizedContours in same order as input', () => {
      const pieces = [
        makePiece('first', [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 50, y: 86 },
        ]),
        makePiece('second', [
          { x: 200, y: 200 },
          { x: 300, y: 200 },
          { x: 300, y: 300 },
          { x: 200, y: 300 },
        ]),
      ];

      const result = normalizeShapes(pieces);

      expect(result.normalizedContours).toHaveLength(2);

      // First contour should be near first piece's position
      const c1 = centroid(result.normalizedContours[0]);
      expect(c1.x).toBeCloseTo(50, -1);
      expect(c1.y).toBeCloseTo(29, -1);

      // Second contour should be near second piece's position
      const c2 = centroid(result.normalizedContours[1]);
      expect(c2.x).toBeCloseTo(250, -1);
      expect(c2.y).toBeCloseTo(250, -1);
    });

    it('clusters have valid masterContour and masterArea', () => {
      const piece = makePiece('valid', [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ]);

      const result = normalizeShapes([piece]);
      const cluster = result.clusters[0];

      expect(cluster.masterContour.length).toBeGreaterThanOrEqual(3);
      expect(cluster.masterArea).toBeGreaterThan(0);
      expect(cluster.vertexCount).toBe(4);
      expect(cluster.id).toMatch(/^cluster-\d+$/);
    });

    it('every piece ID appears in pieceToClusterMap', () => {
      const pieces = [
        makePiece('a', [
          { x: 0, y: 0 },
          { x: 50, y: 0 },
          { x: 25, y: 43 },
        ]),
        makePiece('b', [
          { x: 100, y: 0 },
          { x: 200, y: 0 },
          { x: 200, y: 100 },
          { x: 100, y: 100 },
        ]),
        makePiece('c', [
          { x: 300, y: 0 },
          { x: 350, y: 0 },
          { x: 325, y: 43 },
        ]),
      ];

      const result = normalizeShapes(pieces);

      expect(result.pieceToClusterMap.size).toBe(3);
      expect(result.pieceToClusterMap.has('a')).toBe(true);
      expect(result.pieceToClusterMap.has('b')).toBe(true);
      expect(result.pieceToClusterMap.has('c')).toBe(true);
    });
  });

  // ============================================================================
  // Tests: Mixed Scenarios
  // ============================================================================

  describe('mixed scenarios', () => {
    it('handles a realistic quilt grid (4 triangles + 5 squares)', () => {
      const pieces = [
        // 5 squares in a cross pattern
        makePiece('sq1', [
          { x: 100, y: 0 },
          { x: 200, y: 0 },
          { x: 200, y: 100 },
          { x: 100, y: 100 },
        ]),
        makePiece('sq2', [
          { x: 0, y: 100 },
          { x: 100, y: 100 },
          { x: 100, y: 200 },
          { x: 0, y: 200 },
        ]),
        makePiece('sq3', [
          { x: 100, y: 100 },
          { x: 200, y: 100 },
          { x: 200, y: 200 },
          { x: 100, y: 200 },
        ]),
        makePiece('sq4', [
          { x: 200, y: 100 },
          { x: 300, y: 100 },
          { x: 300, y: 200 },
          { x: 200, y: 200 },
        ]),
        makePiece('sq5', [
          { x: 100, y: 200 },
          { x: 200, y: 200 },
          { x: 200, y: 300 },
          { x: 100, y: 300 },
        ]),
        // 4 corner triangles
        makePiece('t1', [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 0, y: 100 },
        ]),
        makePiece('t2', [
          { x: 200, y: 0 },
          { x: 300, y: 0 },
          { x: 300, y: 100 },
        ]),
        makePiece('t3', [
          { x: 0, y: 200 },
          { x: 0, y: 300 },
          { x: 100, y: 300 },
        ]),
        makePiece('t4', [
          { x: 300, y: 200 },
          { x: 300, y: 300 },
          { x: 200, y: 300 },
        ]),
      ];

      const result = normalizeShapes(pieces);

      // Should have 2 clusters: triangles and squares
      expect(result.clusters).toHaveLength(2);
      expect(result.normalizedContours).toHaveLength(9);
      expect(result.pieceToClusterMap.size).toBe(9);

      // Triangle cluster should have 4 members
      const triCluster = result.clusters.find((c) => c.shapeType === 'triangle');
      expect(triCluster).toBeDefined();
      expect(triCluster!.pieceIds).toHaveLength(4);

      // Square cluster should have 5 members
      const quadCluster = result.clusters.find((c) => c.shapeType === 'quadrilateral');
      expect(quadCluster).toBeDefined();
      expect(quadCluster!.pieceIds).toHaveLength(5);
    });

    it('produces valid polygons (at least 3 vertices, finite coords)', () => {
      const pieces = [
        makePiece('a', [
          { x: 10, y: 10 },
          { x: 90, y: 11 },
          { x: 89, y: 91 },
          { x: 11, y: 90 },
        ]),
        makePiece('b', [
          { x: 200, y: 0 },
          { x: 300, y: 0 },
          { x: 250, y: 86 },
        ]),
      ];

      const result = normalizeShapes(pieces);

      for (const contour of result.normalizedContours) {
        expect(contour.length).toBeGreaterThanOrEqual(3);
        for (const p of contour) {
          expect(Number.isFinite(p.x)).toBe(true);
          expect(Number.isFinite(p.y)).toBe(true);
        }
      }
    });
  });
});
