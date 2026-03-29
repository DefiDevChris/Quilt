import { describe, it, expect } from 'vitest';
import {
  levenshteinDistance,
  inferColorHex,
  matchPatternFabrics,
} from '@/lib/pattern-fabric-matcher';
import type { FabricRecord } from '@/lib/pattern-fabric-matcher';
import type { ParsedFabric } from '@/lib/pattern-parser-types';

// ── Test Fixtures ─────────────────────────────────────────────────

function makeParsedFabric(
  overrides: Partial<ParsedFabric> & { label: string; name: string }
): ParsedFabric {
  return {
    role: 'background',
    yardage: 1,
    ...overrides,
  };
}

function makeFabricRecord(
  overrides: Partial<FabricRecord> & { id: string; name: string }
): FabricRecord {
  return {
    manufacturer: null,
    sku: null,
    collection: null,
    colorFamily: null,
    ...overrides,
  };
}

describe('pattern-fabric-matcher', () => {
  describe('levenshteinDistance', () => {
    it('returns 0 for identical strings', () => {
      expect(levenshteinDistance('kitten', 'kitten')).toBe(0);
    });

    it('returns 1 for a single character difference', () => {
      expect(levenshteinDistance('cat', 'bat')).toBe(1);
    });

    it('returns max(len) for completely different strings', () => {
      expect(levenshteinDistance('abc', 'xyz')).toBe(3);
    });

    it('handles empty first string', () => {
      expect(levenshteinDistance('', 'hello')).toBe(5);
    });

    it('handles empty second string', () => {
      expect(levenshteinDistance('hello', '')).toBe(5);
    });

    it('handles both strings empty', () => {
      expect(levenshteinDistance('', '')).toBe(0);
    });

    it('is symmetric', () => {
      expect(levenshteinDistance('kitten', 'sitting')).toBe(
        levenshteinDistance('sitting', 'kitten')
      );
    });
  });

  describe('inferColorHex', () => {
    it('returns correct hex for "Red"', () => {
      const hex = inferColorHex('Crimson Red Dot');
      // Should match "crimson" (longer match) or "red" — both are red-family
      expect(hex).toMatch(/^#[0-9a-f]{6}$/);
      expect(hex).not.toBe('#888888');
    });

    it('returns navy hex for fabric name containing "Navy"', () => {
      expect(inferColorHex('Navy Stripe')).toBe('#000080');
    });

    it('falls back to color family when name has no color keyword', () => {
      // "Sugarberry" contains "berry" which matches a known color name,
      // so use a name with no embedded color words to test family fallback
      expect(inferColorHex('Sparkle Texture', 'Blue')).toBe('#4169e1');
    });

    it('returns default #888888 for unknown name and no family', () => {
      expect(inferColorHex('Mystery Fabric XYZ')).toBe('#888888');
    });

    it('is case-insensitive for color name lookup', () => {
      // "navy" should be found in "NAVY FLORAL" (lowercased)
      expect(inferColorHex('NAVY FLORAL')).toBe('#000080');
    });

    it('prefers longer color names (e.g., "hot pink" over "pink")', () => {
      const hex = inferColorHex('Hot Pink Chevron');
      expect(hex).toBe('#ff69b4');
    });

    it('falls back to color family hex when name has no match', () => {
      expect(inferColorHex('Speckled Fabric', 'Green')).toBe('#228b22');
    });
  });

  describe('matchPatternFabrics', () => {
    const dbFabrics: FabricRecord[] = [
      makeFabricRecord({
        id: 'fab-1',
        name: 'Sugarberry Cream',
        sku: 'AB-1234',
        colorFamily: 'Neutral',
      }),
      makeFabricRecord({
        id: 'fab-2',
        name: 'Century Red Dot',
        sku: 'CS-5678',
        colorFamily: 'Red',
      }),
      makeFabricRecord({
        id: 'fab-3',
        name: 'Navy Texture',
        sku: null,
        colorFamily: 'Blue',
      }),
    ];

    it('returns confidence 1.0 and method "sku" for exact SKU match', () => {
      const fabrics: ParsedFabric[] = [
        makeParsedFabric({
          label: 'A',
          name: 'Sugarberry Cream',
          sku: 'AB-1234',
        }),
      ];

      const results = matchPatternFabrics(fabrics, dbFabrics);
      expect(results).toHaveLength(1);
      expect(results[0].confidence).toBe(1.0);
      expect(results[0].matchMethod).toBe('sku');
      expect(results[0].matchedFabricId).toBe('fab-1');
    });

    it('matches SKU case-insensitively and ignoring whitespace', () => {
      const fabrics: ParsedFabric[] = [
        makeParsedFabric({
          label: 'A',
          name: 'Some Fabric',
          sku: 'ab 1234',
        }),
      ];

      const results = matchPatternFabrics(fabrics, dbFabrics);
      expect(results[0].confidence).toBe(1.0);
      expect(results[0].matchMethod).toBe('sku');
      expect(results[0].matchedFabricId).toBe('fab-1');
    });

    it('uses fuzzy name match for close names', () => {
      const fabrics: ParsedFabric[] = [
        makeParsedFabric({
          label: 'B',
          name: 'Century Red Dott', // 1 edit distance
        }),
      ];

      const results = matchPatternFabrics(fabrics, dbFabrics);
      expect(results[0].matchMethod).toBe('name');
      expect(results[0].confidence).toBeGreaterThan(0.5);
      expect(results[0].confidence).toBeLessThanOrEqual(0.9);
      expect(results[0].matchedFabricId).toBe('fab-2');
    });

    it('uses color family fallback when no SKU or name match', () => {
      const fabrics: ParsedFabric[] = [
        makeParsedFabric({
          label: 'C',
          name: 'Totally Different Name',
          colorFamily: 'Blue',
        }),
      ];

      // db has fab-3 with colorFamily "Blue"
      const results = matchPatternFabrics(fabrics, dbFabrics);
      expect(results[0].matchMethod).toBe('color-family');
      expect(results[0].confidence).toBe(0.4);
      expect(results[0].matchedFabricId).toBe('fab-3');
    });

    it('returns confidence 0 and method "none" when nothing matches', () => {
      const fabrics: ParsedFabric[] = [
        makeParsedFabric({
          label: 'D',
          name: 'Zyxwvutsrqp',
        }),
      ];

      const results = matchPatternFabrics(fabrics, dbFabrics);
      expect(results[0].matchMethod).toBe('none');
      expect(results[0].confidence).toBe(0);
      expect(results[0].matchedFabricId).toBeNull();
    });

    it('returns empty results for empty fabric lists', () => {
      const results = matchPatternFabrics([], dbFabrics);
      expect(results).toEqual([]);
    });

    it('returns no-match results when db fabrics list is empty', () => {
      const fabrics: ParsedFabric[] = [
        makeParsedFabric({ label: 'E', name: 'Any Fabric', sku: 'XX-9999' }),
      ];

      const results = matchPatternFabrics(fabrics, []);
      expect(results).toHaveLength(1);
      expect(results[0].matchMethod).toBe('none');
      expect(results[0].confidence).toBe(0);
    });
  });
});
