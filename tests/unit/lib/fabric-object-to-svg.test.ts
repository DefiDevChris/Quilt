import { fabricObjectToSvgData } from '@/lib/fabric-object-to-svg';

describe('fabricObjectToSvgData', () => {
  it('returns null for unsupported object type', () => {
    const obj = { type: 'unsupported' };
    expect(fabricObjectToSvgData(obj)).toBe(null);
  });

  it('returns null for non-object input', () => {
    expect(fabricObjectToSvgData(null)).toBe(null);
  });

  it('returns null for group with no children', () => {
    expect(fabricObjectToSvgData({ type: 'group' })).toBe(null);
  });

  it('returns null for group with empty _objects', () => {
    expect(fabricObjectToSvgData({ type: 'group', _objects: [] })).toBe(null);
  });

  it('returns null for polygon with fewer than 3 points', () => {
    expect(fabricObjectToSvgData({ type: 'polygon', points: [{ x: 0, y: 0 }] })).toBe(null);
  });

  it('returns null for polyline with fewer than 2 points', () => {
    expect(fabricObjectToSvgData({ type: 'polyline', points: [{ x: 0, y: 0 }] })).toBe(null);
  });

  it('returns null for path with empty path array', () => {
    expect(fabricObjectToSvgData({ type: 'path', path: [] })).toBe(null);
  });
});
