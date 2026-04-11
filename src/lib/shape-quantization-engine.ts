import type { Point2D, DetectedPiece, ShapeType } from '@/lib/photo-layout-types';

/**
 * Shape Quantization Engine
 *
 * Replaces the old normalizer and snapper.
 *
 * Takes raw DetectedPiece[] and quantizes them to an inferred integer grid,
 * collapsing 100s of wobbly pieces into a small canonical vocabulary.
 *
 * Framework Decision:
 * We need domain-specific quantization (inferring a quilt grid and snapping pieces
 * to exact multiples of a base unit u) which no off-the-shelf library handles
 * properly without extensive custom logic. Therefore, this engine is built
 * from scratch using basic math and geometric heuristics tailored for quilts.
 *
 * Pipeline stages:
 * 1. Grid inference (find modal short edge `u` and rotation `θ`)
 * 2. Canonicalization (de-rotate, classify, quantize dimensions to `u`)
 * 3. Grid snapping (snap vertices to integer grid of `u`)
 * 4. Re-emit contours from canonical templates
 */

export interface QuantizerConfig {
  /** Override base unit in pixels, if known */
  baseUnit?: number;
  /** Force specific global rotation in degrees */
  rotationOffset?: number;
  /** Minimum area to retain a piece */
  minArea?: number;
}

export interface QuantizedPiece extends DetectedPiece {
  quantizedContour: Point2D[];
  shapeClass: string;
  canonicalDims: { width: number; height: number; type: string };
  gridUnit: number;
}

export interface QuantizerResult {
  pieces: QuantizedPiece[];
  inferredGridUnit: number;
  inferredRotation: number;
}

// Math helpers
function distance(p1: Point2D, p2: Point2D): number {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

function angle(p1: Point2D, p2: Point2D): number {
  return Math.atan2(p2.y - p1.y, p2.x - p1.x);
}

function polygonArea(points: readonly Point2D[]): number {
  let area = 0;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    area += (points[j].x + points[i].x) * (points[j].y - points[i].y);
  }
  return Math.abs(area / 2);
}

function rotatePoint(p: Point2D, origin: Point2D, theta: number): Point2D {
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  const dx = p.x - origin.x;
  const dy = p.y - origin.y;
  return {
    x: origin.x + dx * cos - dy * sin,
    y: origin.y + dx * sin + dy * cos
  };
}

function getBoundingBox(points: readonly Point2D[]) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY, center: { x: (minX + maxX) / 2, y: (minY + maxY) / 2 } };
}

// 1. Grid Inference
function inferGrid(pieces: readonly DetectedPiece[]): { unit: number, rotation: number } {
  const edgeLengths: number[] = [];
  const edgeAngles: number[] = [];

  for (const piece of pieces) {
    const contour = piece.contour;
    if (contour.length < 3) continue;

    // We expect simplified contours, but let's gather all segments
    for (let i = 0, j = contour.length - 1; i < contour.length; j = i++) {
      const p1 = contour[j];
      const p2 = contour[i];
      const len = distance(p1, p2);
      if (len > 5) { // ignore tiny segments
        edgeLengths.push(len);
        let ang = angle(p1, p2);
        // Normalize angle modulo 90 degrees (Math.PI / 2) to find grid orientation
        while (ang < 0) ang += Math.PI / 2;
        ang = ang % (Math.PI / 2);
        // Map [45, 90] back to [-45, 0] for easier clustering around 0
        if (ang > Math.PI / 4) ang -= Math.PI / 2;
        edgeAngles.push(ang);
      }
    }
  }

  if (edgeLengths.length === 0) return { unit: 50, rotation: 0 };

  // Find median or mode for rotation
  edgeAngles.sort((a, b) => a - b);
  const medianRotation = edgeAngles[Math.floor(edgeAngles.length / 2)];

  // For unit, look at the distribution of lengths.
  // We want the greatest common divisor of lengths, but practically,
  // finding the 10th percentile or a prominent cluster in the lower range works well for 'u'.
  edgeLengths.sort((a, b) => a - b);
  // Simple heuristic: find the smallest common edge length that isn't just noise
  let baseUnit = edgeLengths[Math.floor(edgeLengths.length * 0.1)] || 50;

  // Refine baseUnit by clustering
  const buckets = new Map<number, number>();
  const bucketSize = 5; // 5px buckets
  for (const len of edgeLengths) {
    const b = Math.round(len / bucketSize) * bucketSize;
    buckets.set(b, (buckets.get(b) || 0) + 1);
  }

  let maxCount = 0;
  let modeBucket = baseUnit;
  for (const [b, count] of buckets.entries()) {
    if (count > maxCount && b > 15) { // min reasonable unit
      maxCount = count;
      modeBucket = b;
    }
  }

  // If modeBucket is e.g. 100, but we have lots of 50s, 50 might be the real base unit.
  // We'll stick to a simple heuristic: use the mode if it's reasonable, otherwise 10th percentile.
  baseUnit = modeBucket > 0 ? modeBucket : baseUnit;

  return { unit: baseUnit, rotation: medianRotation };
}

// 2. Classify and Quantize Shape
function quantizeShape(
  piece: DetectedPiece,
  baseUnit: number,
  globalRotation: number
): QuantizedPiece | null {
  const contour = piece.contour;
  if (contour.length < 3) return null;

  const area = polygonArea(contour);
  if (area < (baseUnit * baseUnit * 0.1)) return null; // Too small

  const center = getBoundingBox(contour).center;

  // De-rotate
  const derotated = contour.map(p => rotatePoint(p, center, -globalRotation));
  const box = getBoundingBox(derotated);

  // Quantize dimensions to nearest multiple of baseUnit
  let uW = Math.max(1, Math.round(box.width / baseUnit));
  let uH = Math.max(1, Math.round(box.height / baseUnit));

  // Snap center to grid
  const gridX = Math.round(center.x / baseUnit) * baseUnit;
  const gridY = Math.round(center.y / baseUnit) * baseUnit;
  const snappedCenter = { x: gridX, y: gridY };

  // Determine shape type
  // Check if it's a triangle
  const isTriangle = contour.length === 3 || (area < box.width * box.height * 0.6); // basic heuristic

  let type = 'rectangle';
  let qW = uW * baseUnit;
  let qH = uH * baseUnit;
  let canonicalContour: Point2D[] = [];

  if (isTriangle) {
    type = 'triangle';
    // For right triangle, area is w*h/2.
    // Assume right triangle filling the bounding box.
    // We need to figure out which corner is the right angle.
    // For simplicity, just use the canonical bottom-left right angle.
    // A robust version would check vertex distances to box corners.
    let rightAngleIdx = 0;
    let minDist = Infinity;
    const corners = [
      {x: box.minX, y: box.minY},
      {x: box.maxX, y: box.minY},
      {x: box.maxX, y: box.maxY},
      {x: box.minX, y: box.maxY}
    ];
    for (const p of derotated) {
      corners.forEach((c, i) => {
        const d = distance(p, c);
        if (d < minDist) {
          minDist = d;
          rightAngleIdx = i;
        }
      });
    }

    // Generate canonical triangle based on which corner is the right angle
    if (rightAngleIdx === 0) { // top-left
      canonicalContour = [
        { x: -qW/2, y: -qH/2 },
        { x: qW/2, y: -qH/2 },
        { x: -qW/2, y: qH/2 }
      ];
    } else if (rightAngleIdx === 1) { // top-right
      canonicalContour = [
        { x: -qW/2, y: -qH/2 },
        { x: qW/2, y: -qH/2 },
        { x: qW/2, y: qH/2 }
      ];
    } else if (rightAngleIdx === 2) { // bottom-right
      canonicalContour = [
        { x: qW/2, y: -qH/2 },
        { x: qW/2, y: qH/2 },
        { x: -qW/2, y: qH/2 }
      ];
    } else { // bottom-left
      canonicalContour = [
        { x: -qW/2, y: -qH/2 },
        { x: qW/2, y: qH/2 },
        { x: -qW/2, y: qH/2 }
      ];
    }
  } else {
    if (uW === uH) {
      type = 'square';
    }
    // Canonical rectangle centered at origin
    canonicalContour = [
      { x: -qW/2, y: -qH/2 },
      { x: qW/2, y: -qH/2 },
      { x: qW/2, y: qH/2 },
      { x: -qW/2, y: qH/2 }
    ];
  }

  // Re-rotate and translate to snapped center
  const finalContour = canonicalContour.map(p => {
    // translate to center
    const translated = { x: p.x + snappedCenter.x, y: p.y + snappedCenter.y };
    // rotate back
    return rotatePoint(translated, snappedCenter, globalRotation);
  });

  return {
    ...piece,
    quantizedContour: finalContour,
    shapeClass: `${uW}x${uH} ${type}`,
    canonicalDims: { width: uW, height: uH, type },
    gridUnit: baseUnit
  };
}

export function quantizeShapes(
  pieces: readonly DetectedPiece[],
  config: QuantizerConfig = {}
): QuantizerResult {
  if (pieces.length === 0) {
    return { pieces: [], inferredGridUnit: 50, inferredRotation: 0 };
  }

  // 1. Infer Grid
  const inferred = inferGrid(pieces);
  const unit = config.baseUnit || inferred.unit;
  const rotation = config.rotationOffset !== undefined ? config.rotationOffset * (Math.PI / 180) : inferred.rotation;

  // 2. Canonicalize & Snap
  const quantizedPieces: QuantizedPiece[] = [];

  for (const piece of pieces) {
    const qp = quantizeShape(piece, unit, rotation);
    if (qp) {
      quantizedPieces.push(qp);
    } else {
      // Fallback for shapes that couldn't be quantized (keep as is but snap vertices)
      const snappedContour = piece.contour.map(p => ({
        x: Math.round(p.x / unit) * unit,
        y: Math.round(p.y / unit) * unit
      }));
      quantizedPieces.push({
        ...piece,
        quantizedContour: snappedContour,
        shapeClass: 'general polygon',
        canonicalDims: { width: 0, height: 0, type: 'polygon' },
        gridUnit: unit
      });
    }
  }

  return {
    pieces: quantizedPieces,
    inferredGridUnit: unit,
    inferredRotation: rotation * (180 / Math.PI)
  };
}
