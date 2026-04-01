import { describe, it, expect } from 'vitest';
import { computeResize } from '@/lib/resize-utils';

describe('computeResize', () => {
  const mockObjects = [
    {
      id: 'obj1',
      left: 10,
      top: 10,
      scaleX: 1,
      scaleY: 1,
      width: 20,
      height: 20,
      type: 'rect',
    },
  ];

  describe('add-blocks mode with null layoutSettings', () => {
    it('returns early when layoutSettings is null', () => {
      const result = computeResize({
        currentWidth: 100,
        currentHeight: 100,
        newWidth: 200,
        newHeight: 200,
        mode: 'add-blocks',
        lockAspectRatio: false,
        layoutType: 'grid',
        layoutSettings: null,
        objects: mockObjects,
        tilePattern: false,
      });

      expect(result.layoutSettings).toBeNull();
      expect(result.addedCells).toEqual([]);
    });
  });

  describe('tilePattern logic', () => {
    it('calculates sourceObjectIds for added cells when tilePattern is true', () => {
      const result = computeResize({
        currentWidth: 100,
        currentHeight: 100,
        newWidth: 200,
        newHeight: 200,
        mode: 'add-blocks',
        lockAspectRatio: false,
        layoutType: 'grid',
        layoutSettings: { rows: 1, cols: 1, blockSize: 50 },
        objects: mockObjects,
        tilePattern: true,
      });

      expect(result.addedCells.length).toBe(15);
      expect(result.addedCells.some(cell => cell.sourceObjectIds.includes('obj1'))).toBe(true);
    });
  });

  describe('lockAspectRatio with zero currentHeight', () => {
    it('throws error when currentHeight is zero and lockAspectRatio is true', () => {
      expect(() => {
        computeResize({
          currentWidth: 100,
          currentHeight: 0,
          newWidth: 200,
          newHeight: 200,
          mode: 'scale',
          lockAspectRatio: true,
          layoutType: 'free-form',
          layoutSettings: null,
          objects: mockObjects,
          tilePattern: false,
        });
      }).toThrow('Cannot resize with zero current height when aspect ratio is locked');
    });
  });
});