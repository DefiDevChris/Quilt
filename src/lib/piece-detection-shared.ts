import type { DetectionOptions, QuiltDetectionConfig, Point2D } from './photo-layout-types';
import { DEFAULT_QUILT_DETECTION_CONFIG } from './photo-layout-types';
import { PHOTO_PATTERN_PIECE_MIN_AREA_RATIO } from './constants';
import type { OpenCV, OpenCVMat } from '../types/opencv-js';

export const DEFAULT_CLIPPER_MITER_LIMIT = 2.0;
export const DEFAULT_WATERSHED_THRESHOLD = 5;
export const DEFAULT_MIN_SOLIDITY = 0.5;
export const DEFAULT_MAX_ASPECT_RATIO = 20;
export const DEFAULT_SOBEL_THRESHOLD_MULTIPLIER = 1.0;
export const DEFAULT_TOPSTITCHING_KERNEL_FACTOR = 0.002;
export const DEFAULT_HEAVY_TOPSTITCHING_FACTOR = 0.004;
export const DEFAULT_CLAHE_CLIP_LIMIT = 2.0;
export const DEFAULT_SHARPENING_INTENSITY = 0.5;
export const DEFAULT_SENSITIVITY = 1.0;
export const DEFAULT_WATERSHED_DISTANCE_THRESHOLD = 3;

export const TINY_PIECE_SCALE_RATIO = 0.4;
export const LARGE_PIECE_SCALE_RATIO = 2.5;

export function getMinAreaRatioForPieceScale(
  pieceScale: QuiltDetectionConfig['pieceScale']
): number {
  switch (pieceScale) {
    case 'tiny':
      return PHOTO_PATTERN_PIECE_MIN_AREA_RATIO * TINY_PIECE_SCALE_RATIO;
    case 'large':
      return PHOTO_PATTERN_PIECE_MIN_AREA_RATIO * LARGE_PIECE_SCALE_RATIO;
    case 'standard':
    default:
      return PHOTO_PATTERN_PIECE_MIN_AREA_RATIO;
  }
}

export function applyQuiltConfigToOptions(
  options: DetectionOptions,
  quiltConfig: QuiltDetectionConfig
): DetectionOptions {
  const result = { ...options };

  if (quiltConfig.hasApplique) {
    result.detectNestedShapes = true;
  }

  if (quiltConfig.hasLowContrastSeams) {
    result.enableWatershed = true;
    result.watershedDistanceThreshold = DEFAULT_WATERSHED_DISTANCE_THRESHOLD;
  }

  if (quiltConfig.hasHeavyTopstitching) {
    result.removeTopstitching = true;
    result.topstitchingKernelFactor = DEFAULT_HEAVY_TOPSTITCHING_FACTOR;
  }

  return result;
}

export function dynamicKernelSize(imageWidth: number, factor: number = 0.005): number {
  const size = Math.max(3, Math.round(imageWidth * factor));
  return size % 2 === 0 ? size + 1 : size;
}

export function approximatePolygon(
  cv: OpenCV,
  contour: OpenCVMat,
  epsilon?: number,
  hasCurvedPiecing: boolean = false
): Point2D[] {
  const approx = new cv.Mat();

  try {
    const perimeter = cv.arcLength(contour, true);
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

export function getEffectiveDetectionOptions(
  options: DetectionOptions
): Required<Omit<DetectionOptions, 'quiltConfig'>> & { quiltConfig?: QuiltDetectionConfig } {
  const { quiltConfig, ...baseOptions } = options;
  const effectiveConfig = quiltConfig ?? DEFAULT_QUILT_DETECTION_CONFIG;

  const mergedOptions = applyQuiltConfigToOptions(baseOptions, effectiveConfig);

  return {
    sensitivity: DEFAULT_SENSITIVITY,
    enableShapeClustering: true,
    detectNestedShapes: false,
    enableCLAHE: true,
    claheClipLimit: DEFAULT_CLAHE_CLIP_LIMIT,
    enableSharpening: true,
    sharpeningIntensity: DEFAULT_SHARPENING_INTENSITY,
    removeTopstitching: true,
    topstitchingKernelFactor: DEFAULT_TOPSTITCHING_KERNEL_FACTOR,
    useSobelGradient: true,
    sobelThresholdMultiplier: DEFAULT_SOBEL_THRESHOLD_MULTIPLIER,
    enableWatershed: true,
    watershedDistanceThreshold: DEFAULT_WATERSHED_THRESHOLD,
    minSolidity: DEFAULT_MIN_SOLIDITY,
    maxAspectRatio: DEFAULT_MAX_ASPECT_RATIO,
    seamAllowanceInches: 0.25,
    ...mergedOptions,
  };
}
