import { describe, it, expect, vi } from 'vitest';
import type { Point2D } from '@/lib/photo-pattern-types';
import {
  sortCornersClockwise,
  autoDetectQuiltBoundary,
  computePerspectiveTransform,
  applyPerspectiveCorrection,
} from '@/lib/perspective-engine';

// ── Mock Helpers ────────────────────────────────────────────────

function createMockMat(cols: number, rows: number) {
  return {
    cols,
    rows,
    data32F: new Float32Array(cols * rows),
    delete: vi.fn(),
    size: () => ({ width: cols, height: rows }),
  };
}

interface MockCvOpts {
  readonly approxVertexCount?: number;
  readonly contourAreaValue?: number;
  readonly arcLengthValue?: number;
}

function createMockCv(opts: MockCvOpts = {}) {
  const { approxVertexCount = 4, contourAreaValue = 50000, arcLengthValue = 1000 } = opts;

  const mockContour = {
    data32S: new Int32Array(approxVertexCount * 2),
    rows: approxVertexCount,
    cols: 1,
    size: () => ({ height: approxVertexCount, width: 1 }),
    intPtr: (row: number, _col: number) => {
      // Return [x, y] pairs that form a rectangle for 4 vertices
      const points = [
        [10, 10],
        [490, 10],
        [490, 490],
        [10, 490],
      ];
      if (row < points.length) {
        return points[row];
      }
      return [250, 250];
    },
    delete: vi.fn(),
  };

  const mockApprox = {
    rows: approxVertexCount,
    cols: 1,
    size: () => ({ height: approxVertexCount, width: 1 }),
    intPtr: mockContour.intPtr,
    delete: vi.fn(),
  };

  const mockContours = {
    size: () => 1,
    get: () => mockContour,
    delete: vi.fn(),
  };

  const mockHierarchy = createMockMat(4, 1);
  const mockTransformMat = createMockMat(3, 3);

  // Use function constructors so `new cv.Mat()` and `new cv.MatVector()` work
  function MockMat() {
    return createMockMat(0, 0);
  }

  function MockMatVector() {
    return mockContours;
  }

  function MockSize(w: number, h: number) {
    return { width: w, height: h };
  }

  return {
    Mat: MockMat,
    MatVector: MockMatVector,
    cvtColor: vi.fn(),
    GaussianBlur: vi.fn(),
    Canny: vi.fn(),
    findContours: vi.fn((_image: any, contours: any, _hierarchy: any) => {
      contours.size = () => 1;
      contours.get = () => mockContour;
    }),
    contourArea: vi.fn(() => contourAreaValue),
    arcLength: vi.fn(() => arcLengthValue),
    approxPolyDP: vi.fn((_contour: any, approx: any) => {
      approx.rows = approxVertexCount;
      approx.size = () => ({ height: approxVertexCount, width: 1 });
      approx.intPtr = mockApprox.intPtr;
    }),
    getPerspectiveTransform: vi.fn(() => mockTransformMat),
    warpPerspective: vi.fn(),
    matFromArray: vi.fn((rows: number, cols: number) => createMockMat(cols, rows)),
    Size: MockSize,
    COLOR_RGBA2GRAY: 11,
    RETR_EXTERNAL: 0,
    CHAIN_APPROX_SIMPLE: 2,
    INTER_LINEAR: 1,
    CV_32FC2: 13,
    _mockHierarchy: mockHierarchy,
    _mockContours: mockContours,
    _mockApprox: mockApprox,
  };
}

// ── Tests ───────────────────────────────────────────────────────

describe('perspective-engine', () => {
  describe('sortCornersClockwise', () => {
    it('sorts scrambled square corners into TL, TR, BR, BL order', () => {
      const scrambled: [Point2D, Point2D, Point2D, Point2D] = [
        { x: 100, y: 100 },
        { x: 0, y: 0 },
        { x: 0, y: 100 },
        { x: 100, y: 0 },
      ];

      const result = sortCornersClockwise(scrambled);

      // TL: min sum (0+0=0)
      expect(result[0]).toEqual({ x: 0, y: 0 });
      // TR: max diff (100-0=100)
      expect(result[1]).toEqual({ x: 100, y: 0 });
      // BR: max sum (100+100=200)
      expect(result[2]).toEqual({ x: 100, y: 100 });
      // BL: min diff (0-100=-100)
      expect(result[3]).toEqual({ x: 0, y: 100 });
    });

    it('sorts a tilted quadrilateral with distinct sum/diff values', () => {
      // A trapezoid-like quad where all sums and diffs are unique
      // Points: top-left-ish, top-right-ish, bottom-right-ish, bottom-left-ish
      const tilted: [Point2D, Point2D, Point2D, Point2D] = [
        { x: 150, y: 30 }, // sum=180, diff=120
        { x: 20, y: 40 }, // sum=60,  diff=-20
        { x: 130, y: 160 }, // sum=290, diff=-30
        { x: 40, y: 150 }, // sum=190, diff=-110
      ];

      const result = sortCornersClockwise(tilted);

      // TL: min sum=60 → (20,40)
      expect(result[0]).toEqual({ x: 20, y: 40 });
      // TR: max diff=120 → (150,30)
      expect(result[1]).toEqual({ x: 150, y: 30 });
      // BR: max sum=290 → (130,160)
      expect(result[2]).toEqual({ x: 130, y: 160 });
      // BL: min diff=-110 → (40,150)
      expect(result[3]).toEqual({ x: 40, y: 150 });
    });
  });

  describe('autoDetectQuiltBoundary', () => {
    it('returns null when no 4-corner contour is found', () => {
      const cv = createMockCv({ approxVertexCount: 5 });
      const imageMat = createMockMat(500, 500);

      const result = autoDetectQuiltBoundary(cv, imageMat);

      expect(result).toBeNull();
      expect(cv.cvtColor).toHaveBeenCalled();
      expect(cv.GaussianBlur).toHaveBeenCalled();
      expect(cv.Canny).toHaveBeenCalled();
      expect(cv.findContours).toHaveBeenCalled();
    });

    it('returns sorted corners when a quadrilateral contour is found', () => {
      const cv = createMockCv({ approxVertexCount: 4 });
      const imageMat = createMockMat(500, 500);

      const result = autoDetectQuiltBoundary(cv, imageMat);

      expect(result).not.toBeNull();
      expect(result).toHaveLength(4);

      // Mock intPtr returns: [10,10], [490,10], [490,490], [10,490]
      // TL: min sum=20 → (10,10)
      // TR: max diff=480 → (490,10)
      // BR: max sum=980 → (490,490)
      // BL: min diff=-480 → (10,490)
      expect(result![0]).toEqual({ x: 10, y: 10 });
      expect(result![1]).toEqual({ x: 490, y: 10 });
      expect(result![2]).toEqual({ x: 490, y: 490 });
      expect(result![3]).toEqual({ x: 10, y: 490 });
    });
  });

  describe('computePerspectiveTransform', () => {
    it('calls cv.getPerspectiveTransform with correct matrices', () => {
      const cv = createMockCv();
      const srcCorners: [Point2D, Point2D, Point2D, Point2D] = [
        { x: 10, y: 10 },
        { x: 490, y: 10 },
        { x: 490, y: 490 },
        { x: 10, y: 490 },
      ];

      const result = computePerspectiveTransform(cv, srcCorners, 800, 600);

      expect(cv.matFromArray).toHaveBeenCalledTimes(2);

      expect(cv.matFromArray).toHaveBeenCalledWith(
        4,
        1,
        cv.CV_32FC2,
        [10, 10, 490, 10, 490, 490, 10, 490]
      );

      expect(cv.matFromArray).toHaveBeenCalledWith(
        4,
        1,
        cv.CV_32FC2,
        [0, 0, 800, 0, 800, 600, 0, 600]
      );

      expect(cv.getPerspectiveTransform).toHaveBeenCalledTimes(1);
      expect(result).toBeDefined();
    });
  });

  describe('applyPerspectiveCorrection', () => {
    it('calls cv.warpPerspective and returns a mat', () => {
      const cv = createMockCv();
      const imageMat = createMockMat(500, 500);
      const transformMatrix = createMockMat(3, 3);

      const result = applyPerspectiveCorrection(cv, imageMat, transformMatrix, 800, 600);

      expect(cv.warpPerspective).toHaveBeenCalledTimes(1);
      expect(result).toBeDefined();
      expect(result.delete).toBeDefined();
    });
  });
});
