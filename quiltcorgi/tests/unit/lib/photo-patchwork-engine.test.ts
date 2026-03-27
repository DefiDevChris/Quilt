import { describe, it, expect } from 'vitest';
import {
  sampleGridColors,
  kMeansClustering,
  quantizeGrid,
  mapClustersToFabrics,
  generatePatchworkGrid,
} from '@/lib/photo-patchwork-engine';
import type { ImageDataInput } from '@/lib/photo-patchwork-engine';
import type { RGB } from '@/lib/color-math';
import { rgbToHex } from '@/lib/color-math';
import type { ColorCluster } from '@/types/photo-patchwork';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Create a solid-color ImageData with the given width, height, and RGBA values.
 */
function createSolidImage(
  width: number,
  height: number,
  r: number,
  g: number,
  b: number,
  a: number = 255
): ImageDataInput {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    data[i * 4] = r;
    data[i * 4 + 1] = g;
    data[i * 4 + 2] = b;
    data[i * 4 + 3] = a;
  }
  return { width, height, data };
}

/**
 * Create a two-color ImageData split vertically (left/right halves).
 */
function createTwoColorImage(
  width: number,
  height: number,
  colorA: RGB,
  colorB: RGB
): ImageDataInput {
  const data = new Uint8ClampedArray(width * height * 4);
  const halfWidth = Math.floor(width / 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 4;
      const color = x < halfWidth ? colorA : colorB;
      data[offset] = color.r;
      data[offset + 1] = color.g;
      data[offset + 2] = color.b;
      data[offset + 3] = 255;
    }
  }

  return { width, height, data };
}

// ---------------------------------------------------------------------------
// sampleGridColors
// ---------------------------------------------------------------------------

describe('sampleGridColors', () => {
  it('returns correct dimensions for 2x2 grid on a 4x4 image', () => {
    const image = createSolidImage(4, 4, 128, 128, 128);
    const grid = sampleGridColors(image, 2, 2);

    expect(grid.length).toBe(2); // 2 rows
    expect(grid[0].length).toBe(2); // 2 cols
    expect(grid[1].length).toBe(2);
  });

  it('computes correct average color for uniform image', () => {
    const image = createSolidImage(4, 4, 100, 150, 200);
    const grid = sampleGridColors(image, 2, 2);

    for (const row of grid) {
      for (const color of row) {
        expect(color.r).toBe(100);
        expect(color.g).toBe(150);
        expect(color.b).toBe(200);
      }
    }
  });

  it('detects different colors in left/right halves', () => {
    const red: RGB = { r: 255, g: 0, b: 0 };
    const blue: RGB = { r: 0, g: 0, b: 255 };
    const image = createTwoColorImage(4, 4, red, blue);
    const grid = sampleGridColors(image, 2, 2);

    // Left columns should be red
    expect(grid[0][0].r).toBe(255);
    expect(grid[0][0].b).toBe(0);

    // Right columns should be blue
    expect(grid[0][1].r).toBe(0);
    expect(grid[0][1].b).toBe(255);
  });

  it('handles 1x1 grid (entire image averaged)', () => {
    const image = createSolidImage(10, 10, 200, 100, 50);
    const grid = sampleGridColors(image, 1, 1);

    expect(grid.length).toBe(1);
    expect(grid[0].length).toBe(1);
    expect(grid[0][0]).toEqual({ r: 200, g: 100, b: 50 });
  });

  it('handles grid equal to image size (1 pixel per cell)', () => {
    const data = new Uint8ClampedArray([
      10, 20, 30, 255,  40, 50, 60, 255,
      70, 80, 90, 255,  100, 110, 120, 255,
    ]);
    const image: ImageDataInput = { width: 2, height: 2, data };
    const grid = sampleGridColors(image, 2, 2);

    expect(grid[0][0]).toEqual({ r: 10, g: 20, b: 30 });
    expect(grid[0][1]).toEqual({ r: 40, g: 50, b: 60 });
    expect(grid[1][0]).toEqual({ r: 70, g: 80, b: 90 });
    expect(grid[1][1]).toEqual({ r: 100, g: 110, b: 120 });
  });
});

// ---------------------------------------------------------------------------
// kMeansClustering
// ---------------------------------------------------------------------------

describe('kMeansClustering', () => {
  it('returns a single cluster for uniform input', () => {
    const colors: RGB[] = Array.from({ length: 100 }, () => ({
      r: 128,
      g: 128,
      b: 128,
    }));

    const clusters = kMeansClustering(colors, 1, 20, 42);
    expect(clusters.length).toBe(1);
    expect(clusters[0].centroid.r).toBe(128);
    expect(clusters[0].centroid.g).toBe(128);
    expect(clusters[0].centroid.b).toBe(128);
    expect(clusters[0].pixelCount).toBe(100);
    expect(clusters[0].percentage).toBeCloseTo(100, 1);
  });

  it('separates two distinct colors into 2 clusters', () => {
    const reds: RGB[] = Array.from({ length: 50 }, () => ({
      r: 255,
      g: 0,
      b: 0,
    }));
    const blues: RGB[] = Array.from({ length: 50 }, () => ({
      r: 0,
      g: 0,
      b: 255,
    }));
    const colors = [...reds, ...blues];

    const clusters = kMeansClustering(colors, 2, 20, 42);
    expect(clusters.length).toBe(2);

    // Both clusters should have 50 pixels
    expect(clusters[0].pixelCount).toBe(50);
    expect(clusters[1].pixelCount).toBe(50);

    // One centroid should be red-ish and the other blue-ish
    const hexes = clusters.map((c) => c.hex);
    const hasRed = hexes.some((h) => h === '#ff0000');
    const hasBlue = hexes.some((h) => h === '#0000ff');
    expect(hasRed).toBe(true);
    expect(hasBlue).toBe(true);
  });

  it('is sorted by pixel count descending', () => {
    const reds: RGB[] = Array.from({ length: 80 }, () => ({
      r: 255,
      g: 0,
      b: 0,
    }));
    const blues: RGB[] = Array.from({ length: 20 }, () => ({
      r: 0,
      g: 0,
      b: 255,
    }));
    const colors = [...reds, ...blues];

    const clusters = kMeansClustering(colors, 2, 20, 42);
    expect(clusters[0].pixelCount).toBeGreaterThanOrEqual(clusters[1].pixelCount);
  });

  it('returns empty array for empty input', () => {
    const clusters = kMeansClustering([], 3, 20, 42);
    expect(clusters).toEqual([]);
  });

  it('clamps k to number of input colors', () => {
    const colors: RGB[] = [
      { r: 255, g: 0, b: 0 },
      { r: 0, g: 255, b: 0 },
    ];

    // Request 10 clusters but only 2 colors
    const clusters = kMeansClustering(colors, 10, 20, 42);
    expect(clusters.length).toBeLessThanOrEqual(2);
  });

  it('respects maxIterations (does not exceed)', () => {
    const colors: RGB[] = Array.from({ length: 50 }, (_, i) => ({
      r: i * 5,
      g: i * 5,
      b: i * 5,
    }));

    // With 1 iteration, the result may differ from 20 iterations
    const clusters1 = kMeansClustering(colors, 3, 1, 42);
    const clusters20 = kMeansClustering(colors, 3, 20, 42);

    // Both should produce valid clusters
    expect(clusters1.length).toBeGreaterThan(0);
    expect(clusters20.length).toBeGreaterThan(0);
  });

  it('is deterministic with the same seed', () => {
    const colors: RGB[] = Array.from({ length: 100 }, (_, i) => ({
      r: i * 2,
      g: 255 - i * 2,
      b: 128,
    }));

    const clusters1 = kMeansClustering(colors, 4, 20, 12345);
    const clusters2 = kMeansClustering(colors, 4, 20, 12345);

    expect(clusters1).toEqual(clusters2);
  });

  it('produces different results with different seeds', () => {
    const colors: RGB[] = Array.from({ length: 100 }, (_, i) => ({
      r: i * 2,
      g: 255 - i * 2,
      b: 128,
    }));

    const clusters1 = kMeansClustering(colors, 4, 20, 111);
    const clusters2 = kMeansClustering(colors, 4, 20, 999);

    // Centroids should differ (not always guaranteed, but extremely likely
    // with different seeds and varied input)
    const hexes1 = clusters1.map((c) => c.hex).sort();
    const hexes2 = clusters2.map((c) => c.hex).sort();
    const allSame = hexes1.every((h, i) => h === hexes2[i]);

    // With 100 varied colors and 4 clusters, different seeds should produce
    // different centroids in the vast majority of cases
    expect(allSame).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// quantizeGrid
// ---------------------------------------------------------------------------

describe('quantizeGrid', () => {
  it('assigns cells to the nearest cluster', () => {
    const gridColors: readonly (readonly RGB[])[] = [
      [
        { r: 250, g: 5, b: 5 },     // near red
        { r: 5, g: 5, b: 250 },     // near blue
      ],
      [
        { r: 5, g: 5, b: 250 },     // near blue
        { r: 250, g: 5, b: 5 },     // near red
      ],
    ];

    const clusters: ColorCluster[] = [
      { centroid: { r: 255, g: 0, b: 0 }, hex: '#ff0000', pixelCount: 50, percentage: 50 },
      { centroid: { r: 0, g: 0, b: 255 }, hex: '#0000ff', pixelCount: 50, percentage: 50 },
    ];

    const cells = quantizeGrid(gridColors, clusters);

    expect(cells.length).toBe(4);
    expect(cells[0].clusterId).toBe(0); // red
    expect(cells[0].color).toBe('#ff0000');
    expect(cells[1].clusterId).toBe(1); // blue
    expect(cells[1].color).toBe('#0000ff');
    expect(cells[2].clusterId).toBe(1); // blue
    expect(cells[3].clusterId).toBe(0); // red
  });

  it('returns correct row and col indices', () => {
    const gridColors: readonly (readonly RGB[])[] = [
      [{ r: 0, g: 0, b: 0 }, { r: 0, g: 0, b: 0 }],
      [{ r: 0, g: 0, b: 0 }, { r: 0, g: 0, b: 0 }],
      [{ r: 0, g: 0, b: 0 }, { r: 0, g: 0, b: 0 }],
    ];

    const clusters: ColorCluster[] = [
      { centroid: { r: 0, g: 0, b: 0 }, hex: '#000000', pixelCount: 1, percentage: 100 },
    ];

    const cells = quantizeGrid(gridColors, clusters);
    expect(cells[0]).toMatchObject({ row: 0, col: 0 });
    expect(cells[1]).toMatchObject({ row: 0, col: 1 });
    expect(cells[2]).toMatchObject({ row: 1, col: 0 });
    expect(cells[3]).toMatchObject({ row: 1, col: 1 });
    expect(cells[4]).toMatchObject({ row: 2, col: 0 });
    expect(cells[5]).toMatchObject({ row: 2, col: 1 });
  });

  it('returns empty array for empty clusters', () => {
    const gridColors: readonly (readonly RGB[])[] = [
      [{ r: 0, g: 0, b: 0 }],
    ];
    const cells = quantizeGrid(gridColors, []);
    expect(cells).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// mapClustersToFabrics
// ---------------------------------------------------------------------------

describe('mapClustersToFabrics', () => {
  it('maps each cluster to nearest fabric color', () => {
    const clusters: ColorCluster[] = [
      { centroid: { r: 255, g: 0, b: 0 }, hex: '#ff0000', pixelCount: 50, percentage: 50 },
      { centroid: { r: 0, g: 0, b: 255 }, hex: '#0000ff', pixelCount: 50, percentage: 50 },
    ];

    const fabrics = [
      { id: 'f1', name: 'Cherry Red', primaryColor: '#ff0000' },
      { id: 'f2', name: 'Ocean Blue', primaryColor: '#0000ff' },
      { id: 'f3', name: 'Forest Green', primaryColor: '#00ff00' },
    ];

    const mappings = mapClustersToFabrics(clusters, fabrics);

    expect(mappings.length).toBe(2);
    expect(mappings[0].fabricId).toBe('f1');
    expect(mappings[0].fabricName).toBe('Cherry Red');
    expect(mappings[1].fabricId).toBe('f2');
    expect(mappings[1].fabricName).toBe('Ocean Blue');
  });

  it('returns empty array when no fabrics available', () => {
    const clusters: ColorCluster[] = [
      { centroid: { r: 255, g: 0, b: 0 }, hex: '#ff0000', pixelCount: 50, percentage: 100 },
    ];
    const mappings = mapClustersToFabrics(clusters, []);
    expect(mappings).toEqual([]);
  });

  it('maps to nearest fabric when no exact match exists', () => {
    const clusters: ColorCluster[] = [
      { centroid: { r: 200, g: 10, b: 10 }, hex: '#c80a0a', pixelCount: 100, percentage: 100 },
    ];

    const fabrics = [
      { id: 'f1', name: 'Bright Red', primaryColor: '#ff0000' },
      { id: 'f2', name: 'Deep Blue', primaryColor: '#0000cc' },
    ];

    const mappings = mapClustersToFabrics(clusters, fabrics);
    expect(mappings[0].fabricId).toBe('f1'); // Red is closer to (200,10,10)
  });

  it('preserves cluster IDs in mapping', () => {
    const clusters: ColorCluster[] = [
      { centroid: { r: 255, g: 0, b: 0 }, hex: '#ff0000', pixelCount: 50, percentage: 50 },
      { centroid: { r: 0, g: 255, b: 0 }, hex: '#00ff00', pixelCount: 50, percentage: 50 },
    ];

    const fabrics = [
      { id: 'f1', name: 'Red', primaryColor: '#ff0000' },
    ];

    const mappings = mapClustersToFabrics(clusters, fabrics);
    expect(mappings[0].clusterId).toBe(0);
    expect(mappings[1].clusterId).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// generatePatchworkGrid
// ---------------------------------------------------------------------------

describe('generatePatchworkGrid', () => {
  it('produces a valid grid from a uniform image', () => {
    const image = createSolidImage(8, 8, 128, 128, 128);
    const config = { gridWidth: 4, gridHeight: 4, colorCount: 2 };

    const grid = generatePatchworkGrid(image, config);

    expect(grid.rows).toBe(4);
    expect(grid.cols).toBe(4);
    expect(grid.totalPatches).toBe(16);
    expect(grid.cells.length).toBe(16);
    expect(grid.palette.length).toBeGreaterThan(0);
  });

  it('applies fabric mappings when fabrics are provided', () => {
    const image = createSolidImage(8, 8, 255, 0, 0);
    const config = { gridWidth: 4, gridHeight: 4, colorCount: 2 };
    const fabrics = [
      { id: 'f1', name: 'Cherry Red', primaryColor: '#ff0000' },
    ];

    const grid = generatePatchworkGrid(image, config, fabrics);

    // All cells should be mapped to the single red fabric
    for (const cell of grid.cells) {
      expect(cell.fabricId).toBe('f1');
      expect(cell.fabricName).toBe('Cherry Red');
    }
  });

  it('does not attach fabric info when no fabrics provided', () => {
    const image = createSolidImage(8, 8, 128, 128, 128);
    const config = { gridWidth: 4, gridHeight: 4, colorCount: 2 };

    const grid = generatePatchworkGrid(image, config);

    for (const cell of grid.cells) {
      expect(cell.fabricId).toBeUndefined();
      expect(cell.fabricName).toBeUndefined();
    }
  });

  it('throws on invalid config (gridWidth too small)', () => {
    const image = createSolidImage(8, 8, 128, 128, 128);
    const config = { gridWidth: 2, gridHeight: 4, colorCount: 8 };

    expect(() => generatePatchworkGrid(image, config)).toThrow();
  });

  it('throws on invalid config (gridHeight too large)', () => {
    const image = createSolidImage(8, 8, 128, 128, 128);
    const config = { gridWidth: 4, gridHeight: 100, colorCount: 8 };

    expect(() => generatePatchworkGrid(image, config)).toThrow();
  });

  it('throws on invalid config (colorCount out of range)', () => {
    const image = createSolidImage(8, 8, 128, 128, 128);
    const config = { gridWidth: 4, gridHeight: 4, colorCount: 0 };

    expect(() => generatePatchworkGrid(image, config)).toThrow();
  });

  it('uses maxIterations from config', () => {
    const image = createSolidImage(8, 8, 128, 128, 128);
    const config = {
      gridWidth: 4,
      gridHeight: 4,
      colorCount: 2,
      maxIterations: 5,
    };

    // Should not throw and produce valid results
    const grid = generatePatchworkGrid(image, config);
    expect(grid.cells.length).toBe(16);
  });

  it('handles minimum grid size (4x4)', () => {
    const image = createSolidImage(8, 8, 100, 200, 50);
    const config = { gridWidth: 4, gridHeight: 4, colorCount: 2 };

    const grid = generatePatchworkGrid(image, config);
    expect(grid.rows).toBe(4);
    expect(grid.cols).toBe(4);
    expect(grid.totalPatches).toBe(16);
  });

  it('handles maximum grid size (48x48)', () => {
    // Create a large enough image
    const image = createSolidImage(96, 96, 100, 200, 50);
    const config = { gridWidth: 48, gridHeight: 48, colorCount: 2 };

    const grid = generatePatchworkGrid(image, config);
    expect(grid.rows).toBe(48);
    expect(grid.cols).toBe(48);
    expect(grid.totalPatches).toBe(2304);
    expect(grid.cells.length).toBe(2304);
  });

  it('produces multiple palette colors for multicolor image', () => {
    const red: RGB = { r: 255, g: 0, b: 0 };
    const blue: RGB = { r: 0, g: 0, b: 255 };
    const image = createTwoColorImage(8, 8, red, blue);
    const config = { gridWidth: 4, gridHeight: 4, colorCount: 4 };

    const grid = generatePatchworkGrid(image, config);

    // Should have at least 2 distinct palette colors
    const uniqueHexes = new Set(grid.palette.map((c) => c.hex));
    expect(uniqueHexes.size).toBeGreaterThanOrEqual(2);
  });
});
