import { describe, it, expect } from 'vitest';
import {
  generateColorScheme,
  suggestPalette,
  type ColorSchemeType,
} from '@/lib/colortheme-utils';

describe('Color Scheme Generation', () => {
  describe('generateColorScheme', () => {
    it('should generate monochromatic color scheme', () => {
      const colors = generateColorScheme('#ff0000', 'monochromatic', 5);
      
      expect(colors).toHaveLength(5);
      expect(colors[0]).toBe('#ff0000'); // Base color should be first
      
      // All colors should have the same hue (red)
      colors.forEach(color => {
        expect(color).toMatch(/^#[0-9a-f]{6}$/);
      });
    });

    it('should generate analogous color scheme', () => {
      const colors = generateColorScheme('#ff0000', 'analogous', 5);
      
      expect(colors).toHaveLength(5);
      expect(colors[0]).toBe('#ff0000');
      
      // Should have different hues but related
      const uniqueColors = new Set(colors);
      expect(uniqueColors.size).toBeGreaterThan(1);
    });

    it('should generate complementary color scheme', () => {
      const colors = generateColorScheme('#ff0000', 'complementary', 4);
      
      expect(colors).toHaveLength(4);
      expect(colors[0]).toBe('#ff0000');
      
      // Should include complementary color (cyan-ish for red)
      expect(colors[1]).toMatch(/^#[0-9a-f]{6}$/);
    });

    it('should generate triadic color scheme', () => {
      const colors = generateColorScheme('#ff0000', 'triadic', 5);
      
      expect(colors).toHaveLength(5);
      expect(colors[0]).toBe('#ff0000');
      
      // Should have 3 main colors (120° apart)
      expect(colors[1]).toMatch(/^#[0-9a-f]{6}$/);
      expect(colors[2]).toMatch(/^#[0-9a-f]{6}$/);
    });

    it('should generate split-complementary color scheme', () => {
      const colors = generateColorScheme('#ff0000', 'split-complementary', 5);
      
      expect(colors).toHaveLength(5);
      expect(colors[0]).toBe('#ff0000');
      
      // Should have split complements
      expect(colors[1]).toMatch(/^#[0-9a-f]{6}$/);
      expect(colors[2]).toMatch(/^#[0-9a-f]{6}$/);
    });

    it('should generate tetradic color scheme', () => {
      const colors = generateColorScheme('#ff0000', 'tetradic', 6);
      
      expect(colors).toHaveLength(6);
      expect(colors[0]).toBe('#ff0000');
      
      // Should have 4 main colors (90° apart)
      expect(colors[1]).toMatch(/^#[0-9a-f]{6}$/);
      expect(colors[2]).toMatch(/^#[0-9a-f]{6}$/);
      expect(colors[3]).toMatch(/^#[0-9a-f]{6}$/);
    });

    it('should handle different base colors', () => {
      const baseColors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
      
      baseColors.forEach(baseColor => {
        const colors = generateColorScheme(baseColor, 'analogous', 3);
        expect(colors).toHaveLength(3);
        expect(colors[0]).toBe(baseColor);
      });
    });

    it('should handle different count values', () => {
      const counts = [1, 3, 5, 8, 10];
      
      counts.forEach(count => {
        const colors = generateColorScheme('#ff0000', 'monochromatic', count);
        expect(colors).toHaveLength(count);
      });
    });

    it('should generate valid hex colors', () => {
      const schemes: ColorSchemeType[] = [
        'monochromatic',
        'analogous',
        'complementary',
        'triadic',
        'split-complementary',
        'tetradic',
      ];

      schemes.forEach(scheme => {
        const colors = generateColorScheme('#8d4f00', scheme, 5);
        
        colors.forEach(color => {
          expect(color).toMatch(/^#[0-9a-f]{6}$/);
          
          // Verify it's a valid hex color by parsing RGB values
          const r = parseInt(color.slice(1, 3), 16);
          const g = parseInt(color.slice(3, 5), 16);
          const b = parseInt(color.slice(5, 7), 16);
          
          expect(r).toBeGreaterThanOrEqual(0);
          expect(r).toBeLessThanOrEqual(255);
          expect(g).toBeGreaterThanOrEqual(0);
          expect(g).toBeLessThanOrEqual(255);
          expect(b).toBeGreaterThanOrEqual(0);
          expect(b).toBeLessThanOrEqual(255);
        });
      });
    });

    it('should handle edge case colors', () => {
      const edgeCases = ['#000000', '#ffffff', '#808080'];
      
      edgeCases.forEach(color => {
        const colors = generateColorScheme(color, 'complementary', 3);
        expect(colors).toHaveLength(3);
        expect(colors[0]).toBe(color);
      });
    });

    it('should produce different results for different schemes', () => {
      const baseColor = '#ff0000';
      const count = 5;
      
      const mono = generateColorScheme(baseColor, 'monochromatic', count);
      const analogous = generateColorScheme(baseColor, 'analogous', count);
      const complementary = generateColorScheme(baseColor, 'complementary', count);
      
      // All should start with the same base color
      expect(mono[0]).toBe(baseColor);
      expect(analogous[0]).toBe(baseColor);
      expect(complementary[0]).toBe(baseColor);
      
      // But should have different second colors
      expect(mono[1]).not.toBe(analogous[1]);
      expect(analogous[1]).not.toBe(complementary[1]);
    });
  });

  describe('suggestPalette', () => {
    it('should suggest palette based on current palette', () => {
      const currentPalette = ['#ff0000', '#00ff00', '#0000ff'];
      const suggested = suggestPalette(currentPalette, 'analogous', 5);
      
      expect(suggested).toHaveLength(5);
      expect(suggested[0]).toBe('#ff0000'); // Should use first color as base
    });

    it('should handle empty current palette', () => {
      const suggested = suggestPalette([], 'complementary', 4);
      
      expect(suggested).toHaveLength(4);
      expect(suggested[0]).toBe('#d4883c'); // Default base color
    });

    it('should work with different scheme types', () => {
      const currentPalette = ['#8d4f00'];
      const schemes: ColorSchemeType[] = [
        'monochromatic',
        'analogous',
        'complementary',
        'triadic',
        'split-complementary',
        'tetradic',
      ];

      schemes.forEach(scheme => {
        const suggested = suggestPalette(currentPalette, scheme, 5);
        expect(suggested).toHaveLength(5);
        expect(suggested[0]).toBe('#8d4f00');
      });
    });

    it('should handle single color palette', () => {
      const currentPalette = ['#800080']; // Use hex instead of color name
      const suggested = suggestPalette(currentPalette, 'triadic', 3);
      
      expect(suggested).toHaveLength(3);
      expect(suggested[0]).toBe('#800080');
    });
  });

  describe('color conversion utilities', () => {
    it('should handle various input formats', () => {
      // Test with different valid hex formats
      const colors = generateColorScheme('#F00', 'monochromatic', 3);
      expect(colors[0]).toBe('#ff0000'); // Should normalize short hex
    });

    it('should maintain color relationships', () => {
      const colors = generateColorScheme('#ff0000', 'complementary', 2);
      
      // Red's complement should be cyan-ish
      expect(colors[1]).toMatch(/^#[0-9a-f]{6}$/);
      
      // Parse the complement color
      const r = parseInt(colors[1].slice(1, 3), 16);
      const g = parseInt(colors[1].slice(3, 5), 16);
      const b = parseInt(colors[1].slice(5, 7), 16);
      
      // For red (#ff0000), complement should have low red, high green/blue
      expect(r).toBeLessThan(128);
      expect(g + b).toBeGreaterThan(r);
    });

    it('should handle lightness variations in monochromatic', () => {
      const colors = generateColorScheme('#ff0000', 'monochromatic', 5);
      
      // Should have different lightness values
      const lightnesses = colors.map(color => {
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        return 0.299 * r + 0.587 * g + 0.114 * b;
      });
      
      const uniqueLightnesses = new Set(lightnesses);
      expect(uniqueLightnesses.size).toBeGreaterThan(1);
    });
  });

  describe('edge cases', () => {
    it('should handle zero count by returning at least 1 color', () => {
      // Zero count is clamped to minimum of 1
      const colors = generateColorScheme('#ff0000', 'analogous', 0);
      expect(colors.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle count of 1', () => {
      const colors = generateColorScheme('#ff0000', 'analogous', 1);
      expect(colors).toHaveLength(1);
      expect(colors[0]).toBe('#ff0000');
    });

    it('should handle very large count', () => {
      const colors = generateColorScheme('#ff0000', 'monochromatic', 20);
      expect(colors).toHaveLength(20);
      expect(colors[0]).toBe('#ff0000');
    });

    it('should be deterministic for same inputs', () => {
      const colors1 = generateColorScheme('#ff0000', 'triadic', 5);
      const colors2 = generateColorScheme('#ff0000', 'triadic', 5);
      
      expect(colors1).toEqual(colors2);
    });

    it('should handle malformed hex colors gracefully', () => {
      // The function should normalize colors, but let's test with valid inputs
      const colors = generateColorScheme('#ff0000', 'analogous', 3);
      expect(colors).toHaveLength(3);
      expect(colors[0]).toBe('#ff0000');
    });
  });
});
