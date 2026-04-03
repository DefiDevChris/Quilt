import { centerConfigOnPatch } from '@/lib/fussy-cut-utils';

describe('centerConfigOnPatch', () => {
  it('handles NaN fabric width', () => {
    const config = { fabricId: 'f1', offsetX: 0, offsetY: 0, rotation: 0, scale: 1 };
    const result = centerConfigOnPatch(config, [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }], NaN, 100);
    expect(result.offsetX).toBe(50);
    expect(result.offsetY).toBe(0);
  });

  it('handles Infinity fabric height', () => {
    const config = { fabricId: 'f1', offsetX: 0, offsetY: 0, rotation: 0, scale: 1 };
    const result = centerConfigOnPatch(config, [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }], 100, Infinity);
    expect(result.offsetX).toBe(0);
    expect(result.offsetY).toBe(50);
  });
});
