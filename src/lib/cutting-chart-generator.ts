/**
 * Rotary Cutting Chart Generator
 *
 * Classifies patch shapes, calculates rotary cutting dimensions with seam allowance,
 * groups by fabric, and optimizes strip cutting for width-of-fabric.
 *
 * Pure computation — no React or Fabric.js dependency.
 */

import { svgPathToPolyline, extractPathFromSvg, type Point } from '@/lib/seam-allowance';
import { PIXELS_PER_INCH } from '@/lib/constants';
import { decimalToFraction, toMixedNumberString } from '@/lib/fraction-math';

// ── Types ──────────────────────────────────────────────────────────

export type PatchShape = 'square' | 'hst' | 'qst' | 'rectangle' | 'trapezoid' | 'irregular';

export interface PatchClassification {
  readonly shape: PatchShape;
  readonly finishedWidth: number;
  readonly finishedHeight: number;
  readonly cutWidth: number;
  readonly cutHeight: number;
  readonly specialInstructions: string | null;
}

export interface CuttingChartItem {
  readonly shapeId: string;
  readonly shapeName: string;
  readonly svgData: string;
  readonly quantity: number;
  readonly seamAllowance: number;
  readonly unitSystem: 'imperial' | 'metric';
  readonly fabricId?: string | null;
  readonly fabricName?: string | null;
  readonly fillColor?: string;
}

export interface CuttingChartEntry {
  readonly fabricGroupKey: string;
  readonly fabricDisplayName: string;
  readonly fabricId: string | null;
  readonly fillColor: string;
  readonly patches: CuttingChartPatch[];
  readonly totalPieces: number;
}

export interface CuttingChartPatch {
  readonly shapeName: string;
  readonly shape: PatchShape;
  readonly cutWidth: number;
  readonly cutHeight: number;
  readonly quantity: number;
  readonly specialInstructions: string | null;
  readonly stripWidth: number | null;
}

export interface StripCuttingPlan {
  readonly stripWidth: number;
  readonly piecesPerStrip: number;
  readonly stripsNeeded: number;
  readonly shape: PatchShape;
  readonly shapeName: string;
}

// ── Shape Classification ───────────────────────────────────────────

function extractVertices(svgData: string): Point[] {
  // Try polygon points first
  const polygonMatch = svgData.match(/points="([^"]+)"/);
  if (polygonMatch) {
    const pairs = polygonMatch[1].trim().split(/\s+/);
    return pairs.map((pair) => {
      const coords = pair.split(',').map(Number);
      return { x: coords[0] ?? 0, y: coords[1] ?? 0 };
    });
  }

  // Try path d attribute
  const pathD = extractPathFromSvg(svgData);
  if (pathD) {
    const pts = svgPathToPolyline(pathD);
    // Remove duplicate closing point (Z command adds start point back)
    if (
      pts.length > 1 &&
      pts[0].x === pts[pts.length - 1].x &&
      pts[0].y === pts[pts.length - 1].y
    ) {
      return pts.slice(0, -1);
    }
    return pts;
  }

  return [];
}

import { boundingBoxWithMinMax } from '@/lib/geometry-utils';

function isApproxEqual(a: number, b: number, tolerance: number = 0.05): boolean {
  return Math.abs(a - b) / Math.max(a, b, 1) < tolerance;
}

/**
 * Check if a triangle is an isosceles right triangle (45-45-90).
 * HSTs must be cut from squares and have a right angle with equal legs.
 */
function isIsoscelesRightTriangle(vertices: Point[]): boolean {
  if (vertices.length !== 3) return false;

  const [a, b, c] = vertices;

  // Calculate squared side lengths
  const ab2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
  const bc2 = (c.x - b.x) ** 2 + (c.y - b.y) ** 2;
  const ca2 = (a.x - c.x) ** 2 + (a.y - c.y) ** 2;

  // Sort sides
  const sides = [ab2, bc2, ca2].sort((x, y) => x - y);
  const [s1, s2, s3] = sides;

  // For an isosceles right triangle:
  // - Two legs should be equal (within tolerance)
  // - Hypotenuse should be approximately 2x a leg (Pythagorean theorem)
  const legsEqual = isApproxEqual(s1, s2, 0.02);
  const rightAngle = isApproxEqual(s3, s1 + s2, 0.02);

  return legsEqual && rightAngle;
}

function hasRightAngles(vertices: Point[]): boolean {
  const n = vertices.length;
  if (n < 3) return false;
  for (let i = 0; i < n; i++) {
    const a = vertices[i];
    const b = vertices[(i + 1) % n];
    const c = vertices[(i + 2) % n];
    const dx1 = b.x - a.x;
    const dy1 = b.y - a.y;
    const dx2 = c.x - b.x;
    const dy2 = c.y - b.y;
    const dot = dx1 * dx2 + dy1 * dy2;
    const mag = Math.sqrt((dx1 * dx1 + dy1 * dy1) * (dx2 * dx2 + dy2 * dy2));
    if (mag === 0) return false;
    if (Math.abs(dot / mag) > 0.1) return false;
  }
  return true;
}

/**
 * Classify an SVG patch shape and calculate cutting dimensions.
 */
export function classifyPatchShape(svgData: string, seamAllowance: number): PatchClassification {
  const vertices = extractVertices(svgData);
  const bbox = boundingBoxWithMinMax(vertices);
  const finishedWidth = bbox.width / PIXELS_PER_INCH;
  const finishedHeight = bbox.height / PIXELS_PER_INCH;
  const vertexCount = vertices.length;

  // Triangle (3 vertices) -> HST or irregular triangle
  if (vertexCount === 3) {
    // Only classify as HST if it's an isosceles right triangle
    if (isIsoscelesRightTriangle(vertices)) {
      // HST: cut size = finished size + 7/8"
      const finishedSize = Math.max(finishedWidth, finishedHeight);
      const cutSize = finishedSize + 0.875;
      return {
        shape: 'hst',
        finishedWidth: finishedSize,
        finishedHeight: finishedSize,
        cutWidth: cutSize,
        cutHeight: cutSize,
        specialInstructions: `Cut ${toMixedNumberString(decimalToFraction(cutSize)).replace(' ', '-')}" square, then cut once diagonally`,
      };
    } else {
      // Irregular triangle - template cut
      const cutW = finishedWidth + 2 * seamAllowance;
      const cutH = finishedHeight + 2 * seamAllowance;
      return {
        shape: 'irregular',
        finishedWidth,
        finishedHeight,
        cutWidth: cutW,
        cutHeight: cutH,
        specialInstructions: 'Template cut — use pattern piece for irregular triangle',
      };
    }
  }

  // 4 vertices
  if (vertexCount === 4) {
    const isSquareAspect = isApproxEqual(bbox.width, bbox.height);

    // Check if it's a QST (4 triangles from center)
    // For now, classify as square or rectangle based on aspect ratio
    if (isSquareAspect && hasRightAngles(vertices)) {
      const cutWidth = finishedWidth + 2 * seamAllowance;
      return {
        shape: 'square',
        finishedWidth,
        finishedHeight,
        cutWidth,
        cutHeight: cutWidth,
        specialInstructions: null,
      };
    }

    // Check if it's truly rectangular (right angles at all corners)
    if (hasRightAngles(vertices)) {
      const cutW = finishedWidth + 2 * seamAllowance;
      const cutH = finishedHeight + 2 * seamAllowance;
      return {
        shape: 'rectangle',
        finishedWidth,
        finishedHeight,
        cutWidth: cutW,
        cutHeight: cutH,
        specialInstructions: null,
      };
    }

    // Non-right-angle quadrilateral — trapezoid or irregular 4-sided shape
    const cutW = finishedWidth + 2 * seamAllowance;
    const cutH = finishedHeight + 2 * seamAllowance;
    return {
      shape: 'trapezoid',
      finishedWidth,
      finishedHeight,
      cutWidth: cutW,
      cutHeight: cutH,
      specialInstructions: 'Template cut — use pattern piece',
    };
  }

  // 5 vertices — irregular pentagon, treat as template piece
  if (vertexCount === 5) {
    const cutW = finishedWidth + 2 * seamAllowance;
    const cutH = finishedHeight + 2 * seamAllowance;
    return {
      shape: 'trapezoid',
      finishedWidth,
      finishedHeight,
      cutWidth: cutW,
      cutHeight: cutH,
      specialInstructions: 'Template cut — use pattern piece',
    };
  }

  // Irregular
  const cutW = finishedWidth + 2 * seamAllowance;
  const cutH = finishedHeight + 2 * seamAllowance;
  return {
    shape: 'irregular',
    finishedWidth,
    finishedHeight,
    cutWidth: cutW,
    cutHeight: cutH,
    specialInstructions: 'Template cut — use pattern piece',
  };
}

// ── Cutting Chart Generation ───────────────────────────────────────

/**
 * Generate a cutting chart grouped by fabric from printlist items.
 */
export function generateCuttingChart(
  items: CuttingChartItem[],
  seamAllowance: number
): CuttingChartEntry[] {
  if (items.length === 0) return [];

  const groups = new Map<
    string,
    {
      fabricId: string | null;
      fabricDisplayName: string;
      fillColor: string;
      patches: Map<string, CuttingChartPatch & { mutableQuantity: number }>;
      totalPieces: number;
    }
  >();

  for (const item of items) {
    const groupKey = item.fabricId ?? item.fillColor ?? 'unknown';
    const displayName = item.fabricName ?? item.fillColor ?? 'Unknown Fabric';

    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        fabricId: item.fabricId ?? null,
        fabricDisplayName: displayName,
        fillColor: item.fillColor ?? '#888',
        patches: new Map(),
        totalPieces: 0,
      });
    }

    const group = groups.get(groupKey)!;
    const classification = classifyPatchShape(item.svgData, seamAllowance);

    // Create a key for merging identical patches
    const patchKey = `${classification.shape}-${classification.cutWidth.toFixed(3)}-${classification.cutHeight.toFixed(3)}`;

    if (group.patches.has(patchKey)) {
      const existing = group.patches.get(patchKey)!;
      group.patches.set(patchKey, {
        ...existing,
        mutableQuantity: existing.mutableQuantity + item.quantity,
      });
    } else {
      group.patches.set(patchKey, {
        shapeName: item.shapeName,
        shape: classification.shape,
        cutWidth: classification.cutWidth,
        cutHeight: classification.cutHeight,
        quantity: item.quantity,
        mutableQuantity: item.quantity,
        specialInstructions: classification.specialInstructions,
        stripWidth:
          classification.shape === 'irregular' || classification.shape === 'trapezoid'
            ? null
            : Math.max(classification.cutWidth, classification.cutHeight),
      });
    }

    group.totalPieces += item.quantity;
  }

  return Array.from(groups.entries()).map(([groupKey, group]) => ({
    fabricGroupKey: groupKey,
    fabricDisplayName: group.fabricDisplayName,
    fabricId: group.fabricId,
    fillColor: group.fillColor,
    patches: Array.from(group.patches.values()).map(({ mutableQuantity, ...patch }) => ({
      ...patch,
      quantity: mutableQuantity,
    })),
    totalPieces: group.totalPieces,
  }));
}

// ── Strip Cutting Optimization ─────────────────────────────────────

/**
 * Calculate strip-cutting optimization for a set of patches.
 * Returns plans for each strip width needed.
 */
export function optimizeStripCutting(
  patches: CuttingChartPatch[],
  wofInches: number
): StripCuttingPlan[] {
  if (patches.length === 0) return [];

  const plans: StripCuttingPlan[] = [];

  for (const patch of patches) {
    if (patch.stripWidth == null) continue;

    const piecesPerStrip = Math.floor(wofInches / patch.cutWidth);
    if (piecesPerStrip <= 0) continue;

    const stripsNeeded = Math.ceil(patch.quantity / piecesPerStrip);

    plans.push({
      stripWidth: patch.stripWidth,
      piecesPerStrip,
      stripsNeeded,
      shape: patch.shape,
      shapeName: patch.shapeName,
    });
  }

  return plans;
}

export { formatFraction } from '@/lib/piece-detection-utils';
