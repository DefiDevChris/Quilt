import { extractDominantColors, extractBlockColors } from '@/lib/ocr/color-extraction';

describe('extractDominantColors', () => {
  it('returns empty array for all transparent pixels', () => {
    const pixelData = new Uint8ClampedArray([0, 0, 0, 0, 0, 0, 0, 0]);
    const result = extractDominantColors(pixelData, 5);
    expect(result).toEqual([]);
  });

  it('extracts dominant colors from opaque pixels', () => {
    const pixelData = new Uint8ClampedArray([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255]);
    const result = extractDominantColors(pixelData, 2);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('hex');
    expect(result[0]).toHaveProperty('percentage');
  });
});

describe('extractBlockColors', () => {
  it('extracts colors for multiple regions', () => {
    const regions = [
      { row: 0, col: 0, pixelData: new Uint8ClampedArray([255, 0, 0, 255]) },
      { row: 0, col: 1, pixelData: new Uint8ClampedArray([0, 255, 0, 255]) },
    ];
    const result = extractBlockColors(regions, 3);
    expect(result.length).toBe(2);
    expect(result[0].row).toBe(0);
    expect(result[0].col).toBe(0);
  });
});
