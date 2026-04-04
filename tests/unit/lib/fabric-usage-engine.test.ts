import { describe, it, expect } from 'vitest';
import { findFabricUsage, getCanvasFabrics } from '@/lib/fabric-usage-engine';

describe('fabric-usage-engine', () => {
  describe('findFabricUsage', () => {
    it('should handle empty object arrays', () => {
      const result = findFabricUsage([], 'fabric1', 'url1');
      expect(result.patchCount).toBe(0);
      expect(result.patches).toEqual([]);
    });

    it('should handle invalid fabric ID', () => {
      const objects = [{ id: '1', fill: '#ff0000' }];
      const result = findFabricUsage(objects, 'nonexistent', 'url');
      expect(result.patchCount).toBe(0);
    });
  });

  describe('getCanvasFabrics', () => {
    it('should handle empty arrays', () => {
      const result = getCanvasFabrics([]);
      expect(result).toEqual([]);
    });

    it('should handle objects without fabric data', () => {
      const objects = [{ id: '1', type: 'rect' }];
      const result = getCanvasFabrics(objects);
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
