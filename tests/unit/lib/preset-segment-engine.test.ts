import { describe, it, expect } from 'vitest';
import { segmentByPreset } from '@/lib/preset-segment-engine';
import type { BlockGridPreset } from '@/lib/block-grid-presets';
import type { ImageDataLike } from '@/lib/color-quantize';

// ---------------------------------------------------------------------------
// Helpers — build synthetic test images
// ---------------------------------------------------------------------------

/**
 * Create a solid-color ImageDataLike of the given dimensions.
 */
function solidImage(width: number, height: number, hex: string): ImageDataLike {
  const data = new Uint8ClampedArray(width * height * 4);
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  for (let i = 0; i < width * height; i++) {
    data[i * 4] = r;
    data[i * 4 + 1] = g;
    data[i * 4 + 2] = b;
    data[i * 4 + 3] = 255;
  }
  return { data, width, height };
}

/**
 * Create a 2×2 checkerboard image (each quadrant a different solid color).
 */
function checkerboardImage(size: number): ImageDataLike {
  const data = new Uint8ClampedArray(size * size * 4);
  const mid = Math.floor(size / 2);
  const colors: Record<string, string> = {
    'tl': '#ff0000',
    'tr': '#00ff00',
    'bl': '#0000ff',
    'br': '#ffff00',
  };
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const key = `${x < mid ? 't' : 'b'}${y < mid ? 'l' : 'r'}` as keyof typeof colors;
      // Fix: key mapping should be tl, tr, bl, br based on x and y position
      const actualKey = (x < mid ? 'l' : 'r') + (y < mid ? 't' : 'b');
      const colorMap: Record<string, string> = {
        lt: '#ff0000', // top-left
        rt: '#00ff00', // top-right
        lb: '#0000ff', // bottom-left
        rb: '#ffff00', // bottom-right
      };
      const hex = colorMap[actualKey] ?? '#808080';
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      const idx = (y * size + x) * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }
  return { data, width: size, height: size };
}

// ---------------------------------------------------------------------------
// Preset helpers
// ---------------------------------------------------------------------------

function makePreset(overrides: Partial<BlockGridPreset>): BlockGridPreset {
  return {
    id: 'test',
    name: 'Test',
    description: 'Test preset',
    cols: 1,
    rows: 1,
    blockPattern: 'single',
    thumbnail: '',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('segmentByPreset', () => {
  it('returns empty result for zero-dimension image', () => {
    const img = solidImage(0, 0, '#ff0000');
    const preset = makePreset({});
    const result = segmentByPreset(img, preset, 1, 1, 1, 1);
    expect(result.patches).toHaveLength(0);
    expect(result.palette).toHaveLength(0);
    expect(result.width).toBe(0);
    expect(result.height).toBe(0);
  });

  it('produces one patch for a 1×1 single preset on a solid image', () => {
    const img = solidImage(100, 100, '#ff0000');
    const preset = makePreset({ cols: 1, rows: 1, blockPattern: 'single' });
    const result = segmentByPreset(img, preset, 10, 10, 1, 1);
    expect(result.patches.length).toBeGreaterThanOrEqual(1);
    expect(result.palette.length).toBe(1);
    expect(result.palette[0].hex).toBe('#ff0000');
  });

  it('produces 4 patches for a 2×2 single preset', () => {
    const img = solidImage(100, 100, '#808080');
    const preset = makePreset({ cols: 2, rows: 2, blockPattern: 'single' });
    const result = segmentByPreset(img, preset, 10, 10, 2, 2);
    // Each cell is one patch in single mode
    expect(result.patches.length).toBe(4);
    expect(result.palette.length).toBe(1); // All same color
  });

  it('produces 2 sub-cells per block for HST pattern', () => {
    const img = solidImage(100, 100, '#aabbcc');
    const preset = makePreset({ cols: 1, rows: 1, blockPattern: 'hst' });
    const result = segmentByPreset(img, preset, 10, 10, 1, 1);
    // HST splits one cell into 2 triangles
    expect(result.patches.length).toBe(2);
    expect(result.palette.length).toBe(1); // Same color
  });

  it('produces 4 sub-cells per block for 4patch pattern', () => {
    const img = solidImage(120, 120, '#dddddd');
    const preset = makePreset({ cols: 1, rows: 1, blockPattern: '4patch' });
    const result = segmentByPreset(img, preset, 12, 12, 1, 1);
    expect(result.patches.length).toBe(4);
  });

  it('produces 9 sub-cells per block for 9patch pattern', () => {
    const img = solidImage(120, 120, '#eeeeee');
    const preset = makePreset({ cols: 1, rows: 1, blockPattern: '9patch' });
    const result = segmentByPreset(img, preset, 12, 12, 1, 1);
    expect(result.patches.length).toBe(9);
  });

  it('produces 4 sub-cells for QST pattern (both diagonals)', () => {
    const img = solidImage(100, 100, '#cccccc');
    const preset = makePreset({ cols: 1, rows: 1, blockPattern: 'qst' });
    const result = segmentByPreset(img, preset, 10, 10, 1, 1);
    expect(result.patches.length).toBe(4);
  });

  it('produces 4 sub-cells for pinwheel pattern', () => {
    const img = solidImage(100, 100, '#bbbbbb');
    const preset = makePreset({ cols: 1, rows: 1, blockPattern: 'pinwheel' });
    const result = segmentByPreset(img, preset, 10, 10, 1, 1);
    expect(result.patches.length).toBe(4);
  });

  it('produces 3 sub-cells for flying-geese pattern', () => {
    const img = solidImage(120, 60, '#aaaaaa');
    const preset = makePreset({ cols: 1, rows: 1, blockPattern: 'flying-geese' });
    const result = segmentByPreset(img, preset, 12, 6, 1, 1);
    expect(result.patches.length).toBe(3);
  });

  it('respects custom rows/cols for custom preset', () => {
    const img = solidImage(100, 100, '#999999');
    const preset = makePreset({ id: 'custom', cols: 0, rows: 0, blockPattern: 'single' });
    const result = segmentByPreset(img, preset, 10, 10, 5, 4);
    // 5 rows × 4 cols = 20 cells
    expect(result.patches.length).toBe(20);
    expect(result.palette.length).toBe(1);
  });

  it('falls back to defaults when custom rows/cols are zero', () => {
    const img = solidImage(100, 100, '#888888');
    const preset = makePreset({ id: 'custom', cols: 0, rows: 0, blockPattern: 'single' });
    const result = segmentByPreset(img, preset, 10, 10, 0, 0);
    // Defaults to 3×3 = 9
    expect(result.patches.length).toBe(9);
  });

  it('clusters different colors into separate palette entries', () => {
    const img = checkerboardImage(100);
    const preset = makePreset({ cols: 2, rows: 2, blockPattern: 'single' });
    const result = segmentByPreset(img, preset, 10, 10, 2, 2);
    // 4 quadrants, each a different color → 4 palette entries
    expect(result.palette.length).toBe(4);
    // Each patch maps to a different cluster
    const clusterIndices = new Set(result.patches.map((p) => p.clusterIndex));
    expect(clusterIndices.size).toBe(4);
  });

  it('includes library fabric matches when candidates provided', () => {
    const img = solidImage(100, 100, '#ff0000');
    const preset = makePreset({ cols: 1, rows: 1, blockPattern: 'single' });
    const result = segmentByPreset(img, preset, 10, 10, 1, 1, {
      libraryCandidates: [{ id: 'fab-1', hex: '#ff0000' }],
    });
    expect(result.palette[0].libraryFabricId).toBe('fab-1');
    expect(result.palette[0].libraryFabricDistance).toBe(0);
  });

  it('patch polygons have integer coordinates', () => {
    const img = solidImage(100, 100, '#777777');
    const preset = makePreset({ cols: 2, rows: 2, blockPattern: 'single' });
    const result = segmentByPreset(img, preset, 10, 10, 2, 2);
    for (const patch of result.patches) {
      for (const pt of patch.polygonPx) {
        expect(Number.isInteger(pt.x)).toBe(true);
        expect(Number.isInteger(pt.y)).toBe(true);
      }
    }
  });

  it('patch centroids are arithmetic means of vertices', () => {
    const img = solidImage(100, 100, '#666666');
    const preset = makePreset({ cols: 1, rows: 1, blockPattern: 'single' });
    const result = segmentByPreset(img, preset, 10, 10, 1, 1);
    const patch = result.patches[0];
    let cx = 0;
    let cy = 0;
    for (const pt of patch.polygonPx) {
      cx += pt.x;
      cy += pt.y;
    }
    const n = patch.polygonPx.length;
    expect(patch.centroidPx.x).toBeCloseTo(cx / n, 5);
    expect(patch.centroidPx.y).toBeCloseTo(cy / n, 5);
  });
});
