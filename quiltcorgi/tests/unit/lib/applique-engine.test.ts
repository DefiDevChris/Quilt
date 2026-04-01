import { describe, it, expect } from 'vitest';
import {
  generateShapePath,
  circlePath,
  ovalPath,
  heartPath,
  leafPath,
  teardropPath,
  createLayer,
  reorderLayers,
  bringForward,
  sendBackward,
  exportWithLayerMetadata,
  createBackgroundLayer,
  type ShapeType,
  type AppliqueLayer,
  type AppliqueBlock,
} from '@/lib/applique-utils';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeLayer(overrides: Partial<AppliqueLayer> = {}): AppliqueLayer {
  return {
    id: 'layer-1',
    shapeType: 'circle',
    pathData: 'M 50 50',
    fill: '#ff0000',
    zIndex: 1,
    transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
    ...overrides,
  };
}

function makeLayerStack(count: number): AppliqueLayer[] {
  return Array.from({ length: count }, (_, i) =>
    makeLayer({ id: `layer-${i}`, zIndex: i, shapeType: 'circle' })
  );
}

function makeBlock(layers: AppliqueLayer[]): AppliqueBlock {
  return {
    layers,
    backgroundFill: '#ffffff',
    width: 200,
    height: 200,
  };
}

// ---------------------------------------------------------------------------
// generateShapePath
// ---------------------------------------------------------------------------

describe('generateShapePath', () => {
  const ALL_SHAPE_TYPES: ShapeType[] = ['circle', 'oval', 'heart', 'leaf', 'teardrop', 'freeform'];

  it.each(ALL_SHAPE_TYPES.filter((s) => s !== 'freeform'))(
    'returns a non-empty string for shape type "%s"',
    (shapeType) => {
      const path = generateShapePath(shapeType, 100, 100, 50);
      expect(typeof path).toBe('string');
      expect(path.length).toBeGreaterThan(0);
    }
  );

  it('returns a string (possibly empty) for all shape types including freeform', () => {
    for (const shapeType of ALL_SHAPE_TYPES) {
      const path = generateShapePath(shapeType, 100, 100, 50);
      expect(typeof path).toBe('string');
    }
  });

  it.each(ALL_SHAPE_TYPES.filter((s) => s !== 'freeform'))(
    'path for "%s" starts with "M"',
    (shapeType) => {
      const path = generateShapePath(shapeType, 100, 100, 50);
      expect(path.trimStart()).toMatch(/^M/);
    }
  );

  it('passes center coordinates to the underlying path generator', () => {
    const pathAt100 = generateShapePath('circle', 100, 100, 40);
    const pathAt200 = generateShapePath('circle', 200, 200, 40);
    expect(pathAt100).not.toBe(pathAt200);
  });

  it('passes size to the underlying path generator', () => {
    const small = generateShapePath('circle', 100, 100, 20);
    const large = generateShapePath('circle', 100, 100, 80);
    expect(small).not.toBe(large);
  });

  it('freeform returns empty string placeholder', () => {
    const path = generateShapePath('freeform', 100, 100, 50);
    expect(path).toBe('');
  });
});

// ---------------------------------------------------------------------------
// circlePath
// ---------------------------------------------------------------------------

describe('circlePath', () => {
  it('starts with M', () => {
    expect(circlePath(50, 50, 30).trimStart()).toMatch(/^M/);
  });

  it('contains arc commands (A)', () => {
    expect(circlePath(50, 50, 30)).toContain('A');
  });

  it('ends with Z to close the path', () => {
    expect(circlePath(50, 50, 30).trimEnd()).toMatch(/Z\s*$/);
  });

  it('encodes the center x in the path', () => {
    const path = circlePath(75, 50, 30);
    // Move to (cx - radius, cy) = (45, 50)
    expect(path).toContain('45');
  });

  it('encodes the radius in the arc command', () => {
    const path = circlePath(50, 50, 25);
    expect(path).toContain('25');
  });

  it('radius of 0 produces a degenerate but valid path', () => {
    const path = circlePath(50, 50, 0);
    expect(typeof path).toBe('string');
    expect(path.trimStart()).toMatch(/^M/);
  });
});

// ---------------------------------------------------------------------------
// ovalPath
// ---------------------------------------------------------------------------

describe('ovalPath', () => {
  it('starts with M', () => {
    expect(ovalPath(50, 50, 40, 20).trimStart()).toMatch(/^M/);
  });

  it('contains arc commands (A)', () => {
    expect(ovalPath(50, 50, 40, 20)).toContain('A');
  });

  it('ends with Z', () => {
    expect(ovalPath(50, 50, 40, 20).trimEnd()).toMatch(/Z\s*$/);
  });

  it('encodes rx and ry differently when they differ', () => {
    const wideOval = ovalPath(50, 50, 40, 10);
    const tallOval = ovalPath(50, 50, 10, 40);
    expect(wideOval).not.toBe(tallOval);
  });

  it('produces same output as circlePath when rx === ry (same radii)', () => {
    const oval = ovalPath(50, 50, 30, 30);
    const circle = circlePath(50, 50, 30);
    // Both should encode the same geometry
    expect(oval).toBe(circle);
  });
});

// ---------------------------------------------------------------------------
// heartPath
// ---------------------------------------------------------------------------

describe('heartPath', () => {
  it('starts with M', () => {
    expect(heartPath(100, 100, 60).trimStart()).toMatch(/^M/);
  });

  it('contains cubic bezier commands (C)', () => {
    expect(heartPath(100, 100, 60)).toContain('C');
  });

  it('ends with Z', () => {
    expect(heartPath(100, 100, 60).trimEnd()).toMatch(/Z\s*$/);
  });

  it('produces different path for different sizes', () => {
    const small = heartPath(100, 100, 30);
    const large = heartPath(100, 100, 90);
    expect(small).not.toBe(large);
  });

  it('produces different path for different centers', () => {
    const a = heartPath(50, 50, 40);
    const b = heartPath(150, 150, 40);
    expect(a).not.toBe(b);
  });
});

// ---------------------------------------------------------------------------
// leafPath
// ---------------------------------------------------------------------------

describe('leafPath', () => {
  it('starts with M', () => {
    expect(leafPath(100, 100, 60).trimStart()).toMatch(/^M/);
  });

  it('contains quadratic bezier commands (Q)', () => {
    expect(leafPath(100, 100, 60)).toContain('Q');
  });

  it('ends with Z', () => {
    expect(leafPath(100, 100, 60).trimEnd()).toMatch(/Z\s*$/);
  });

  it('produces different path for different sizes', () => {
    const small = leafPath(100, 100, 20);
    const large = leafPath(100, 100, 80);
    expect(small).not.toBe(large);
  });

  it('produces different path for different centers', () => {
    const a = leafPath(50, 50, 40);
    const b = leafPath(200, 200, 40);
    expect(a).not.toBe(b);
  });
});

// ---------------------------------------------------------------------------
// teardropPath
// ---------------------------------------------------------------------------

describe('teardropPath', () => {
  it('starts with M', () => {
    expect(teardropPath(100, 100, 60).trimStart()).toMatch(/^M/);
  });

  it('ends with Z', () => {
    expect(teardropPath(100, 100, 60).trimEnd()).toMatch(/Z\s*$/);
  });

  it('produces different path for different sizes', () => {
    const small = teardropPath(100, 100, 20);
    const large = teardropPath(100, 100, 80);
    expect(small).not.toBe(large);
  });

  it('produces different path for different centers', () => {
    const a = teardropPath(50, 50, 40);
    const b = teardropPath(200, 200, 40);
    expect(a).not.toBe(b);
  });
});

// ---------------------------------------------------------------------------
// createLayer
// ---------------------------------------------------------------------------

describe('createLayer', () => {
  it('creates a layer with the supplied id', () => {
    const layer = createLayer('my-id', 'circle', 100, 100, 50, '#abc', 2);
    expect(layer.id).toBe('my-id');
  });

  it('creates a layer with the supplied shapeType', () => {
    const layer = createLayer('id', 'heart', 100, 100, 50, '#abc', 2);
    expect(layer.shapeType).toBe('heart');
  });

  it('creates a layer with the supplied fill', () => {
    const layer = createLayer('id', 'circle', 100, 100, 50, '#deadbe', 3);
    expect(layer.fill).toBe('#deadbe');
  });

  it('creates a layer with the supplied zIndex', () => {
    const layer = createLayer('id', 'circle', 100, 100, 50, '#abc', 7);
    expect(layer.zIndex).toBe(7);
  });

  it('generates pathData by calling generateShapePath', () => {
    const layer = createLayer('id', 'circle', 100, 100, 50, '#abc', 1);
    expect(layer.pathData).toBe(generateShapePath('circle', 100, 100, 50));
  });

  it('initializes transform with zero translation, zero rotation, unit scale', () => {
    const layer = createLayer('id', 'leaf', 50, 50, 30, '#abc', 1);
    expect(layer.transform).toEqual({ x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 });
  });

  it('creates layers with all required fields', () => {
    const layer = createLayer('id', 'oval', 100, 100, 50, '#abc', 0);
    expect(layer).toHaveProperty('id');
    expect(layer).toHaveProperty('shapeType');
    expect(layer).toHaveProperty('pathData');
    expect(layer).toHaveProperty('fill');
    expect(layer).toHaveProperty('zIndex');
    expect(layer).toHaveProperty('transform');
    expect(layer.transform).toHaveProperty('x');
    expect(layer.transform).toHaveProperty('y');
    expect(layer.transform).toHaveProperty('rotation');
    expect(layer.transform).toHaveProperty('scaleX');
    expect(layer.transform).toHaveProperty('scaleY');
  });

  it('does not mutate any external state (returns new object)', () => {
    const a = createLayer('id-a', 'circle', 100, 100, 50, '#aaa', 1);
    const b = createLayer('id-b', 'circle', 100, 100, 50, '#bbb', 2);
    expect(a).not.toBe(b);
    expect(a.id).toBe('id-a');
  });
});

// ---------------------------------------------------------------------------
// reorderLayers
// ---------------------------------------------------------------------------

describe('reorderLayers', () => {
  it('moves first layer to last position', () => {
    const layers = makeLayerStack(3);
    const result = reorderLayers(layers, 0, 2);
    expect(result[2].id).toBe('layer-0');
  });

  it('moves last layer to first position', () => {
    const layers = makeLayerStack(3);
    const result = reorderLayers(layers, 2, 0);
    expect(result[0].id).toBe('layer-2');
  });

  it('moves middle layer to last position', () => {
    const layers = makeLayerStack(4);
    const result = reorderLayers(layers, 1, 3);
    expect(result[3].id).toBe('layer-1');
  });

  it('does not mutate the original array', () => {
    const layers = makeLayerStack(3);
    const original = [...layers];
    reorderLayers(layers, 0, 2);
    expect(layers[0].id).toBe(original[0].id);
    expect(layers[1].id).toBe(original[1].id);
    expect(layers[2].id).toBe(original[2].id);
  });

  it('returns a new array reference', () => {
    const layers = makeLayerStack(3);
    const result = reorderLayers(layers, 0, 1);
    expect(result).not.toBe(layers);
  });

  it('preserves array length', () => {
    const layers = makeLayerStack(5);
    const result = reorderLayers(layers, 0, 4);
    expect(result).toHaveLength(5);
  });

  it('reassigns zIndex values to match new positions', () => {
    const layers = makeLayerStack(3);
    const result = reorderLayers(layers, 0, 2);
    expect(result[0].zIndex).toBe(0);
    expect(result[1].zIndex).toBe(1);
    expect(result[2].zIndex).toBe(2);
  });

  it('is a no-op when fromIndex equals toIndex', () => {
    const layers = makeLayerStack(3);
    const result = reorderLayers(layers, 1, 1);
    expect(result.map((l) => l.id)).toEqual(layers.map((l) => l.id));
  });
});

// ---------------------------------------------------------------------------
// bringForward
// ---------------------------------------------------------------------------

describe('bringForward', () => {
  it('moves a middle layer one position up', () => {
    const layers = makeLayerStack(3);
    // layers: [layer-0 z0, layer-1 z1, layer-2 z2]
    const result = bringForward(layers, 'layer-1');
    // layer-1 should now be at index 2
    expect(result[2].id).toBe('layer-1');
  });

  it('layer at top stays at top', () => {
    const layers = makeLayerStack(3);
    const result = bringForward(layers, 'layer-2');
    // Order should be unchanged
    expect(result[2].id).toBe('layer-2');
    expect(result.map((l) => l.id)).toEqual(['layer-0', 'layer-1', 'layer-2']);
  });

  it('does not mutate the original array', () => {
    const layers = makeLayerStack(3);
    bringForward(layers, 'layer-0');
    expect(layers[0].id).toBe('layer-0');
  });

  it('returns a new array reference', () => {
    const layers = makeLayerStack(3);
    const result = bringForward(layers, 'layer-1');
    expect(result).not.toBe(layers);
  });

  it('reassigns zIndex values after moving', () => {
    const layers = makeLayerStack(3);
    const result = bringForward(layers, 'layer-0');
    for (let i = 0; i < result.length; i++) {
      expect(result[i].zIndex).toBe(i);
    }
  });

  it('handles unknown layerId gracefully by returning unchanged order', () => {
    const layers = makeLayerStack(3);
    const result = bringForward(layers, 'nonexistent-id');
    expect(result.map((l) => l.id)).toEqual(layers.map((l) => l.id));
  });
});

// ---------------------------------------------------------------------------
// sendBackward
// ---------------------------------------------------------------------------

describe('sendBackward', () => {
  it('moves a middle layer one position down', () => {
    const layers = makeLayerStack(3);
    // layers: [layer-0, layer-1, layer-2]
    const result = sendBackward(layers, 'layer-1');
    // layer-1 should now be at index 0
    expect(result[0].id).toBe('layer-1');
  });

  it('layer at bottom stays at bottom', () => {
    const layers = makeLayerStack(3);
    const result = sendBackward(layers, 'layer-0');
    expect(result[0].id).toBe('layer-0');
    expect(result.map((l) => l.id)).toEqual(['layer-0', 'layer-1', 'layer-2']);
  });

  it('does not mutate the original array', () => {
    const layers = makeLayerStack(3);
    sendBackward(layers, 'layer-2');
    expect(layers[2].id).toBe('layer-2');
  });

  it('returns a new array reference', () => {
    const layers = makeLayerStack(3);
    const result = sendBackward(layers, 'layer-2');
    expect(result).not.toBe(layers);
  });

  it('reassigns zIndex values after moving', () => {
    const layers = makeLayerStack(3);
    const result = sendBackward(layers, 'layer-2');
    for (let i = 0; i < result.length; i++) {
      expect(result[i].zIndex).toBe(i);
    }
  });

  it('handles unknown layerId gracefully by returning unchanged order', () => {
    const layers = makeLayerStack(3);
    const result = sendBackward(layers, 'no-such-layer');
    expect(result.map((l) => l.id)).toEqual(layers.map((l) => l.id));
  });
});

// ---------------------------------------------------------------------------
// exportWithLayerMetadata
// ---------------------------------------------------------------------------

describe('exportWithLayerMetadata', () => {
  it('returns an object with fabricJsData and layerOrder keys', () => {
    const block = makeBlock(makeLayerStack(3));
    const result = exportWithLayerMetadata(block);
    expect(result).toHaveProperty('fabricJsData');
    expect(result).toHaveProperty('layerOrder');
  });

  it('layerOrder is an array', () => {
    const block = makeBlock(makeLayerStack(3));
    const { layerOrder } = exportWithLayerMetadata(block);
    expect(Array.isArray(layerOrder)).toBe(true);
  });

  it('layerOrder contains all layer ids', () => {
    const layers = makeLayerStack(3);
    const block = makeBlock(layers);
    const { layerOrder } = exportWithLayerMetadata(block);
    expect(layerOrder).toHaveLength(3);
    expect(layerOrder).toContain('layer-0');
    expect(layerOrder).toContain('layer-1');
    expect(layerOrder).toContain('layer-2');
  });

  it('layerOrder preserves layer ordering by zIndex (ascending)', () => {
    // Layers intentionally out of order by id but with explicit zIndex
    const layers: AppliqueLayer[] = [
      makeLayer({ id: 'z2', zIndex: 2 }),
      makeLayer({ id: 'z0', zIndex: 0 }),
      makeLayer({ id: 'z1', zIndex: 1 }),
    ];
    const block = makeBlock(layers);
    const { layerOrder } = exportWithLayerMetadata(block);
    expect(layerOrder).toEqual(['z0', 'z1', 'z2']);
  });

  it('fabricJsData is a non-null object', () => {
    const block = makeBlock(makeLayerStack(2));
    const { fabricJsData } = exportWithLayerMetadata(block);
    expect(typeof fabricJsData).toBe('object');
    expect(fabricJsData).not.toBeNull();
  });

  it('fabricJsData includes block dimensions', () => {
    const block = makeBlock(makeLayerStack(2));
    const { fabricJsData } = exportWithLayerMetadata(block);
    expect(fabricJsData).toHaveProperty('width', 200);
    expect(fabricJsData).toHaveProperty('height', 200);
  });

  it('fabricJsData includes backgroundFill', () => {
    const block = makeBlock(makeLayerStack(1));
    const { fabricJsData } = exportWithLayerMetadata(block);
    expect(fabricJsData).toHaveProperty('backgroundFill', '#ffffff');
  });

  it('fabricJsData includes layers array', () => {
    const block = makeBlock(makeLayerStack(2));
    const { fabricJsData } = exportWithLayerMetadata(block);
    expect(fabricJsData).toHaveProperty('layers');
    expect(Array.isArray(fabricJsData.layers)).toBe(true);
  });

  it('does not mutate the input block', () => {
    const layers = makeLayerStack(3);
    const block = makeBlock(layers);
    const originalIds = block.layers.map((l) => l.id);
    exportWithLayerMetadata(block);
    expect(block.layers.map((l) => l.id)).toEqual(originalIds);
  });

  it('handles an empty layers array', () => {
    const block = makeBlock([]);
    const { layerOrder, fabricJsData } = exportWithLayerMetadata(block);
    expect(layerOrder).toEqual([]);
    expect(Array.isArray(fabricJsData.layers)).toBe(true);
    expect((fabricJsData.layers as unknown[]).length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// createBackgroundLayer
// ---------------------------------------------------------------------------

describe('createBackgroundLayer', () => {
  it('creates a layer with zIndex 0', () => {
    const layer = createBackgroundLayer(200, 200, '#ffffff');
    expect(layer.zIndex).toBe(0);
  });

  it('has id "background"', () => {
    const layer = createBackgroundLayer(200, 200, '#ffffff');
    expect(layer.id).toBe('background');
  });

  it('uses the supplied fill', () => {
    const layer = createBackgroundLayer(200, 200, '#ffe0c0');
    expect(layer.fill).toBe('#ffe0c0');
  });

  it('pathData describes a rectangle covering the full block', () => {
    const layer = createBackgroundLayer(300, 150, '#fff');
    expect(layer.pathData).toContain('M');
    // Should reference the width and height
    expect(layer.pathData).toContain('300');
    expect(layer.pathData).toContain('150');
  });

  it('has all required AppliqueLayer fields', () => {
    const layer = createBackgroundLayer(100, 100, '#000');
    expect(layer).toHaveProperty('id');
    expect(layer).toHaveProperty('shapeType');
    expect(layer).toHaveProperty('pathData');
    expect(layer).toHaveProperty('fill');
    expect(layer).toHaveProperty('zIndex');
    expect(layer).toHaveProperty('transform');
  });

  it('transform defaults to identity', () => {
    const layer = createBackgroundLayer(100, 100, '#000');
    expect(layer.transform).toEqual({ x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 });
  });

  it('produces different pathData for different dimensions', () => {
    const a = createBackgroundLayer(100, 100, '#fff');
    const b = createBackgroundLayer(200, 300, '#fff');
    expect(a.pathData).not.toBe(b.pathData);
  });
});

// ---------------------------------------------------------------------------
// Immutability — shared edge-case tests
// ---------------------------------------------------------------------------

describe('immutability guarantees', () => {
  it('reorderLayers does not modify layer objects', () => {
    const layers = makeLayerStack(3);
    const originalFill = layers[0].fill;
    reorderLayers(layers, 0, 2);
    expect(layers[0].fill).toBe(originalFill);
  });

  it('bringForward does not modify layer transform objects', () => {
    const layers = makeLayerStack(3);
    const originalTransform = { ...layers[1].transform };
    bringForward(layers, 'layer-1');
    expect(layers[1].transform).toEqual(originalTransform);
  });

  it('sendBackward does not modify layer transform objects', () => {
    const layers = makeLayerStack(3);
    const originalTransform = { ...layers[1].transform };
    sendBackward(layers, 'layer-1');
    expect(layers[1].transform).toEqual(originalTransform);
  });
});
