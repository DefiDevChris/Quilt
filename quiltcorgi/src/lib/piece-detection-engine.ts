/**
 * Piece Detection Engine — Pure computational engine for detecting quilt pieces
 * from a corrected photo using OpenCV.
 *
 * Zero DOM/React dependencies. OpenCV instance passed as parameter.
 * All parameters and returns are readonly/immutable.
 */

import type { DetectedPiece, Point2D, Rect, ScaledPiece } from './photo-pattern-types';
import { rgbToHex } from './color-math';
import {
  PHOTO_PATTERN_PIECE_MIN_AREA_RATIO,
  PHOTO_PATTERN_PIECE_MAX_AREA_RATIO,
} from './constants';

// ---------------------------------------------------------------------------
// Rounding utilities
// ---------------------------------------------------------------------------

/**
 * Round a value up to the nearest 1/8 inch.
 */
export function roundToEighthUp(value: number): number {
  return Math.ceil(value * 8) / 8;
}

/**
 * Round a value to the nearest 1/8 inch.
 */
export function roundToEighthNearest(value: number): number {
  return Math.round(value * 8) / 8;
}

/**
 * Round a value to the nearest 1/4 inch.
 */
export function roundToQuarterNearest(value: number): number {
  return Math.round(value * 4) / 4;
}

// ---------------------------------------------------------------------------
// Fraction formatting
// ---------------------------------------------------------------------------

/**
 * Convert a decimal inch value to a quilter-friendly fraction string.
 * Rounds to nearest eighth, simplifies 2/8→1/4, 4/8→1/2, 6/8→3/4.
 *
 * Examples: 3.5 → "3 1/2", 4.875 → "4 7/8", 6.0 → "6", 0.25 → "1/4"
 */
export function formatFraction(value: number): string {
  const rounded = roundToEighthNearest(value);
  const whole = Math.floor(rounded);
  const eighths = Math.round((rounded - whole) * 8);

  if (eighths === 0) {
    return `${whole}`;
  }

  // Simplify the fraction
  const gcdValue = gcd(eighths, 8);
  const numerator = eighths / gcdValue;
  const denominator = 8 / gcdValue;

  if (whole === 0) {
    return `${numerator}/${denominator}`;
  }

  return `${whole} ${numerator}/${denominator}`;
}

function gcd(a: number, b: number): number {
  while (b !== 0) {
    const temp = b;
    b = a % b;
    a = temp;
  }
  return a;
}

// ---------------------------------------------------------------------------
// Contour filtering
// ---------------------------------------------------------------------------

/**
 * Filter contour areas by min/max ratio of the total image area.
 * Returns a boolean array — true means the contour passes the filter.
 */
export function filterContoursByArea(
  areas: readonly number[],
  imageArea: number,
  minRatio: number = PHOTO_PATTERN_PIECE_MIN_AREA_RATIO,
  maxRatio: number = PHOTO_PATTERN_PIECE_MAX_AREA_RATIO,
): readonly boolean[] {
  const minArea = minRatio * imageArea;
  const maxArea = maxRatio * imageArea;

  return areas.map((area) => area >= minArea && area <= maxArea);
}

// ---------------------------------------------------------------------------
// Color extraction
// ---------------------------------------------------------------------------

/**
 * Extract the dominant color from an RGBA pixel patch by averaging
 * the center 50% of the region.
 */
export function extractDominantColor(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
): string {
  const startCol = Math.floor(width * 0.25);
  const endCol = Math.floor(width * 0.75);
  const startRow = Math.floor(height * 0.25);
  const endRow = Math.floor(height * 0.75);

  let totalR = 0;
  let totalG = 0;
  let totalB = 0;
  let count = 0;

  for (let row = startRow; row < endRow; row++) {
    for (let col = startCol; col < endCol; col++) {
      const idx = (row * width + col) * 4;
      totalR += pixels[idx];
      totalG += pixels[idx + 1];
      totalB += pixels[idx + 2];
      count++;
    }
  }

  if (count === 0) {
    return '#000000';
  }

  return rgbToHex({
    r: Math.round(totalR / count),
    g: Math.round(totalG / count),
    b: Math.round(totalB / count),
  });
}

// ---------------------------------------------------------------------------
// OpenCV piece detection pipeline
// ---------------------------------------------------------------------------

/**
 * Detect quilt pieces from a perspective-corrected image using OpenCV.
 *
 * Pipeline: grayscale → blur → adaptive threshold → morphological close →
 * Canny edge detection → findContours → filter by area → extract pieces.
 *
 * All OpenCV Mats are deleted in a finally block to prevent memory leaks.
 *
 * @param cv - OpenCV.js instance
 * @param correctedImage - OpenCV Mat of the corrected image (BGR or BGRA)
 * @param sensitivity - Detection sensitivity multiplier (0.2–2.0)
 */
export function detectPieces(
  cv: unknown,
  correctedImage: unknown,
  sensitivity: number,
): readonly DetectedPiece[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const opencv = cv as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const src = correctedImage as any;

  const gray = new opencv.Mat();
  const blurred = new opencv.Mat();
  const thresh = new opencv.Mat();
  const morphed = new opencv.Mat();
  const edges = new opencv.Mat();
  const hierarchy = new opencv.Mat();
  const contours = new opencv.MatVector();
  const kernel = opencv.getStructuringElement(
    opencv.MORPH_RECT,
    new opencv.Size(3, 3),
  );

  try {
    // Step 1: Convert to grayscale
    opencv.cvtColor(src, gray, opencv.COLOR_RGBA2GRAY);

    // Step 2: Gaussian blur to reduce noise
    const blurSize = Math.max(3, Math.round(5 * sensitivity) | 1);
    opencv.GaussianBlur(
      gray,
      blurred,
      new opencv.Size(blurSize, blurSize),
      0,
    );

    // Step 3: Adaptive threshold for varying lighting
    const blockSize = Math.max(3, Math.round(11 * sensitivity) | 1);
    opencv.adaptiveThreshold(
      blurred,
      thresh,
      255,
      opencv.ADAPTIVE_THRESH_GAUSSIAN_C,
      opencv.THRESH_BINARY_INV,
      blockSize,
      2,
    );

    // Step 4: Morphological close to fill small gaps
    opencv.morphologyEx(thresh, morphed, opencv.MORPH_CLOSE, kernel);

    // Step 5: Canny edge detection
    const cannyLow = Math.round(50 / sensitivity);
    const cannyHigh = Math.round(150 / sensitivity);
    opencv.Canny(morphed, edges, cannyLow, cannyHigh);

    // Step 6: Find contours
    opencv.findContours(
      edges,
      contours,
      hierarchy,
      opencv.RETR_EXTERNAL,
      opencv.CHAIN_APPROX_SIMPLE,
    );

    // Step 7: Filter and extract pieces
    const imageArea = src.rows * src.cols;
    const areas: number[] = [];
    for (let i = 0; i < contours.size(); i++) {
      areas.push(opencv.contourArea(contours.get(i)));
    }

    const passFilter = filterContoursByArea(areas, imageArea);

    const pieces: DetectedPiece[] = [];

    for (let i = 0; i < contours.size(); i++) {
      if (!passFilter[i]) continue;

      const contour = contours.get(i);
      const rect = opencv.boundingRect(contour);
      const moments = opencv.moments(contour);

      // Extract contour points
      const points: Point2D[] = [];
      for (let j = 0; j < contour.rows; j++) {
        points.push({
          x: contour.intAt(j, 0),
          y: contour.intAt(j, 1),
        });
      }

      // Compute centroid from moments
      const cx = moments.m00 !== 0 ? moments.m10 / moments.m00 : rect.x + rect.width / 2;
      const cy = moments.m00 !== 0 ? moments.m01 / moments.m00 : rect.y + rect.height / 2;

      // Extract dominant color from the bounding rect region
      const roiRect = new opencv.Rect(rect.x, rect.y, rect.width, rect.height);
      const roi = src.roi(roiRect);
      const roiData = new Uint8ClampedArray(roi.data);
      const dominantColor = extractDominantColor(roiData, rect.width, rect.height);
      roi.delete();

      const boundingRect: Rect = {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
      };

      pieces.push({
        id: `piece-${i}`,
        contour: points,
        boundingRect,
        centroid: { x: Math.round(cx), y: Math.round(cy) },
        areaPx: areas[i],
        dominantColor,
      });
    }

    return pieces;
  } finally {
    gray.delete();
    blurred.delete();
    thresh.delete();
    morphed.delete();
    edges.delete();
    hierarchy.delete();
    contours.delete();
    kernel.delete();
  }
}

// ---------------------------------------------------------------------------
// Scale pieces to physical dimensions
// ---------------------------------------------------------------------------

/**
 * Scale detected pieces from pixel coordinates to physical dimensions (inches).
 * Applies seam allowance to compute cut dimensions.
 *
 * @param pieces - Array of detected pieces with pixel coordinates
 * @param imageWidth - Original image width in pixels
 * @param imageHeight - Original image height in pixels
 * @param targetWidthInches - Target quilt width in inches
 * @param targetHeightInches - Target quilt height in inches
 * @param seamAllowanceInches - Seam allowance per side in inches (e.g., 0.25)
 */
export function scalePiecesToDimensions(
  pieces: readonly DetectedPiece[],
  imageWidth: number,
  imageHeight: number,
  targetWidthInches: number,
  targetHeightInches: number,
  seamAllowanceInches: number,
): readonly ScaledPiece[] {
  const scaleX = targetWidthInches / imageWidth;
  const scaleY = targetHeightInches / imageHeight;

  return pieces.map((piece) => {
    // Scale bounding rect dimensions to inches
    const rawFinishedWidth = piece.boundingRect.width * scaleX;
    const rawFinishedHeight = piece.boundingRect.height * scaleY;

    // Round to nearest eighth
    const finishedWidthNum = roundToEighthNearest(rawFinishedWidth);
    const finishedHeightNum = roundToEighthNearest(rawFinishedHeight);

    // Add seam allowance (both sides) for cut dimensions
    const cutWidthNum = finishedWidthNum + 2 * seamAllowanceInches;
    const cutHeightNum = finishedHeightNum + 2 * seamAllowanceInches;

    // Scale contour vertices to inches
    const contourInches: readonly Point2D[] = piece.contour.map((pt) => ({
      x: roundToEighthNearest(pt.x * scaleX),
      y: roundToEighthNearest(pt.y * scaleY),
    }));

    return {
      id: piece.id,
      contourInches,
      finishedWidth: formatFraction(finishedWidthNum),
      finishedHeight: formatFraction(finishedHeightNum),
      cutWidth: formatFraction(cutWidthNum),
      cutHeight: formatFraction(cutHeightNum),
      finishedWidthNum,
      finishedHeightNum,
      dominantColor: piece.dominantColor,
    };
  });
}
