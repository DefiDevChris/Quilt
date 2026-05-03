import { extractManufacturer, extractCollection } from '@/lib/affiliate/classifier';

describe('extractManufacturer', () => {
  it('detects Moda in product name', () => {
    expect(extractManufacturer('Moda Grunge Basics')).toBe('Moda');
  });

  it('detects Free Spirit', () => {
    expect(extractManufacturer('Free Spirit Tula Pink Daydreamer')).toBe('Free Spirit');
  });

  it('detects Robert Kaufman', () => {
    expect(extractManufacturer('Robert Kaufman Kona Cotton')).toBe('Robert Kaufman');
  });

  it('detects Tula Pink as Free Spirit', () => {
    expect(extractManufacturer('Tula Pink Daydreamer')).toBe('Free Spirit');
  });

  it('detects Connecting Threads', () => {
    expect(extractManufacturer('Connecting Threads Spectrum')).toBe('Connecting Threads');
  });

  it('returns null for unknown manufacturer', () => {
    expect(extractManufacturer('Random Fabric Name')).toBeNull();
  });
});

describe('extractCollection', () => {
  it('extracts collection after manufacturer using dash', () => {
    const result = extractCollection('Moda Grunge Basics - Cream', 'Moda');
    expect(result).toBe('Grunge Basics');
  });

  it('extracts collection using colon separator', () => {
    const result = extractCollection('Kona Cotton: Snow', null);
    expect(result).toBe('Kona Cotton');
  });

  it('returns null when no separator found', () => {
    const result = extractCollection('SingleWordName', null);
    expect(result).toBeNull();
  });
});
