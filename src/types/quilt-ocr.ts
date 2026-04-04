export type LayoutClassification = 'grid' | 'on-point' | 'sashing' | 'none';

export interface DetectedLine {
  readonly rho: number;
  readonly theta: number;
  readonly votes: number;
}

export interface GridIntersection {
  readonly x: number;
  readonly y: number;
}

export interface DetectedGrid {
  readonly rows: number;
  readonly cols: number;
  readonly cellWidth: number;
  readonly cellHeight: number;
  readonly horizontalLines: readonly number[];
  readonly verticalLines: readonly number[];
  readonly intersections: readonly GridIntersection[];
  readonly layoutType: LayoutClassification;
  readonly confidence: number;
}

export interface BlockRegion {
  readonly row: number;
  readonly col: number;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly pixelData: Uint8ClampedArray;
}

export interface BlockMatch {
  readonly blockId: string;
  readonly blockName: string;
  readonly similarity: number;
  readonly category: string;
}

export interface RecognizedBlock {
  readonly row: number;
  readonly col: number;
  readonly matches: readonly BlockMatch[];
  readonly bestMatch: BlockMatch | null;
  readonly confidence: number;
}

export interface ExtractedColor {
  readonly hex: string;
  readonly percentage: number;
  readonly fabricId?: string;
  readonly fabricName?: string;
}

export interface BlockColorInfo {
  readonly row: number;
  readonly col: number;
  readonly dominantColors: readonly ExtractedColor[];
}

export interface QuiltMeasurements {
  readonly blockSizeInches: number;
  readonly sashingWidthInches: number;
  readonly borderWidthInches: number;
  readonly totalWidthInches: number;
  readonly totalHeightInches: number;
  readonly seamAllowanceInches: number;
}
