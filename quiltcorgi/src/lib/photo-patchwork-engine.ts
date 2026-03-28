/**
 * Photo Patchwork Engine — Pure logic for converting photos into quilt grids.
 *
 * All functions are pure and immutable: they accept inputs, return new data,
 * and never mutate their arguments. No React, no Fabric.js, no DOM dependencies.
 *
 * Pipeline: image data -> grid sampling -> k-means clustering -> quantized grid
 */

import type { RGB, LAB } from '@/lib/color-math';
import {
  rgbToLab,
  rgbToHex,
  hexToRgb,
  labDistance,
  averageColor,
  findClosestColor,
} from '@/lib/color-math';
import type {
  PhotoPatchworkConfig,
  ColorCluster,
  PatchworkCell,
  PatchworkGrid,
  FabricMapping,
} from '@/types/photo-patchwork';
import { photoPatchworkConfigSchema } from '@/lib/validation';

// ---------------------------------------------------------------------------
// ImageData-like input (no DOM dependency)
// ---------------------------------------------------------------------------

export interface ImageDataInput {
  readonly width: number;
  readonly height: number;
  readonly data: Uint8ClampedArray;
}

// ---------------------------------------------------------------------------
// Mulberry32 PRNG (matches colorway-engine.ts pattern)
// ---------------------------------------------------------------------------

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s += 0x6d2b79f5;
    let z = s;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 0x100000000;
  };
}

// ---------------------------------------------------------------------------
// sampleGridColors
// ---------------------------------------------------------------------------

/**
 * Sample the average color for each cell in a grid overlaid on the image.
 * Returns a 2D array indexed [row][col] of RGB values.
 */
export function sampleGridColors(
  imageData: ImageDataInput,
  gridWidth: number,
  gridHeight: number
): readonly (readonly RGB[])[] {
  const cellWidth = imageData.width / gridWidth;
  const cellHeight = imageData.height / gridHeight;

  const rows: (readonly RGB[])[] = [];

  for (let row = 0; row < gridHeight; row++) {
    const cols: RGB[] = [];
    for (let col = 0; col < gridWidth; col++) {
      const startX = Math.floor(col * cellWidth);
      const startY = Math.floor(row * cellHeight);
      const endX = Math.floor((col + 1) * cellWidth);
      const endY = Math.floor((row + 1) * cellHeight);

      let totalR = 0;
      let totalG = 0;
      let totalB = 0;
      let pixelCount = 0;

      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          const offset = (y * imageData.width + x) * 4;
          totalR += imageData.data[offset];
          totalG += imageData.data[offset + 1];
          totalB += imageData.data[offset + 2];
          pixelCount++;
        }
      }

      if (pixelCount === 0) {
        cols.push({ r: 0, g: 0, b: 0 });
      } else {
        cols.push({
          r: Math.round(totalR / pixelCount),
          g: Math.round(totalG / pixelCount),
          b: Math.round(totalB / pixelCount),
        });
      }
    }
    rows.push(cols);
  }

  return rows;
}

// ---------------------------------------------------------------------------
// kMeansClustering
// ---------------------------------------------------------------------------

/**
 * K-means++ clustering of RGB colors with CIE LAB distance.
 *
 * @param colors - Flat array of RGB colors to cluster
 * @param k - Number of clusters
 * @param maxIterations - Maximum iterations (default 20)
 * @param seed - Optional PRNG seed for deterministic results
 * @returns Clusters sorted by pixel count descending
 */
export function kMeansClustering(
  colors: readonly RGB[],
  k: number,
  maxIterations: number = 20,
  seed?: number
): readonly ColorCluster[] {
  if (colors.length === 0) {
    return [];
  }

  const clampedK = Math.min(k, colors.length);
  const rand = seed !== undefined ? mulberry32(seed) : Math.random.bind(Math);

  // Pre-compute LAB values for all colors
  const labColors = colors.map(rgbToLab);

  // K-means++ initialization
  const centroids = kMeansPlusPlusInit(labColors, clampedK, rand);

  // Iterative refinement
  let assignments = new Int32Array(colors.length);

  for (let iter = 0; iter < maxIterations; iter++) {
    // Assign each color to nearest centroid
    const newAssignments = new Int32Array(colors.length);
    for (let i = 0; i < labColors.length; i++) {
      let bestDist = Infinity;
      let bestCluster = 0;
      for (let c = 0; c < centroids.length; c++) {
        const d = labDistance(labColors[i], centroids[c]);
        if (d < bestDist) {
          bestDist = d;
          bestCluster = c;
        }
      }
      newAssignments[i] = bestCluster;
    }

    // Check for convergence
    let changed = false;
    for (let i = 0; i < assignments.length; i++) {
      if (assignments[i] !== newAssignments[i]) {
        changed = true;
        break;
      }
    }
    assignments = newAssignments;

    if (!changed && iter > 0) {
      break;
    }

    // Update centroids
    for (let c = 0; c < centroids.length; c++) {
      let sumL = 0;
      let sumA = 0;
      let sumB = 0;
      let count = 0;

      for (let i = 0; i < labColors.length; i++) {
        if (assignments[i] === c) {
          sumL += labColors[i].l;
          sumA += labColors[i].a;
          sumB += labColors[i].b;
          count++;
        }
      }

      if (count > 0) {
        centroids[c] = {
          l: sumL / count,
          a: sumA / count,
          b: sumB / count,
        };
      }
    }
  }

  // Build cluster results
  const totalPixels = colors.length;
  const clusterCounts = new Array<number>(centroids.length).fill(0);
  const clusterSumsR = new Array<number>(centroids.length).fill(0);
  const clusterSumsG = new Array<number>(centroids.length).fill(0);
  const clusterSumsB = new Array<number>(centroids.length).fill(0);

  for (let i = 0; i < colors.length; i++) {
    const c = assignments[i];
    clusterCounts[c]++;
    clusterSumsR[c] += colors[i].r;
    clusterSumsG[c] += colors[i].g;
    clusterSumsB[c] += colors[i].b;
  }

  const clusters: ColorCluster[] = [];
  for (let c = 0; c < centroids.length; c++) {
    if (clusterCounts[c] === 0) {
      continue;
    }

    const centroid: RGB = {
      r: Math.round(clusterSumsR[c] / clusterCounts[c]),
      g: Math.round(clusterSumsG[c] / clusterCounts[c]),
      b: Math.round(clusterSumsB[c] / clusterCounts[c]),
    };

    clusters.push({
      centroid,
      hex: rgbToHex(centroid),
      pixelCount: clusterCounts[c],
      percentage: (clusterCounts[c] / totalPixels) * 100,
    });
  }

  // Sort by pixel count descending
  return [...clusters].sort((a, b) => b.pixelCount - a.pixelCount);
}

// ---------------------------------------------------------------------------
// K-means++ initialization
// ---------------------------------------------------------------------------

function kMeansPlusPlusInit(labColors: readonly LAB[], k: number, rand: () => number): LAB[] {
  const centroids: LAB[] = [];

  // Pick first centroid randomly
  const firstIndex = Math.floor(rand() * labColors.length);
  centroids.push({ ...labColors[firstIndex] });

  // Pick remaining centroids with probability proportional to distance squared
  for (let c = 1; c < k; c++) {
    const distances = labColors.map((color) => {
      let minDist = Infinity;
      for (const centroid of centroids) {
        const d = labDistance(color, centroid);
        if (d < minDist) {
          minDist = d;
        }
      }
      return minDist * minDist;
    });

    const totalDist = distances.reduce((sum, d) => sum + d, 0);

    if (totalDist === 0) {
      // All points are identical; just duplicate the first centroid
      centroids.push({ ...centroids[0] });
      continue;
    }

    const threshold = rand() * totalDist;
    let cumulative = 0;
    let selectedIndex = 0;

    for (let i = 0; i < distances.length; i++) {
      cumulative += distances[i];
      if (cumulative >= threshold) {
        selectedIndex = i;
        break;
      }
    }

    centroids.push({ ...labColors[selectedIndex] });
  }

  return centroids;
}

// ---------------------------------------------------------------------------
// quantizeGrid
// ---------------------------------------------------------------------------

/**
 * Assign each grid cell to its nearest cluster centroid in LAB space.
 */
export function quantizeGrid(
  gridColors: readonly (readonly RGB[])[],
  clusters: readonly ColorCluster[]
): readonly PatchworkCell[] {
  if (clusters.length === 0) {
    return [];
  }

  const clusterLabs = clusters.map((c) => rgbToLab(c.centroid));
  const cells: PatchworkCell[] = [];

  for (let row = 0; row < gridColors.length; row++) {
    for (let col = 0; col < gridColors[row].length; col++) {
      const cellLab = rgbToLab(gridColors[row][col]);

      let bestIndex = 0;
      let bestDist = Infinity;

      for (let i = 0; i < clusterLabs.length; i++) {
        const d = labDistance(cellLab, clusterLabs[i]);
        if (d < bestDist) {
          bestDist = d;
          bestIndex = i;
        }
      }

      cells.push({
        row,
        col,
        color: clusters[bestIndex].hex,
        clusterId: bestIndex,
      });
    }
  }

  return cells;
}

// ---------------------------------------------------------------------------
// mapClustersToFabrics
// ---------------------------------------------------------------------------

/**
 * Map each cluster centroid to the closest available fabric color in LAB space.
 */
export function mapClustersToFabrics(
  clusters: readonly ColorCluster[],
  availableFabrics: readonly {
    readonly id: string;
    readonly name: string;
    readonly primaryColor: string;
  }[]
): readonly FabricMapping[] {
  if (availableFabrics.length === 0) {
    return [];
  }

  const fabricRgbs = availableFabrics.map((f) => hexToRgb(f.primaryColor));

  return clusters.map((cluster, index) => {
    const match = findClosestColor(cluster.centroid, fabricRgbs);
    const fabric = availableFabrics[match.index];

    return {
      clusterId: index,
      clusterHex: cluster.hex,
      fabricId: fabric.id,
      fabricName: fabric.name,
    };
  });
}

// ---------------------------------------------------------------------------
// generatePatchworkGrid (orchestrator)
// ---------------------------------------------------------------------------

/**
 * Full pipeline: sample -> cluster -> quantize -> optional fabric mapping.
 * Validates config with Zod before processing.
 */
export function generatePatchworkGrid(
  imageData: ImageDataInput,
  config: PhotoPatchworkConfig,
  fabrics?: readonly {
    readonly id: string;
    readonly name: string;
    readonly primaryColor: string;
  }[]
): PatchworkGrid {
  const validated = photoPatchworkConfigSchema.parse(config);

  const gridColors = sampleGridColors(imageData, validated.gridWidth, validated.gridHeight);

  // Flatten grid colors for clustering
  const flatColors: RGB[] = [];
  for (const row of gridColors) {
    for (const color of row) {
      flatColors.push(color);
    }
  }

  const clusters = kMeansClustering(
    flatColors,
    validated.colorCount,
    validated.maxIterations ?? 20
  );

  let cells = quantizeGrid(gridColors, clusters);

  // Apply fabric mappings if available
  if (fabrics && fabrics.length > 0) {
    const mappings = mapClustersToFabrics(clusters, fabrics);
    const mappingByCluster = new Map(mappings.map((m) => [m.clusterId, m]));

    cells = cells.map((cell) => {
      const mapping = mappingByCluster.get(cell.clusterId);
      if (mapping) {
        return {
          ...cell,
          fabricId: mapping.fabricId,
          fabricName: mapping.fabricName,
        };
      }
      return cell;
    });
  }

  return {
    rows: validated.gridHeight,
    cols: validated.gridWidth,
    cells,
    palette: clusters,
    totalPatches: validated.gridWidth * validated.gridHeight,
  };
}
