export interface Point2D {
  x: number;
  y: number;
}

export interface BBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

const EMPTY_BBOX: BBox = { x: 0, y: 0, width: 0, height: 0 };

/**
 * Compute the axis-aligned bounding box of a flat array of points.
 * Returns `{x:0, y:0, width:0, height:0}` for an empty array.
 */
export function boundingBoxFromPoints(
  points: ReadonlyArray<{ readonly x: number; readonly y: number }>
): BBox {
  if (points.length === 0) return EMPTY_BBOX;

  let minX = points[0].x;
  let maxX = points[0].x;
  let minY = points[0].y;
  let maxY = points[0].y;

  for (let i = 1; i < points.length; i++) {
    const { x, y } = points[i];
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/**
 * Compute the axis-aligned bounding box spanning all points across
 * multiple paths (polygons). Returns `{x:0, y:0, width:0, height:0}` when empty.
 */
export function boundingBoxFromPaths(
  paths: ReadonlyArray<ReadonlyArray<{ readonly x: number; readonly y: number }>>
): BBox {
  if (paths.length === 0 || paths.every((p) => p.length === 0)) return EMPTY_BBOX;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const path of paths) {
    for (const point of path) {
      if (point.x < minX) minX = point.x;
      if (point.y < minY) minY = point.y;
      if (point.x > maxX) maxX = point.x;
      if (point.y > maxY) maxY = point.y;
    }
  }

  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/**
 * Extract polygon geometry from a Fabric.js canvas object.
 *
 * Handles polygon, rect, triangle, path, group, and circle types.
 * Returns an array of polygons (each polygon is an array of Point2D vertices).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function extractObjectGeometry(obj: any): Point2D[][] {
  if (obj.type === 'polygon' && Array.isArray(obj.points)) {
    return [
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      obj.points.map((p: any) => ({
        x: p.x + (obj.left ?? 0),
        y: p.y + (obj.top ?? 0),
      })),
    ];
  }
  if (obj.type === 'rect') {
    const l = obj.left ?? 0;
    const t = obj.top ?? 0;
    const w = (obj.width ?? 0) * (obj.scaleX ?? 1);
    const h = (obj.height ?? 0) * (obj.scaleY ?? 1);
    return [
      [
        { x: l, y: t },
        { x: l + w, y: t },
        { x: l + w, y: t + h },
        { x: l, y: t + h },
      ],
    ];
  }
  if (obj.type === 'triangle') {
    const l = obj.left ?? 0;
    const t = obj.top ?? 0;
    const w = (obj.width ?? 0) * (obj.scaleX ?? 1);
    const h = (obj.height ?? 0) * (obj.scaleY ?? 1);
    return [
      [
        { x: l + w / 2, y: t },
        { x: l + w, y: t + h },
        { x: l, y: t + h },
      ],
    ];
  }
  if (obj.type === 'path' || obj.type === 'group' || obj.type === 'circle') {
    const bounds = obj.getBoundingRect?.() ?? { left: 0, top: 0, width: 100, height: 100 };
    return [
      [
        { x: bounds.left, y: bounds.top },
        { x: bounds.left + bounds.width, y: bounds.top },
        { x: bounds.left + bounds.width, y: bounds.top + bounds.height },
        { x: bounds.left, y: bounds.top + bounds.height },
      ],
    ];
  }
  return [];
}
