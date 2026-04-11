/**
 * Grid Sampling Engine
 *
 * Given a flattened (perspective-corrected) ImageData of a single quilt
 * block, a `BlockGridPreset`, and a real-world block size in inches, this
 * engine produces the {@link GridCell}s that drive the review step and the
 * final canvas import.
 *
 * Two responsibilities:
 *   1. Generate inch-space polygons for every grid cell (including the
 *      diagonal splits used by Half-Square-Triangle presets).
 *   2. Sample a dominant color for each cell from the warped image via a
 *      tiny K-Means pass on the cell's pixels.
 *
 * Pure computation — zero DOM / Fabric.js / React dependencies. Testable in
 * Vitest.
 */

import type { BlockGridPreset, GridCell, Point2D } from './photo-layout-types';

// ── Cell Polygon Generation ───────────────────────────────────────────────

/**
 * Build the inch-space polygons for every cell in a block grid preset.
 *
 * - Plain cells are axis-aligned squares (or rectangles when the block is
 *   non-square).
 * - HST cells are returned as two right-triangle halves, each with its own
 *   id suffix (`-a` for the first, `-b` for the second).
 *
 * Coordinates are in inches, with the origin at the top-left of the block.
 */
export function buildCellPolygons(
  preset: BlockGridPreset,
  widthInches: number,
  heightInches: number
): ReadonlyArray<{
  id: string;
  row: number;
  col: number;
  polygonInches: readonly Point2D[];
  centroidInches: Point2D;
}> {
  const cellW = widthInches / preset.cols;
  const cellH = heightInches / preset.rows;
  const splitMap = new Map<string, 'tl-br' | 'tr-bl'>();
  for (const s of preset.splits ?? []) {
    splitMap.set(`${s.row},${s.col}`, s.split);
  }

  const out: ReturnType<typeof buildCellPolygons>[number][] = [];

  for (let r = 0; r < preset.rows; r++) {
    for (let c = 0; c < preset.cols; c++) {
      const x0 = c * cellW;
      const y0 = r * cellH;
      const x1 = x0 + cellW;
      const y1 = y0 + cellH;

      const split = splitMap.get(`${r},${c}`);
      if (!split) {
        const polygon: Point2D[] = [
          { x: x0, y: y0 },
          { x: x1, y: y0 },
          { x: x1, y: y1 },
          { x: x0, y: y1 },
        ];
        out.push({
          id: `cell-r${r}c${c}`,
          row: r,
          col: c,
          polygonInches: polygon,
          centroidInches: { x: x0 + cellW / 2, y: y0 + cellH / 2 },
        });
        continue;
      }

      if (split === 'tl-br') {
        // Upper-right triangle
        const a: Point2D[] = [
          { x: x0, y: y0 },
          { x: x1, y: y0 },
          { x: x1, y: y1 },
        ];
        // Lower-left triangle
        const b: Point2D[] = [
          { x: x0, y: y0 },
          { x: x1, y: y1 },
          { x: x0, y: y1 },
        ];
        out.push({
          id: `cell-r${r}c${c}-a`,
          row: r,
          col: c,
          polygonInches: a,
          centroidInches: centroidOf(a),
        });
        out.push({
          id: `cell-r${r}c${c}-b`,
          row: r,
          col: c,
          polygonInches: b,
          centroidInches: centroidOf(b),
        });
      } else {
        // tr-bl: triangles formed along the other diagonal
        // Upper-left triangle
        const a: Point2D[] = [
          { x: x0, y: y0 },
          { x: x1, y: y0 },
          { x: x0, y: y1 },
        ];
        // Lower-right triangle
        const b: Point2D[] = [
          { x: x1, y: y0 },
          { x: x1, y: y1 },
          { x: x0, y: y1 },
        ];
        out.push({
          id: `cell-r${r}c${c}-a`,
          row: r,
          col: c,
          polygonInches: a,
          centroidInches: centroidOf(a),
        });
        out.push({
          id: `cell-r${r}c${c}-b`,
          row: r,
          col: c,
          polygonInches: b,
          centroidInches: centroidOf(b),
        });
      }
    }
  }

  return out;
}

function centroidOf(polygon: readonly Point2D[]): Point2D {
  let sx = 0;
  let sy = 0;
  for (const p of polygon) {
    sx += p.x;
    sy += p.y;
  }
  return { x: sx / polygon.length, y: sy / polygon.length };
}

// ── Color Sampling ────────────────────────────────────────────────────────

/**
 * Standard K-Means on a fixed-size pixel array. Used per-cell to discover
 * the dominant color of each patch in the warped block image.
 *
 * @param pixels — Flat RGB array (length % 3 === 0)
 * @param k — Number of clusters to find
 * @param maxIters — Convergence cap
 * @returns The centroid of the largest cluster as an RGB triple.
 */
export function kMeansDominantRgb(
  pixels: number[],
  k: number = 3,
  maxIters: number = 8
): [number, number, number] {
  const n = pixels.length / 3;
  if (n === 0) return [0, 0, 0];
  if (n <= k) {
    return meanRgb(pixels);
  }

  // Deterministic k-means++-style init: pick evenly spaced samples.
  const centroids: number[][] = [];
  for (let i = 0; i < k; i++) {
    const idx = Math.floor((i * n) / k) * 3;
    centroids.push([pixels[idx], pixels[idx + 1], pixels[idx + 2]]);
  }

  const assignments = new Int32Array(n);
  for (let iter = 0; iter < maxIters; iter++) {
    // Assign each pixel to the nearest centroid.
    let changed = 0;
    for (let i = 0; i < n; i++) {
      const r = pixels[i * 3];
      const g = pixels[i * 3 + 1];
      const b = pixels[i * 3 + 2];
      let best = 0;
      let bestDist = Infinity;
      for (let c = 0; c < k; c++) {
        const dr = r - centroids[c][0];
        const dg = g - centroids[c][1];
        const db = b - centroids[c][2];
        const d = dr * dr + dg * dg + db * db;
        if (d < bestDist) {
          bestDist = d;
          best = c;
        }
      }
      if (assignments[i] !== best) {
        assignments[i] = best;
        changed++;
      }
    }
    if (changed === 0) break;

    // Recompute centroids.
    const sums = Array.from({ length: k }, () => [0, 0, 0]);
    const counts = new Int32Array(k);
    for (let i = 0; i < n; i++) {
      const c = assignments[i];
      sums[c][0] += pixels[i * 3];
      sums[c][1] += pixels[i * 3 + 1];
      sums[c][2] += pixels[i * 3 + 2];
      counts[c]++;
    }
    for (let c = 0; c < k; c++) {
      if (counts[c] > 0) {
        centroids[c] = [sums[c][0] / counts[c], sums[c][1] / counts[c], sums[c][2] / counts[c]];
      }
    }
  }

  // Return the centroid of the largest cluster.
  const counts = new Int32Array(k);
  for (let i = 0; i < n; i++) counts[assignments[i]]++;
  let largest = 0;
  for (let c = 1; c < k; c++) {
    if (counts[c] > counts[largest]) largest = c;
  }
  const [r, g, b] = centroids[largest];
  return [Math.round(r), Math.round(g), Math.round(b)];
}

function meanRgb(pixels: number[]): [number, number, number] {
  const n = pixels.length / 3;
  if (n === 0) return [0, 0, 0];
  let r = 0;
  let g = 0;
  let b = 0;
  for (let i = 0; i < n; i++) {
    r += pixels[i * 3];
    g += pixels[i * 3 + 1];
    b += pixels[i * 3 + 2];
  }
  return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// ── Point-in-Polygon ──────────────────────────────────────────────────────

function pointInPolygon(p: Point2D, polygon: readonly Point2D[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    const intersect =
      yi > p.y !== yj > p.y && p.x < ((xj - xi) * (p.y - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// ── Top-Level: Build GridCells with Sampled Colors ────────────────────────

export interface BuildGridCellsResult {
  readonly cells: readonly GridCell[];
  readonly preset: BlockGridPreset;
}

/**
 * Sample one RGB color per cell of the block and produce the full
 * {@link GridCell} list that drives the review step.
 *
 * Pixel sampling uses the warped image's pixel space, then K-Means on
 * whatever pixels actually fall inside the polygon (after scaling the
 * polygon from inches → warped pixels). For triangular halves we use the
 * same point-in-polygon test so each half gets a distinct color.
 */
export function buildGridCells(
  preset: BlockGridPreset,
  widthInches: number,
  heightInches: number,
  warped: ImageData | null
): BuildGridCellsResult {
  const polygons = buildCellPolygons(preset, widthInches, heightInches);

  // Null warped image: skip sampling and fall back to a neutral placeholder
  // (used by unit tests that don't bother generating pixels).
  if (!warped) {
    const cells: GridCell[] = polygons.map((p) => ({
      id: p.id,
      row: p.row,
      col: p.col,
      polygonInches: p.polygonInches,
      centroidInches: p.centroidInches,
      fabricColor: '#d4ccc4',
      assignedFabricId: null,
    }));
    return { cells, preset };
  }

  const scaleX = warped.width / widthInches;
  const scaleY = warped.height / heightInches;

  const cells: GridCell[] = polygons.map((p) => {
    // Transform polygon into warped pixel space.
    const pxPoly: Point2D[] = p.polygonInches.map((pt) => ({
      x: pt.x * scaleX,
      y: pt.y * scaleY,
    }));

    // Bounding box in warped pixel space for a cheap scan area.
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const pt of pxPoly) {
      if (pt.x < minX) minX = pt.x;
      if (pt.y < minY) minY = pt.y;
      if (pt.x > maxX) maxX = pt.x;
      if (pt.y > maxY) maxY = pt.y;
    }
    // Inset the bounding box slightly to avoid picking up neighbouring
    // seams — quilters usually have a visible stitch line right at the
    // cell boundary.
    const insetX = (maxX - minX) * 0.08;
    const insetY = (maxY - minY) * 0.08;
    minX = Math.max(0, Math.floor(minX + insetX));
    minY = Math.max(0, Math.floor(minY + insetY));
    maxX = Math.min(warped.width - 1, Math.ceil(maxX - insetX));
    maxY = Math.min(warped.height - 1, Math.ceil(maxY - insetY));

    const samples: number[] = [];
    // Subsample so very large cells don't blow up K-Means.
    const pxCount = Math.max(0, (maxX - minX) * (maxY - minY));
    const targetSamples = 900;
    const stride = Math.max(1, Math.floor(Math.sqrt(pxCount / targetSamples)));

    for (let y = minY; y <= maxY; y += stride) {
      for (let x = minX; x <= maxX; x += stride) {
        // Only accept pixels that actually fall inside the polygon — this
        // keeps triangular halves distinct.
        if (!pointInPolygon({ x, y }, pxPoly)) continue;
        const idx = (y * warped.width + x) * 4;
        samples.push(warped.data[idx], warped.data[idx + 1], warped.data[idx + 2]);
      }
    }

    const [r, g, b] = samples.length > 0 ? kMeansDominantRgb(samples, 3, 8) : [212, 204, 196];

    return {
      id: p.id,
      row: p.row,
      col: p.col,
      polygonInches: p.polygonInches,
      centroidInches: p.centroidInches,
      fabricColor: rgbToHex(r, g, b),
      assignedFabricId: null,
    };
  });

  return { cells, preset };
}

// ── Fabric Palette (for the review step swap UI) ──────────────────────────

/**
 * Collapse a list of grid cells into a palette of unique colors + counts.
 * The review step shows this as a legend and lets the user bulk-reassign
 * cells that share a color.
 */
export function buildFabricPalette(cells: readonly GridCell[]): ReadonlyArray<{
  color: string;
  count: number;
}> {
  const counts = new Map<string, number>();
  for (const cell of cells) {
    counts.set(cell.fabricColor, (counts.get(cell.fabricColor) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([color, count]) => ({ color, count }))
    .sort((a, b) => b.count - a.count);
}
