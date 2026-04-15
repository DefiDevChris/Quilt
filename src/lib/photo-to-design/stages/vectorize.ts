// ============================================================================
// Stage: Morphology + Vectorize (OpenCV)
//
// Takes the raw, pixelated masks from SAM2 and turns each into a clean polygon:
//
//   1. MORPH_CLOSE (3×3) seals small seam gaps SAM often leaves at quilt
//      intersections.
//   2. MORPH_OPEN  (3×3) erases one-pixel noise and hair-thin mask artifacts.
//   3. findContours — RETR_EXTERNAL is intentional: we want the outer hull
//      of the mask, not any interior holes (a quilt patch is simply connected).
//   4. Pick the largest contour by area — morphology doesn't always merge
//      every noise speck into the main blob.
//   5. approxPolyDP with epsilon = 1% of arc length — Douglas–Peucker
//      simplification; leaves quads as quads and hexagons as hexagons while
//      melting away noise along straight edges.
//
// Memory discipline: every `cv.Mat` allocated here is released via a
// nested try/finally so a throw mid-pipeline cannot leak WASM heap. The
// `VectorizeError` boundary converts cv-side failures into a stable API
// so callers don't have to know OpenCV-specific failure shapes.
// ============================================================================

import { loadOpenCv } from '../opencv-loader';
import type { Point, RawSAMMask, VectorizedPatch } from '../types';

const MORPH_KERNEL_SIZE = 3;
const APPROX_EPSILON_FACTOR = 0.01;
const MIN_VERTICES = 3;

export class VectorizeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VectorizeError';
  }
}

// Narrow, cv.js-shaped interfaces so the rest of the file stays typed.
// OpenCV.js itself ships no TypeScript definitions, so these are documented
// contracts — if a build strips/renames any of these, the loader-side cast
// will surface a runtime error immediately.
interface CvMat {
  data: Uint8Array;
  data32S: Int32Array;
  rows: number;
  cols: number;
  delete: () => void;
}

interface CvMatVector {
  size: () => number;
  get: (i: number) => CvMat;
  delete: () => void;
}

interface CvNamespace {
  Mat: new (rows?: number, cols?: number, type?: number) => CvMat;
  MatVector: new () => CvMatVector;
  Size: new (w: number, h: number) => unknown;
  CV_8UC1: number;
  MORPH_RECT: number;
  MORPH_CLOSE: number;
  MORPH_OPEN: number;
  RETR_EXTERNAL: number;
  CHAIN_APPROX_NONE: number;
  getStructuringElement: (shape: number, size: unknown) => CvMat;
  morphologyEx: (src: CvMat, dst: CvMat, op: number, kernel: CvMat) => void;
  findContours: (
    src: CvMat,
    contours: CvMatVector,
    hierarchy: CvMat,
    mode: number,
    method: number
  ) => void;
  contourArea: (contour: CvMat) => number;
  arcLength: (contour: CvMat, closed: boolean) => number;
  approxPolyDP: (src: CvMat, dst: CvMat, epsilon: number, closed: boolean) => void;
}

/**
 * Vectorize a batch of raw SAM masks into simplified polygons.
 * Masks that collapse to nothing after morphology (< 3 vertices, zero area)
 * are silently dropped — they were either noise or already un-segmentable.
 */
export async function vectorizeMasks(masks: RawSAMMask[]): Promise<VectorizedPatch[]> {
  const cv = (await loadOpenCv()) as CvNamespace;
  const results: VectorizedPatch[] = [];
  for (const mask of masks) {
    const patch = vectorizeSingleMask(cv, mask);
    if (patch) results.push(patch);
  }
  return results;
}

function vectorizeSingleMask(cv: CvNamespace, mask: RawSAMMask): VectorizedPatch | null {
  const src = new cv.Mat(mask.height, mask.width, cv.CV_8UC1);
  const kernel = cv.getStructuringElement(
    cv.MORPH_RECT,
    new cv.Size(MORPH_KERNEL_SIZE, MORPH_KERNEL_SIZE)
  );
  const closed = new cv.Mat();
  const opened = new cv.Mat();
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  let approx: CvMat | null = null;

  try {
    src.data.set(mask.data);
    cv.morphologyEx(src, closed, cv.MORPH_CLOSE, kernel);
    cv.morphologyEx(closed, opened, cv.MORPH_OPEN, kernel);
    cv.findContours(opened, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_NONE);

    const bestIdx = pickLargestContour(cv, contours);
    if (bestIdx < 0) return null;

    const contour = contours.get(bestIdx);
    try {
      approx = new cv.Mat();
      const perimeter = cv.arcLength(contour, true);
      cv.approxPolyDP(contour, approx, APPROX_EPSILON_FACTOR * perimeter, true);
      const vertices = matToPoints(approx);
      if (vertices.length < MIN_VERTICES) return null;
      return { vertices, bbox: mask.bbox, score: mask.score };
    } finally {
      contour.delete();
    }
  } catch (err) {
    throw new VectorizeError(
      `Vectorize failed for mask at (${mask.bbox.minX},${mask.bbox.minY}): ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  } finally {
    src.delete();
    kernel.delete();
    closed.delete();
    opened.delete();
    contours.delete();
    hierarchy.delete();
    approx?.delete();
  }
}

function pickLargestContour(cv: CvNamespace, contours: CvMatVector): number {
  const size = contours.size();
  if (size === 0) return -1;

  let bestIdx = -1;
  let bestArea = 0;
  for (let i = 0; i < size; i++) {
    const c = contours.get(i);
    try {
      const area = cv.contourArea(c);
      if (area > bestArea) {
        bestArea = area;
        bestIdx = i;
      }
    } finally {
      c.delete();
    }
  }
  return bestArea > 0 ? bestIdx : -1;
}

/**
 * Convert an OpenCV CV_32SC2 contour matrix into a plain Point[].
 * Exported for unit testing — pure function, no cv dependency.
 */
export function matToPoints(mat: { data32S: Int32Array; rows: number }): Point[] {
  const points: Point[] = [];
  for (let i = 0; i < mat.rows; i++) {
    points.push({ x: mat.data32S[i * 2], y: mat.data32S[i * 2 + 1] });
  }
  return points;
}
