/**
 * Post-D: Shape classification.
 *
 * Groups same-shape patches into templates. Each template has a human-readable
 * name ("2\" Square", "HST 3\"", "Hexagon 2\"", etc.).
 *
 * Algorithm:
 *  1. Normalize each polygon (center, scale, rotate, reorder vertices).
 *  2. Group patches by vertex count.
 *  3. Pairwise compare using Hausdorff distance on canonical signatures.
 *  4. Build ShapeTemplate per cluster.
 *  5. Assign human-readable names.
 */

import type { ShapeTemplate, Point } from '@/types/photo-to-design';

interface ContourData {
  patchId: number;
  points: Point[];
  pixelPoints: Point[];
  centroid: Point;
  area: number;
}

interface ClassifiedPatch {
  patchId: number;
  templateId: string;
  dominantColor: string;
  colorPalette: [string, string, string];
  fabricSwatch: string;
}

interface ShapeCluster {
  templateId: string;
  name: string;
  normalizedPolygon: Point[];
  realWorldSize: { w: number; h: number };
  patchIds: number[];
}

const HAUSDORFF_THRESHOLD = 0.08;

/**
 * Classify shapes and build templates.
 *
 * @param contours  — contour data from the pipeline
 * @param colorData — extracted color data per patch
 * @returns { templates, patchesWithTemplates }
 */
export function classifyShapes(
  contours: ContourData[],
  colorData: Map<
    number,
    { dominantColor: string; colorPalette: [string, string, string]; fabricSwatch: string }
  >
): { templates: ShapeTemplate[]; patchesWithTemplates: ClassifiedPatch[] } {
  if (contours.length === 0) {
    return { templates: [], patchesWithTemplates: [] };
  }

  // Step 1: Normalize each polygon
  const normalized = contours.map((c) => ({
    ...c,
    normalized: normalizePolygon(c.points),
  }));

  // Step 2: Group by vertex count
  const byVertexCount = new Map<number, typeof normalized>();
  for (const n of normalized) {
    const vc = n.normalized.length;
    const group = byVertexCount.get(vc) || [];
    group.push(n);
    byVertexCount.set(vc, group);
  }

  // Step 3: Pairwise compare within each vertex-count group
  const clusters: ShapeCluster[] = [];

  for (const [, group] of byVertexCount) {
    const groupClusters = clusterGroup(group);
    clusters.push(...groupClusters);
  }

  // Step 4: Build templates
  const templates: ShapeTemplate[] = clusters.map((c) => ({
    id: c.templateId,
    name: c.name,
    normalizedPolygon: c.normalizedPolygon,
    realWorldSize: c.realWorldSize,
    instanceCount: c.patchIds.length,
    instanceIds: c.patchIds,
  }));

  // Step 5: Build classified patches
  const patchToTemplate = new Map<number, string>();
  for (const cluster of clusters) {
    for (const pid of cluster.patchIds) {
      patchToTemplate.set(pid, cluster.templateId);
    }
  }

  const patchesWithTemplates: ClassifiedPatch[] = contours.map((c) => {
    const colors = colorData.get(c.patchId);
    return {
      patchId: c.patchId,
      templateId: patchToTemplate.get(c.patchId) || `unknown-${c.patchId}`,
      dominantColor: colors?.dominantColor ?? '#888888',
      colorPalette: colors?.colorPalette ?? ['#888888', '#888888', '#888888'],
      fabricSwatch: colors?.fabricSwatch ?? '',
    };
  });

  return { templates, patchesWithTemplates };
}

// ── Polygon normalization ───────────────────────────────────────────────────

/**
 * Normalize a polygon to a canonical signature:
 *  1. Center on origin (subtract centroid).
 *  2. Scale so longest distance from center = 1.
 *  3. Rotate so the longest edge aligns to 0°.
 *  4. Start from the top-left-most vertex.
 */
function normalizePolygon(points: Point[]): Point[] {
  if (points.length < 3) return points;

  // 1. Compute centroid
  let cx = 0,
    cy = 0;
  for (const p of points) {
    cx += p.x;
    cy += p.y;
  }
  cx /= points.length;
  cy /= points.length;

  // 2. Center on origin
  const centered = points.map((p) => ({ x: p.x - cx, y: p.y - cy }));

  // 3. Scale (longest distance from center = 1)
  let maxDist = 0;
  for (const p of centered) {
    const d = Math.hypot(p.x, p.y);
    if (d > maxDist) maxDist = d;
  }
  if (maxDist === 0) return centered;
  const scaled = centered.map((p) => ({ x: p.x / maxDist, y: p.y / maxDist }));

  // 4. Rotate so longest edge aligns to 0°
  let longestEdgeAngle = 0;
  let longestEdgeLen = 0;
  for (let i = 0; i < scaled.length; i++) {
    const next = scaled[(i + 1) % scaled.length];
    const dx = next.x - scaled[i].x;
    const dy = next.y - scaled[i].y;
    const len = Math.hypot(dx, dy);
    if (len > longestEdgeLen) {
      longestEdgeLen = len;
      longestEdgeAngle = Math.atan2(dy, dx);
    }
  }

  const cos = Math.cos(-longestEdgeAngle);
  const sin = Math.sin(-longestEdgeAngle);
  const rotated = scaled.map((p) => ({
    x: p.x * cos - p.y * sin,
    y: p.x * sin + p.y * cos,
  }));

  // 5. Start from top-left-most vertex
  let startIdx = 0;
  let bestScore = Infinity;
  for (let i = 0; i < rotated.length; i++) {
    const score = rotated[i].y * 1000 + rotated[i].x; // prioritize top, then left
    if (score < bestScore) {
      bestScore = score;
      startIdx = i;
    }
  }

  const reordered = [...rotated.slice(startIdx), ...rotated.slice(0, startIdx)];

  return reordered;
}

// ── Clustering by Hausdorff distance ────────────────────────────────────────

function clusterGroup(group: Array<{ patchId: number; normalized: Point[] }>): ShapeCluster[] {
  const clusters: ShapeCluster[] = [];

  for (const item of group) {
    let assigned = false;

    for (const cluster of clusters) {
      // Compare against first member of cluster
      const representative = group.find((g) => g.patchId === cluster.patchIds[0]);
      if (!representative) continue;

      const dist = hausdorffDistance(item.normalized, representative.normalized);

      // Also check mirror image
      const mirrored = mirrorPolygon(item.normalized);
      const mirrorDist = hausdorffDistance(mirrored, representative.normalized);

      if (dist < HAUSDORFF_THRESHOLD || mirrorDist < HAUSDORFF_THRESHOLD) {
        cluster.patchIds.push(item.patchId);
        assigned = true;
        break;
      }
    }

    if (!assigned) {
      const templateId = `tpl-${item.patchId}`;
      const name = shapeName(item.normalized, item.patchId);
      const size = computeRealWorldSize(item.normalized);

      clusters.push({
        templateId,
        name,
        normalizedPolygon: item.normalized,
        realWorldSize: size,
        patchIds: [item.patchId],
      });
    }
  }

  // Rename templates with sequential IDs
  clusters.forEach((c, i) => {
    c.templateId = `tpl-${i + 1}`;
  });

  return clusters;
}

/**
 * Compute Hausdorff distance between two normalized polygons.
 * Both should have the same number of vertices for meaningful comparison.
 */
function hausdorffDistance(a: Point[], b: Point[]): number {
  if (a.length !== b.length) return Infinity;

  // Try all cyclic shifts of b
  let minDist = Infinity;

  for (let shift = 0; shift < b.length; shift++) {
    let maxDist = 0;
    for (let i = 0; i < a.length; i++) {
      const j = (i + shift) % b.length;
      const d = Math.hypot(a[i].x - b[j].x, a[i].y - b[j].y);
      if (d > maxDist) maxDist = d;
    }
    if (maxDist < minDist) minDist = maxDist;
  }

  return minDist;
}

function mirrorPolygon(points: Point[]): Point[] {
  return points.map((p) => ({ x: -p.x, y: p.y }));
}

// ── Shape naming ────────────────────────────────────────────────────────────

function shapeName(normalized: Point[], patchId: number): string {
  const n = normalized.length;

  if (n === 3) {
    // Check for right triangle
    if (hasRightAngle(normalized)) {
      const size = computeSize(normalized);
      return `HST ${roundSize(size)}"`;
    }
    return `Triangle ${patchId}`;
  }

  if (n === 4) {
    if (allRightAngles(normalized)) {
      const size = computeRealWorldSize(normalized);
      if (isNearlyEqual(size.w, size.h, 0.1)) {
        return `Square ${roundSize(size.w)}"`;
      }
      return `Rectangle ${roundSize(size.w)}"×${roundSize(size.h)}"`;
    }
    // Check for diamond/rhombus
    if (isRhombus(normalized)) {
      const size = computeSize(normalized);
      return `Diamond ${roundSize(size)}"`;
    }
    return `Quad ${patchId}`;
  }

  if (n === 6) {
    const size = computeSize(normalized);
    return `Hexagon ${roundSize(size)}"`;
  }

  if (n === 5) {
    const size = computeSize(normalized);
    return `Pentagon ${roundSize(size)}"`;
  }

  return `${n}-gon ${patchId}`;
}

function hasRightAngle(points: Point[]): boolean {
  for (let i = 0; i < points.length; i++) {
    const prev = points[(i - 1 + points.length) % points.length];
    const curr = points[i];
    const next = points[(i + 1) % points.length];

    const dx1 = prev.x - curr.x;
    const dy1 = prev.y - curr.y;
    const dx2 = next.x - curr.x;
    const dy2 = next.y - curr.y;

    // Dot product ≈ 0 for right angle
    const dot = dx1 * dx2 + dy1 * dy2;
    if (Math.abs(dot) < 0.05) return true;
  }
  return false;
}

function allRightAngles(points: Point[]): boolean {
  for (let i = 0; i < points.length; i++) {
    const prev = points[(i - 1 + points.length) % points.length];
    const curr = points[i];
    const next = points[(i + 1) % points.length];

    const dx1 = prev.x - curr.x;
    const dy1 = prev.y - curr.y;
    const dx2 = next.x - curr.x;
    const dy2 = next.y - curr.y;

    const dot = dx1 * dx2 + dy1 * dy2;
    if (Math.abs(dot) > 0.15) return false;
  }
  return true;
}

function isRhombus(points: Point[]): boolean {
  // Check if all sides are approximately equal
  const sides: number[] = [];
  for (let i = 0; i < points.length; i++) {
    const next = points[(i + 1) % points.length];
    sides.push(Math.hypot(next.x - points[i].x, next.y - points[i].y));
  }
  const avg = sides.reduce((a, b) => a + b, 0) / sides.length;
  return sides.every((s) => Math.abs(s - avg) / avg < 0.15);
}

function computeSize(points: Point[]): number {
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  return Math.max(maxX - minX, maxY - minY);
}

function computeRealWorldSize(points: Point[]): { w: number; h: number } {
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  return { w: maxX - minX, h: maxY - minY };
}

function isNearlyEqual(a: number, b: number, tolerance: number): boolean {
  const avg = (a + b) / 2;
  return avg === 0 || Math.abs(a - b) / avg < tolerance;
}

function roundSize(size: number): number {
  return Math.round(size * 4) / 4; // Round to nearest 1/4"
}
