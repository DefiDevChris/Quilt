import { describe, it, expect } from 'vitest';
import {
  computeActiveZone,
  isPointInZone,
  computeTransforms,
  applyTransform,
  applySymmetry,
  filterObjectsInZone,
  SYMMETRY_TYPE_LABELS,
  RADIAL_FOLD_MIN,
  RADIAL_FOLD_MAX,
  type SymmetryConfig,
  type SerializedObject,
} from '@/lib/symmetry-utils';

function makeConfig(
  type: SymmetryConfig['type'],
  overrides?: Partial<SymmetryConfig>
): SymmetryConfig {
  return {
    type,
    foldCount: 4,
    canvasWidth: 200,
    canvasHeight: 200,
    ...overrides,
  };
}

function makeObject(left: number, top: number, size = 20): SerializedObject {
  return {
    left,
    top,
    width: size,
    height: size,
    scaleX: 1,
    scaleY: 1,
    angle: 0,
    type: 'Rect',
    fill: '#D4883C',
  };
}

describe('symmetry-utils', () => {
  describe('computeActiveZone', () => {
    it('returns top half for mirror-x', () => {
      const zone = computeActiveZone(makeConfig('mirror-x'));
      expect(zone.label).toBe('Top Half');
      expect(zone.points).toHaveLength(4);
      // Bottom-right corner of zone should be at (200, 100)
      expect(zone.points[2]).toEqual({ x: 200, y: 100 });
    });

    it('returns left half for mirror-y', () => {
      const zone = computeActiveZone(makeConfig('mirror-y'));
      expect(zone.label).toBe('Left Half');
      expect(zone.points).toHaveLength(4);
      expect(zone.points[1]).toEqual({ x: 100, y: 0 });
    });

    it('returns top-left quadrant for mirror-both', () => {
      const zone = computeActiveZone(makeConfig('mirror-both'));
      expect(zone.label).toBe('Top-Left Quadrant');
      expect(zone.points).toHaveLength(4);
      expect(zone.points[2]).toEqual({ x: 100, y: 100 });
    });

    it('returns upper-left triangle for diagonal', () => {
      const zone = computeActiveZone(makeConfig('diagonal'));
      expect(zone.label).toBe('Upper-Left Triangle');
      expect(zone.points).toHaveLength(3);
    });

    it('returns pie slice for radial', () => {
      const zone = computeActiveZone(makeConfig('radial', { foldCount: 6 }));
      expect(zone.label).toBe('6-fold Radial Slice');
      // Center point + arc points
      expect(zone.points.length).toBeGreaterThan(3);
      expect(zone.points[0]).toEqual({ x: 100, y: 100 }); // center
    });
  });

  describe('isPointInZone', () => {
    it('detects point inside rectangular zone', () => {
      const zone = computeActiveZone(makeConfig('mirror-x'));
      expect(isPointInZone({ x: 50, y: 25 }, zone)).toBe(true);
    });

    it('detects point outside rectangular zone', () => {
      const zone = computeActiveZone(makeConfig('mirror-x'));
      expect(isPointInZone({ x: 50, y: 150 }, zone)).toBe(false);
    });

    it('detects point inside triangular zone', () => {
      const zone = computeActiveZone(makeConfig('diagonal'));
      expect(isPointInZone({ x: 10, y: 10 }, zone)).toBe(true);
    });

    it('detects point outside triangular zone', () => {
      const zone = computeActiveZone(makeConfig('diagonal'));
      // Point below the diagonal
      expect(isPointInZone({ x: 10, y: 190 }, zone)).toBe(false);
    });

    it('returns false for empty zone', () => {
      expect(isPointInZone({ x: 0, y: 0 }, { points: [], label: '' })).toBe(false);
    });
  });

  describe('computeTransforms', () => {
    it('returns 1 transform for mirror-x', () => {
      const transforms = computeTransforms(makeConfig('mirror-x'));
      expect(transforms).toHaveLength(1);
    });

    it('returns 1 transform for mirror-y', () => {
      const transforms = computeTransforms(makeConfig('mirror-y'));
      expect(transforms).toHaveLength(1);
    });

    it('returns 3 transforms for mirror-both', () => {
      const transforms = computeTransforms(makeConfig('mirror-both'));
      expect(transforms).toHaveLength(3);
    });

    it('returns 1 transform for diagonal', () => {
      const transforms = computeTransforms(makeConfig('diagonal'));
      expect(transforms).toHaveLength(1);
    });

    it('returns N-1 transforms for radial with foldCount=N', () => {
      const transforms = computeTransforms(makeConfig('radial', { foldCount: 6 }));
      expect(transforms).toHaveLength(5);
    });

    it('returns 3 transforms for radial with foldCount=4', () => {
      const transforms = computeTransforms(makeConfig('radial', { foldCount: 4 }));
      expect(transforms).toHaveLength(3);
    });
  });

  describe('applyTransform', () => {
    it('mirrors object across X-axis correctly', () => {
      const obj = makeObject(10, 20);
      const transforms = computeTransforms(makeConfig('mirror-x'));
      const result = applyTransform(obj, transforms[0], 'mirror-x');
      // Object center at (20, 30), mirrored across y=100 → center at (20, 170)
      // So new top = 170 - 10 = 160
      expect(result.left).toBeCloseTo(10, 1);
      expect(result.top).toBeCloseTo(160, 1);
    });

    it('mirrors object across Y-axis correctly', () => {
      const obj = makeObject(10, 20);
      const transforms = computeTransforms(makeConfig('mirror-y'));
      const result = applyTransform(obj, transforms[0], 'mirror-y');
      // Object center at (20, 30), mirrored across x=100 → center at (180, 30)
      // So new left = 180 - 10 = 170
      expect(result.left).toBeCloseTo(170, 1);
      expect(result.top).toBeCloseTo(20, 1);
    });

    it('preserves object dimensions', () => {
      const obj = makeObject(10, 20, 30);
      const transforms = computeTransforms(makeConfig('mirror-x'));
      const result = applyTransform(obj, transforms[0], 'mirror-x');
      expect(result.width).toBe(30);
      expect(result.height).toBe(30);
      expect(result.scaleX).toBe(1);
      expect(result.scaleY).toBe(1);
    });

    it('normalizes angle to 0-360', () => {
      const obj = makeObject(10, 20);
      obj.angle = 45;
      const transforms = computeTransforms(makeConfig('mirror-x'));
      const result = applyTransform(obj, transforms[0], 'mirror-x');
      expect(result.angle).toBeGreaterThanOrEqual(0);
      expect(result.angle).toBeLessThan(360);
    });
  });

  describe('applySymmetry', () => {
    it('generates correct number of new objects for mirror-x', () => {
      const objects = [makeObject(10, 10), makeObject(50, 20)];
      const result = applySymmetry(objects, makeConfig('mirror-x'));
      // 1 transform × 2 objects = 2 new objects
      expect(result.newObjects).toHaveLength(2);
    });

    it('generates correct number of new objects for mirror-both', () => {
      const objects = [makeObject(10, 10)];
      const result = applySymmetry(objects, makeConfig('mirror-both'));
      // 3 transforms × 1 object = 3 new objects
      expect(result.newObjects).toHaveLength(3);
    });

    it('generates correct number of new objects for radial N=4', () => {
      const objects = [makeObject(10, 10)];
      const result = applySymmetry(objects, makeConfig('radial', { foldCount: 4 }));
      // 3 transforms × 1 object = 3 new objects
      expect(result.newObjects).toHaveLength(3);
    });

    it('returns empty for no objects', () => {
      const result = applySymmetry([], makeConfig('mirror-x'));
      expect(result.newObjects).toHaveLength(0);
    });

    it('radial N=4 produces 4-fold rotational symmetry', () => {
      const obj = makeObject(50, 10, 20);
      const config = makeConfig('radial', { foldCount: 4 });
      const result = applySymmetry([obj], config);
      // Should have 3 new objects at 90, 180, 270 degrees
      expect(result.newObjects).toHaveLength(3);
    });
  });

  describe('filterObjectsInZone', () => {
    it('filters objects to those inside the zone', () => {
      const zone = computeActiveZone(makeConfig('mirror-x'));
      const objects = [
        makeObject(10, 10),  // center at (20, 20) — in top half
        makeObject(10, 150), // center at (20, 160) — in bottom half
      ];
      const filtered = filterObjectsInZone(objects, zone);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].top).toBe(10);
    });

    it('returns empty for no objects in zone', () => {
      const zone = computeActiveZone(makeConfig('mirror-x'));
      const objects = [makeObject(10, 150)]; // bottom half only
      const filtered = filterObjectsInZone(objects, zone);
      expect(filtered).toHaveLength(0);
    });
  });

  describe('constants', () => {
    it('has labels for all symmetry types', () => {
      expect(Object.keys(SYMMETRY_TYPE_LABELS)).toHaveLength(5);
      expect(SYMMETRY_TYPE_LABELS['mirror-x']).toBeTruthy();
      expect(SYMMETRY_TYPE_LABELS['mirror-y']).toBeTruthy();
      expect(SYMMETRY_TYPE_LABELS['mirror-both']).toBeTruthy();
      expect(SYMMETRY_TYPE_LABELS['diagonal']).toBeTruthy();
      expect(SYMMETRY_TYPE_LABELS['radial']).toBeTruthy();
    });

    it('has valid radial fold bounds', () => {
      expect(RADIAL_FOLD_MIN).toBe(2);
      expect(RADIAL_FOLD_MAX).toBe(12);
    });
  });
});
