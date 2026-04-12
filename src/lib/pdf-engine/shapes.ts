/**
 * PDF Shape Processing — extract polylines from SVG, compute bounding boxes.
 */

import { PDF_POINTS_PER_INCH, PIXELS_PER_INCH, type ShapePolyline, type BoundingBox } from './types';
import {
  svgPathToPolyline,
  extractPathFromSvg,
  computeSeamOffset,
} from '@/lib/seam-allowance';
import { boundingBoxWithMinMax } from '@/lib/geometry-utils';

/**
 * Extract cut line and seam line polylines from SVG data.
 */
export function extractShapePolyline(
  svgData: string,
  seamAllowance: number
): ShapePolyline | null {
  const pathD = extractPathFromSvg(svgData);
  if (!pathD) return null;

  const rawPoints = svgPathToPolyline(pathD);
  if (rawPoints.length < 3) return null;

  const pixelToInch = 1 / PIXELS_PER_INCH;
  const cutLine = rawPoints.map((p) => ({
    x: p.x * pixelToInch,
    y: p.y * pixelToInch,
  }));

  const seamLine = seamAllowance > 0 ? computeSeamOffset(cutLine, seamAllowance) : null;

  const cutBbox = computeBoundingBox(cutLine);
  const seamBbox = seamLine ? computeBoundingBox(seamLine) : cutBbox;

  return { cutLine, seamLine, cutBbox, seamBbox };
}

function computeBoundingBox(points: { x: number; y: number }[]): BoundingBox {
  const bbox = boundingBoxWithMinMax(points);
  return {
    width: bbox.width,
    height: bbox.height,
    minX: bbox.minX,
    minY: bbox.minY,
  };
}

/**
 * Convert inches to PDF points.
 */
export function inchesToPoints(inches: number): number {
  return inches * PDF_POINTS_PER_INCH;
}
