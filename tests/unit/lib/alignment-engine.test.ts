import { describe, it, expect } from 'vitest';
import {
  calculateHorizontalDistribution,
  calculateVerticalDistribution,
  type ObjectBounds,
} from '@/lib/alignment-engine';

function makeObject(
  id: string,
  left: number,
  top: number,
  width: number,
  height: number
): ObjectBounds {
  return { id, left, top, width, height };
}

describe('alignment-engine', () => {
  describe('calculateHorizontalDistribution', () => {
    it('returns null for fewer than 3 objects', () => {
      expect(calculateHorizontalDistribution([makeObject('a', 0, 0, 10, 10)])).toBeNull();
      expect(calculateHorizontalDistribution([])).toBeNull();
    });

    it('distributes 3 objects evenly across width', () => {
      const objects = [
        makeObject('a', 0, 0, 20, 20),
        makeObject('b', 50, 0, 20, 20),
        makeObject('c', 100, 0, 20, 20),
      ];
      const result = calculateHorizontalDistribution(objects);
      expect(result).not.toBeNull();
      expect(result!.adjustments).toHaveLength(3);
    });

    it('preserves leftmost object position', () => {
      const objects = [
        makeObject('a', 10, 0, 20, 20),
        makeObject('b', 60, 0, 20, 20),
        makeObject('c', 110, 0, 20, 20),
      ];
      const result = calculateHorizontalDistribution(objects);
      expect(result!.adjustments.find((a) => a.id === 'a')?.deltaLeft).toBe(0);
    });

    it('handles objects with different widths', () => {
      const objects = [
        makeObject('a', 0, 0, 10, 20),
        makeObject('b', 50, 0, 30, 20),
        makeObject('c', 100, 0, 20, 20),
      ];
      const result = calculateHorizontalDistribution(objects);
      expect(result).not.toBeNull();
    });
  });

  describe('calculateVerticalDistribution', () => {
    it('returns null for fewer than 3 objects', () => {
      expect(calculateVerticalDistribution([makeObject('a', 0, 0, 10, 10)])).toBeNull();
      expect(calculateVerticalDistribution([])).toBeNull();
    });

    it('distributes 3 objects evenly across height', () => {
      const objects = [
        makeObject('a', 0, 0, 20, 20),
        makeObject('b', 0, 50, 20, 20),
        makeObject('c', 0, 100, 20, 20),
      ];
      const result = calculateVerticalDistribution(objects);
      expect(result).not.toBeNull();
      expect(result!.adjustments).toHaveLength(3);
    });

    it('preserves topmost object position', () => {
      const objects = [
        makeObject('a', 0, 10, 20, 20),
        makeObject('b', 0, 60, 20, 20),
        makeObject('c', 0, 110, 20, 20),
      ];
      const result = calculateVerticalDistribution(objects);
      expect(result!.adjustments.find((a) => a.id === 'a')?.deltaTop).toBe(0);
    });

    it('handles objects with different heights', () => {
      const objects = [
        makeObject('a', 0, 0, 20, 10),
        makeObject('b', 0, 50, 20, 30),
        makeObject('c', 0, 100, 20, 20),
      ];
      const result = calculateVerticalDistribution(objects);
      expect(result).not.toBeNull();
    });
  });
});
