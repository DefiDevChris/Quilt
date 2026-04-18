import { describe, it, expect } from 'vitest';
import { getDefaultLayoutConfig, DEFAULT_QUILT_LAYOUT } from '@/lib/default-layout';

describe('default-layout', () => {
  describe('getDefaultLayoutConfig', () => {
    it('returns 4x4 grid configuration', () => {
      const config = getDefaultLayoutConfig();

      expect(config.rows).toBe(4);
      expect(config.cols).toBe(4);
    });

    it('returns block size of 12 inches', () => {
      const config = getDefaultLayoutConfig();

      expect(config.blockSize).toBe(12);
    });

    it('returns throw-size canvas dimensions (72x72 inches)', () => {
      const config = getDefaultLayoutConfig();

      expect(config.canvasWidth).toBe(72);
      expect(config.canvasHeight).toBe(72);
    });

    it('returns no sashing (width 0)', () => {
      const config = getDefaultLayoutConfig();

      expect(config.sashing.width).toBe(0);
    });

    it('returns no borders (empty array)', () => {
      const config = getDefaultLayoutConfig();

      expect(config.borders).toEqual([]);
    });

    it('returns no cornerstones', () => {
      const config = getDefaultLayoutConfig();

      expect(config.hasCornerstones).toBe(false);
    });

    it('returns binding width of 0.25 inches', () => {
      const config = getDefaultLayoutConfig();

      expect(config.bindingWidth).toBe(0.25);
    });

    it('returns grid layout type', () => {
      const config = getDefaultLayoutConfig();

      expect(config.layoutType).toBe('grid');
    });

    it('returns a copy of the default config (immutable)', () => {
      const config1 = getDefaultLayoutConfig();
      const config2 = getDefaultLayoutConfig();

      // They should be equal in value
      expect(config1).toEqual(config2);

      // But different objects (not same reference)
      expect(config1).not.toBe(config2);

      // Modifying one should not affect the other
      config1.rows = 10;
      expect(config2.rows).toBe(4);
    });
  });

  describe('DEFAULT_QUILT_LAYOUT', () => {
    it('is exported and contains expected values', () => {
      expect(DEFAULT_QUILT_LAYOUT).toBeDefined();
      expect(DEFAULT_QUILT_LAYOUT.rows).toBe(4);
      expect(DEFAULT_QUILT_LAYOUT.cols).toBe(4);
      expect(DEFAULT_QUILT_LAYOUT.blockSize).toBe(12);
      expect(DEFAULT_QUILT_LAYOUT.canvasWidth).toBe(72);
      expect(DEFAULT_QUILT_LAYOUT.canvasHeight).toBe(72);
    });
  });
});
