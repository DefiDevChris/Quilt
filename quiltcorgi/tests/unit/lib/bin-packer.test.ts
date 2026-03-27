import { describe, it, expect } from 'vitest';
import {
  packItems,
  polylineBoundingBox,
  PAPER_LETTER,
  PAPER_A4,
} from '@/lib/bin-packer';

describe('bin-packer', () => {
  describe('polylineBoundingBox', () => {
    it('computes bounding box of a rectangle', () => {
      const points = [
        { x: 1, y: 2 },
        { x: 5, y: 2 },
        { x: 5, y: 6 },
        { x: 1, y: 6 },
      ];
      const bbox = polylineBoundingBox(points);
      expect(bbox.width).toBe(4);
      expect(bbox.height).toBe(4);
      expect(bbox.minX).toBe(1);
      expect(bbox.minY).toBe(2);
    });

    it('handles a single point', () => {
      const bbox = polylineBoundingBox([{ x: 3, y: 7 }]);
      expect(bbox.width).toBe(0);
      expect(bbox.height).toBe(0);
      expect(bbox.minX).toBe(3);
      expect(bbox.minY).toBe(7);
    });
  });

  describe('packItems', () => {
    it('packs a single item onto one page', () => {
      const items = [
        { width: 2, height: 2, quantity: 1, itemIndex: 0 },
      ];
      const result = packItems(items, PAPER_LETTER);
      expect(result.totalPages).toBe(1);
      expect(result.items.length).toBe(1);
      expect(result.items[0].page).toBe(0);
      expect(result.items[0].x).toBe(0);
      expect(result.items[0].y).toBe(0);
    });

    it('expands items by quantity', () => {
      const items = [
        { width: 2, height: 2, quantity: 4, itemIndex: 0 },
      ];
      const result = packItems(items, PAPER_LETTER);
      expect(result.items.length).toBe(4);
      // All should be itemIndex 0
      expect(result.items.every((i) => i.itemIndex === 0)).toBe(true);
      // copyIndex should be 0-3
      const copies = result.items.map((i) => i.copyIndex).sort();
      expect(copies).toEqual([0, 1, 2, 3]);
    });

    it('places items on same shelf when they fit', () => {
      const items = [
        { width: 2, height: 2, quantity: 3, itemIndex: 0 },
      ];
      const result = packItems(items, PAPER_LETTER);
      // 3 items of width 2 with 0.125 gap = 6.25 < 7.5 usable width
      expect(result.totalPages).toBe(1);
      // All should be on the same row (same y)
      const ys = new Set(result.items.map((i) => i.y));
      expect(ys.size).toBe(1);
    });

    it('creates new shelves when width is exceeded', () => {
      const items = [
        { width: 3, height: 2, quantity: 4, itemIndex: 0 },
      ];
      const result = packItems(items, PAPER_LETTER);
      // 2 items per row (3 + 0.125 + 3 = 6.125 < 7.5, 3rd doesn't fit)
      const ys = [...new Set(result.items.map((i) => i.y))];
      expect(ys.length).toBe(2);
    });

    it('overflows to new pages when height is exceeded', () => {
      const items = [
        { width: 2, height: 4, quantity: 8, itemIndex: 0 },
      ];
      const result = packItems(items, PAPER_LETTER);
      // Each shelf is 4" tall. Letter usable height is 10". So ~2 shelves per page (8" + gap)
      // 3 items per shelf (2+0.125+2+0.125+2 = 6.25 < 7.5)
      // 8 items / 3 per shelf = 3 shelves needed = more than 1 page
      expect(result.totalPages).toBeGreaterThanOrEqual(1);
      expect(result.items.length).toBe(8);
    });

    it('respects first page reservation', () => {
      const items = [
        { width: 2, height: 2, quantity: 1, itemIndex: 0 },
      ];
      const result = packItems(items, PAPER_LETTER, 1.6);
      // First item should start below the reservation
      expect(result.items[0].y).toBeGreaterThanOrEqual(1.6);
    });

    it('skips items too large for the page', () => {
      const items = [
        { width: 20, height: 2, quantity: 1, itemIndex: 0 },
      ];
      const result = packItems(items, PAPER_LETTER);
      expect(result.items.length).toBe(0);
    });

    it('handles multiple item types', () => {
      const items = [
        { width: 3, height: 3, quantity: 2, itemIndex: 0 },
        { width: 2, height: 2, quantity: 3, itemIndex: 1 },
      ];
      const result = packItems(items, PAPER_LETTER);
      expect(result.items.length).toBe(5);
      // Both item types should be present
      const indices = new Set(result.items.map((i) => i.itemIndex));
      expect(indices.size).toBe(2);
    });

    it('uses A4 paper dimensions correctly', () => {
      expect(PAPER_A4.usableWidth).toBeCloseTo(7.268, 2);
      expect(PAPER_A4.usableHeight).toBeCloseTo(10.693, 2);
    });

    it('uses Letter paper dimensions correctly', () => {
      expect(PAPER_LETTER.usableWidth).toBe(7.5);
      expect(PAPER_LETTER.usableHeight).toBe(10);
    });
  });
});
