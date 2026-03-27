/**
 * Serendipity Engine — Pure computation functions for block combination.
 *
 * Extracts polygon geometry from Fabric.js block data, applies boolean
 * operations (intersection, union, difference) via polygon-clipping,
 * and converts results back to SVG path data and Fabric.js objects.
 */

import polygonClipping, { type MultiPolygon, type Polygon } from 'polygon-clipping';

export type VariationType = 'intersection' | 'union' | 'difference-ab' | 'difference-ba';

export interface BlockGeometry {
  blockId: string;
  blockName: string;
  polygons: MultiPolygon;
}

export interface GeneratedVariation {
  type: VariationType;
  label: string;
  svgPath: string;
  polygons: MultiPolygon;
  parentBlockIds: [string, string];
  parentBlockNames: [string, string];
}

export const VARIATION_LABELS: Record<VariationType, string> = {
  intersection: 'Intersection (A & B)',
  union: 'Union (A + B)',
  'difference-ab': 'A minus B',
  'difference-ba': 'B minus A',
};

/**
 * Extract polygon geometry from a Fabric.js block's data.
 * Handles Group objects containing Rect, Polygon, and Path primitives.
 * All coordinates are normalized to a 0-100 unit space.
 */
export function extractPolygons(
  blockId: string,
  blockName: string,
  fabricJsData: Record<string, unknown>
): BlockGeometry {
  const objects = (fabricJsData.objects ?? []) as Array<Record<string, unknown>>;
  const polygons: Polygon[] = [];

  for (const obj of objects) {
    const poly = objectToPolygon(obj);
    if (poly) {
      polygons.push(poly);
    }
  }

  // If no polygons extracted, create a default square
  if (polygons.length === 0) {
    polygons.push([
      [
        [0, 0],
        [100, 0],
        [100, 100],
        [0, 100],
        [0, 0],
      ],
    ]);
  }

  return {
    blockId,
    blockName,
    polygons: polygons.map((p) => [p]),
  };
}

/**
 * Convert a single Fabric.js object to a polygon-clipping Polygon.
 */
function objectToPolygon(obj: Record<string, unknown>): Polygon | null {
  const type = obj.type as string;
  const left = (obj.left as number) ?? 0;
  const top = (obj.top as number) ?? 0;
  const scaleX = (obj.scaleX as number) ?? 1;
  const scaleY = (obj.scaleY as number) ?? 1;

  switch (type) {
    case 'Rect':
    case 'rect': {
      const w = ((obj.width as number) ?? 0) * scaleX;
      const h = ((obj.height as number) ?? 0) * scaleY;
      return [
        [
          [left, top],
          [left + w, top],
          [left + w, top + h],
          [left, top + h],
          [left, top],
        ],
      ];
    }

    case 'Polygon':
    case 'polygon': {
      const points = obj.points as Array<{ x: number; y: number }> | undefined;
      if (!points || points.length < 3) return null;
      const ring = points.map(
        (p) => [left + p.x * scaleX, top + p.y * scaleY] as [number, number]
      );
      // Close the ring
      ring.push([...ring[0]] as [number, number]);
      return [ring];
    }

    case 'Path':
    case 'path': {
      // Approximate path as a polygon by sampling points
      const pathData = obj.path as Array<Array<string | number>> | undefined;
      if (!pathData) return null;
      const points = samplePathPoints(pathData, left, top, scaleX, scaleY);
      if (points.length < 3) return null;
      const ring = points.map((p) => [p.x, p.y] as [number, number]);
      ring.push([...ring[0]] as [number, number]);
      return [ring];
    }

    case 'Circle':
    case 'circle': {
      const radius = ((obj.radius as number) ?? 0) * scaleX;
      const cx = left + radius;
      const cy = top + radius;
      // Approximate circle as 24-gon
      const ring: Array<[number, number]> = [];
      for (let i = 0; i <= 24; i++) {
        const angle = (2 * Math.PI * i) / 24;
        ring.push([cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)]);
      }
      return [ring];
    }

    case 'Triangle':
    case 'triangle': {
      const w = ((obj.width as number) ?? 0) * scaleX;
      const h = ((obj.height as number) ?? 0) * scaleY;
      return [
        [
          [left + w / 2, top],
          [left + w, top + h],
          [left, top + h],
          [left + w / 2, top],
        ],
      ];
    }

    default:
      return null;
  }
}

/**
 * Sample points from SVG path data for polygon approximation.
 */
function samplePathPoints(
  pathData: Array<Array<string | number>>,
  offsetX: number,
  offsetY: number,
  scaleX: number,
  scaleY: number
): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  let curX = 0;
  let curY = 0;

  for (const segment of pathData) {
    const cmd = segment[0] as string;
    const nums = segment.slice(1).map(Number);

    switch (cmd) {
      case 'M':
      case 'L':
        curX = nums[0];
        curY = nums[1];
        points.push({
          x: offsetX + curX * scaleX,
          y: offsetY + curY * scaleY,
        });
        break;

      case 'm':
        curX += nums[0];
        curY += nums[1];
        points.push({
          x: offsetX + curX * scaleX,
          y: offsetY + curY * scaleY,
        });
        break;

      case 'l':
        curX += nums[0];
        curY += nums[1];
        points.push({
          x: offsetX + curX * scaleX,
          y: offsetY + curY * scaleY,
        });
        break;

      case 'C': {
        // Cubic bezier: sample 8 points along the curve
        const [cp1x, cp1y, cp2x, cp2y, endX, endY] = nums;
        for (let t = 0.125; t <= 1; t += 0.125) {
          const t2 = t * t;
          const t3 = t2 * t;
          const mt = 1 - t;
          const mt2 = mt * mt;
          const mt3 = mt2 * mt;
          const x = mt3 * curX + 3 * mt2 * t * cp1x + 3 * mt * t2 * cp2x + t3 * endX;
          const y = mt3 * curY + 3 * mt2 * t * cp1y + 3 * mt * t2 * cp2y + t3 * endY;
          points.push({
            x: offsetX + x * scaleX,
            y: offsetY + y * scaleY,
          });
        }
        curX = endX;
        curY = endY;
        break;
      }

      case 'Q': {
        // Quadratic bezier: sample 8 points
        const [qcpx, qcpy, qendX, qendY] = nums;
        for (let t = 0.125; t <= 1; t += 0.125) {
          const mt = 1 - t;
          const x = mt * mt * curX + 2 * mt * t * qcpx + t * t * qendX;
          const y = mt * mt * curY + 2 * mt * t * qcpy + t * t * qendY;
          points.push({
            x: offsetX + x * scaleX,
            y: offsetY + y * scaleY,
          });
        }
        curX = qendX;
        curY = qendY;
        break;
      }

      case 'Z':
      case 'z':
        // Close path — handled by ring closure
        break;
    }
  }

  return points;
}

/**
 * Generate four variations from two blocks using boolean polygon operations.
 */
export function generateVariations(
  blockA: BlockGeometry,
  blockB: BlockGeometry
): GeneratedVariation[] {
  const parentIds: [string, string] = [blockA.blockId, blockB.blockId];
  const parentNames: [string, string] = [blockA.blockName, blockB.blockName];

  // Merge all polygons for each block into a single MultiPolygon
  const multiA = mergeMultiPolygons(blockA.polygons);
  const multiB = mergeMultiPolygons(blockB.polygons);

  const variations: GeneratedVariation[] = [];

  // Intersection
  try {
    const result = polygonClipping.intersection(multiA, multiB);
    if (result.length > 0) {
      variations.push({
        type: 'intersection',
        label: VARIATION_LABELS.intersection,
        svgPath: multiPolygonToSvgPath(result),
        polygons: result,
        parentBlockIds: parentIds,
        parentBlockNames: parentNames,
      });
    }
  } catch {
    // Skip if operation fails (degenerate geometry)
  }

  // Union
  try {
    const result = polygonClipping.union(multiA, multiB);
    if (result.length > 0) {
      variations.push({
        type: 'union',
        label: VARIATION_LABELS.union,
        svgPath: multiPolygonToSvgPath(result),
        polygons: result,
        parentBlockIds: parentIds,
        parentBlockNames: parentNames,
      });
    }
  } catch {
    // Skip if operation fails
  }

  // Difference A - B
  try {
    const result = polygonClipping.difference(multiA, multiB);
    if (result.length > 0) {
      variations.push({
        type: 'difference-ab',
        label: VARIATION_LABELS['difference-ab'],
        svgPath: multiPolygonToSvgPath(result),
        polygons: result,
        parentBlockIds: parentIds,
        parentBlockNames: parentNames,
      });
    }
  } catch {
    // Skip if operation fails
  }

  // Difference B - A
  try {
    const result = polygonClipping.difference(multiB, multiA);
    if (result.length > 0) {
      variations.push({
        type: 'difference-ba',
        label: VARIATION_LABELS['difference-ba'],
        svgPath: multiPolygonToSvgPath(result),
        polygons: result,
        parentBlockIds: parentIds,
        parentBlockNames: parentNames,
      });
    }
  } catch {
    // Skip if operation fails
  }

  return variations;
}

/**
 * Merge an array of MultiPolygon arrays into a single MultiPolygon
 * by unioning them together.
 */
function mergeMultiPolygons(polygons: MultiPolygon[]): MultiPolygon {
  if (polygons.length === 0) return [];
  if (polygons.length === 1) return polygons[0];

  let merged = polygons[0];
  for (let i = 1; i < polygons.length; i++) {
    try {
      merged = polygonClipping.union(merged, polygons[i]);
    } catch {
      // If union fails, just concatenate
      merged = [...merged, ...polygons[i]];
    }
  }
  return merged;
}

/**
 * Convert a MultiPolygon result to an SVG path string.
 */
export function multiPolygonToSvgPath(mp: MultiPolygon): string {
  const parts: string[] = [];

  for (const polygon of mp) {
    for (const ring of polygon) {
      if (ring.length < 2) continue;
      const commands: string[] = [];
      commands.push(`M ${ring[0][0].toFixed(2)} ${ring[0][1].toFixed(2)}`);
      for (let i = 1; i < ring.length; i++) {
        commands.push(`L ${ring[i][0].toFixed(2)} ${ring[i][1].toFixed(2)}`);
      }
      commands.push('Z');
      parts.push(commands.join(' '));
    }
  }

  return parts.join(' ');
}

/**
 * Convert a MultiPolygon to Fabric.js-compatible path data.
 * Returns an object suitable for creating a fabric.Path.
 */
export function multiPolygonToFabricData(
  mp: MultiPolygon,
  name: string,
  parentBlockIds: [string, string]
): Record<string, unknown> {
  const svgPath = multiPolygonToSvgPath(mp);

  // Compute bounding box
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const polygon of mp) {
    for (const ring of polygon) {
      for (const [x, y] of ring) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  const width = maxX - minX;
  const height = maxY - minY;

  return {
    type: 'Path',
    path: svgPath,
    left: minX,
    top: minY,
    width: width || 100,
    height: height || 100,
    scaleX: 1,
    scaleY: 1,
    fill: '#D4883C',
    stroke: '#2D2D2D',
    strokeWidth: 1,
    _metadata: {
      generatedBy: 'serendipity',
      parentBlockIds,
      name,
    },
  };
}

/**
 * Generate a simple SVG string for a variation preview thumbnail.
 * Normalizes coordinates to fit within a 100x100 viewBox.
 */
export function variationToSvg(variation: GeneratedVariation): string {
  // Compute bounding box
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const polygon of variation.polygons) {
    for (const ring of polygon) {
      for (const [x, y] of ring) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  const w = maxX - minX || 100;
  const h = maxY - minY || 100;
  const padding = 5;

  return `<svg viewBox="${minX - padding} ${minY - padding} ${w + padding * 2} ${h + padding * 2}" xmlns="http://www.w3.org/2000/svg">
  <path d="${variation.svgPath}" fill="#D4883C" stroke="#2D2D2D" stroke-width="1" />
</svg>`;
}
