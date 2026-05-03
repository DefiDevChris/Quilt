import { isQuiltingCotton } from '@/lib/affiliate/ingest/filter';
import type { RawProduct } from '@/lib/affiliate/ingest/types';

function makeRaw(overrides: Partial<RawProduct> = {}): RawProduct {
  return {
    externalId: 'SKU123',
    externalUrl: 'https://example.com',
    name: 'Kona Cotton Snow',
    imageUrl: 'https://img.example.com/fabric.jpg',
    price: 12.5,
    currency: 'USD',
    inStock: true,
    ...overrides,
  };
}

describe('isQuiltingCotton', () => {
  describe('fat-quarter-shop', () => {
    it('accepts yardage products', () => {
      expect(isQuiltingCotton(makeRaw({ category: 'Yardage' }), 'fat-quarter-shop')).toBe(true);
    });

    it('accepts pre-cuts', () => {
      expect(isQuiltingCotton(makeRaw({ category: 'Pre-Cuts' }), 'fat-quarter-shop')).toBe(true);
    });

    it('accepts batiks', () => {
      expect(isQuiltingCotton(makeRaw({ category: 'Batiks' }), 'fat-quarter-shop')).toBe(true);
    });

    it('rejects Pattern in title', () => {
      expect(isQuiltingCotton(makeRaw({ name: 'Quilt Pattern - Stars' }), 'fat-quarter-shop')).toBe(false);
    });

    it('rejects Book in title', () => {
      expect(isQuiltingCotton(makeRaw({ name: 'Sewing Book - Modern Quilts' }), 'fat-quarter-shop')).toBe(false);
    });

    it('rejects Thread in title', () => {
      expect(isQuiltingCotton(makeRaw({ name: 'Aurifil Thread 50wt' }), 'fat-quarter-shop')).toBe(false);
    });

    it('rejects Notion in title', () => {
      expect(isQuiltingCotton(makeRaw({ name: 'Quilting Notion - Seam Roller' }), 'fat-quarter-shop')).toBe(false);
    });

    it('rejects Ruler in title', () => {
      expect(isQuiltingCotton(makeRaw({ name: 'Quilt Ruler 6.5x24' }), 'fat-quarter-shop')).toBe(false);
    });

    it('rejects Batting in title', () => {
      expect(isQuiltingCotton(makeRaw({ name: 'Warm and Natural Batting' }), 'fat-quarter-shop')).toBe(false);
    });
  });

  describe('connecting-threads', () => {
    it('accepts quilting fabric', () => {
      expect(isQuiltingCotton(makeRaw({ category: 'Quilting Fabric' }), 'connecting-threads')).toBe(true);
    });

    it('accepts cotton fabric', () => {
      expect(isQuiltingCotton(makeRaw({ category: 'Cotton Fabric' }), 'connecting-threads')).toBe(true);
    });

    it('rejects Pattern in title', () => {
      expect(isQuiltingCotton(makeRaw({ name: 'Table Runner Pattern' }), 'connecting-threads')).toBe(false);
    });

    it('rejects Class in title', () => {
      expect(isQuiltingCotton(makeRaw({ name: 'Online Class - Paper Piecing' }), 'connecting-threads')).toBe(false);
    });

    it('rejects Marker in title', () => {
      expect(isQuiltingCotton(makeRaw({ name: 'Fabric Marker - Blue' }), 'connecting-threads')).toBe(false);
    });
  });

  it('passes unknown retailers through', () => {
    expect(isQuiltingCotton(makeRaw(), 'unknown-retailer')).toBe(true);
  });
});
