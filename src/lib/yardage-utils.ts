import { clamp } from './math-utils';

export interface CanvasShapeData {
  id: string;
  widthPx: number;
  heightPx: number;
  scaleX: number;
  scaleY: number;
  fabricId: string | null;
  fabricName: string | null;
  fillColor: string;
  type: string;
  __pieceKind?: 'triangle-a' | 'triangle-b' | string;
  __sizeInches?: number;
}

export interface FabricGroup {
  groupKey: string;
  displayName: string;
  fabricId: string | null;
  fillColor: string;
  shapes: CanvasShapeData[];
}

export interface YardageResult {
  groupKey: string;
  displayName: string;
  fabricId: string | null;
  fillColor: string;
  shapeCount: number;
  totalAreaSqIn: number;
  yardsRequired: number;
  fatQuartersRequired: number;
  cutInstructions: string[];
  extraHSTs: number;
  stripCount: number;
  stripWidthInches: number;
}

export type WOF = 42 | 44 | 45 | 54 | 60;

export const STANDARD_WOFS: readonly WOF[] = [42, 44, 45, 54, 60] as const;

export const FAT_QUARTER_DIMENSIONS = {
  width: 18,
  height: 22,
} as const;

const FAT_QUARTER_AREA_SQ_IN = FAT_QUARTER_DIMENSIONS.width * FAT_QUARTER_DIMENSIONS.height;

const INCHES_PER_YARD = 36;

export function groupShapesByFabric(shapes: CanvasShapeData[]): FabricGroup[] {
  if (shapes.length === 0) return [];

  const groupMap = new Map<string, FabricGroup>();

  for (const shape of shapes) {
    const key = shape.fabricId ? `fabric:${shape.fabricId}` : `color:${shape.fillColor}`;

    const existing = groupMap.get(key);
    if (existing) {
      existing.shapes = [...existing.shapes, shape];
    } else {
      groupMap.set(key, {
        groupKey: key,
        displayName: shape.fabricName ?? shape.fillColor,
        fabricId: shape.fabricId,
        fillColor: shape.fillColor,
        shapes: [shape],
      });
    }
  }

  return Array.from(groupMap.values());
}

export function calculateYardage(
  totalAreaSqIn: number,
  wofInches: number,
  wasteMargin: number
): number {
  if (totalAreaSqIn === 0 || wofInches <= 0) return 0;
  // Clamp wasteMargin to reasonable range [0, 0.5]
  const validWasteMargin = clamp(wasteMargin, 0, 0.5);
  const areaWithWaste = totalAreaSqIn * (1 + validWasteMargin);
  const lengthInches = areaWithWaste / wofInches;
  return lengthInches / INCHES_PER_YARD;
}

function roundUpToEighth(yards: number): number {
  return Math.ceil(yards * 8) / 8;
}

export function calculateFatQuarters(totalAreaSqIn: number, wasteMargin: number): number {
  if (totalAreaSqIn === 0) return 0;
  const areaWithWaste = totalAreaSqIn * (1 + wasteMargin);
  return Math.ceil(areaWithWaste / FAT_QUARTER_AREA_SQ_IN);
}

export function computeYardageEstimates(
  shapes: CanvasShapeData[],
  pixelsPerInch: number,
  wofInches: number,
  wasteMargin: number
): YardageResult[] {
  const groups = groupShapesByFabric(shapes);

  const results: YardageResult[] = groups.map((group) => {
    const cutInstructions: string[] = [];
    let totalAreaSqIn = 0;
    let extraHSTs = 0;
    let stripCount = 0;
    let stripWidthInches = 0;

    const plainBySize = new Map<number, number>();
    const hstBySize = new Map<number, { a: number; b: number }>();

    for (const shape of group.shapes) {
      const finishedSize = shape.__sizeInches ?? (shape.widthPx * shape.scaleX) / pixelsPerInch;

      if (shape.__pieceKind === 'triangle-a' || shape.__pieceKind === 'triangle-b') {
        if (!hstBySize.has(finishedSize)) {
          hstBySize.set(finishedSize, { a: 0, b: 0 });
        }
        const entry = hstBySize.get(finishedSize)!;
        if (shape.__pieceKind === 'triangle-a') {
          entry.a++;
        } else {
          entry.b++;
        }
      } else {
        const count = plainBySize.get(finishedSize) || 0;
        plainBySize.set(finishedSize, count + 1);
      }
    }

    // Process plain squares
    for (const [finishedSize, count] of plainBySize.entries()) {
      const cutSize = finishedSize + 0.5;
      const area = count * cutSize * cutSize;
      totalAreaSqIn += area;
      cutInstructions.push(`Cut ${count} squares at ${cutSize}" for plain squares`);
      // Compute strips: squares_per_strip = floor(WOF / cutSize), strips = ceil(count / squares_per_strip)
      const squaresPerStrip = Math.floor(wofInches / cutSize);
      const stripsForThisSize = squaresPerStrip > 0 ? Math.ceil(count / squaresPerStrip) : count;
      stripCount += stripsForThisSize;
      stripWidthInches = Math.max(stripWidthInches, cutSize);
    }

    // Process HSTs
    for (const [finishedSize, { a, b }] of hstBySize.entries()) {
      const pairs = Math.min(a, b);
      const unpaired = (a - pairs) + (b - pairs);
      const totalCutSquares = pairs + unpaired;
      const cutSize = finishedSize + 0.875;
      const hstCount = pairs * 2 + unpaired;
      const area = totalCutSquares * cutSize * cutSize;
      totalAreaSqIn += area;
      cutInstructions.push(`Cut ${totalCutSquares} squares at ${cutSize}" for ${hstCount} HSTs`);
      extraHSTs += unpaired;
      // Compute strips for HSTs
      const squaresPerStrip = Math.floor(wofInches / cutSize);
      const stripsForThisSize = squaresPerStrip > 0 ? Math.ceil(totalCutSquares / squaresPerStrip) : totalCutSquares;
      stripCount += stripsForThisSize;
      stripWidthInches = Math.max(stripWidthInches, cutSize);
    }

    const rawYards = calculateYardage(totalAreaSqIn, wofInches, wasteMargin);
    const yardsRequired = rawYards > 0 ? roundUpToEighth(rawYards) : 0;
    const fatQuartersRequired = calculateFatQuarters(totalAreaSqIn, wasteMargin);

    return {
      groupKey: group.groupKey,
      displayName: group.displayName,
      fabricId: group.fabricId,
      fillColor: group.fillColor,
      shapeCount: group.shapes.length,
      totalAreaSqIn,
      yardsRequired,
      fatQuartersRequired,
      cutInstructions,
      extraHSTs,
      stripCount,
      stripWidthInches,
    };
  });

  return results.sort((a, b) => b.yardsRequired - a.yardsRequired);
}

// ── Backing & Binding ─────────────────────────────────────────────

export interface BackingYardageResult {
  readonly yardsRequired: number;
  readonly panelsNeeded: number;
  readonly panelLengthInches: number;
}

/**
 * Calculate backing yardage for a quilt.
 *
 * Standard practice: backing extends 4" beyond the quilt top on each side (8" total).
 * For quilts wider than WOF, panels are seamed side-by-side.
 */
export function calculateBackingYardage(
  quiltWidthInches: number,
  quiltHeightInches: number,
  wofInches: number,
  overhangInches: number = 4
): BackingYardageResult {
  const backingWidth = quiltWidthInches + overhangInches * 2;
  const backingHeight = quiltHeightInches + overhangInches * 2;

  // Number of WOF panels needed side-by-side to cover the width
  const panelsNeeded = Math.ceil(backingWidth / wofInches);

  // Each panel is cut to the backing height
  const panelLengthInches = backingHeight;
  const totalLengthInches = panelsNeeded * panelLengthInches;
  const yardsRequired = Math.ceil((totalLengthInches / INCHES_PER_YARD) * 8) / 8;

  return { yardsRequired, panelsNeeded, panelLengthInches };
}

export interface BindingYardageResult {
  readonly yardsRequired: number;
  readonly stripCount: number;
  readonly stripWidthInches: number;
  readonly totalStripLengthInches: number;
}

/**
 * Calculate binding yardage from quilt perimeter.
 *
 * Standard: 2.5" wide strips cut on grain, joined end-to-end.
 * Adds 10" for seam joining + mitered corners.
 */
export function calculateBindingYardage(
  quiltWidthInches: number,
  quiltHeightInches: number,
  wofInches: number,
  stripWidthInches: number = 2.5
): BindingYardageResult {
  const perimeter = 2 * (quiltWidthInches + quiltHeightInches);
  return calculateBindingYardageFromPerimeter(perimeter, wofInches, stripWidthInches);
}

export function calculateBindingYardageFromPerimeter(
  perimeter: number,
  wofInches: number,
  stripWidthInches: number = 2.5
): BindingYardageResult {
  const totalStripLengthInches = perimeter + 10;
  const stripsPerWidth = Math.floor(wofInches / stripWidthInches);
  const stripCount = Math.ceil(totalStripLengthInches / wofInches);
  const fabricLengthInches = Math.ceil(stripCount / stripsPerWidth) * stripWidthInches;
  const yardsRequired = Math.ceil((fabricLengthInches / INCHES_PER_YARD) * 8) / 8;

  return { yardsRequired, stripCount, stripWidthInches, totalStripLengthInches };
}
