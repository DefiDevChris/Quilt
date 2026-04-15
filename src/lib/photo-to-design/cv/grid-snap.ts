/**
 * Post-B: Grid snapping.
 *
 * If grid confidence > 0.5 and gridSnapEnabled, snap contour vertices to
 * nearest grid line intersections. This ensures clean topology: vertices
 * from different patches that land on the same intersection become identical.
 *
 * If no grid detected, apply light regularization:
 *   - Snap edges to dominant angles (within 5°)
 *   - Merge vertices within 3px across all patches (union-find)
 */

import type { DetectedGrid, Point, ProcessParams } from '@/types/photo-to-design';

interface ContourData {
  patchId: number;
  points: Point[];
  pixelPoints: Point[];
  centroid: Point;
  area: number;
}

/**
 * Snap contour vertices to grid or apply regularization.
 */
export function snapToGrid(
  contours: ContourData[],
  grid: DetectedGrid,
  params: ProcessParams
): ContourData[] {
  if (grid.confidence > 0.5 && params.gridSnapEnabled && grid.spacings.length >= 2) {
    return snapToGridIntersections(contours, grid, params);
  }

  return applyRegularization(contours, grid);
}

// ── Grid intersection snapping ──────────────────────────────────────────────

function snapToGridIntersections(
  contours: ContourData[],
  grid: DetectedGrid,
  params: ProcessParams
): ContourData[] {
  const tolerance = params.gridSnapTolerance;

  // Compute grid line intersections from spacings
  const intersections = computeGridIntersections(grid);

  // Snap each vertex to nearest intersection
  return contours.map((c) => {
    const snapped = c.points.map((p) => {
      let bestDist = tolerance;
      let bestPoint: Point | null = null;

      for (const inter of intersections) {
        const dist = Math.hypot(p.x - inter.x, p.y - inter.y);
        if (dist < bestDist) {
          bestDist = dist;
          bestPoint = inter;
        }
      }

      return bestPoint ?? p;
    });

    return { ...c, points: snapped };
  });
}

function computeGridIntersections(grid: DetectedGrid): Point[] {
  if (grid.spacings.length < 2) return [];

  // Assume grid lines pass through origin and are spaced by the mean spacing
  const [groupA, groupB] = grid.spacings;
  const angleA = (groupA.angle * Math.PI) / 180;
  const angleB = (groupB.angle * Math.PI) / 180;

  const intersections: Point[] = [];
  const maxLines = 50;

  // Generate lines from both families and compute intersections
  const linesA = generateLines(angleA, groupA.spacing, maxLines);
  const linesB = generateLines(angleB, groupB.spacing, maxLines);

  for (const la of linesA) {
    for (const lb of linesB) {
      const pt = lineIntersection(la, lb);
      if (pt) {
        intersections.push(pt);
      }
    }
  }

  return intersections;
}

interface Line {
  point: Point;
  angle: number;
}

function generateLines(angle: number, spacing: number, maxLines: number): Line[] {
  const lines: Line[] = [];
  const perpX = -Math.sin(angle);
  const perpY = Math.cos(angle);

  for (let i = -Math.floor(maxLines / 2); i < Math.ceil(maxLines / 2); i++) {
    lines.push({
      point: { x: perpX * spacing * i, y: perpY * spacing * i },
      angle,
    });
  }

  return lines;
}

function lineIntersection(a: Line, b: Line): Point | null {
  const dx1 = Math.cos(a.angle);
  const dy1 = Math.sin(a.angle);
  const dx2 = Math.cos(b.angle);
  const dy2 = Math.sin(b.angle);

  const denom = dx1 * dy2 - dy1 * dx2;
  if (Math.abs(denom) < 1e-6) return null;

  const dx = b.point.x - a.point.x;
  const dy = b.point.y - a.point.y;
  const t = (dx * dy2 - dy * dx2) / denom;

  return {
    x: a.point.x + t * dx1,
    y: a.point.y + t * dy1,
  };
}

// ── Light regularization (no grid) ──────────────────────────────────────────

function applyRegularization(
  contours: ContourData[],
  grid: DetectedGrid
): ContourData[] {
  const dominantAngles = grid.dominantAngles.map((a) => (a * Math.PI) / 180);

  // Snap edges to dominant angles (within 5°)
  const angleSnapped = contours.map((c) => {
    const snapped = c.points.map((p, i) => {
      const prev = c.points[(i - 1 + c.points.length) % c.points.length];
      const next = c.points[(i + 1) % c.points.length];

      // Edge angle
      const edgeAngle = Math.atan2(next.y - prev.y, next.x - prev.x);

      // Check if close to any dominant angle
      for (const da of dominantAngles) {
        const diff = Math.abs(angleDiff(edgeAngle, da));
        if (diff < (5 * Math.PI) / 180) {
          // Snap to dominant angle — project vertex onto line
          return snapToAngle(p, prev, da);
        }
      }

      return p;
    });

    return { ...c, points: snapped };
  });

  // Merge vertices within 3px across all patches (union-find)
  return mergeCloseVertices(angleSnapped, 3);
}

function snapToAngle(point: Point, anchor: Point, angle: number): Point {
  // Project point onto line through anchor at given angle
  const dx = point.x - anchor.x;
  const dy = point.y - anchor.y;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const t = dx * cos + dy * sin;

  return {
    x: anchor.x + t * cos,
    y: anchor.y + t * sin,
  };
}

function angleDiff(a: number, b: number): number {
  let diff = Math.abs(a - b) % Math.PI;
  if (diff > Math.PI / 2) diff = Math.PI - diff;
  return diff;
}

// ── Union-find for vertex merging ───────────────────────────────────────────

function mergeCloseVertices(
  contours: ContourData[],
  threshold: number
): ContourData[] {
  // Collect all unique vertices and build equivalence classes
  const allVertices: Array<{ x: number; y: number; contourIdx: number; vertexIdx: number }> = [];

  contours.forEach((c, ci) => {
    c.points.forEach((p, vi) => {
      allVertices.push({ x: p.x, y: p.y, contourIdx: ci, vertexIdx: vi });
    });
  });

  // Union-find
  const parent = allVertices.map((_, i) => i);

  function find(i: number): number {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]];
      i = parent[i];
    }
    return i;
  }

  function union(i: number, j: number) {
    parent[find(i)] = find(j);
  }

  // Compare vertices within threshold
  for (let i = 0; i < allVertices.length; i++) {
    for (let j = i + 1; j < allVertices.length; j++) {
      const dist = Math.hypot(allVertices[i].x - allVertices[j].x, allVertices[i].y - allVertices[j].y);
      if (dist < threshold) {
        union(i, j);
      }
    }
  }

  // Compute centroids for each equivalence class
  const centroids = new Map<number, Point>();
  const counts = new Map<number, number>();

  for (let i = 0; i < allVertices.length; i++) {
    const root = find(i);
    const v = allVertices[i];
    const c = centroids.get(root) ?? { x: 0, y: 0 };
    c.x += v.x;
    c.y += v.y;
    centroids.set(root, c);
    counts.set(root, (counts.get(root) || 0) + 1);
  }

  for (const [root, c] of centroids) {
    const count = counts.get(root) || 1;
    c.x /= count;
    c.y /= count;
  }

  // Apply merged positions
  const result = contours.map((c) => ({ ...c, points: [...c.points] }));

  for (let i = 0; i < allVertices.length; i++) {
    const { contourIdx, vertexIdx } = allVertices[i];
    const root = find(i);
    const merged = centroids.get(root);
    if (merged) {
      result[contourIdx].points[vertexIdx] = { ...merged };
    }
  }

  return result;
}
