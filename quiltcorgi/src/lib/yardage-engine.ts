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

const FAT_QUARTER_AREA_SQ_IN =
  FAT_QUARTER_DIMENSIONS.width * FAT_QUARTER_DIMENSIONS.height;

const INCHES_PER_YARD = 36;

export function groupShapesByFabric(shapes: CanvasShapeData[]): FabricGroup[] {
  if (shapes.length === 0) return [];

  const groupMap = new Map<string, FabricGroup>();

  for (const shape of shapes) {
    const key = shape.fabricId
      ? `fabric:${shape.fabricId}`
      : `color:${shape.fillColor}`;

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

export function calculateTotalArea(
  shapes: CanvasShapeData[],
  pixelsPerUnit: number
): number {
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
  if (totalAreaSqIn === 0) return 0;
  const areaWithWaste = totalAreaSqIn * (1 + wasteMargin);
  const lengthInches = areaWithWaste / wofInches;
  return lengthInches / INCHES_PER_YARD;
}

function roundUpToEighth(yards: number): number {
  return Math.ceil(yards * 8) / 8;
}

export function calculateFatQuarters(
  totalAreaSqIn: number,
  wasteMargin: number
): number {
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
