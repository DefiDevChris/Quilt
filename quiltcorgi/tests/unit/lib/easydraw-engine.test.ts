import { describe, it, expect } from 'vitest';
import {
  normalizeSegment,
  segmentsEqual,
  addBoundarySegments,
  detectPatches,
  gridPointToPixel,
  patchArea,
  arcToPath,
  type GridPoint,
  type Segment,
  type ArcSegment,
  type Patch,
} from '@/lib/easydraw-engine';

describe('easydraw-engine', () => {
  describe('normalizeSegment', () => {
    it('orders points by row first, then col', () => {
      const seg: Segment = { from: { row: 2, col: 0 }, to: { row: 0, col: 0 } };
      const normalized = normalizeSegment(seg);
      expect(normalized.from).toEqual({ row: 0, col: 0 });
      expect(normalized.to).toEqual({ row: 2, col: 0 });
    });

    it('keeps already-normalized segment unchanged', () => {
      const seg: Segment = { from: { row: 0, col: 0 }, to: { row: 0, col: 3 } };
      const normalized = normalizeSegment(seg);
      expect(normalized).toEqual(seg);
    });

    it('orders by col when rows are equal', () => {
      const seg: Segment = { from: { row: 1, col: 3 }, to: { row: 1, col: 1 } };
      const normalized = normalizeSegment(seg);
      expect(normalized.from).toEqual({ row: 1, col: 1 });
      expect(normalized.to).toEqual({ row: 1, col: 3 });
    });

    it('returns immutable result (does not mutate input)', () => {
      const seg: Segment = { from: { row: 3, col: 0 }, to: { row: 0, col: 0 } };
      const original = { ...seg };
      normalizeSegment(seg);
      expect(seg).toEqual(original);
    });
  });

  describe('segmentsEqual', () => {
    it('returns true for identical segments', () => {
      const a: Segment = { from: { row: 0, col: 0 }, to: { row: 2, col: 2 } };
      const b: Segment = { from: { row: 0, col: 0 }, to: { row: 2, col: 2 } };
      expect(segmentsEqual(a, b)).toBe(true);
    });

    it('returns true for reversed segments (normalization)', () => {
      const a: Segment = { from: { row: 0, col: 0 }, to: { row: 2, col: 2 } };
      const b: Segment = { from: { row: 2, col: 2 }, to: { row: 0, col: 0 } };
      expect(segmentsEqual(a, b)).toBe(true);
    });

    it('returns false for different segments', () => {
      const a: Segment = { from: { row: 0, col: 0 }, to: { row: 2, col: 2 } };
      const b: Segment = { from: { row: 0, col: 0 }, to: { row: 1, col: 1 } };
      expect(segmentsEqual(a, b)).toBe(false);
    });
  });

  describe('addBoundarySegments', () => {
    it('returns 4 segments for a 1x1 grid', () => {
      const boundaries = addBoundarySegments(1, 1);
      expect(boundaries).toHaveLength(4);
    });

    it('returns correct segments for a 2x2 grid', () => {
      const boundaries = addBoundarySegments(2, 2);
      // top: 2, right: 2, bottom: 2, left: 2
      expect(boundaries).toHaveLength(8);
    });

    it('includes all 4 corner-to-corner segments for 1x1', () => {
      const boundaries = addBoundarySegments(1, 1);
      const topEdge = boundaries.find(
        (s) => s.from.row === 0 && s.from.col === 0 && s.to.row === 0 && s.to.col === 1
      );
      const rightEdge = boundaries.find(
        (s) => s.from.row === 0 && s.from.col === 1 && s.to.row === 1 && s.to.col === 1
      );
      const bottomEdge = boundaries.find(
        (s) => s.from.row === 1 && s.from.col === 0 && s.to.row === 1 && s.to.col === 1
      );
      const leftEdge = boundaries.find(
        (s) => s.from.row === 0 && s.from.col === 0 && s.to.row === 1 && s.to.col === 0
      );
      expect(topEdge).toBeDefined();
      expect(rightEdge).toBeDefined();
      expect(bottomEdge).toBeDefined();
      expect(leftEdge).toBeDefined();
    });
  });

  describe('gridPointToPixel', () => {
    it('converts (0,0) to (0,0)', () => {
      expect(gridPointToPixel({ row: 0, col: 0 }, 50)).toEqual({ x: 0, y: 0 });
    });

    it('converts (1,1) with gridSize 50 to (50,50)', () => {
      expect(gridPointToPixel({ row: 1, col: 1 }, 50)).toEqual({ x: 50, y: 50 });
    });

    it('converts (2,3) with gridSize 33 to (99,66)', () => {
      expect(gridPointToPixel({ row: 2, col: 3 }, 33)).toEqual({ x: 99, y: 66 });
    });
  });

  describe('patchArea', () => {
    it('computes area of a unit square', () => {
      const patch: Patch = {
        id: 'test',
        vertices: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 1, y: 1 },
          { x: 0, y: 1 },
        ],
        path: '',
      };
      expect(patchArea(patch)).toBeCloseTo(1, 5);
    });

    it('computes area of a right triangle', () => {
      const patch: Patch = {
        id: 'test',
        vertices: [
          { x: 0, y: 0 },
          { x: 2, y: 0 },
          { x: 0, y: 2 },
        ],
        path: '',
      };
      expect(patchArea(patch)).toBeCloseTo(2, 5);
    });

    it('returns positive area regardless of winding', () => {
      const patch: Patch = {
        id: 'test',
        vertices: [
          { x: 0, y: 0 },
          { x: 0, y: 1 },
          { x: 1, y: 1 },
          { x: 1, y: 0 },
        ],
        path: '',
      };
      expect(patchArea(patch)).toBeCloseTo(1, 5);
    });
  });

  describe('detectPatches', () => {
    it('returns 1 patch (whole grid) when no seam lines are drawn', () => {
      const patches = detectPatches([], 2, 2);
      expect(patches).toHaveLength(1);
    });

    it('returns 2 patches for a single horizontal line across a 2x2 grid', () => {
      // Horizontal line from (1,0) to (1,2) splitting grid in half
      const segments: Segment[] = [
        { from: { row: 1, col: 0 }, to: { row: 1, col: 1 } },
        { from: { row: 1, col: 1 }, to: { row: 1, col: 2 } },
      ];
      const patches = detectPatches(segments, 2, 2);
      expect(patches).toHaveLength(2);
    });

    it('returns 2 patches for a single vertical line across a 2x2 grid', () => {
      const segments: Segment[] = [
        { from: { row: 0, col: 1 }, to: { row: 1, col: 1 } },
        { from: { row: 1, col: 1 }, to: { row: 2, col: 1 } },
      ];
      const patches = detectPatches(segments, 2, 2);
      expect(patches).toHaveLength(2);
    });

    it('returns 4 patches for crossing lines (+ pattern) in a 2x2 grid', () => {
      const segments: Segment[] = [
        // Horizontal line through middle
        { from: { row: 1, col: 0 }, to: { row: 1, col: 1 } },
        { from: { row: 1, col: 1 }, to: { row: 1, col: 2 } },
        // Vertical line through middle
        { from: { row: 0, col: 1 }, to: { row: 1, col: 1 } },
        { from: { row: 1, col: 1 }, to: { row: 2, col: 1 } },
      ];
      const patches = detectPatches(segments, 2, 2);
      expect(patches).toHaveLength(4);
    });

    it('returns 2 triangular patches for a diagonal line', () => {
      // Diagonal from top-left (0,0) to bottom-right (2,2) in a 2x2 grid
      const segments: Segment[] = [
        { from: { row: 0, col: 0 }, to: { row: 2, col: 2 } },
      ];
      const patches = detectPatches(segments, 2, 2);
      expect(patches).toHaveLength(2);
    });

    it('handles duplicate segments (deduplication)', () => {
      const seg: Segment = { from: { row: 1, col: 0 }, to: { row: 1, col: 2 } };
      const patches = detectPatches([seg, seg], 2, 2);
      // Should deduplicate and still produce 2 patches
      expect(patches).toHaveLength(2);
    });

    it('assigns unique ids to each patch', () => {
      const segments: Segment[] = [
        { from: { row: 1, col: 0 }, to: { row: 1, col: 1 } },
        { from: { row: 1, col: 1 }, to: { row: 1, col: 2 } },
      ];
      const patches = detectPatches(segments, 2, 2);
      const ids = patches.map((p) => p.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('each patch has non-empty vertices array', () => {
      const segments: Segment[] = [
        { from: { row: 1, col: 0 }, to: { row: 1, col: 2 } },
      ];
      const patches = detectPatches(segments, 2, 2);
      for (const patch of patches) {
        expect(patch.vertices.length).toBeGreaterThan(2);
      }
    });

    it('total area of all patches equals grid area (conservation)', () => {
      const gridCols = 3;
      const gridRows = 3;
      const segments: Segment[] = [
        // Cross pattern
        { from: { row: 0, col: 0 }, to: { row: 3, col: 3 } },
        { from: { row: 0, col: 3 }, to: { row: 3, col: 0 } },
      ];
      const patches = detectPatches(segments, gridCols, gridRows);
      const totalArea = patches.reduce((sum, p) => sum + patchArea(p), 0);
      // Grid area = gridCols * gridRows (in grid units, each cell is 1x1)
      expect(totalArea).toBeCloseTo(gridCols * gridRows, 1);
    });

    it('produces 9 patches for a 3x3 nine-patch block', () => {
      // Two horizontal + two vertical lines creating a 3x3 grid within a 3x3 block
      const segments: Segment[] = [
        // Horizontal lines
        { from: { row: 1, col: 0 }, to: { row: 1, col: 3 } },
        { from: { row: 2, col: 0 }, to: { row: 2, col: 3 } },
        // Vertical lines
        { from: { row: 0, col: 1 }, to: { row: 3, col: 1 } },
        { from: { row: 0, col: 2 }, to: { row: 3, col: 2 } },
      ];
      const patches = detectPatches(segments, 3, 3);
      expect(patches).toHaveLength(9);
    });
  });

  describe('arcToPath', () => {
    it('returns a valid SVG arc path string', () => {
      const arc: ArcSegment = {
        from: { row: 0, col: 0 },
        to: { row: 1, col: 1 },
        center: { row: 0, col: 1 },
        clockwise: true,
      };
      const path = arcToPath(arc, 100);
      expect(path).toMatch(/^M/);
      expect(path).toContain('A');
    });

    it('produces different paths for clockwise vs counterclockwise', () => {
      const cw: ArcSegment = {
        from: { row: 0, col: 0 },
        to: { row: 1, col: 1 },
        center: { row: 0, col: 1 },
        clockwise: true,
      };
      const ccw: ArcSegment = { ...cw, clockwise: false };
      expect(arcToPath(cw, 100)).not.toBe(arcToPath(ccw, 100));
    });
  });
});
