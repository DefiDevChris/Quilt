import type { Point2D } from '@/lib/photo-pattern-types';
import type { OpenCV, OpenCVMat, OpenCVMatVector } from '@/types/opencv-js';

/**
 * Sort four corner points into clockwise order: TL, TR, BR, BL.
 *
 * Uses the sum (x+y) to identify TL (min sum) and BR (max sum),
 * and the difference (x-y) to identify TR (max diff) and BL (min diff).
 */
export function sortCornersClockwise(
  corners: readonly [Point2D, Point2D, Point2D, Point2D],
): [Point2D, Point2D, Point2D, Point2D] {
  const pts = [...corners];

  let tlIdx = 0;
  let trIdx = 0;
  let brIdx = 0;
  let blIdx = 0;

  let minSum = Infinity;
  let maxSum = -Infinity;
  let maxDiff = -Infinity;
  let minDiff = Infinity;

  for (let i = 0; i < pts.length; i++) {
    const sum = pts[i].x + pts[i].y;
    const diff = pts[i].x - pts[i].y;

    if (sum < minSum) {
      minSum = sum;
      tlIdx = i;
    }
    if (sum > maxSum) {
      maxSum = sum;
      brIdx = i;
    }
    if (diff > maxDiff) {
      maxDiff = diff;
      trIdx = i;
    }
    if (diff < minDiff) {
      minDiff = diff;
      blIdx = i;
    }
  }

  return [pts[tlIdx], pts[trIdx], pts[brIdx], pts[blIdx]];
}

/**
 * Detect the largest quadrilateral contour in an image, typically the quilt boundary.
 *
 * Pipeline: Grayscale -> GaussianBlur -> Canny -> findContours -> largest by area -> approxPolyDP.
 * Returns null if no 4-vertex contour is found.
 * All intermediate cv.Mat objects are deleted in a finally block.
 */
export function autoDetectQuiltBoundary(
  cv: OpenCV,
  imageMat: OpenCVMat,
): [Point2D, Point2D, Point2D, Point2D] | null {
  const gray = new cv.Mat();
  const blurred = new cv.Mat();
  const edges = new cv.Mat();
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();

  try {
    // Preprocessing pipeline
    cv.cvtColor(imageMat, gray, cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
    cv.Canny(blurred, edges, 50, 150);

    // Find contours
    cv.findContours(
      edges,
      contours,
      hierarchy,
      cv.RETR_EXTERNAL,
      cv.CHAIN_APPROX_SIMPLE,
    );

    // Find the largest contour by area
    let largestContour: OpenCVMat | null = null;
    let largestArea = 0;

    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i);
      const area = cv.contourArea(contour);
      if (area > largestArea) {
        largestArea = area;
        largestContour = contour;
      }
    }

    if (!largestContour) {
      return null;
    }

    // Approximate the contour to a polygon
    const approx = new cv.Mat();
    try {
      const perimeter = cv.arcLength(largestContour, true);
      cv.approxPolyDP(largestContour, approx, 0.02 * perimeter, true);

      // Must be a quadrilateral (4 vertices)
      if (approx.rows !== 4) {
        return null;
      }

      // Extract the 4 corner points
      const corners: [Point2D, Point2D, Point2D, Point2D] = [
        { x: approx.intPtr(0, 0)[0], y: approx.intPtr(0, 0)[1] },
        { x: approx.intPtr(1, 0)[0], y: approx.intPtr(1, 0)[1] },
        { x: approx.intPtr(2, 0)[0], y: approx.intPtr(2, 0)[1] },
        { x: approx.intPtr(3, 0)[0], y: approx.intPtr(3, 0)[1] },
      ];

      return sortCornersClockwise(corners);
    } finally {
      approx.delete();
    }
  } finally {
    gray.delete();
    blurred.delete();
    edges.delete();
    contours.delete();
    hierarchy.delete();
  }
}

/**
 * Compute a 3x3 perspective transform matrix from source corners to a
 * destination rectangle of the given width and height.
 *
 * Temp mats are deleted in a finally block; the returned transform mat
 * is owned by the caller.
 */
export function computePerspectiveTransform(
  cv: OpenCV,
  srcCorners: readonly [Point2D, Point2D, Point2D, Point2D],
  destWidth: number,
  destHeight: number,
): OpenCVMat {
  const srcData = [
    srcCorners[0].x, srcCorners[0].y,
    srcCorners[1].x, srcCorners[1].y,
    srcCorners[2].x, srcCorners[2].y,
    srcCorners[3].x, srcCorners[3].y,
  ];

  const dstData = [
    0, 0,
    destWidth, 0,
    destWidth, destHeight,
    0, destHeight,
  ];

  const srcMat = cv.matFromArray(4, 1, cv.CV_32FC2, srcData);
  const dstMat = cv.matFromArray(4, 1, cv.CV_32FC2, dstData);

  try {
    return cv.getPerspectiveTransform(srcMat, dstMat);
  } finally {
    srcMat.delete();
    dstMat.delete();
  }
}

/**
 * Apply a perspective warp to an image using a precomputed transform matrix.
 *
 * Returns a new cv.Mat (caller owns it and must call delete()).
 */
export function applyPerspectiveCorrection(
  cv: OpenCV,
  imageMat: OpenCVMat,
  transformMatrix: OpenCVMat,
  width: number,
  height: number,
): OpenCVMat {
  const dst = new cv.Mat();
  const dsize = new cv.Size(width, height);

  cv.warpPerspective(
    imageMat,
    dst,
    transformMatrix,
    dsize,
    cv.INTER_LINEAR,
  );

  return dst;
}
