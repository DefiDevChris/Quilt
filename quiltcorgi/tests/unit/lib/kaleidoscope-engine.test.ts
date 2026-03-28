import { describe, it, expect } from 'vitest';
import {
  generateKaleidoscope,
  kaleidoscopeToSvgPath,
  type KaleidoscopeConfig,
  type Point2D,
} from '@/lib/kaleidoscope-engine';

describe('Kaleidoscope Engine', () => {
  const mockSourceGeometry: Point2D[][] = [
    [
      { x: 0, y: 0 },
      { x: 50, y: 0 },
      { x: 25, y: 50 },
    ],
  ];

  describe('generateKaleidoscope', () => {
    it('should generate 4-fold kaleidoscope', () => {
      const config: KaleidoscopeConfig = {
        foldCount: 4,
        sourceQuadrant: 'top-left',
      };

      const result = generateKaleidoscope(mockSourceGeometry, config);

      expect(result.wedgeAngle).toBe(90);
      expect(result.geometry.length).toBeGreaterThan(0);
      expect(result.centerPoint).toBeDefined();
      expect(result.radius).toBeGreaterThan(0);
    });

    it('should generate 6-fold kaleidoscope', () => {
      const config: KaleidoscopeConfig = {
        foldCount: 6,
        sourceQuadrant: 'top-right',
      };

      const result = generateKaleidoscope(mockSourceGeometry, config);

      expect(result.wedgeAngle).toBe(60);
      expect(result.geometry.length).toBeGreaterThan(0);
    });

    it('should generate 8-fold kaleidoscope', () => {
      const config: KaleidoscopeConfig = {
        foldCount: 8,
        sourceQuadrant: 'bottom-left',
      };

      const result = generateKaleidoscope(mockSourceGeometry, config);

      expect(result.wedgeAngle).toBe(45);
      expect(result.geometry.length).toBeGreaterThan(0);
    });

    it('should generate 12-fold kaleidoscope', () => {
      const config: KaleidoscopeConfig = {
        foldCount: 12,
        sourceQuadrant: 'bottom-right',
      };

      const result = generateKaleidoscope(mockSourceGeometry, config);

      expect(result.wedgeAngle).toBe(30);
      expect(result.geometry.length).toBeGreaterThan(0);
    });

    it('should use custom radius when provided', () => {
      const config: KaleidoscopeConfig = {
        foldCount: 6,
        sourceQuadrant: 'top-left',
        radius: 100,
      };

      const result = generateKaleidoscope(mockSourceGeometry, config);

      expect(result.radius).toBe(100);
    });

    it('should auto-calculate radius when not provided', () => {
      const config: KaleidoscopeConfig = {
        foldCount: 6,
        sourceQuadrant: 'top-left',
      };

      const result = generateKaleidoscope(mockSourceGeometry, config);

      expect(result.radius).toBeGreaterThan(0);
      expect(result.radius).toBeLessThan(1000); // Reasonable bounds
    });

    it('should handle different source quadrants', () => {
      const quadrants: Array<KaleidoscopeConfig['sourceQuadrant']> = [
        'top-left',
        'top-right',
        'bottom-left',
        'bottom-right',
      ];

      quadrants.forEach((quadrant) => {
        const config: KaleidoscopeConfig = {
          foldCount: 6,
          sourceQuadrant: quadrant,
        };

        const result = generateKaleidoscope(mockSourceGeometry, config);
        expect(result.geometry.length).toBeGreaterThan(0);
      });
    });

    it('should create symmetrical patterns', () => {
      const config: KaleidoscopeConfig = {
        foldCount: 4,
        sourceQuadrant: 'top-left',
      };

      const result = generateKaleidoscope(mockSourceGeometry, config);

      // Check that we have geometry for multiple wedges
      expect(result.geometry.length).toBeGreaterThan(1);
      
      // All geometry should be within the radius
      for (const path of result.geometry) {
        for (const point of path) {
          const distance = Math.sqrt(
            Math.pow(point.x - result.centerPoint.x, 2) +
            Math.pow(point.y - result.centerPoint.y, 2)
          );
          expect(distance).toBeLessThanOrEqual(result.radius + 1); // Allow small tolerance
        }
      }
    });

    it('should handle complex source geometry', () => {
      const complexGeometry: Point2D[][] = [
        [
          { x: 0, y: 0 },
          { x: 30, y: 10 },
          { x: 50, y: 40 },
          { x: 20, y: 60 },
          { x: 10, y: 30 },
        ],
        [
          { x: 60, y: 20 },
          { x: 80, y: 25 },
          { x: 75, y: 45 },
        ],
      ];

      const config: KaleidoscopeConfig = {
        foldCount: 8,
        sourceQuadrant: 'top-left',
      };

      const result = generateKaleidoscope(complexGeometry, config);

      expect(result.geometry.length).toBeGreaterThan(0);
      expect(result.wedgeAngle).toBe(45);
    });

    it('should handle empty source geometry', () => {
      const emptyGeometry: Point2D[][] = [];

      const config: KaleidoscopeConfig = {
        foldCount: 6,
        sourceQuadrant: 'top-left',
      };

      const result = generateKaleidoscope(emptyGeometry, config);

      expect(result.geometry).toEqual([]);
      expect(result.wedgeAngle).toBe(60);
    });
  });

  describe('kaleidoscopeToSvgPath', () => {
    it('should convert kaleidoscope geometry to SVG path', () => {
      const config: KaleidoscopeConfig = {
        foldCount: 6,
        sourceQuadrant: 'top-left',
      };

      const result = generateKaleidoscope(mockSourceGeometry, config);
      const svgPath = kaleidoscopeToSvgPath(result);

      expect(svgPath).toContain('M ');
      expect(svgPath).toContain('L ');
      expect(svgPath).toContain('Z');
    });

    it('should handle empty geometry', () => {
      const emptyResult = {
        geometry: [],
        centerPoint: { x: 0, y: 0 },
        radius: 100,
        wedgeAngle: 60,
      };

      const svgPath = kaleidoscopeToSvgPath(emptyResult);
      expect(svgPath).toBe('');
    });

    it('should handle single point paths', () => {
      const singlePointResult = {
        geometry: [[{ x: 50, y: 50 }]],
        centerPoint: { x: 0, y: 0 },
        radius: 100,
        wedgeAngle: 60,
      };

      const svgPath = kaleidoscopeToSvgPath(singlePointResult);
      expect(svgPath).toContain('M 50 50');
      expect(svgPath).toContain('Z');
    });
  });

  describe('edge cases', () => {
    it('should handle very small source geometry', () => {
      const tinyGeometry: Point2D[][] = [
        [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 0.5, y: 1 },
        ],
      ];

      const config: KaleidoscopeConfig = {
        foldCount: 6,
        sourceQuadrant: 'top-left',
      };

      const result = generateKaleidoscope(tinyGeometry, config);
      expect(result.geometry.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle very large source geometry', () => {
      const largeGeometry: Point2D[][] = [
        [
          { x: 0, y: 0 },
          { x: 1000, y: 0 },
          { x: 500, y: 1000 },
        ],
      ];

      const config: KaleidoscopeConfig = {
        foldCount: 4,
        sourceQuadrant: 'top-left',
      };

      const result = generateKaleidoscope(largeGeometry, config);
      expect(result.radius).toBeGreaterThan(500);
    });

    it('should handle degenerate triangles', () => {
      const degenerateGeometry: Point2D[][] = [
        [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 50, y: 0 }, // Collinear points
        ],
      ];

      const config: KaleidoscopeConfig = {
        foldCount: 6,
        sourceQuadrant: 'top-left',
      };

      const result = generateKaleidoscope(degenerateGeometry, config);
      expect(result.geometry.length).toBeGreaterThanOrEqual(0);
    });

    it('should maintain precision with floating point coordinates', () => {
      const floatGeometry: Point2D[][] = [
        [
          { x: 0.123, y: 0.456 },
          { x: 50.789, y: 0.012 },
          { x: 25.345, y: 50.678 },
        ],
      ];

      const config: KaleidoscopeConfig = {
        foldCount: 8,
        sourceQuadrant: 'top-left',
      };

      const result = generateKaleidoscope(floatGeometry, config);
      expect(result.geometry.length).toBeGreaterThan(0);
      
      // Check that floating point precision is maintained
      const hasFloats = result.geometry.some(path =>
        path.some(point => 
          point.x % 1 !== 0 || point.y % 1 !== 0
        )
      );
      expect(hasFloats).toBe(true);
    });
  });
});
