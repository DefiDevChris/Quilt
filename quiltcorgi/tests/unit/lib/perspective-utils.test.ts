import { sortCornersClockwise } from '@/lib/perspective-utils';

describe('sortCornersClockwise', () => {
  it('returns null for degenerate corners (45 degree rotation)', () => {
    const corners: [any, any, any, any] = [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 1 },
      { x: 0, y: 0 },
    ];
    expect(sortCornersClockwise(corners)).toBe(null);
  });
});
