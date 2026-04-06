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

export function calculateTotalArea(shapes: CanvasShapeData[], pixelsPerUnit: number): number {
  return shapes.reduce((sum, shape) => {
    const widthUnits = (shape.widthPx * shape.scaleX) / pixelsPerUnit;
    const heightUnits = (shape.heightPx * shape.scaleY) / pixelsPerUnit;
    return sum + widthUnits * heightUnits;
  }, 0);
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
    const totalAreaSqIn = calculateTotalArea(group.shapes, pixelsPerInch);
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
  const totalStripLengthInches = perimeter + 10; // Extra for joins and corners

  // How many strips from one WOF width
  const stripsPerWidth = Math.floor(wofInches / stripWidthInches);
  const stripCount = Math.ceil(totalStripLengthInches / wofInches);

  // Fabric needed: stripCount strips at stripWidth each
  const fabricLengthInches = Math.ceil(stripCount / stripsPerWidth) * stripWidthInches;
  const yardsRequired = Math.ceil((fabricLengthInches / INCHES_PER_YARD) * 8) / 8;

  return { yardsRequired, stripCount, stripWidthInches, totalStripLengthInches };
}
