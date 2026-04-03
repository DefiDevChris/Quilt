import {
  polylineBoundingBox,
  packItems,
  PAPER_LETTER,
  PAPER_A4,
  type PackResult,
} from '@/lib/bin-packer';

describe('polylineBoundingBox', () => {
  it('returns zeros for empty points', () => {
    const result = polylineBoundingBox([]);
    expect(result.width).toBe(0);
    expect(result.height).toBe(0);
    expect(result.minX).toBe(0);
    expect(result.minY).toBe(0);
  });

  it('computes bounding box for simple rectangle', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 5 },
      { x: 0, y: 5 },
    ];
    const result = polylineBoundingBox(points);
    expect(result.width).toBe(10);
    expect(result.height).toBe(5);
    expect(result.minX).toBe(0);
    expect(result.minY).toBe(0);
  });

  it('handles negative coordinates', () => {
    const points = [
      { x: -5, y: -10 },
      { x: 5, y: -10 },
      { x: 5, y: 10 },
      { x: -5, y: 10 },
    ];
    const result = polylineBoundingBox(points);
    expect(result.width).toBe(10);
    expect(result.height).toBe(20);
    expect(result.minX).toBe(-5);
    expect(result.minY).toBe(-10);
  });
});

describe('packItems', () => {
  it('returns empty result for empty items', () => {
    const result = packItems([], PAPER_LETTER);
    expect(result.items).toHaveLength(0);
    expect(result.totalPages).toBe(1);
  });

  it('places single item at origin', () => {
    const result = packItems([{ width: 2, height: 3, quantity: 1, itemIndex: 0 }], PAPER_LETTER);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].x).toBe(0);
    expect(result.items[0].y).toBe(0);
    expect(result.items[0].page).toBe(0);
  });

  it('respects paper dimensions', () => {
    const result = packItems([{ width: 10, height: 10, quantity: 1, itemIndex: 0 }], PAPER_LETTER);
    expect(result.items).toHaveLength(0); // Won't fit
  });

  it('expands items by quantity', () => {
    const result = packItems([{ width: 1, height: 1, quantity: 3, itemIndex: 0 }], PAPER_LETTER);
    expect(result.items).toHaveLength(3);
  });

  it('uses PAPER_LETTER config', () => {
    expect(PAPER_LETTER.usableWidth).toBe(7.5);
    expect(PAPER_LETTER.usableHeight).toBe(10);
  });

  it('uses PAPER_A4 config', () => {
    expect(PAPER_A4.usableWidth).toBeCloseTo(7.268);
    expect(PAPER_A4.usableHeight).toBeCloseTo(10.693);
  });
});
