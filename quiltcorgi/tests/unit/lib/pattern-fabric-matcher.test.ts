import { matchPatternFabrics, inferColorHex, levenshteinDistance } from '@/lib/pattern-fabric-matcher';
import type { ParsedFabric } from '@/lib/pattern-parser-types';
import type { FabricRecord } from '@/lib/pattern-fabric-matcher';

describe('matchPatternFabrics', () => {
  const dbFabrics: FabricRecord[] = [
    { id: '1', name: 'Blue Sky', manufacturer: 'Moda', sku: 'BS-001', collection: 'Nature', colorFamily: 'Blue' },
    { id: '2', name: 'Red Rose', manufacturer: null, sku: null, collection: null, colorFamily: 'Red' },
  ];

  it('returns null for color family match when no family found', () => {
    const patternFabrics: ParsedFabric[] = [
      { label: 'Fabric A', name: 'Unknown Color', sku: null, colorFamily: 'NonExistent' },
    ];
    const results = matchPatternFabrics(patternFabrics, dbFabrics);
    expect(results[0].matchMethod).toBe('none');
  });

  it('matches by collection name', () => {
    const patternFabrics: ParsedFabric[] = [
      { label: 'Fabric A', name: 'Nature Blue Sky', sku: null, colorFamily: null },
    ];
    const results = matchPatternFabrics(patternFabrics, dbFabrics);
    expect(results[0].matchMethod).toBe('name');
  });

  it('returns null for name match when distance > 3', () => {
    const patternFabrics: ParsedFabric[] = [
      { label: 'Fabric A', name: 'Xylophone Zebra Quantum', sku: null, colorFamily: null },
    ];
    const results = matchPatternFabrics(patternFabrics, dbFabrics);
    expect(results[0].matchMethod).toBe('none');
  });
});

describe('inferColorHex', () => {
  it('returns default hex for unknown color', () => {
    expect(inferColorHex('Unknown Fabric', 'NonExistent')).toBe('#888888');
  });
});

describe('levenshteinDistance', () => {
  it('returns 0 for empty strings', () => {
    expect(levenshteinDistance('', '')).toBe(0);
  });

  it('returns length for one empty string', () => {
    expect(levenshteinDistance('abc', '')).toBe(3);
    expect(levenshteinDistance('', 'abc')).toBe(3);
  });
});
