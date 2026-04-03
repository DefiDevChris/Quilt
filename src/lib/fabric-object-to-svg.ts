/**
 * Fabric Object to SVG Converter
 *
 * Extracts SVG path data from Fabric.js objects using duck-typing.
 * Bridges the canvas world to the pure piece inspector engine.
 *
 * ZERO Fabric.js imports — uses duck-typing to detect object types.
 * Safe for Node test environments.
 *
 * Pure computation — no React, DOM, or Fabric.js dependency.
 */

// ── Internal Types ────────────────────────────────────────────────

interface PointLike {
  readonly x: number;
  readonly y: number;
}

/**
 * Duck-typed Fabric.js object interface.
 * We check for properties rather than importing Fabric types.
 */
interface FabricLike {
  readonly type?: string;
  readonly width?: number;
  readonly height?: number;
  readonly left?: number;
  readonly top?: number;
  readonly rx?: number;
  readonly ry?: number;
  readonly radius?: number;
  readonly points?: readonly PointLike[];
  readonly path?: ReadonlyArray<readonly (string | number)[]>;
  readonly _objects?: readonly FabricLike[];
  readonly scaleX?: number;
  readonly scaleY?: number;
}

// ── Constants ─────────────────────────────────────────────────────

const CIRCLE_SEGMENTS = 32;
const TWO_PI = Math.PI * 2;

// ── Internal Helpers ──────────────────────────────────────────────

function getEffectiveDimensions(obj: FabricLike): {
  width: number;
  height: number;
  left: number;
  top: number;
} {
  const scaleX = obj.scaleX ?? 1;
  const scaleY = obj.scaleY ?? 1;
  return {
    width: (obj.width ?? 0) * scaleX,
    height: (obj.height ?? 0) * scaleY,
    left: obj.left ?? 0,
    top: obj.top ?? 0,
  };
}

function pointsToPathData(points: readonly PointLike[], close: boolean): string {
  if (points.length === 0) return '';
  const parts = [`M ${points[0].x} ${points[0].y}`];
  for (let i = 1; i < points.length; i++) {
    parts.push(`L ${points[i].x} ${points[i].y}`);
  }
  if (close) {
    parts.push('Z');
  }
  return parts.join(' ');
}

/**
 * Convert a Fabric.js path array to an SVG path d string.
 * Each element in the path array is a tuple like ['M', x, y] or ['C', ...].
 */
function fabricPathToSvgD(path: ReadonlyArray<readonly (string | number)[]>): string {
  return path.map((segment) => segment.join(' ')).join(' ');
}

/**
 * Approximate a circle as a polygon with the given number of segments.
 */
function circleToPolygonPoints(
  cx: number,
  cy: number,
  radius: number,
  segments: number = CIRCLE_SEGMENTS
): PointLike[] {
  const points: PointLike[] = [];
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * TWO_PI;
    points.push({
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    });
  }
  return points;
}

/**
 * Approximate an ellipse as a polygon with the given number of segments.
 */
function ellipseToPolygonPoints(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  segments: number = CIRCLE_SEGMENTS
): PointLike[] {
  const points: PointLike[] = [];
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * TWO_PI;
    points.push({
      x: cx + rx * Math.cos(angle),
      y: cy + ry * Math.sin(angle),
    });
  }
  return points;
}

/**
 * Detect object type via duck-typing.
 * Checks the `type` property first, then falls back to shape-specific properties.
 */
function detectObjectType(
  obj: FabricLike
): 'rect' | 'triangle' | 'polygon' | 'polyline' | 'path' | 'group' | 'circle' | 'ellipse' | null {
  const typeLower = (obj.type ?? '').toLowerCase();

  // Check explicit type property
  if (typeLower === 'rect' || typeLower === 'rectangle') return 'rect';
  if (typeLower === 'triangle') return 'triangle';
  if (typeLower === 'polygon') return 'polygon';
  if (typeLower === 'polyline') return 'polyline';
  if (typeLower === 'path') return 'path';
  if (typeLower === 'group' || typeLower === 'activeselection') return 'group';
  if (typeLower === 'circle') return 'circle';
  if (typeLower === 'ellipse') return 'ellipse';

  // Duck-type fallback: check for shape-specific properties
  if (obj.path != null && Array.isArray(obj.path)) return 'path';
  if (obj._objects != null && Array.isArray(obj._objects)) return 'group';
  if (obj.points != null && Array.isArray(obj.points)) return 'polygon';
  if (obj.radius != null && typeof obj.radius === 'number') return 'circle';
  if (obj.rx != null && obj.ry != null) return 'ellipse';

  // Rect-like: has width/height but no other shape markers
  if (
    obj.width != null &&
    obj.height != null &&
    obj.path == null &&
    obj.points == null &&
    obj.radius == null
  ) {
    return 'rect';
  }

  return null;
}

// ── Converters ────────────────────────────────────────────────────

function rectToSvg(obj: FabricLike): string {
  const { width, height, left, top } = getEffectiveDimensions(obj);
  const points: PointLike[] = [
    { x: left, y: top },
    { x: left + width, y: top },
    { x: left + width, y: top + height },
    { x: left, y: top + height },
  ];
  return pointsToPathData(points, true);
}

function triangleToSvg(obj: FabricLike): string {
  const { width, height, left, top } = getEffectiveDimensions(obj);
  // Standard Fabric.js triangle: top-center, bottom-left, bottom-right
  const points: PointLike[] = [
    { x: left + width / 2, y: top },
    { x: left + width, y: top + height },
    { x: left, y: top + height },
  ];
  return pointsToPathData(points, true);
}

function polygonToSvg(obj: FabricLike): string | null {
  const points = obj.points;
  if (!points || points.length < 3) return null;
  return pointsToPathData(points, true);
}

function polylineToSvg(obj: FabricLike): string | null {
  const points = obj.points;
  if (!points || points.length < 2) return null;
  return pointsToPathData(points, false);
}

function pathToSvg(obj: FabricLike): string | null {
  const path = obj.path;
  if (!path || !Array.isArray(path) || path.length === 0) return null;
  return fabricPathToSvgD(path);
}

function circleToSvg(obj: FabricLike): string {
  const { left, top } = getEffectiveDimensions(obj);
  const radius = (obj.radius ?? 0) * (obj.scaleX ?? 1);
  const cx = left + radius;
  const cy = top + radius;
  const points = circleToPolygonPoints(cx, cy, radius, CIRCLE_SEGMENTS);
  return pointsToPathData(points, true);
}

function ellipseToSvg(obj: FabricLike): string {
  const { left, top } = getEffectiveDimensions(obj);
  const rx = (obj.rx ?? 0) * (obj.scaleX ?? 1);
  const ry = (obj.ry ?? 0) * (obj.scaleY ?? 1);
  const cx = left + rx;
  const cy = top + ry;
  const points = ellipseToPolygonPoints(cx, cy, rx, ry, CIRCLE_SEGMENTS);
  return pointsToPathData(points, true);
}

function groupToSvg(obj: FabricLike): string | null {
  const children = obj._objects;
  if (!children || !Array.isArray(children) || children.length === 0) return null;

  const paths: string[] = [];
  for (const child of children) {
    const childSvg = convertSingleObject(child);
    if (childSvg) {
      paths.push(childSvg);
    }
  }

  if (paths.length === 0) return null;
  return paths.join(' ');
}

function convertSingleObject(obj: FabricLike): string | null {
  const objType = detectObjectType(obj);
  if (objType === null) return null;

  switch (objType) {
    case 'rect':
      return rectToSvg(obj);
    case 'triangle':
      return triangleToSvg(obj);
    case 'polygon':
      return polygonToSvg(obj);
    case 'polyline':
      return polylineToSvg(obj);
    case 'path':
      return pathToSvg(obj);
    case 'circle':
      return circleToSvg(obj);
    case 'ellipse':
      return ellipseToSvg(obj);
    case 'group':
      return groupToSvg(obj);
    default:
      return null;
  }
}

// ── Public API ────────────────────────────────────────────────────

/**
 * Convert any Fabric.js object to SVG path data suitable for the
 * piece inspector engine.
 *
 * Uses duck-typing to detect object types (checks `type` property
 * and shape-specific properties like `points`, `path`, `rx`).
 * Does NOT import Fabric at module level — works in Node test environments.
 *
 * Supported object types:
 * - Rect -> 4-point polygon path
 * - Triangle -> 3-point polygon path
 * - Polygon / Polyline -> extract points directly
 * - Path -> extract path data string
 * - Group -> recurse into children, combine
 * - Circle / Ellipse -> approximate as polygon (32 segments)
 *
 * @param obj - A Fabric.js object (typed as unknown for decoupling)
 * @returns SVG path data string, or null for unsupported types
 */
export function fabricObjectToSvgData(obj: unknown): string | null {
  if (obj == null || typeof obj !== 'object') return null;
  return convertSingleObject(obj as FabricLike);
}
