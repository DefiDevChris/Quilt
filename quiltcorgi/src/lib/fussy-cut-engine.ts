/**
 * Fussy Cut Engine — Pure logic for per-patch fabric positioning.
 *
 * Converts FussyCutConfig values to 2D affine transform matrices suitable
 * for Fabric.js patternTransform, computes patch bounding boxes, and
 * provides config helpers for centering, clamping, and equality checks.
 *
 * No React, no Fabric.js, no DOM dependencies. All functions are pure and
 * return new objects — never mutate inputs.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FussyCutConfig {
  fabricId: string;
  offsetX: number;
  offsetY: number;
  rotation: number;
  scale: number;
}

export interface Point {
  x: number;
  y: number;
}

/**
 * A 2D affine transform in the form used by Fabric.js patternTransform:
 * [a, b, c, d, tx, ty]
 *
 * Where:
 *   a  = cos(rotation) * scale
 *   b  = sin(rotation) * scale
 *   c  = -sin(rotation) * scale
 *   d  = cos(rotation) * scale
 *   tx = offsetX
 *   ty = offsetY
 */
export type PatternTransformMatrix = [number, number, number, number, number, number];

// ---------------------------------------------------------------------------
// Clamp bounds
// ---------------------------------------------------------------------------

const OFFSET_MIN = -2000;
const OFFSET_MAX = 2000;
const ROTATION_MIN = -360;
const ROTATION_MAX = 360;
const SCALE_MIN = 0.1;
const SCALE_MAX = 10;

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

/**
 * Converts a FussyCutConfig into a 2D affine transform matrix suitable for
 * use as Fabric.js patternTransform.
 *
 * Matrix layout: [cos*scale, sin*scale, -sin*scale, cos*scale, offsetX, offsetY]
 * Rotation is specified in degrees and converted to radians internally.
 */
export function computePatternTransform(config: FussyCutConfig): PatternTransformMatrix {
  const radians = (config.rotation * Math.PI) / 180;
  const cosR = Math.cos(radians);
  const sinR = Math.sin(radians);
  const s = config.scale;

  return [cosR * s, sinR * s, -sinR * s, cosR * s, config.offsetX, config.offsetY];
}

/**
 * Returns a default FussyCutConfig with all transforms at their neutral
 * values: no offset, no rotation, scale=1.
 */
export function defaultFussyCutConfig(fabricId: string): FussyCutConfig {
  return {
    fabricId,
    offsetX: 0,
    offsetY: 0,
    rotation: 0,
    scale: 1,
  };
}

/**
 * Computes the axis-aligned bounding box of a polygon defined by its
 * vertices. Returns x/y of the top-left corner plus width and height.
 *
 * For a single-point polygon, width and height are both 0.
 */
export function patchBoundingBox(vertices: readonly Point[]): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  if (vertices.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  let minX = vertices[0].x;
  let maxX = vertices[0].x;
  let minY = vertices[0].y;
  let maxY = vertices[0].y;

  for (let i = 1; i < vertices.length; i++) {
    const { x, y } = vertices[i];
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Returns a new FussyCutConfig whose offsetX/offsetY are adjusted so that
 * the fabric image (of the given dimensions) appears centered over the
 * patch's bounding box.
 *
 * The centering formula:
 *   offsetX = patchCenterX - fabricWidth / 2
 *   offsetY = patchCenterY - fabricHeight / 2
 *
 * All other config fields (fabricId, rotation, scale) are preserved.
 */
export function centerConfigOnPatch(
  config: FussyCutConfig,
  patchVertices: readonly Point[],
  fabricWidth: number,
  fabricHeight: number
): FussyCutConfig {
  const bb = patchBoundingBox(patchVertices);
  const patchCenterX = bb.x + bb.width / 2;
  const patchCenterY = bb.y + bb.height / 2;

  return {
    ...config,
    offsetX: patchCenterX - fabricWidth / 2,
    offsetY: patchCenterY - fabricHeight / 2,
  };
}

/**
 * Clamps all numeric fields of a FussyCutConfig to their valid ranges:
 *   offsetX / offsetY : [-2000, 2000]
 *   rotation          : [-360,  360]
 *   scale             : [0.1,   10]
 *
 * Returns a new config object; the input is never mutated.
 */
export function clampConfig(config: FussyCutConfig): FussyCutConfig {
  return {
    fabricId: config.fabricId,
    offsetX: Math.min(OFFSET_MAX, Math.max(OFFSET_MIN, config.offsetX)),
    offsetY: Math.min(OFFSET_MAX, Math.max(OFFSET_MIN, config.offsetY)),
    rotation: Math.min(ROTATION_MAX, Math.max(ROTATION_MIN, config.rotation)),
    scale: Math.min(SCALE_MAX, Math.max(SCALE_MIN, config.scale)),
  };
}

/**
 * Returns true when both FussyCutConfig objects have identical field values.
 * Uses strict equality for all fields (including floating-point numbers).
 */
export function configsEqual(a: FussyCutConfig, b: FussyCutConfig): boolean {
  return (
    a.fabricId === b.fabricId &&
    a.offsetX === b.offsetX &&
    a.offsetY === b.offsetY &&
    a.rotation === b.rotation &&
    a.scale === b.scale
  );
}
