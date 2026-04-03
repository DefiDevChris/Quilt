/**
 * Symmetry Engine — Pure computation functions for auto-complete symmetry.
 *
 * Computes active zones, transformation matrices, and duplicated object
 * positions for Mirror X/Y/Both, Diagonal, and N-fold Radial symmetry.
 * All coordinates are in pixels. Callers handle Fabric.js integration.
 */

import { EPSILON } from './math-utils';
import type { Point2D } from '@/types/geometry';

export type SymmetryType = 'mirror-x' | 'mirror-y' | 'mirror-both' | 'diagonal' | 'radial';

export interface SymmetryConfig {
  type: SymmetryType;
  /** N-fold count for radial symmetry (2-12). Ignored for non-radial types. */
  foldCount: number;
  canvasWidth: number;
  canvasHeight: number;
}

export type { Point2D };

/** A polygon zone defined by its vertices (closed path). */
export interface ActiveZone {
  points: Point2D[];
  label: string;
}

/**
 * A 2D affine transform represented as [a, b, c, d, tx, ty].
 * Applies as: x' = a*x + c*y + tx, y' = b*x + d*y + ty
 */
export type AffineMatrix = [number, number, number, number, number, number];

/**
 * Describes a symmetry transformation to apply to an object.
 */
export interface SymmetryTransform {
  /** The original object data (caller-supplied opaque blob). */
  original: SerializedObject;
  /** The affine transform to apply. */
  transform: AffineMatrix;
  /** Whether to flip horizontally after transform. */
  flipX: boolean;
  /** Whether to flip vertically after transform. */
  flipY: boolean;
}

export interface SerializedObject {
  left: number;
  top: number;
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
  angle: number;
  [key: string]: unknown;
}

export interface SymmetryResult {
  /** New objects to add to the canvas (already transformed). */
  newObjects: SerializedObject[];
}

/**
 * Compute the active zone polygon for a given symmetry configuration.
 * The active zone is where the user designs; the engine mirrors/rotates
 * from this zone to fill the rest of the canvas.
 */
export function computeActiveZone(config: SymmetryConfig): ActiveZone {
  const { type, canvasWidth: w, canvasHeight: h, foldCount } = config;
  const cx = w / 2;
  const cy = h / 2;

  switch (type) {
    case 'mirror-x':
      // Active zone: top half
      return {
        points: [
          { x: 0, y: 0 },
          { x: w, y: 0 },
          { x: w, y: cy },
          { x: 0, y: cy },
        ],
        label: 'Top Half',
      };

    case 'mirror-y':
      // Active zone: left half
      return {
        points: [
          { x: 0, y: 0 },
          { x: cx, y: 0 },
          { x: cx, y: h },
          { x: 0, y: h },
        ],
        label: 'Left Half',
      };

    case 'mirror-both':
      // Active zone: top-left quadrant
      return {
        points: [
          { x: 0, y: 0 },
          { x: cx, y: 0 },
          { x: cx, y: cy },
          { x: 0, y: cy },
        ],
        label: 'Top-Left Quadrant',
      };

    case 'diagonal':
      // Active zone: upper-left triangle (above the main diagonal)
      return {
        points: [
          { x: 0, y: 0 },
          { x: w, y: 0 },
          { x: 0, y: h },
        ],
        label: 'Upper-Left Triangle',
      };

    case 'radial': {
      // Active zone: a pie slice of 360/N degrees starting from 12 o'clock
      const sliceAngle = (2 * Math.PI) / foldCount;
      // Start from -PI/2 (12 o'clock position, pointing up)
      const startAngle = -Math.PI / 2;
      // Radius large enough to cover the canvas
      const radius = Math.sqrt(cx * cx + cy * cy) * 1.1;

      const points: Point2D[] = [{ x: cx, y: cy }];
      // Generate arc points for smooth visualization
      const arcSteps = 20;
      for (let i = 0; i <= arcSteps; i++) {
        const angle = startAngle + (sliceAngle * i) / arcSteps;
        points.push({
          x: cx + radius * Math.cos(angle),
          y: cy + radius * Math.sin(angle),
        });
      }

      return {
        points,
        label: `${foldCount}-fold Radial Slice`,
      };
    }

    default:
      return { points: [], label: '' };
  }
}

/**
 * Check if a point (object center) falls within the active zone polygon.
 * Uses ray-casting algorithm.
 */
export function isPointInZone(point: Point2D, zone: ActiveZone): boolean {
  const { points } = zone;
  if (points.length < 3) return false;

  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i].x;
    const yi = points[i].y;
    const xj = points[j].x;
    const yj = points[j].y;

    const intersect =
      yi > point.y !== yj > point.y && point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Compute the transformation matrices needed for a symmetry operation.
 * Each matrix transforms objects from the active zone to a mirrored/rotated zone.
 */
export function computeTransforms(config: SymmetryConfig): AffineMatrix[] {
  const { type, canvasWidth: w, canvasHeight: h, foldCount } = config;
  const cx = w / 2;
  const cy = h / 2;

  switch (type) {
    case 'mirror-x':
      // Reflect across horizontal center: y' = h - y
      return [[1, 0, 0, -1, 0, h]];

    case 'mirror-y':
      // Reflect across vertical center: x' = w - x
      return [[-1, 0, 0, 1, w, 0]];

    case 'mirror-both':
      // Three transforms: mirror-y, mirror-x, and mirror-both (rotate 180)
      return [
        [-1, 0, 0, 1, w, 0], // Right half (mirror Y)
        [1, 0, 0, -1, 0, h], // Bottom-left (mirror X)
        [-1, 0, 0, -1, w, h], // Bottom-right (mirror both)
      ];

    case 'diagonal': {
      // Reflect across the main diagonal (y=x scaled to canvas):
      // x' = y * (w/h), y' = x * (h/w)
      // Guard against division by zero
      if (w === 0 || h === 0) {
        return [];
      }
      return [[0, h / w, w / h, 0, 0, 0]];
    }

    case 'radial': {
      // N-1 rotations around center by multiples of 360/N
      const transforms: AffineMatrix[] = [];
      const sliceAngle = (2 * Math.PI) / foldCount;

      for (let i = 1; i < foldCount; i++) {
        const angle = sliceAngle * i;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        // Rotate around center (cx, cy):
        // x' = cos*(x-cx) - sin*(y-cy) + cx
        // y' = sin*(x-cx) + cos*(y-cy) + cy
        const tx = cx - cos * cx + sin * cy;
        const ty = cy - sin * cx - cos * cy;
        transforms.push([cos, sin, -sin, cos, tx, ty]);
      }

      return transforms;
    }

    default:
      return [];
  }
}

/**
 * Apply an affine transform to an object's position and angle.
 * Returns a new serialized object with transformed coordinates.
 */
export function applyTransform(
  obj: SerializedObject,
  transform: AffineMatrix,
  symmetryType: SymmetryType
): SerializedObject {
  const [a, b, c, d, tx, ty] = transform;

  // Transform the object's center point
  // Fabric.js left/top is the object's origin (default: top-left corner)
  // We need to transform the center of the object
  const objCenterX = obj.left + (obj.width * obj.scaleX) / 2;
  const objCenterY = obj.top + (obj.height * obj.scaleY) / 2;

  const newCenterX = a * objCenterX + c * objCenterY + tx;
  const newCenterY = b * objCenterX + d * objCenterY + ty;

  // Compute new left/top from transformed center
  const newLeft = newCenterX - (obj.width * obj.scaleX) / 2;
  const newTop = newCenterY - (obj.height * obj.scaleY) / 2;

  // Compute new angle
  // The rotation part of the affine matrix: atan2(b, a) gives the rotation angle
  const transformAngle = Math.atan2(b, a) * (180 / Math.PI);
  let newAngle = obj.angle + transformAngle;

  // For reflection transforms, we need to handle the flip
  const det = a * d - b * c;
  const isReflection = det < 0;

  let flipX = false;
  let flipY = false;

  if (isReflection) {
    // Determine flip direction based on symmetry type
    if (symmetryType === 'mirror-x') {
      flipY = true;
      newAngle = -obj.angle;
    } else if (symmetryType === 'mirror-y') {
      flipX = true;
      newAngle = -obj.angle;
    } else if (symmetryType === 'mirror-both') {
      // Check which specific mirror this transform is
      if (Math.abs(a - -1) < EPSILON && Math.abs(d - 1) < EPSILON) {
        // Mirror Y transform
        flipX = true;
        newAngle = -obj.angle;
      } else if (Math.abs(a - 1) < EPSILON && Math.abs(d - -1) < EPSILON) {
        // Mirror X transform
        flipY = true;
        newAngle = -obj.angle;
      } else {
        // Both mirrors (180 rotation, which isn't a reflection)
        newAngle = obj.angle + 180;
      }
    } else if (symmetryType === 'diagonal') {
      // Diagonal reflection swaps axes
      flipX = true;
      newAngle = -obj.angle + 90;
    }
  }

  // Normalize angle to 0-360
  newAngle = ((newAngle % 360) + 360) % 360;

  return {
    ...obj,
    left: newLeft,
    top: newTop,
    angle: newAngle,
    flipX: obj.flipX !== undefined ? (obj.flipX as boolean) !== flipX : flipX,
    flipY: obj.flipY !== undefined ? (obj.flipY as boolean) !== flipY : flipY,
  };
}

/**
 * Apply symmetry to a set of objects within the active zone.
 * Returns new objects that should be added to the canvas.
 * The caller is responsible for:
 * 1. Pushing an undo state before calling this
 * 2. Filtering objects to only those in the active zone
 * 3. Adding the returned objects to the Fabric.js canvas
 */
export function applySymmetry(objects: SerializedObject[], config: SymmetryConfig): SymmetryResult {
  const transforms = computeTransforms(config);
  const newObjects: SerializedObject[] = [];

  for (const obj of objects) {
    for (const transform of transforms) {
      const transformed = applyTransform(obj, transform, config.type);
      newObjects.push(transformed);
    }
  }

  return { newObjects };
}

/**
 * Filter objects to those whose center falls within the active zone.
 */
export function filterObjectsInZone(
  objects: SerializedObject[],
  zone: ActiveZone
): SerializedObject[] {
  return objects.filter((obj) => {
    const centerX = obj.left + (obj.width * obj.scaleX) / 2;
    const centerY = obj.top + (obj.height * obj.scaleY) / 2;
    return isPointInZone({ x: centerX, y: centerY }, zone);
  });
}

/** Symmetry type display names for UI. */
export const SYMMETRY_TYPE_LABELS: Record<SymmetryType, string> = {
  'mirror-x': 'Mirror Horizontal (X-Axis)',
  'mirror-y': 'Mirror Vertical (Y-Axis)',
  'mirror-both': 'Quadrant (Both Axes)',
  diagonal: 'Diagonal',
  radial: 'Radial (N-Fold)',
};

/** Min/max for radial fold count. */
export const RADIAL_FOLD_MIN = 2;
export const RADIAL_FOLD_MAX = 12;
