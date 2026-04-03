import { describe, it, expect } from 'vitest';
import {
  normalizeColor,
  spraycanRecolor,
  swapColors,
  randomizeColors,
  extractUniquePalette,
  generateColorScheme,
  suggestPalette,
  type PatchColor,
  type ColorChange,
} from '@/lib/colortheme-utils';

describe('colortheme-utils', () => {
  describe('normalizeColor', () => {
    it('normalizes 3-digit hex', () => {
      expect(normalizeColor('#fff')).toBe('#ffffff');
    });

    it('normalizes 6-digit hex', () => {
      expect(normalizeColor('#FF0000')).toBe('#ff0000');
    });

    it('adds hash if missing', () => {
      expect(normalizeColor('ff0000')).toBe('#ff0000');
    });

    it('returns black for invalid input', () => {
      expect(normalizeColor('invalid')).toBe('#000000');
      expect(normalizeColor('#xyz')).toBe('#000000');
      expect(normalizeColor('')).toBe('#000000');
    });
  });

  describe('spraycanRecolor', () => {
    it('recolors matching patches', () => {
      const patches: PatchColor[] = [
        { objectId: '1', currentFill: '#ff0000' },
        { objectId: '2', currentFill: '#0000ff' },
        { objectId: '3', currentFill: '#ff0000' },
      ];
      const result = spraycanRecolor(patches, '#ff0000', '#00ff00');
      expect(result).toHaveLength(2);
      expect(result.map((c) => c.newFill)).toEqual(['#00ff00', '#00ff00']);
    });
  });

  describe('swapColors', () => {
    it('swaps colors bidirectionally', () => {
      const patches: PatchColor[] = [
        { objectId: '1', currentFill: '#ff0000' },
        { objectId: '2', currentFill: '#0000ff' },
        { objectId: '3', currentFill: '#ff0000' },
      ];
      const result = swapColors(patches, '#ff0000', '#0000ff');
      expect(result).toHaveLength(3);
    });
  });

  describe('randomizeColors', () => {
    it('returns unchanged patches when palette is empty', () => {
      const patches: PatchColor[] = [
        { objectId: '1', currentFill: '#ff0000' },
        { objectId: '2', currentFill: '#0000ff' },
      ];
      const result = randomizeColors(patches, []);
      expect(result.map((c) => c.objectId)).toEqual(['1', '2']);
    });

    it('uses seed for deterministic output', () => {
      const patches: PatchColor[] = [{ objectId: '1', currentFill: '#ff0000' }];
      const result1 = randomizeColors(patches, ['#ff0000', '#00ff00'], 42);
      const result2 = randomizeColors(patches, ['#ff0000', '#00ff00'], 42);
      expect(result1[0].newFill).toBe(result2[0].newFill);
    });
  });

  describe('extractUniquePalette', () => {
    it('deduplicates colors', () => {
      const patches: PatchColor[] = [
        { objectId: '1', currentFill: '#ff0000' },
        { objectId: '2', currentFill: '#00ff00' },
        { objectId: '3', currentFill: '#ff0000' },
      ];
      const result = extractUniquePalette(patches);
      expect(result).toHaveLength(2);
    });
  });

  describe('generateColorScheme', () => {
    it('generates monochromatic scheme', () => {
      const result = generateColorScheme('#ff0000', 'monochromatic', 3);
      expect(result).toHaveLength(3);
    });

    it('handles invalid count', () => {
      const result = generateColorScheme('#ff0000', 'monochromatic', 0);
      expect(result.length).toBeGreaterThan(0);
    });

    it('handles negative count', () => {
      const result = generateColorScheme('#ff0000', 'monochromatic', -5);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('suggestPalette', () => {
    it('returns default scheme for empty palette', () => {
      const result = suggestPalette([], 'monochromatic', 3);
      expect(result).toHaveLength(3);
    });

    it('uses first color as base', () => {
      const result = suggestPalette(['#0000ff'], 'analogous', 3);
      expect(result[0]).toBe('#0000ff');
    });
  });
});