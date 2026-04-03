/**
 * Geometry Utilities
 * Canonical implementations for geometric computations.
 * Pure functions — no React, Fabric.js, or DOM dependencies.
 */

import type { Point } from '@/types/geometry';

export type { Point };

export interface BBox {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface BBoxWithMinMax extends BBox {
  readonly minX: number;
  readonly minY: number;
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
 * Compute bounding box with explicit minX/minY fields.
 * Used when callers need direct access to min coordinates.
 */
export function boundingBoxWithMinMax(
  points: ReadonlyArray<{ readonly x: number; readonly y: number }>
): BBoxWithMinMax {
  if (points.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0, minX: 0, minY: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
    minX,
    minY,
  };
}
