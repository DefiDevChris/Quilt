import { describe, it, expect } from 'vitest';
import {
  computePatternTransform,
  defaultFussyCutConfig,
  patchBoundingBox,
  centerConfigOnPatch,
  clampConfig,
  configsEqual,
  type FussyCutConfig,
  type Point,
  type PatternTransformMatrix,
} from '@/lib/fussy-cut-utils';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FLOAT_PRECISION = 10;

function matrixClose(a: PatternTransformMatrix, b: PatternTransformMatrix): boolean {
  return a.every((v, i) => Math.abs(v - b[i]) < 1e-10);
}

// ---------------------------------------------------------------------------
// computePatternTransform
// ---------------------------------------------------------------------------

describe('computePatternTransform', () => {
  it('returns identity matrix for rotation=0, scale=1, no offset', () => {
    const config: FussyCutConfig = {
      fabricId: 'f1',
      offsetX: 0,
      offsetY: 0,
      rotation: 0,
      scale: 1,
    };
    const matrix = computePatternTransform(config);
    // [cos*scale, sin*scale, -sin*scale, cos*scale, offsetX, offsetY]
    // [1, 0, 0, 1, 0, 0]
    expect(matrixClose(matrix, [1, 0, 0, 1, 0, 0])).toBe(true);
  });

  it('returns correct matrix for 90-degree rotation, scale=1', () => {
    const config: FussyCutConfig = {
      fabricId: 'f1',
      offsetX: 0,
      offsetY: 0,
      rotation: 90,
      scale: 1,
    };
    const matrix = computePatternTransform(config);
    // cos(90°)=0, sin(90°)=1
    // [0, 1, -1, 0, 0, 0]
    expect(matrixClose(matrix, [0, 1, -1, 0, 0, 0])).toBe(true);
  });

  it('returns correct matrix for 180-degree rotation, scale=1', () => {
    const config: FussyCutConfig = {
      fabricId: 'f2',
      offsetX: 0,
      offsetY: 0,
      rotation: 180,
      scale: 1,
    };
    const matrix = computePatternTransform(config);
    // cos(180°)=-1, sin(180°)=0
    // [-1, 0, 0, -1, 0, 0]
    expect(matrixClose(matrix, [-1, 0, 0, -1, 0, 0])).toBe(true);
  });

  it('returns correct matrix for 45-degree rotation, scale=1', () => {
    const config: FussyCutConfig = {
      fabricId: 'f3',
      offsetX: 0,
      offsetY: 0,
      rotation: 45,
      scale: 1,
    };
    const matrix = computePatternTransform(config);
    const s = Math.sin(Math.PI / 4);
    const c = Math.cos(Math.PI / 4);
    expect(matrixClose(matrix, [c, s, -s, c, 0, 0])).toBe(true);
  });

  it('applies scale factor correctly at rotation=0', () => {
    const config: FussyCutConfig = {
      fabricId: 'f4',
      offsetX: 0,
      offsetY: 0,
      rotation: 0,
      scale: 2,
    };
    const matrix = computePatternTransform(config);
    // [2, 0, 0, 2, 0, 0]
    expect(matrixClose(matrix, [2, 0, 0, 2, 0, 0])).toBe(true);
  });

  it('applies scale factor of 0.5 at rotation=0', () => {
    const config: FussyCutConfig = {
      fabricId: 'f4',
      offsetX: 0,
      offsetY: 0,
      rotation: 0,
      scale: 0.5,
    };
    const matrix = computePatternTransform(config);
    expect(matrixClose(matrix, [0.5, 0, 0, 0.5, 0, 0])).toBe(true);
  });

  it('encodes offsets in tx and ty positions', () => {
    const config: FussyCutConfig = {
      fabricId: 'f5',
      offsetX: 100,
      offsetY: 200,
      rotation: 0,
      scale: 1,
    };
    const matrix = computePatternTransform(config);
    expect(matrix[4]).toBe(100);
    expect(matrix[5]).toBe(200);
  });

  it('combines rotation, scale, and offset correctly', () => {
    const config: FussyCutConfig = {
      fabricId: 'f6',
      offsetX: 50,
      offsetY: -30,
      rotation: 90,
      scale: 2,
    };
    const matrix = computePatternTransform(config);
    // cos(90°)=0, sin(90°)=1, scale=2
    // [0*2, 1*2, -1*2, 0*2, 50, -30] = [0, 2, -2, 0, 50, -30]
    expect(matrixClose(matrix, [0, 2, -2, 0, 50, -30])).toBe(true);
  });

  it('returns a tuple of exactly 6 elements', () => {
    const config = defaultFussyCutConfig('f7');
    const matrix = computePatternTransform(config);
    expect(matrix).toHaveLength(6);
  });

  it('handles negative rotation (rotation=-90)', () => {
    const config: FussyCutConfig = {
      fabricId: 'f8',
      offsetX: 0,
      offsetY: 0,
      rotation: -90,
      scale: 1,
    };
    const matrix = computePatternTransform(config);
    // cos(-90°)=0, sin(-90°)=-1
    // [0, -1, 1, 0, 0, 0]
    expect(matrixClose(matrix, [0, -1, 1, 0, 0, 0])).toBe(true);
  });

  it('handles 360-degree rotation (equivalent to 0)', () => {
    const config360: FussyCutConfig = {
      fabricId: 'f9',
      offsetX: 0,
      offsetY: 0,
      rotation: 360,
      scale: 1,
    };
    const config0: FussyCutConfig = {
      fabricId: 'f9',
      offsetX: 0,
      offsetY: 0,
      rotation: 0,
      scale: 1,
    };
    const m360 = computePatternTransform(config360);
    const m0 = computePatternTransform(config0);
    expect(matrixClose(m360, m0)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// defaultFussyCutConfig
// ---------------------------------------------------------------------------

describe('defaultFussyCutConfig', () => {
  it('returns config with the provided fabricId', () => {
    const config = defaultFussyCutConfig('fabric-abc');
    expect(config.fabricId).toBe('fabric-abc');
  });

  it('returns offsetX=0', () => {
    const config = defaultFussyCutConfig('f1');
    expect(config.offsetX).toBe(0);
  });

  it('returns offsetY=0', () => {
    const config = defaultFussyCutConfig('f1');
    expect(config.offsetY).toBe(0);
  });

  it('returns rotation=0', () => {
    const config = defaultFussyCutConfig('f1');
    expect(config.rotation).toBe(0);
  });

  it('returns scale=1', () => {
    const config = defaultFussyCutConfig('f1');
    expect(config.scale).toBe(1);
  });

  it('returns distinct objects for different fabricIds', () => {
    const a = defaultFussyCutConfig('fa');
    const b = defaultFussyCutConfig('fb');
    expect(a.fabricId).not.toBe(b.fabricId);
    // Ensure they are not the same object reference
    expect(a).not.toBe(b);
  });

  it('does not reuse the same object across calls with same fabricId', () => {
    const a = defaultFussyCutConfig('same');
    const b = defaultFussyCutConfig('same');
    expect(a).not.toBe(b);
  });
});

// ---------------------------------------------------------------------------
// patchBoundingBox
// ---------------------------------------------------------------------------

describe('patchBoundingBox', () => {
  it('computes bounding box for an axis-aligned square', () => {
    const vertices: Point[] = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ];
    const bb = patchBoundingBox(vertices);
    expect(bb.x).toBe(0);
    expect(bb.y).toBe(0);
    expect(bb.width).toBe(100);
    expect(bb.height).toBe(100);
  });

  it('computes bounding box for an axis-aligned rectangle', () => {
    const vertices: Point[] = [
      { x: 10, y: 20 },
      { x: 110, y: 20 },
      { x: 110, y: 70 },
      { x: 10, y: 70 },
    ];
    const bb = patchBoundingBox(vertices);
    expect(bb.x).toBe(10);
    expect(bb.y).toBe(20);
    expect(bb.width).toBe(100);
    expect(bb.height).toBe(50);
  });

  it('computes bounding box for a triangle', () => {
    const vertices: Point[] = [
      { x: 50, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ];
    const bb = patchBoundingBox(vertices);
    expect(bb.x).toBe(0);
    expect(bb.y).toBe(0);
    expect(bb.width).toBe(100);
    expect(bb.height).toBe(100);
  });

  it('computes bounding box for a single point', () => {
    const vertices: Point[] = [{ x: 42, y: 17 }];
    const bb = patchBoundingBox(vertices);
    expect(bb.x).toBe(42);
    expect(bb.y).toBe(17);
    expect(bb.width).toBe(0);
    expect(bb.height).toBe(0);
  });

  it('handles negative coordinates', () => {
    const vertices: Point[] = [
      { x: -50, y: -50 },
      { x: 50, y: -50 },
      { x: 50, y: 50 },
      { x: -50, y: 50 },
    ];
    const bb = patchBoundingBox(vertices);
    expect(bb.x).toBe(-50);
    expect(bb.y).toBe(-50);
    expect(bb.width).toBe(100);
    expect(bb.height).toBe(100);
  });

  it('handles a polygon with non-axis-aligned vertices', () => {
    // Diamond shape
    const vertices: Point[] = [
      { x: 50, y: 0 },
      { x: 100, y: 50 },
      { x: 50, y: 100 },
      { x: 0, y: 50 },
    ];
    const bb = patchBoundingBox(vertices);
    expect(bb.x).toBe(0);
    expect(bb.y).toBe(0);
    expect(bb.width).toBe(100);
    expect(bb.height).toBe(100);
  });

  it('computes bounding box when first vertex has the maximum y value', () => {
    // First vertex has y=100 (max); subsequent vertex has y=0 (min).
    // This exercises the y < minY branch in the loop.
    const vertices: Point[] = [
      { x: 0, y: 100 },
      { x: 50, y: 0 },
      { x: 100, y: 50 },
    ];
    const bb = patchBoundingBox(vertices);
    expect(bb.y).toBe(0);
    expect(bb.height).toBe(100);
  });

  it('does not mutate the input vertices array', () => {
    const vertices: Point[] = [
      { x: 0, y: 0 },
      { x: 10, y: 10 },
    ];
    const original = vertices.map((v) => ({ ...v }));
    patchBoundingBox(vertices);
    vertices.forEach((v, i) => {
      expect(v.x).toBe(original[i].x);
      expect(v.y).toBe(original[i].y);
    });
  });
});

// ---------------------------------------------------------------------------
// centerConfigOnPatch
// ---------------------------------------------------------------------------

describe('centerConfigOnPatch', () => {
  it('centers a 100x100 fabric over a 100x100 square patch at origin', () => {
    const config = defaultFussyCutConfig('f1');
    const vertices: Point[] = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ];
    const result = centerConfigOnPatch(config, vertices, 100, 100);
    // Patch center: (50, 50). Fabric center: (50, 50). Offset = patch_center - fabric_center = 0, 0
    expect(result.offsetX).toBe(0);
    expect(result.offsetY).toBe(0);
  });

  it('centers a 200x200 fabric over a 100x100 square patch at origin', () => {
    const config = defaultFussyCutConfig('f1');
    const vertices: Point[] = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ];
    const result = centerConfigOnPatch(config, vertices, 200, 200);
    // Patch center: (50, 50). Fabric center: (100, 100). Offset = 50 - 100 = -50
    expect(result.offsetX).toBe(-50);
    expect(result.offsetY).toBe(-50);
  });

  it('centers fabric over a patch offset from origin', () => {
    const config = defaultFussyCutConfig('f1');
    const vertices: Point[] = [
      { x: 200, y: 300 },
      { x: 300, y: 300 },
      { x: 300, y: 400 },
      { x: 200, y: 400 },
    ];
    // Patch center: (250, 350). Fabric (100x100) center: (50, 50). Offset = 250-50, 350-50 = 200, 300
    const result = centerConfigOnPatch(config, vertices, 100, 100);
    expect(result.offsetX).toBe(200);
    expect(result.offsetY).toBe(300);
  });

  it('returns a new config object (does not mutate input)', () => {
    const config = defaultFussyCutConfig('f1');
    const vertices: Point[] = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ];
    const result = centerConfigOnPatch(config, vertices, 200, 200);
    expect(result).not.toBe(config);
  });

  it('preserves non-offset fields from the input config', () => {
    const config: FussyCutConfig = {
      fabricId: 'myFabric',
      offsetX: 999,
      offsetY: 999,
      rotation: 45,
      scale: 2,
    };
    const vertices: Point[] = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ];
    const result = centerConfigOnPatch(config, vertices, 100, 100);
    expect(result.fabricId).toBe('myFabric');
    expect(result.rotation).toBe(45);
    expect(result.scale).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// clampConfig
// ---------------------------------------------------------------------------

describe('clampConfig', () => {
  it('returns same values when all fields are within range', () => {
    const config: FussyCutConfig = {
      fabricId: 'f1',
      offsetX: 100,
      offsetY: -100,
      rotation: 90,
      scale: 2,
    };
    const result = clampConfig(config);
    expect(result.offsetX).toBe(100);
    expect(result.offsetY).toBe(-100);
    expect(result.rotation).toBe(90);
    expect(result.scale).toBe(2);
  });

  it('clamps offsetX above 2000 to 2000', () => {
    const config = { ...defaultFussyCutConfig('f1'), offsetX: 5000 };
    expect(clampConfig(config).offsetX).toBe(2000);
  });

  it('clamps offsetX below -2000 to -2000', () => {
    const config = { ...defaultFussyCutConfig('f1'), offsetX: -9999 };
    expect(clampConfig(config).offsetX).toBe(-2000);
  });

  it('clamps offsetY above 2000 to 2000', () => {
    const config = { ...defaultFussyCutConfig('f1'), offsetY: 2001 };
    expect(clampConfig(config).offsetY).toBe(2000);
  });

  it('clamps offsetY below -2000 to -2000', () => {
    const config = { ...defaultFussyCutConfig('f1'), offsetY: -2001 };
    expect(clampConfig(config).offsetY).toBe(-2000);
  });

  it('clamps rotation above 360 to 360', () => {
    const config = { ...defaultFussyCutConfig('f1'), rotation: 720 };
    expect(clampConfig(config).rotation).toBe(360);
  });

  it('clamps rotation below -360 to -360', () => {
    const config = { ...defaultFussyCutConfig('f1'), rotation: -400 };
    expect(clampConfig(config).rotation).toBe(-360);
  });

  it('clamps scale above 10 to 10', () => {
    const config = { ...defaultFussyCutConfig('f1'), scale: 100 };
    expect(clampConfig(config).scale).toBe(10);
  });

  it('clamps scale below 0.1 to 0.1', () => {
    const config = { ...defaultFussyCutConfig('f1'), scale: 0.001 };
    expect(clampConfig(config).scale).toBe(0.1);
  });

  it('clamps scale of 0 to 0.1', () => {
    const config = { ...defaultFussyCutConfig('f1'), scale: 0 };
    expect(clampConfig(config).scale).toBe(0.1);
  });

  it('preserves fabricId unchanged', () => {
    const config = { ...defaultFussyCutConfig('my-fabric'), scale: 100 };
    expect(clampConfig(config).fabricId).toBe('my-fabric');
  });

  it('returns a new object (does not mutate input)', () => {
    const config: FussyCutConfig = {
      fabricId: 'f1',
      offsetX: 5000,
      offsetY: 0,
      rotation: 0,
      scale: 1,
    };
    const result = clampConfig(config);
    expect(result).not.toBe(config);
    expect(config.offsetX).toBe(5000); // original unchanged
  });

  it('clamps all fields simultaneously', () => {
    const config: FussyCutConfig = {
      fabricId: 'f1',
      offsetX: 9999,
      offsetY: -9999,
      rotation: 999,
      scale: 0,
    };
    const result = clampConfig(config);
    expect(result.offsetX).toBe(2000);
    expect(result.offsetY).toBe(-2000);
    expect(result.rotation).toBe(360);
    expect(result.scale).toBe(0.1);
  });

  it('does not clamp boundary values exactly at the limits', () => {
    const config: FussyCutConfig = {
      fabricId: 'f1',
      offsetX: 2000,
      offsetY: -2000,
      rotation: -360,
      scale: 10,
    };
    const result = clampConfig(config);
    expect(result.offsetX).toBe(2000);
    expect(result.offsetY).toBe(-2000);
    expect(result.rotation).toBe(-360);
    expect(result.scale).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// configsEqual
// ---------------------------------------------------------------------------

describe('configsEqual', () => {
  it('returns true for two identical default configs', () => {
    const a = defaultFussyCutConfig('f1');
    const b = defaultFussyCutConfig('f1');
    expect(configsEqual(a, b)).toBe(true);
  });

  it('returns false when fabricId differs', () => {
    const a = defaultFussyCutConfig('f1');
    const b = defaultFussyCutConfig('f2');
    expect(configsEqual(a, b)).toBe(false);
  });

  it('returns false when offsetX differs', () => {
    const a = defaultFussyCutConfig('f1');
    const b = { ...defaultFussyCutConfig('f1'), offsetX: 10 };
    expect(configsEqual(a, b)).toBe(false);
  });

  it('returns false when offsetY differs', () => {
    const a = defaultFussyCutConfig('f1');
    const b = { ...defaultFussyCutConfig('f1'), offsetY: -5 };
    expect(configsEqual(a, b)).toBe(false);
  });

  it('returns false when rotation differs', () => {
    const a = defaultFussyCutConfig('f1');
    const b = { ...defaultFussyCutConfig('f1'), rotation: 45 };
    expect(configsEqual(a, b)).toBe(false);
  });

  it('returns false when scale differs', () => {
    const a = defaultFussyCutConfig('f1');
    const b = { ...defaultFussyCutConfig('f1'), scale: 2 };
    expect(configsEqual(a, b)).toBe(false);
  });

  it('returns true for two fully-specified identical configs', () => {
    const a: FussyCutConfig = {
      fabricId: 'x',
      offsetX: 10,
      offsetY: -20,
      rotation: 45,
      scale: 1.5,
    };
    const b: FussyCutConfig = {
      fabricId: 'x',
      offsetX: 10,
      offsetY: -20,
      rotation: 45,
      scale: 1.5,
    };
    expect(configsEqual(a, b)).toBe(true);
  });

  it('returns false when all fields differ', () => {
    const a: FussyCutConfig = { fabricId: 'a', offsetX: 0, offsetY: 0, rotation: 0, scale: 1 };
    const b: FussyCutConfig = { fabricId: 'b', offsetX: 1, offsetY: 1, rotation: 1, scale: 2 };
    expect(configsEqual(a, b)).toBe(false);
  });

  it('is symmetric: configsEqual(a, b) === configsEqual(b, a)', () => {
    const a: FussyCutConfig = { fabricId: 'x', offsetX: 5, offsetY: 5, rotation: 30, scale: 1.2 };
    const b: FussyCutConfig = { fabricId: 'y', offsetX: 5, offsetY: 5, rotation: 30, scale: 1.2 };
    expect(configsEqual(a, b)).toBe(configsEqual(b, a));
  });

  it('is reflexive: configsEqual(a, a) is always true', () => {
    const a: FussyCutConfig = {
      fabricId: 'z',
      offsetX: 100,
      offsetY: 200,
      rotation: 270,
      scale: 3,
    };
    expect(configsEqual(a, a)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Zod schema (fussyCutConfigSchema) — imported from validation
// ---------------------------------------------------------------------------

describe('fussyCutConfigSchema (via validation.ts)', () => {
  it('is exported from validation.ts and validates a valid config', async () => {
    const { fussyCutConfigSchema } = await import('@/lib/validation');
    const result = fussyCutConfigSchema.parse({
      fabricId: 'fabric-123',
      offsetX: 0,
      offsetY: 0,
      rotation: 0,
      scale: 1,
    });
    expect(result.fabricId).toBe('fabric-123');
    expect(result.scale).toBe(1);
  });

  it('applies default values when optional fields are omitted', async () => {
    const { fussyCutConfigSchema } = await import('@/lib/validation');
    const result = fussyCutConfigSchema.parse({ fabricId: 'f1' });
    expect(result.offsetX).toBe(0);
    expect(result.offsetY).toBe(0);
    expect(result.rotation).toBe(0);
    expect(result.scale).toBe(1);
  });

  it('rejects empty fabricId', async () => {
    const { fussyCutConfigSchema } = await import('@/lib/validation');
    expect(() => fussyCutConfigSchema.parse({ fabricId: '' })).toThrow();
  });

  it('rejects offsetX outside [-2000, 2000]', async () => {
    const { fussyCutConfigSchema } = await import('@/lib/validation');
    expect(() => fussyCutConfigSchema.parse({ fabricId: 'f1', offsetX: 2001 })).toThrow();
    expect(() => fussyCutConfigSchema.parse({ fabricId: 'f1', offsetX: -2001 })).toThrow();
  });

  it('rejects scale outside [0.1, 10]', async () => {
    const { fussyCutConfigSchema } = await import('@/lib/validation');
    expect(() => fussyCutConfigSchema.parse({ fabricId: 'f1', scale: 0.09 })).toThrow();
    expect(() => fussyCutConfigSchema.parse({ fabricId: 'f1', scale: 10.01 })).toThrow();
  });

  it('rejects rotation outside [-360, 360]', async () => {
    const { fussyCutConfigSchema } = await import('@/lib/validation');
    expect(() => fussyCutConfigSchema.parse({ fabricId: 'f1', rotation: 361 })).toThrow();
    expect(() => fussyCutConfigSchema.parse({ fabricId: 'f1', rotation: -361 })).toThrow();
  });
});
