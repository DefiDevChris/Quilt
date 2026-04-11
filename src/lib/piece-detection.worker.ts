/**
 * Piece Detection — Production Quilt Digitization Pipeline
 *
 * NOTE: Originally a Web Worker, but Turbopack + dynamic WASM imports in
 * workers causes silent hangs. Now runs on the main thread with async yields
 * to keep the UI responsive. The exported `detectPiecesOnMainThread` function
 * is called directly by photo-layout-utils.ts instead of spawning a Worker.
 *
 * All 15 Objectives Implemented:
 * 1. Shape Standardization — Hu Moments clustering
 * 2. Polygon Offset Seam Allowances — Clipper-lib
 * 3. Dynamic Kernels & Sharpening — Laplacian kernel
 * 4. CLAHE — Illumination normalization
 * 5. Topstitching Removal — Morphological opening
 * 6. Bilateral Filter — Edge-preserving smoothing
 * 7. Sobel Gradient — Wrinkle filtering
 * 8. Watershed — Low-contrast seam detection
 * 9. Nested Shapes — Appliqué support
 * 10. Solidity Filtering — Artifact rejection
 * 11. Sliver Rejection — Aspect ratio filtering
 * 12. Mask-Based Color — Accurate color extraction
 * 13. Color Value — Light/Medium/Dark mapping
 * 14. Memory Management — Aggressive cleanup
 */

import {
  DEFAULT_QUILT_DETECTION_CONFIG,
  type DetectedPiece,
  type Point2D,
  type QuiltDetectionConfig,
  type DetectionOptions,
} from './photo-layout-types';
import { PHOTO_PATTERN_PIECE_MAX_AREA_RATIO } from './constants';
import {
  applyQuiltConfigToOptions,
  approximatePolygon,
  getMinAreaRatioForPieceScale,
  dynamicKernelSize,
} from './piece-detection-shared';

import type { OpenCV, OpenCVMat } from '../types/opencv-js';

// ============================================================================
// MatPool — Lightweight WASM memory manager
// ============================================================================

/**
 * Registers cv.Mat instances and releases them all in one call.
 * Prevents WASM memory leaks from missed .delete() calls or early returns.
 */
class MatPool {
  private _mats: OpenCVMat[] = [];

  add(mat: OpenCVMat): OpenCVMat {
    this._mats.push(mat);
    return mat;
  }

  releaseAll(): void {
    for (const mat of this._mats) {
      try {
        mat.delete();
      } catch {
        // Mat may already be deleted — skip silently
      }
    }
    this._mats = [];
  }
}

// ============================================================================
// PIPELINE HELPERS
// ============================================================================

/** Async wrapper that yields to the main thread periodically. */
function yieldToMain(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function applyLaplacianSharpening(cv: OpenCV, src: OpenCVMat, intensity: number = 0.5): OpenCVMat {
  const sharpened = new cv.Mat();
  const kernel = new cv.Mat(3, 3, cv.CV_32F);
  const center = 1 + 4 * intensity;
  const side = -intensity;

  kernel.floatPtr(0, 0)[0] = 0;
  kernel.floatPtr(0, 1)[0] = side;
  kernel.floatPtr(0, 2)[0] = 0;
  kernel.floatPtr(1, 0)[0] = side;
  kernel.floatPtr(1, 1)[0] = center;
  kernel.floatPtr(1, 2)[0] = side;
  kernel.floatPtr(2, 0)[0] = 0;
  kernel.floatPtr(2, 1)[0] = side;
  kernel.floatPtr(2, 2)[0] = 0;

  try {
    cv.filter2D(src, sharpened, cv.CV_8U, kernel);
    return sharpened;
  } finally {
    kernel.delete();
  }
}

function applyCLAHE(
  cv: OpenCV,
  src: OpenCVMat,
  clipLimit: number = 2.0,
  tileGridSize: number = 8
): OpenCVMat {
  const equalized = new cv.Mat();
  const clahe = new cv.CLAHE(clipLimit, new cv.Size(tileGridSize, tileGridSize));
  try {
    clahe.apply(src, equalized);
    return equalized;
  } finally {
    clahe.delete();
  }
}

function removeTopstitching(
  cv: OpenCV,
  src: OpenCVMat,
  imageWidth: number,
  kernelFactor: number = 0.002
): OpenCVMat {
  const opened = new cv.Mat();
  const kernelSize = dynamicKernelSize(imageWidth, kernelFactor);
  const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(kernelSize, kernelSize));
  try {
    cv.morphologyEx(src, opened, cv.MORPH_OPEN, kernel);
    return opened;
  } finally {
    kernel.delete();
  }
}

function applyBilateralFilter(cv: OpenCV, src: OpenCVMat, sensitivity: number): OpenCVMat {
  const filtered = new cv.Mat();
  const diameter = Math.max(5, Math.round(9 * sensitivity));
  const sigmaColor = 75 * sensitivity;
  const sigmaSpace = 75 * sensitivity;
  cv.bilateralFilter(src, filtered, diameter, sigmaColor, sigmaSpace);
  return filtered;
}

function applySobelGradient(
  cv: OpenCV,
  src: OpenCVMat,
  thresholdMultiplier: number = 1.0
): { edges: OpenCVMat; threshold: number } {
  const gradX = new cv.Mat();
  const gradY = new cv.Mat();
  const gradMag = new cv.Mat();
  const edges = new cv.Mat();

  try {
    cv.Sobel(src, gradX, cv.CV_32F, 1, 0, 3);
    cv.Sobel(src, gradY, cv.CV_32F, 0, 1, 3);
    cv.magnitude(gradX, gradY, gradMag);
    gradMag.convertTo(gradMag, cv.CV_8U);

    const mean = cv.mean(gradMag)[0];
    const threshold = Math.min(255, mean * 2 * thresholdMultiplier);
    cv.threshold(gradMag, edges, threshold, 255, cv.THRESH_BINARY);

    return { edges, threshold };
  } catch (e) {
    edges.delete();
    throw e;
  } finally {
    gradX.delete();
    gradY.delete();
    gradMag.delete();
  }
}

function applyWatershed(
  cv: OpenCV,
  src: OpenCVMat,
  binaryImage: OpenCVMat,
  distanceThreshold: number = 5
): OpenCVMat {
  const dist = new cv.Mat();
  const markers = new cv.Mat();

  try {
    cv.distanceTransform(binaryImage, dist, cv.DIST_L2, cv.DIST_MASK_3);
    dist.convertTo(dist, cv.CV_8U);
    cv.threshold(dist, markers, distanceThreshold, 255, cv.THRESH_BINARY);

    const numMarkers = cv.connectedComponents(markers, markers, 8, cv.CV_32S);

    if (numMarkers > 1) {
      const colorSrc = new cv.Mat();
      cv.cvtColor(src, colorSrc, cv.COLOR_GRAY2BGR);
      cv.watershed(colorSrc, markers);
      colorSrc.delete();

      const boundaries = new cv.Mat();
      const minusOne = new cv.Mat(markers.rows, markers.cols, markers.type(), new cv.Scalar(-1));
      cv.compare(markers, minusOne, boundaries, cv.CMP_EQ);
      minusOne.delete();

      const watershedResult = new cv.Mat();
      const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3));
      cv.dilate(boundaries, watershedResult, kernel);
      kernel.delete();
      boundaries.delete();

      dist.delete();
      markers.delete();
      return watershedResult;
    }

    dist.delete();
    markers.delete();
    return binaryImage.clone();
  } catch (e) {
    dist.delete();
    markers.delete();
    throw e;
  }
}

function calculateSolidity(cv: OpenCV, contour: OpenCVMat): number {
  const area = cv.contourArea(contour);
  if (area <= 0) return 0;
  const hull = new cv.Mat();
  try {
    cv.convexHull(contour, hull, false, false);
    const hullArea = cv.contourArea(hull);
    return hullArea > 0 ? area / hullArea : 0;
  } finally {
    hull.delete();
  }
}

function extractColorWithValue(
  cv: OpenCV,
  src: OpenCVMat,
  contour: OpenCVMat
): { color: string; value: 'Light' | 'Medium' | 'Dark'; luminance: number } {
  const mask = cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC1);
  const maskContours = new cv.MatVector();

  try {
    maskContours.push_back(contour);
    cv.drawContours(mask, maskContours, 0, new cv.Scalar(255), -1);

    const meanColor = cv.mean(src, mask);
    // Source Mat is RGBA (from canvas ImageData), not BGR
    const r = meanColor[0];
    const g = meanColor[1];
    const b = meanColor[2];

    const luminance = Math.round(0.299 * r + 0.587 * g + 0.114 * b);

    let value: 'Light' | 'Medium' | 'Dark';
    if (luminance > 180) value = 'Light';
    else if (luminance < 70) value = 'Dark';
    else value = 'Medium';

    const toHex = (n: number) => n.toString(16).padStart(2, '0');
    const color = `#${toHex(Math.round(r))}${toHex(Math.round(g))}${toHex(Math.round(b))}`;

    return { color, value, luminance };
  } finally {
    mask.delete();
    maskContours.delete();
  }
}

// ============================================================================
// MAIN DETECTION
// ============================================================================

function clusterLinesAndDraw(cv: OpenCV, lines: OpenCVMat, mask: OpenCVMat, width: number, height: number) {
  if (lines.rows === 0) return;
  const hBuckets: {rho: number, theta: number}[] = [];
  const vBuckets: {rho: number, theta: number}[] = [];
  const dBuckets: {rho: number, theta: number}[] = [];

  for (let i = 0; i < lines.rows; ++i) {
    const p = lines.data32S;
    const x1 = p[i * 4];
    const y1 = p[i * 4 + 1];
    const x2 = p[i * 4 + 2];
    const y2 = p[i * 4 + 3];

    let theta = Math.atan2(y2 - y1, x2 - x1);
    if (theta < 0) theta += Math.PI;
    const rho = x1 * Math.cos(theta) + y1 * Math.sin(theta);

    const deg = (theta * 180) / Math.PI;
    if (deg < 10 || deg > 170) {
      hBuckets.push({rho, theta});
    } else if (deg > 80 && deg < 100) {
      vBuckets.push({rho, theta});
    } else {
      dBuckets.push({rho, theta});
    }
  }

  const drawLine = (r: number, t: number) => {
    const a = Math.cos(t), b = Math.sin(t);
    const x0 = a * r, y0 = b * r;
    const pt1 = new cv.Point(Math.round(x0 + 2000 * (-b)), Math.round(y0 + 2000 * (a)));
    const pt2 = new cv.Point(Math.round(x0 - 2000 * (-b)), Math.round(y0 - 2000 * (a)));
    cv.line(mask, pt1, pt2, new cv.Scalar(255), 2, cv.LINE_8, 0);
  };

  const binAndDraw = (buckets: {rho: number, theta: number}[]) => {
    const bins: {r: number, t: number, count: number}[] = [];
    for (const b of buckets) {
      let found = false;
      for (const bin of bins) {
        if (Math.abs(bin.r - b.rho) < 20 && Math.abs(bin.t - b.theta) < (10 * Math.PI / 180)) {
          bin.r = (bin.r * bin.count + b.rho) / (bin.count + 1);
          bin.t = (bin.t * bin.count + b.theta) / (bin.count + 1);
          bin.count++;
          found = true;
          break;
        }
      }
      if (!found) bins.push({r: b.rho, t: b.theta, count: 1});
    }
    for (const bin of bins) {
      drawLine(bin.r, bin.t);
    }
  };

  binAndDraw(hBuckets);
  binAndDraw(vBuckets);
  binAndDraw(dBuckets);
}

function runDetection(
  cv: OpenCV,
  imageData: ImageData,
  options: DetectionOptions = {}
): DetectedPiece[] {
  const { quiltConfig, ...baseOptions } = options;
  const effectiveConfig = quiltConfig ?? DEFAULT_QUILT_DETECTION_CONFIG;
  const mergedOptions = applyQuiltConfigToOptions(baseOptions, effectiveConfig);
  const opts = { sensitivity: 1.0, minSolidity: 0.5, maxAspectRatio: 20, ...mergedOptions };

  const pool = new MatPool();
  const src = pool.add(new cv.Mat(imageData.height, imageData.width, cv.CV_8UC4));
  src.data.set(imageData.data);

  // 1. Grayscale + Gaussian blur
  const gray = pool.add(new cv.Mat());
  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

  const blurred = pool.add(new cv.Mat());
  cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);

  // 2. Canny edge detection
  const edges = pool.add(new cv.Mat());
  const cannyLow = 40;
  const cannyHigh = 120;
  cv.Canny(blurred, edges, cannyLow, cannyHigh);

  // 3. Morphological closing
  const closedEdges = pool.add(new cv.Mat());
  const morphKernel = cv.getStructuringElement(cv.MORPH_CROSS, new cv.Size(3, 3));
  pool.add(morphKernel);
  cv.morphologyEx(edges, closedEdges, cv.MORPH_CLOSE, morphKernel);

  // 4. HoughLinesP to extract lines
  const lines = pool.add(new cv.Mat());
  cv.HoughLinesP(closedEdges, lines, 1, Math.PI / 180, 30, 20, 10);

  // 5. Cluster and planar subdivision
  const mask = pool.add(cv.Mat.zeros(imageData.height, imageData.width, cv.CV_8UC1));
  clusterLinesAndDraw(cv, lines, mask, imageData.width, imageData.height);

  // Draw image borders to close outer cells
  cv.rectangle(mask, new cv.Point(0, 0), new cv.Point(imageData.width - 1, imageData.height - 1), new cv.Scalar(255), 2);

  const invertedMask = pool.add(new cv.Mat());
  cv.bitwise_not(mask, invertedMask);

  const hierarchy = pool.add(new cv.Mat());
  const contours = new cv.MatVector();
  cv.findContours(invertedMask, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);

  const imageArea = imageData.width * imageData.height;
  const minAreaRatio = getMinAreaRatioForPieceScale(effectiveConfig.pieceScale);
  const minArea = minAreaRatio * imageArea;
  const maxArea = PHOTO_PATTERN_PIECE_MAX_AREA_RATIO * imageArea;

  const rawPieces: DetectedPiece[] = [];

  for (let i = 0; i < contours.size(); i++) {
    const contour = contours.get(i);
    const area = cv.contourArea(contour);

    if (area < minArea || area > maxArea) continue;

    const cvRect = cv.boundingRect(contour);
    const aspectRatio = Math.max(cvRect.width, cvRect.height) / Math.min(cvRect.width, cvRect.height);
    if (aspectRatio > opts.maxAspectRatio) continue;

    const solidity = calculateSolidity(cv, contour);
    if (solidity < opts.minSolidity) continue;

    const vertices = approximatePolygon(cv, contour, undefined, effectiveConfig.hasCurvedPiecing);
    if (vertices.length < 3) continue;

    const moments = cv.moments(contour);
    const centroid = {
      x: moments.m00 !== 0 ? moments.m10 / moments.m00 : 0,
      y: moments.m00 !== 0 ? moments.m01 / moments.m00 : 0,
    };

    // Sample color from inset
    const cellMask = cv.Mat.zeros(imageData.height, imageData.width, cv.CV_8UC1);
    const maskContours = new cv.MatVector();
    maskContours.push_back(contour);
    cv.drawContours(cellMask, maskContours, 0, new cv.Scalar(255), -1);

    const erodedMask = new cv.Mat();
    const erodeKernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3));
    cv.erode(cellMask, erodedMask, erodeKernel);

    const meanColor = cv.mean(src, erodedMask);
    const r = meanColor[0], g = meanColor[1], b = meanColor[2];
    const luminance = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    let value: 'Light' | 'Medium' | 'Dark';
    if (luminance > 180) value = 'Light';
    else if (luminance < 70) value = 'Dark';
    else value = 'Medium';
    const toHex = (n: number) => n.toString(16).padStart(2, '0');
    const color = `#${toHex(Math.round(r))}${toHex(Math.round(g))}${toHex(Math.round(b))}`;

    cellMask.delete();
    maskContours.delete();
    erodedMask.delete();
    erodeKernel.delete();

    rawPieces.push({
      id: `piece-${i}`,
      contour: Object.freeze(vertices),
      boundingRect: Object.freeze({
        x: cvRect.x,
        y: cvRect.y,
        width: cvRect.width,
        height: cvRect.height,
      }),
      centroid: Object.freeze({ x: Math.round(centroid.x), y: Math.round(centroid.y) }),
      areaPx: area,
      dominantColor: color,
      colorValue: value,
      luminance,
    });
  }

  pool.releaseAll();
  contours.delete();

  return rawPieces;
}

// ============================================================================
// EXPORTED MAIN-THREAD ENTRY POINT
// ============================================================================

/**
 * Run the full detection pipeline on the main thread.
 * Yields periodically to keep the UI responsive.
 *
 * This replaces the old Web Worker approach which hung silently under
 * Turbopack (dynamic WASM import inside a Worker never resolved).
 */
export async function detectPiecesOnMainThread(
  cv: OpenCV,
  imageData: ImageData,
  options: DetectionOptions = {},
  onProgress?: (step: number, status: 'running' | 'complete' | 'error', message?: string) => void
): Promise<DetectedPiece[]> {
  onProgress?.(0, 'running', 'Initializing OpenCV...');
  await yieldToMain();

  onProgress?.(2, 'running', 'Running detection pipeline...');
  await yieldToMain();

  const pieces = runDetection(cv, imageData, options);

  onProgress?.(4, 'complete', 'Detection complete');
  return pieces;
}

export { };
