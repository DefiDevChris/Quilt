export interface Point {
  x: number;
  y: number;
}

export interface Patch {
  id: number;
  templateId: string;
  polygon: Point[];
  pixelPolygon: Point[];
  svgPath: string;
  centroid: Point;
  area: number;
  vertexCount: number;
  dominantColor: string;
  colorPalette: [string, string, string];
  fabricSwatch: string;
  neighbors: number[];
}

export interface ShapeTemplate {
  id: string;
  name: string;
  normalizedPolygon: Point[];
  realWorldSize: { w: number; h: number };
  instanceCount: number;
  instanceIds: number[];
}

export interface DetectedGrid {
  type: 'rectangular' | 'triangular' | 'hexagonal' | 'none';
  dominantAngles: number[];
  spacings: { angle: number; spacing: number }[];
  confidence: number;
}

export interface ProcessParams {
  claheClipLimit: number;
  claheGridSize: number;
  gaussianBlurSize: number;
  bilateralD: number;
  bilateralSigmaColor: number;
  bilateralSigmaSpace: number;
  kColors: number;
  minPatchArea: number;
  edgeEnhance: boolean;
  cannyLow: number;
  cannyHigh: number;
  gridSnapEnabled: boolean;
  gridSnapTolerance: number;
  pixelsPerUnit: number;
  unit: 'in' | 'cm';
}

export interface StudioImportPayload {
  version: '1.0';
  source: 'photo-to-design';
  metadata: {
    quiltWidth: number;
    quiltHeight: number;
    unit: 'in' | 'cm';
    patchCount: number;
    templateCount: number;
    gridType: 'rectangular' | 'triangular' | 'hexagonal' | 'none';
  };
  patches: {
    id: string;
    templateId: string;
    polygon: Point[];
    fill: string;
    colorPalette: [string, string, string];
    swatch: string;
  }[];
  templates: ShapeTemplate[];
  correctedImageUrl?: string;
}
