import { describe, it, expect } from 'vitest';
import {
  applyFrame,
  frameToSvgPath,
  type FrameConfig,
  type Point2D,
} from '@/lib/frame-engine';

describe('Frame Engine', () => {
  const mockBlockGeometry: Point2D[][] = [
    [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ],
  ];

  describe('applyFrame', () => {
    it('should apply simple border frame', () => {
      const config: FrameConfig = {
        style: 'simple-border',
        width: 1,
        color: '#ff0000',
        cornerTreatment: 'mitered',
      };

      const result = applyFrame(mockBlockGeometry, config);

      expect(result.originalBlock).toEqual(mockBlockGeometry);
      expect(result.frameGeometry).toHaveLength(1);
      expect(result.frameGeometry[0].style).toBe('simple-border');
      expect(result.frameGeometry[0].color).toBe('#ff0000');
      expect(result.boundingBox).toEqual({
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      });
    });

    it('should apply double border frame', () => {
      const config: FrameConfig = {
        style: 'double-border',
        width: 2,
        cornerTreatment: 'square',
      };

      const result = applyFrame(mockBlockGeometry, config);

      expect(result.frameGeometry).toHaveLength(2);
      expect(result.frameGeometry[0].style).toBe('simple-border');
      expect(result.frameGeometry[1].style).toBe('simple-border');
    });

    it('should apply sawtooth frame', () => {
      const config: FrameConfig = {
        style: 'sawtooth',
        width: 1.5,
        cornerTreatment: 'mitered',
      };

      const result = applyFrame(mockBlockGeometry, config);

      expect(result.frameGeometry).toHaveLength(1);
      expect(result.frameGeometry[0].style).toBe('sawtooth');
      expect(result.frameGeometry[0].paths[0].length).toBeGreaterThan(4);
    });

    it('should apply flying geese frame', () => {
      const config: FrameConfig = {
        style: 'flying-geese',
        width: 1,
        cornerTreatment: 'mitered',
      };

      const result = applyFrame(mockBlockGeometry, config);

      expect(result.frameGeometry).toHaveLength(1);
      expect(result.frameGeometry[0].style).toBe('flying-geese');
    });

    it('should apply piano keys frame', () => {
      const config: FrameConfig = {
        style: 'piano-keys',
        width: 1,
        cornerTreatment: 'mitered',
      };

      const result = applyFrame(mockBlockGeometry, config);

      expect(result.frameGeometry).toHaveLength(1);
      expect(result.frameGeometry[0].style).toBe('piano-keys');
      expect(result.frameGeometry[0].paths.length).toBeGreaterThan(0);
    });

    it('should apply cornerstone frame', () => {
      const config: FrameConfig = {
        style: 'cornerstone',
        width: 1,
        color: '#000000',
        cornerTreatment: 'mitered',
      };

      const result = applyFrame(mockBlockGeometry, config);

      expect(result.frameGeometry).toHaveLength(2);
      expect(result.frameGeometry[0].style).toBe('simple-border');
      expect(result.frameGeometry[1].style).toBe('cornerstone');
      expect(result.frameGeometry[1].color).toBe('#ffffff'); // Contrasting color
    });

    it('should handle different frame widths', () => {
      const config1: FrameConfig = {
        style: 'simple-border',
        width: 0.25,
        cornerTreatment: 'mitered',
      };

      const config2: FrameConfig = {
        style: 'simple-border',
        width: 3,
        cornerTreatment: 'mitered',
      };

      const result1 = applyFrame(mockBlockGeometry, config1);
      const result2 = applyFrame(mockBlockGeometry, config2);

      // Frame with larger width should have larger geometry
      const frame1Path = result1.frameGeometry[0].paths[0];
      const frame2Path = result2.frameGeometry[0].paths[0];

      expect(Math.abs(frame2Path[0].x)).toBeGreaterThan(Math.abs(frame1Path[0].x));
    });

    it('should handle irregular block geometry', () => {
      const irregularGeometry: Point2D[][] = [
        [
          { x: 10, y: 20 },
          { x: 80, y: 15 },
          { x: 90, y: 85 },
          { x: 15, y: 90 },
        ],
      ];

      const config: FrameConfig = {
        style: 'simple-border',
        width: 1,
        cornerTreatment: 'mitered',
      };

      const result = applyFrame(irregularGeometry, config);

      expect(result.originalBlock).toEqual(irregularGeometry);
      expect(result.frameGeometry).toHaveLength(1);
      expect(result.boundingBox.x).toBe(10);
      expect(result.boundingBox.y).toBe(15);
      expect(result.boundingBox.width).toBe(80);
      expect(result.boundingBox.height).toBe(75);
    });
  });

  describe('frameToSvgPath', () => {
    it('should convert frame geometry to SVG path', () => {
      const config: FrameConfig = {
        style: 'simple-border',
        width: 1,
        cornerTreatment: 'mitered',
      };

      const result = applyFrame(mockBlockGeometry, config);
      const svgPath = frameToSvgPath(result.frameGeometry[0]);

      expect(svgPath).toContain('M ');
      expect(svgPath).toContain('L ');
      expect(svgPath).toContain('Z');
    });

    it('should handle empty paths', () => {
      const emptyGeometry = {
        paths: [],
        style: 'simple-border' as const,
      };

      const svgPath = frameToSvgPath(emptyGeometry);
      expect(svgPath).toBe('');
    });

    it('should handle multiple paths', () => {
      const multiPathGeometry = {
        paths: [
          [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 10, y: 10 },
            { x: 0, y: 10 },
          ],
          [
            { x: 20, y: 20 },
            { x: 30, y: 20 },
            { x: 30, y: 30 },
            { x: 20, y: 30 },
          ],
        ],
        style: 'piano-keys' as const,
      };

      const svgPath = frameToSvgPath(multiPathGeometry);
      const pathCount = (svgPath.match(/M /g) || []).length;
      expect(pathCount).toBe(2);
    });
  });

  describe('edge cases', () => {
    it('should handle zero-width frame', () => {
      const config: FrameConfig = {
        style: 'simple-border',
        width: 0,
        cornerTreatment: 'mitered',
      };

      const result = applyFrame(mockBlockGeometry, config);
      expect(result.frameGeometry).toHaveLength(1);
    });

    it('should handle very large frame width', () => {
      const config: FrameConfig = {
        style: 'simple-border',
        width: 10,
        cornerTreatment: 'mitered',
      };

      const result = applyFrame(mockBlockGeometry, config);
      expect(result.frameGeometry).toHaveLength(1);
      
      const framePath = result.frameGeometry[0].paths[0];
      expect(framePath[0].x).toBeLessThan(-900); // 10 inches * 96 DPI
    });

    it('should handle single point geometry', () => {
      const pointGeometry: Point2D[][] = [
        [{ x: 50, y: 50 }],
      ];

      const config: FrameConfig = {
        style: 'simple-border',
        width: 1,
        cornerTreatment: 'mitered',
      };

      const result = applyFrame(pointGeometry, config);
      expect(result.boundingBox.width).toBe(0);
      expect(result.boundingBox.height).toBe(0);
    });
  });
});
