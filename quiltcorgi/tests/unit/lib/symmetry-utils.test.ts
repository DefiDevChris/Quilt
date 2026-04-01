import { computeTransforms, applyTransform } from '@/lib/symmetry-utils';
import type { SymmetryConfig, SerializedObject } from '@/lib/symmetry-utils';

describe('computeTransforms', () => {
  it('returns empty array for diagonal with zero width', () => {
    const config: SymmetryConfig = { type: 'diagonal', foldCount: 2, canvasWidth: 0, canvasHeight: 100 };
    expect(computeTransforms(config)).toEqual([]);
  });

  it('returns empty array for unknown type', () => {
    const config = { type: 'unknown', foldCount: 2, canvasWidth: 100, canvasHeight: 100 } as any;
    expect(computeTransforms(config)).toEqual([]);
  });
});

describe('applyTransform', () => {
  const obj: SerializedObject = { left: 10, top: 10, width: 20, height: 20, scaleX: 1, scaleY: 1, angle: 0 };

  it('handles mirror-both 180 rotation case', () => {
    const transform: [number, number, number, number, number, number] = [-1, 0, 0, -1, 100, 100];
    const result = applyTransform(obj, transform, 'mirror-both');
    expect(result.angle).toBe(180);
  });

  it('handles diagonal reflection', () => {
    const transform: [number, number, number, number, number, number] = [0, 1, 1, 0, 0, 0];
    const result = applyTransform(obj, transform, 'diagonal');
    expect(result.flipX).toBe(true);
    expect(result.angle).toBe(90);
  });
});
