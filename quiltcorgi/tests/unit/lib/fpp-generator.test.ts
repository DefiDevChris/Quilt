import { describe, it, expect } from 'vitest';
import {
  parseSvgToPatches,
  computeSewingOrder,
  mirrorPatches,
  type FppPatch,
} from '@/lib/fpp-generator';

// Simple block: two triangles making a square (HST)
const HST_SVG = `<svg viewBox="0 0 100 100">
  <polygon points="0,0 100,0 0,100" fill="#D4883C"/>
  <polygon points="100,0 100,100 0,100" fill="#F5F0E8"/>
</svg>`;

// Four-patch block: 4 squares
const FOUR_PATCH_SVG = `<svg viewBox="0 0 100 100">
  <rect x="0" y="0" width="50" height="50" fill="#D4883C"/>
  <rect x="50" y="0" width="50" height="50" fill="#F5F0E8"/>
  <rect x="0" y="50" width="50" height="50" fill="#F5F0E8"/>
  <rect x="50" y="50" width="50" height="50" fill="#D4883C"/>
</svg>`;

// Single patch
const SINGLE_SVG = `<svg viewBox="0 0 100 100">
  <rect x="0" y="0" width="100" height="100" fill="#D4883C"/>
</svg>`;

describe('fpp-generator', () => {
  describe('parseSvgToPatches', () => {
    it('extracts patches from polygon elements', () => {
      const patches = parseSvgToPatches(HST_SVG);
      expect(patches.length).toBe(2);
    });

    it('extracts patches from rect elements', () => {
      const patches = parseSvgToPatches(FOUR_PATCH_SVG);
      expect(patches.length).toBe(4);
    });

    it('assigns unique IDs starting from 1', () => {
      const patches = parseSvgToPatches(FOUR_PATCH_SVG);
      const ids = patches.map((p) => p.id);
      expect(ids).toEqual([1, 2, 3, 4]);
    });

    it('preserves fill color', () => {
      const patches = parseSvgToPatches(HST_SVG);
      expect(patches[0].color).toBe('#D4883C');
      expect(patches[1].color).toBe('#F5F0E8');
    });

    it('returns empty array for empty SVG', () => {
      const patches = parseSvgToPatches('<svg viewBox="0 0 100 100"></svg>');
      expect(patches).toEqual([]);
    });

    it('returns single patch for single-element SVG', () => {
      const patches = parseSvgToPatches(SINGLE_SVG);
      expect(patches.length).toBe(1);
      expect(patches[0].id).toBe(1);
    });
  });

  describe('computeSewingOrder', () => {
    it('assigns sewing order to all patches', () => {
      const patches = parseSvgToPatches(FOUR_PATCH_SVG);
      const ordered = computeSewingOrder(patches);
      const orders = ordered.map((p) => p.sewingOrder);
      expect(orders.length).toBe(4);
      // All orders should be 1-based
      expect(Math.min(...orders)).toBe(1);
      expect(Math.max(...orders)).toBe(4);
    });

    it('assigns order 1 to single patch', () => {
      const patches = parseSvgToPatches(SINGLE_SVG);
      const ordered = computeSewingOrder(patches);
      expect(ordered[0].sewingOrder).toBe(1);
    });

    it('returns all unique sewing orders', () => {
      const patches = parseSvgToPatches(HST_SVG);
      const ordered = computeSewingOrder(patches);
      const orders = ordered.map((p) => p.sewingOrder);
      const unique = new Set(orders);
      expect(unique.size).toBe(patches.length);
    });

    it('detects adjacency between HST triangles', () => {
      const patches = parseSvgToPatches(HST_SVG);
      const ordered = computeSewingOrder(patches);
      // Both patches share the diagonal edge, so they should be adjacent
      const patch1 = ordered.find((p) => p.sewingOrder === 1)!;
      expect(patch1.adjacentPatches.length).toBeGreaterThan(0);
    });
  });

  describe('mirrorPatches', () => {
    it('mirrors x-coordinates around block center', () => {
      const patches: FppPatch[] = [
        { id: 1, vertices: [{ x: 0, y: 0 }, { x: 50, y: 0 }, { x: 0, y: 100 }], color: '#000', sewingOrder: 1, adjacentPatches: [] },
      ];

      const mirrored = mirrorPatches(patches, 100);
      // x=0 -> 100, x=50 -> 50, x=0 -> 100
      expect(mirrored[0].vertices[0].x).toBeCloseTo(100);
      expect(mirrored[0].vertices[1].x).toBeCloseTo(50);
      expect(mirrored[0].vertices[2].x).toBeCloseTo(100);
    });

    it('does not modify y-coordinates', () => {
      const patches: FppPatch[] = [
        { id: 1, vertices: [{ x: 10, y: 20 }, { x: 30, y: 40 }], color: '#000', sewingOrder: 1, adjacentPatches: [] },
      ];

      const mirrored = mirrorPatches(patches, 100);
      expect(mirrored[0].vertices[0].y).toBe(20);
      expect(mirrored[0].vertices[1].y).toBe(40);
    });

    it('preserves patch metadata', () => {
      const patches: FppPatch[] = [
        { id: 5, vertices: [{ x: 0, y: 0 }], color: '#FF0000', sewingOrder: 3, adjacentPatches: [2, 4] },
      ];

      const mirrored = mirrorPatches(patches, 100);
      expect(mirrored[0].id).toBe(5);
      expect(mirrored[0].color).toBe('#FF0000');
      expect(mirrored[0].sewingOrder).toBe(3);
      expect(mirrored[0].adjacentPatches).toEqual([2, 4]);
    });

    it('returns new array without mutating original', () => {
      const original: FppPatch[] = [
        { id: 1, vertices: [{ x: 10, y: 20 }], color: '#000', sewingOrder: 1, adjacentPatches: [] },
      ];

      const mirrored = mirrorPatches(original, 100);
      expect(original[0].vertices[0].x).toBe(10);
      expect(mirrored[0].vertices[0].x).toBeCloseTo(90);
    });
  });
});
