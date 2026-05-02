import { describe, it, expect } from 'vitest';
import { snapToCell, snapToGridCorner } from '@/lib/snap-utils';

describe('snap-utils', () => {
  describe('snapToCell', () => {
    it('should snap to cell when within tolerance', () => {
      const cells = [
        { x: 100, y: 100, width: 50, height: 50, id: 'cell1' },
        { x: 200, y: 100, width: 50, height: 50, id: 'cell2' },
      ];

      const result = snapToCell({ x: 110, y: 110 }, cells, 0.25);
      expect(result).toEqual({ x: 100, y: 100, width: 50, height: 50, id: 'cell1' });
    });

    it('should return null when outside tolerance', () => {
      const cells = [{ x: 100, y: 100, width: 50, height: 50, id: 'cell1' }];

      const result = snapToCell({ x: 200, y: 200 }, cells, 0.25);
      expect(result).toBeNull();
    });
  });

  describe('snapToGridCorner', () => {
    it('should snap to grid corner at 1" granularity', () => {
      // 96 pixels per inch * 1 * 1 zoom = 96px grid
      const result = snapToGridCorner({ x: 50, y: 50 }, 1, 1);
      expect(result).toEqual({ x: 96, y: 96 }); // Rounded to nearest 96px
    });

    it('should snap to grid corner at 0.5" granularity', () => {
      // 96 pixels per inch * 0.5 * 1 zoom = 48px grid
      const result = snapToGridCorner({ x: 50, y: 50 }, 0.5, 1);
      expect(result).toEqual({ x: 48, y: 48 }); // Rounded to nearest 48px
    });

    it('should snap to grid corner at 0.25" granularity', () => {
      // 96 pixels per inch * 0.25 * 1 zoom = 24px grid
      const result = snapToGridCorner({ x: 25, y: 25 }, 0.25, 1);
      expect(result).toEqual({ x: 24, y: 24 }); // Rounded to nearest 24px
    });
  });

});
