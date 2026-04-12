// ============================================================================
// Photo-to-Design — Shared Types
//
// Target output: a seamless planar subdivision of the quilt surface where every
// seam becomes a shared edge and every fabric patch becomes a closed SVG outline
// (no fill, just stroke). Geometry is regularized to standard quilting angles.
//
// The user-calibrated grid provides:
//   1. Minimum piece size (noise filter threshold)
//   2. Snap grid for vertex/edge regularization
//   3. Quilting-angle constraints (90°, 45°)
// ============================================================================

// -----------------------------------------------------------------------------
// Geometry Types
// -----------------------------------------------------------------------------

export interface Point {
  x: number;
  y: number;
}

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

export interface Segment {
  p1: Point;
  p2: Point;
}

// -----------------------------------------------------------------------------
// RNG Types
// -----------------------------------------------------------------------------

export interface XORShift128Plus {
  /** Returns a float in [0, 1) */
  next(): number;
  /** Returns an integer in [min, max] inclusive */
  nextInt(min: number, max: number): number;
}

// -----------------------------------------------------------------------------
// Grid Types — user-calibrated reference grid for regularization
// -----------------------------------------------------------------------------

export interface GridSpec {
  /** Size of each cell in pixels (= smallest piece size) */
  cellSize: number;
  /** Horizontal offset of grid origin */
  offsetX: number;
  /** Vertical offset of grid origin */
  offsetY: number;
  /** Number of columns */
  cols: number;
  /** Number of rows */
  rows: number;
}

// -----------------------------------------------------------------------------
// Seam / Patch Types — engine output
// -----------------------------------------------------------------------------

/** A single fabric patch: closed polygon outline, no fill */
export interface Patch {
  id: number;
  /** Vertices in pixel coords — closed polygon (first !== last, implicitly closed) */
  vertices: Point[];
  /** SVG path string (outline only) */
  svgPath: string;
}

/** Full engine output: seamless planar subdivision */
export interface EngineOutput {
  patches: Patch[];
  gridSpec: GridSpec;
  processingTime: number;
}

// -----------------------------------------------------------------------------
// Pipeline Stage Types
// -----------------------------------------------------------------------------

export type StageName =
  | 'edgeDetection'
  | 'seamTracing'
  | 'graphConstruction'
  | 'regularization'
  | 'svgGeneration';

// -----------------------------------------------------------------------------
// Engine Input
// -----------------------------------------------------------------------------

export interface EngineInput {
  /** RGBA pixel buffer */
  pixels: Uint8ClampedArray;
  /** Image width in pixels */
  width: number;
  /** Image height in pixels */
  height: number;
  /** Grid specification from user calibration (regularization constraint) */
  gridSpec: GridSpec;
  /** RNG seed for deterministic results */
  rngSeed: number;
  /** AbortSignal for cancelling */
  abortSignal?: AbortSignal;
  /** Progress callback */
  onProgress?: (stage: number, stageName: StageName, percentage: number) => void;
}

// -----------------------------------------------------------------------------
// Worker Message Types
// -----------------------------------------------------------------------------

export interface WorkerInput {
  imageData: {
    data: Uint8ClampedArray;
    width: number;
    height: number;
  };
  gridSpec: GridSpec;
  rngSeed: number;
  generation: number;
}

export interface WorkerOutput {
  type: 'success' | 'error' | 'progress';
  result?: EngineOutput;
  error?: string;
  progress?: {
    stage: number;
    stageName: string;
    percentage: number;
  };
  generation: number;
}
