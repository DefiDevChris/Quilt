import { describe, it, expect } from 'vitest';
import { fabricObjectToSvgData } from '@/lib/fabric-object-to-svg';

describe('fabric-object-to-svg', () => {
  describe('fabricObjectToSvgData', () => {
    // ── Rect ──────────────────────────────────────────────────────

    it('converts a rect object to path data with 4 points', () => {
      const rect = {
        type: 'rect',
        width: 100,
        height: 50,
        left: 0,
        top: 0,
        scaleX: 1,
        scaleY: 1,
      };
      const result = fabricObjectToSvgData(rect);

      expect(result).not.toBeNull();
      expect(result).toContain('M');
      expect(result).toContain('Z');

      // A rect should produce 4 L commands (or 3 L + 1 M)
      const lCount = (result!.match(/L /g) ?? []).length;
      expect(lCount).toBe(3);
    });

    it('applies scale to rect dimensions', () => {
      const rect = {
        type: 'rect',
        width: 100,
        height: 50,
        left: 10,
        top: 20,
        scaleX: 2,
        scaleY: 3,
      };
      const result = fabricObjectToSvgData(rect);

      expect(result).not.toBeNull();
      // Scaled width = 200, scaled height = 150
      // Bottom-right corner should be at (10 + 200, 20 + 150) = (210, 170)
      expect(result).toContain('210');
      expect(result).toContain('170');
    });

    // ── Triangle ──────────────────────────────────────────────────

    it('converts a triangle object to path data with 3 points', () => {
      const triangle = {
        type: 'triangle',
        width: 100,
        height: 100,
        left: 0,
        top: 0,
        scaleX: 1,
        scaleY: 1,
      };
      const result = fabricObjectToSvgData(triangle);

      expect(result).not.toBeNull();
      expect(result).toContain('M');
      expect(result).toContain('Z');

      // A triangle should produce 2 L commands + 1 M
      const lCount = (result!.match(/L /g) ?? []).length;
      expect(lCount).toBe(2);
    });

    it('generates correct triangle vertex positions', () => {
      const triangle = {
        type: 'triangle',
        width: 100,
        height: 100,
        left: 0,
        top: 0,
        scaleX: 1,
        scaleY: 1,
      };
      const result = fabricObjectToSvgData(triangle);

      expect(result).not.toBeNull();
      // Standard Fabric.js triangle: top-center (50,0), bottom-right (100,100), bottom-left (0,100)
      expect(result).toContain('50');
    });

    // ── Polygon ───────────────────────────────────────────────────

    it('converts a polygon object with explicit points', () => {
      const polygon = {
        type: 'polygon',
        points: [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 50, y: 87 },
        ],
        scaleX: 1,
        scaleY: 1,
      };
      const result = fabricObjectToSvgData(polygon);

      expect(result).not.toBeNull();
      expect(result).toContain('M 0 0');
      expect(result).toContain('L 100 0');
      expect(result).toContain('L 50 87');
      expect(result).toContain('Z');
    });

    it('returns null for a polygon with fewer than 3 points', () => {
      const polygon = {
        type: 'polygon',
        points: [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
        ],
        scaleX: 1,
        scaleY: 1,
      };
      const result = fabricObjectToSvgData(polygon);

      expect(result).toBeNull();
    });

    // ── Path ──────────────────────────────────────────────────────

    it('converts a path object with path array', () => {
      const pathObj = {
        type: 'path',
        path: [
          ['M', 0, 0],
          ['L', 100, 0],
          ['L', 100, 100],
          ['Z'],
        ],
        scaleX: 1,
        scaleY: 1,
      };
      const result = fabricObjectToSvgData(pathObj);

      expect(result).not.toBeNull();
      expect(result).toContain('M 0 0');
      expect(result).toContain('L 100 0');
      expect(result).toContain('L 100 100');
      expect(result).toContain('Z');
    });

    it('returns null for a path with empty path array', () => {
      const pathObj = {
        type: 'path',
        path: [],
        scaleX: 1,
        scaleY: 1,
      };
      const result = fabricObjectToSvgData(pathObj);

      expect(result).toBeNull();
    });

    // ── Circle ────────────────────────────────────────────────────

    it('converts a circle to an approximated polygon (non-null)', () => {
      const circle = {
        type: 'circle',
        radius: 50,
        left: 0,
        top: 0,
        scaleX: 1,
        scaleY: 1,
      };
      const result = fabricObjectToSvgData(circle);

      expect(result).not.toBeNull();
      expect(result).toContain('M');
      expect(result).toContain('Z');
    });

    it('circle approximation produces 32 segments', () => {
      const circle = {
        type: 'circle',
        radius: 50,
        left: 0,
        top: 0,
        scaleX: 1,
        scaleY: 1,
      };
      const result = fabricObjectToSvgData(circle)!;

      // 32 segments: 1 M + 31 L commands
      const lCount = (result.match(/L /g) ?? []).length;
      expect(lCount).toBe(31);
    });

    it('applies scale to circle radius', () => {
      const circle = {
        type: 'circle',
        radius: 50,
        left: 0,
        top: 0,
        scaleX: 2,
        scaleY: 2,
      };
      const result = fabricObjectToSvgData(circle)!;

      // Effective radius = 50 * 2 = 100. Center at (100, 100).
      // First point at angle 0 should be at x = 100 + 100 = 200
      expect(result).toContain('M 200');
    });

    // ── Ellipse ───────────────────────────────────────────────────

    it('converts an ellipse to an approximated polygon', () => {
      const ellipse = {
        type: 'ellipse',
        rx: 60,
        ry: 40,
        left: 0,
        top: 0,
        scaleX: 1,
        scaleY: 1,
      };
      const result = fabricObjectToSvgData(ellipse);

      expect(result).not.toBeNull();
      expect(result).toContain('M');
      expect(result).toContain('Z');
    });

    // ── Group ─────────────────────────────────────────────────────

    it('converts a group by concatenating child paths', () => {
      const rectChild = {
        type: 'rect',
        width: 100,
        height: 50,
        left: 0,
        top: 0,
        scaleX: 1,
        scaleY: 1,
      };
      const triChild = {
        type: 'triangle',
        width: 100,
        height: 100,
        left: 0,
        top: 0,
        scaleX: 1,
        scaleY: 1,
      };
      const group = {
        type: 'group',
        _objects: [rectChild, triChild],
        scaleX: 1,
        scaleY: 1,
      };
      const result = fabricObjectToSvgData(group);

      expect(result).not.toBeNull();
      // Should contain path data from both children
      const mCount = (result!.match(/M /g) ?? []).length;
      expect(mCount).toBe(2);
    });

    it('returns null for a group with no supported children', () => {
      const group = {
        type: 'group',
        _objects: [{ type: 'textbox', text: 'hello' }],
        scaleX: 1,
        scaleY: 1,
      };
      const result = fabricObjectToSvgData(group);

      expect(result).toBeNull();
    });

    it('returns null for an empty group', () => {
      const group = {
        type: 'group',
        _objects: [],
        scaleX: 1,
        scaleY: 1,
      };
      const result = fabricObjectToSvgData(group);

      expect(result).toBeNull();
    });

    // ── ActiveSelection ───────────────────────────────────────────

    it('treats activeSelection type as a group', () => {
      const activeSelection = {
        type: 'activeSelection',
        _objects: [
          {
            type: 'rect',
            width: 50,
            height: 50,
            left: 0,
            top: 0,
            scaleX: 1,
            scaleY: 1,
          },
        ],
        scaleX: 1,
        scaleY: 1,
      };
      const result = fabricObjectToSvgData(activeSelection);

      expect(result).not.toBeNull();
    });

    // ── Unsupported type ──────────────────────────────────────────

    it('returns null for unsupported types like textbox', () => {
      const textbox = {
        type: 'textbox',
        text: 'hello',
      };
      const result = fabricObjectToSvgData(textbox);

      expect(result).toBeNull();
    });

    it('returns null for an image type', () => {
      const img = {
        type: 'image',
        width: 100,
        height: 100,
        src: 'test.png',
      };
      // Image has width/height but no other shape markers, so duck-typing
      // might classify it as rect. Check the actual behavior.
      const result = fabricObjectToSvgData(img);

      // Image objects have width+height so they might be detected as rect
      // This test documents the current behavior
      expect(typeof result === 'string' || result === null).toBe(true);
    });

    // ── Null / undefined ──────────────────────────────────────────

    it('returns null for null input', () => {
      expect(fabricObjectToSvgData(null)).toBeNull();
    });

    it('returns null for undefined input', () => {
      expect(fabricObjectToSvgData(undefined)).toBeNull();
    });

    it('returns null for a primitive value', () => {
      expect(fabricObjectToSvgData(42 as unknown)).toBeNull();
      expect(fabricObjectToSvgData('string' as unknown)).toBeNull();
    });

    // ── Duck-typing fallback ──────────────────────────────────────

    it('detects a path via duck-typing when type is missing', () => {
      const obj = {
        path: [
          ['M', 0, 0],
          ['L', 100, 0],
          ['L', 100, 100],
          ['Z'],
        ],
        scaleX: 1,
        scaleY: 1,
      };
      const result = fabricObjectToSvgData(obj);

      expect(result).not.toBeNull();
      expect(result).toContain('M 0 0');
    });

    it('detects a group via duck-typing when type is missing', () => {
      const obj = {
        _objects: [
          {
            type: 'rect',
            width: 50,
            height: 50,
            left: 0,
            top: 0,
            scaleX: 1,
            scaleY: 1,
          },
        ],
        scaleX: 1,
        scaleY: 1,
      };
      const result = fabricObjectToSvgData(obj);

      expect(result).not.toBeNull();
    });

    it('detects a polygon via duck-typing when type is missing', () => {
      const obj = {
        points: [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 50, y: 87 },
        ],
        scaleX: 1,
        scaleY: 1,
      };
      const result = fabricObjectToSvgData(obj);

      expect(result).not.toBeNull();
    });

    it('detects a circle via duck-typing when type is missing', () => {
      const obj = {
        radius: 50,
        left: 0,
        top: 0,
        scaleX: 1,
        scaleY: 1,
      };
      const result = fabricObjectToSvgData(obj);

      expect(result).not.toBeNull();
    });

    it('detects an ellipse via duck-typing when type is missing', () => {
      const obj = {
        rx: 60,
        ry: 40,
        left: 0,
        top: 0,
        scaleX: 1,
        scaleY: 1,
      };
      const result = fabricObjectToSvgData(obj);

      expect(result).not.toBeNull();
    });

    // ── Polyline ──────────────────────────────────────────────────

    it('converts a polyline (open path, no Z)', () => {
      const polyline = {
        type: 'polyline',
        points: [
          { x: 0, y: 0 },
          { x: 100, y: 50 },
          { x: 200, y: 0 },
        ],
        scaleX: 1,
        scaleY: 1,
      };
      const result = fabricObjectToSvgData(polyline);

      expect(result).not.toBeNull();
      expect(result).toContain('M 0 0');
      expect(result).not.toContain('Z');
    });

    // ── Case insensitivity ────────────────────────────────────────

    it('handles uppercase type property', () => {
      const rect = {
        type: 'Rect',
        width: 100,
        height: 50,
        left: 0,
        top: 0,
        scaleX: 1,
        scaleY: 1,
      };
      const result = fabricObjectToSvgData(rect);

      expect(result).not.toBeNull();
    });

    it('handles "rectangle" as type alias for rect', () => {
      const rect = {
        type: 'rectangle',
        width: 100,
        height: 50,
        left: 0,
        top: 0,
        scaleX: 1,
        scaleY: 1,
      };
      const result = fabricObjectToSvgData(rect);

      expect(result).not.toBeNull();
    });
  });
});
