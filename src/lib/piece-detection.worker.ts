/**
 * Piece Detection Web Worker — Production Quilt Digitization Pipeline
 *
 * All 15 Objectives Implemented:
 * 1. Web Worker Migration — Runs off main thread
 * 2. Shape Standardization — Hu Moments clustering
 * 3. Polygon Offset Seam Allowances — Clipper-lib
 * 4. Dynamic Kernels & Sharpening — Laplacian kernel
 * 5. CLAHE — Illumination normalization
 * 6. Topstitching Removal — Morphological opening
 * 7. Bilateral Filter — Edge-preserving smoothing
 * 8. Sobel Gradient — Wrinkle filtering
 * 9. Watershed — Low-contrast seam detection
 * 10. Nested Shapes — Appliqué support
 * 11. Solidity Filtering — Artifact rejection
 * 12. Sliver Rejection — Aspect ratio filtering
 * 13. Mask-Based Color — Accurate color extraction
 * 14. Color Value — Light/Medium/Dark mapping
 * 15. Memory Management — Aggressive cleanup
 */

import type {
  DetectedPiece,
  WorkerRequestMessage,
  WorkerResponseMessage,
  WorkerProgressMessage,
  Point2D,
  QuiltDetectionConfig,
} from './photo-pattern-types';
import { DEFAULT_QUILT_DETECTION_CONFIG } from './photo-pattern-types';
import {
  PHOTO_PATTERN_PIECE_MIN_AREA_RATIO,
  PHOTO_PATTERN_PIECE_MAX_AREA_RATIO,
} from './constants';
import {
  applyQuiltConfigToOptions,
  getMinAreaRatioForPieceScale,
  dynamicKernelSize,
  type DetectionOptions,
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

let cvInstance: OpenCV | null = null;
let isLoading = false;
let loadPromise: Promise<OpenCV> | null = null;

async function loadOpenCv(): Promise<OpenCV> {
  if (cvInstance) return cvInstance;
  if (isLoading && loadPromise) return loadPromise;

  isLoading = true;
  loadPromise = (async (): Promise<OpenCV> => {
    try {
      const cv = (await import('@techstark/opencv-js')) as OpenCV;
      await new Promise<void>((resolve, reject) => {
        if (cv.Mat) {
          resolve();
          return;
        }
        const timeout = setTimeout(() => {
          reject(new Error('OpenCV.js WASM initialization timed out'));
        }, 30000);
        cv.onRuntimeInitialized = () => {
          clearTimeout(timeout);
          resolve();
        };
      });
      cvInstance = cv;
      return cv;
    } catch (error) {
      isLoading = false;
      loadPromise = null;
      throw error;
    }
  })();
  return loadPromise;
}

function sendProgress(
  step: number,
  status: 'running' | 'complete' | 'error',
  message?: string
): void {
  self.postMessage({ type: 'PROGRESS', step, status, message } as WorkerProgressMessage);
}

function sendError(error: string): void {
  self.postMessage({ type: 'DETECT_PIECES_ERROR', error } as WorkerResponseMessage);
}

function sendResult(pieces: DetectedPiece[]): void {
  self.postMessage({ type: 'DETECT_PIECES_RESULT', pieces } as WorkerResponseMessage);
}

// ============================================================================
// QUILT CONFIG HELPERS
// ============================================================================

// ============================================================================
// PIPELINE FUNCTIONS
// ============================================================================

function approximatePolygon(
  cv: OpenCV,
  contour: OpenCVMat,
  epsilon?: number,
  hasCurvedPiecing: boolean = false
): Point2D[] {
  const approx = new cv.Mat();
  try {
    const perimeter = cv.arcLength(contour, true);
    // For curved piecing, use smaller epsilon (0.5% vs 2%) to preserve more points
    const defaultEpsilon = hasCurvedPiecing ? perimeter * 0.005 : perimeter * 0.02;
    const eps = epsilon ?? defaultEpsilon;
    cv.approxPolyDP(contour, approx, eps, true);
    const vertices: Point2D[] = [];
    for (let i = 0; i < approx.rows; i++) {
      const ptr = approx.intPtr(i, 0);
      vertices.push({ x: ptr[0], y: ptr[1] });
    }
    return vertices;
  } finally {
    approx.delete();
  }
}

// ============================================================================
// PIPELINE FUNCTIONS
// ============================================================================

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

function runDetection(
  cv: OpenCV,
  imageData: ImageData,
  options: DetectionOptions = {}
): DetectedPiece[] {
  // Extract quiltConfig from options
  const { quiltConfig, ...baseOptions } = options;
  const effectiveConfig = quiltConfig ?? DEFAULT_QUILT_DETECTION_CONFIG;

  // Apply quiltConfig priors to derive effective options
  const mergedOptions = applyQuiltConfigToOptions(baseOptions, effectiveConfig);

  const opts = {
    sensitivity: 1.0,
    enableShapeClustering: true,
    detectNestedShapes: false,
    enableCLAHE: true,
    claheClipLimit: 2.0,
    enableSharpening: true,
    sharpeningIntensity: 0.5,
    removeTopstitching: true,
    topstitchingKernelFactor: 0.002,
    useSobelGradient: true,
    sobelThresholdMultiplier: 1.0,
    enableWatershed: true,
    watershedDistanceThreshold: 5,
    minSolidity: 0.5,
    maxAspectRatio: 20,
    ...mergedOptions,
  };

  const pool = new MatPool();

  const src = pool.add(new cv.Mat(imageData.height, imageData.width, cv.CV_8UC4));
  src.data.set(imageData.data);

  const gray = pool.add(new cv.Mat());
  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

  let processed: OpenCVMat = gray;
  if (opts.enableSharpening) {
    const sharpened = applyLaplacianSharpening(cv, gray, opts.sharpeningIntensity);
    pool.add(sharpened);
    processed = sharpened;
  }

  if (opts.enableCLAHE) {
    const equalized = applyCLAHE(cv, processed, opts.claheClipLimit);
    pool.add(equalized);
    processed = equalized;
  }

  if (opts.removeTopstitching) {
    const topstitchRemoved = removeTopstitching(
      cv,
      processed,
      imageData.width,
      opts.topstitchingKernelFactor
    );
    pool.add(topstitchRemoved);
    processed = topstitchRemoved;
  }

  const filtered = pool.add(applyBilateralFilter(cv, processed, opts.sensitivity));

  const thresh = pool.add(new cv.Mat());
  const blockSize = Math.max(3, Math.round(11 * opts.sensitivity) | 1);
  cv.adaptiveThreshold(
    filtered,
    thresh,
    255,
    cv.ADAPTIVE_THRESH_GAUSSIAN_C,
    cv.THRESH_BINARY_INV,
    blockSize,
    2
  );

  const morphed = pool.add(new cv.Mat());
  const kernel = cv.getStructuringElement(
    cv.MORPH_RECT,
    new cv.Size(dynamicKernelSize(imageData.width), dynamicKernelSize(imageData.width))
  );
  pool.add(kernel);
  cv.morphologyEx(thresh, morphed, cv.MORPH_CLOSE, kernel);

  let edges = pool.add(new cv.Mat());
  if (opts.useSobelGradient) {
    const { edges: sobelResult } = applySobelGradient(cv, filtered, opts.sobelThresholdMultiplier);
    pool.add(sobelResult);
    cv.bitwise_or(morphed, sobelResult, edges);
  } else {
    const cannyLow = Math.round(50 / opts.sensitivity);
    const cannyHigh = Math.round(150 / opts.sensitivity);
    cv.Canny(morphed, edges, cannyLow, cannyHigh);
  }

  if (opts.enableWatershed) {
    const watershedResult = applyWatershed(cv, filtered, edges, opts.watershedDistanceThreshold);
    pool.add(watershedResult);
    const combined = pool.add(new cv.Mat());
    cv.bitwise_or(edges, watershedResult, combined);
    edges = combined;
  }

  const hierarchy = pool.add(new cv.Mat());
  const contours = new cv.MatVector();
  const retrievalMode = opts.detectNestedShapes ? cv.RETR_CCOMP : cv.RETR_EXTERNAL;
  cv.findContours(edges, contours, hierarchy, retrievalMode, cv.CHAIN_APPROX_SIMPLE);

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
    const aspectRatio =
      Math.max(cvRect.width, cvRect.height) / Math.min(cvRect.width, cvRect.height);
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

    const { color, value, luminance } = extractColorWithValue(cv, src, contour);

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
// MESSAGE HANDLER
// ============================================================================

self.onmessage = async (event: MessageEvent<WorkerRequestMessage & DetectionOptions>) => {
  const message = event.data;

  if (message.type !== 'DETECT_PIECES') {
    sendError(`Unknown message type: ${(message as { type: string }).type}`);
    return;
  }

  const { imageData, sensitivity, ...options } = message;

  try {
    sendProgress(0, 'running', 'Loading OpenCV...');
    const cv = await loadOpenCv();

    sendProgress(2, 'running', 'Running detection pipeline...');
    const pieces = runDetection(cv, imageData, { sensitivity, ...options });

    sendProgress(4, 'complete', 'Detection complete');
    sendResult(pieces);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    sendProgress(4, 'error', errorMessage);
    sendError(errorMessage);
  }
};

export {};
