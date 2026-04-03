import { polylineBoundingBox } from '@/lib/bin-packer';

describe('polylineBoundingBox', () => {
  it('returns zeros for empty points', () => {
    const result = polylineBoundingBox([]);
    expect(result).toEqual({ width: 0, height: 0, minX: 0, minY: 0 });
  });
});
