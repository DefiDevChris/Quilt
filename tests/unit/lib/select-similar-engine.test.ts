import { describe, it, expect } from 'vitest';
import { findSimilarObjects, getAvailableSimilarityModes } from '@/lib/select-similar-engine';

describe('select-similar-engine', () => {
  describe('getAvailableSimilarityModes', () => {
    it('should return available similarity modes', () => {
      const mockObject = { fill: '#ff0000' };
      const modes = getAvailableSimilarityModes(mockObject);
      expect(Array.isArray(modes)).toBe(true);
    });
  });

  describe('findSimilarObjects', () => {
    it('should handle empty object arrays', () => {
      const result = findSimilarObjects([], 'color' as any, 'fillColor' as any);
      expect(result).toEqual([]);
    });

    it('should handle invalid similarity modes', () => {
      const objects = [{ id: '1', fill: '#ff0000' }];
      const result = findSimilarObjects(objects, 'invalid' as any, 'fillColor' as any);
      expect(result).toEqual([]);
    });
  });
});
