// ============================================================================
// Photo-to-Design — Shared Types
//
// Pipeline (SAM RFC 2026-04-14):
//   1. SAM2 produces rough binary masks per candidate patch.
//   2. OpenCV morphology + findContours + approxPolyDP simplify masks to polygons.
//   3. Grid Engine snaps vertices to ¼" grid and deduplicates templates.
//   4. Polygon invariant gate ensures non-self-intersecting closed polygons
//      (precondition for the downstream Clipper seam-allowance pipeline).
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

/**
 * Raw SAM2 mask — the output of stage 1 (`sam-segment`).
 * Boolean pixel mask (`data[i] === 255` → foreground), plus tight bbox and score.
 * Coordinates are in the pre-scaled image space, not the original photo.
 */
export interface RawSAMMask {
  /** Row-major Uint8 mask (0 or 255), size = width * height */
  data: Uint8Array;
  width: number;
  height: number;
  bbox: BoundingBox;
  /** SAM IoU confidence, 0–1 */
  score: number;
}

/**
 * Simplified polygon from stage 2 (`vectorize`). Still pre-snap / pre-dedup —
 * canonicalization (U5) promotes these to `Patch` entries with `templateId`.
 */
export interface VectorizedPatch {
  /** Polygon vertices in pre-scaled image coords (closed, first !== last). */
  vertices: Point[];
  bbox: BoundingBox;
  score: number;
}

/** A single fabric patch: closed polygon outline, no fill */
export interface Patch {
  id: number;
  /** Stable template id — shared across identically-shaped patches after dedup */
  templateId: string;
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
  | 'preload'
  | 'prescale'
  | 'encode'
  | 'autoMask'
  | 'vectorize'
  | 'canonicalize'
  | 'validate'
  | 'interactive';

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

export type WorkerInput =
  | {
      type: 'preload';
      generation: number;
    }
  | {
      type: 'segment';
      generation: number;
      imageData: {
        data: Uint8ClampedArray;
        width: number;
        height: number;
      };
      gridSpec: GridSpec;
      rngSeed: number;
    }
  | {
      type: 'interactive';
      generation: number;
      imageData: {
        data: Uint8ClampedArray;
        width: number;
        height: number;
      };
      gridSpec: GridSpec;
      /** Click point in ORIGINAL (pre-prescale) image coordinates. */
      point: Point;
    }
  | {
      type: 'abort';
      generation: number;
    };

/** Geometry-only output of the interactive decoder — store injects id/templateId. */
export interface InteractivePatchCandidate {
  vertices: Point[];
  svgPath: string;
}

/** Progress of a single file download during model preload. */
export interface ModelDownloadProgress {
  /** 'initiate' | 'progress' | 'done' | 'ready' | 'download' */
  status: string;
  /** Filename being downloaded */
  file?: string;
  /** Bytes loaded so far for this file */
  loaded?: number;
  /** Total bytes expected for this file */
  total?: number;
  /** 0–100 */
  progress?: number;
}

export type WorkerOutput =
  | {
      type: 'model-progress';
      generation: number;
      progress: ModelDownloadProgress;
    }
  | {
      type: 'ready';
      generation: number;
      cached: boolean;
      totalBytes: number;
      elapsedMs: number;
    }
  | {
      type: 'progress';
      generation: number;
      progress: { stage: number; stageName: string; percentage: number };
    }
  | {
      type: 'success';
      generation: number;
      result: EngineOutput;
    }
  | {
      type: 'interactive-result';
      generation: number;
      candidate: InteractivePatchCandidate | null;
    }
  | {
      type: 'error';
      generation: number;
      error: string;
      /** 'webgpu-missing' for unrecoverable hardware gap; 'preload' for model-load failure; 'segment' for pipeline failure */
      errorKind: 'webgpu-missing' | 'preload' | 'segment' | 'unknown';
    };
