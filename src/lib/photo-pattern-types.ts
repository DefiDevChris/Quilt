import type { Point2D } from '@/types/geometry';

export type { Point2D };

export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface DetectedPiece {
  readonly id: string;
  readonly contour: readonly Point2D[];
  readonly boundingRect: Rect;
  readonly centroid: Point2D;
  readonly areaPx: number;
  readonly dominantColor: string;
  /**
   * Color value classification for quilting (Objective 14)
   * Light: High luminance (backgrounds, light fabrics)
   * Medium: Mid luminance (most colored fabrics)
   * Dark: Low luminance (shadows, dark navy/black)
   */
  readonly colorValue?: 'Light' | 'Medium' | 'Dark';
  /**
   * Luminance value (0-255) used for value classification
   */
  readonly luminance?: number;
}

export interface ScaledPiece {
  readonly id: string;
  readonly contourInches: readonly Point2D[];
  readonly finishedWidth: string;
  readonly finishedHeight: string;
  readonly cutWidth: string;
  readonly cutHeight: string;
  readonly finishedWidthNum: number;
  readonly finishedHeightNum: number;
  readonly dominantColor: string;
}

export type PipelineStepStatus = 'pending' | 'running' | 'complete' | 'error';

/**
 * Information about image downscaling for memory optimization.
 */
export interface DownscaleInfo {
  /** Whether the image was downscaled */
  readonly scaled: boolean;
  /** Original dimensions before scaling */
  readonly originalWidth: number;
  readonly originalHeight: number;
  /** Final dimensions after scaling */
  readonly finalWidth: number;
  readonly finalHeight: number;
  /** Scale factor applied (0.5 = 50% size) */
  readonly scaleFactor: number;
  /** Reason for downscaling */
  readonly reason: 'memory_budget' | 'piece_scale' | 'none';
}

export interface PipelineStep {
  readonly name: string;
  readonly status: PipelineStepStatus;
  readonly message?: string;
}

export type PhotoPatternStep =
  | 'upload'
  | 'imagePrep'
  | 'scanSettings'
  | 'correction'
  | 'processing'
  | 'results'
  | 'dimensions'
  | 'complete';

/**
 * Types of non-rectangular quilt shapes supported.
 */
export type QuiltShapeType = 'rectangular' | 'circular' | 'hexagonal' | 'octagonal' | 'irregular';

/**
 * Defines the boundary of a non-rectangular quilt.
 * Used for edge piece detection and bounding box calculations.
 */
export interface QuiltBoundary {
  /** Detected shape type */
  readonly type: QuiltShapeType;
  /** Bounding box that contains the entire quilt */
  readonly boundingBox: { readonly width: number; readonly height: number };
  /** Path defining the actual quilt edge (for overlay display) */
  readonly shapePath: readonly Point2D[];
  /** Center point of the quilt */
  readonly center: Point2D;
  /** For circular quilts: the radius */
  readonly radius?: number;
  /** Confidence score for auto-detection (0-1) */
  readonly confidence: number;
}

/**
 * Extended detected piece with edge information for non-rectangular quilts.
 */
export interface DetectedPieceWithEdgeInfo extends DetectedPiece {
  /** True if this piece touches the quilt boundary */
  readonly isEdgePiece: boolean;
  /** Which sides of the piece touch the boundary */
  readonly edgeSides: readonly ('top' | 'bottom' | 'left' | 'right' | 'other')[];
  /** Extra seam allowance needed for edge pieces (0.25" for trimming) */
  readonly extraSeamAllowance: number;
}

export interface QuiltSizePreset {
  readonly label: string;
  readonly width: number;
  readonly height: number;
}

// ============================================================================
// Shape Clustering Types (Objective 2: Shape Standardization)
// ============================================================================

/**
 * Classification of polygon shapes based on vertex count.
 * Used for organizing and standardizing detected quilt pieces.
 */
export type ShapeType = 'triangle' | 'quadrilateral' | 'pentagon' | 'hexagon' | 'other';

/**
 * A cluster of pieces that have been determined to be the same shape
 * via shape matching (Hu Moments comparison).
 */
export interface ShapeCluster {
  /** Unique identifier for this cluster */
  readonly id: string;
  /** Piece IDs that belong to this cluster */
  readonly pieceIds: readonly string[];
  /** The standardized contour (master shape) that all pieces in this cluster should match */
  readonly masterContour: readonly Point2D[];
  /** Number of vertices in the master shape */
  readonly vertexCount: number;
  /** Classification of the shape type */
  readonly shapeType: ShapeType;
  /** Area of the master shape in pixels */
  readonly masterArea: number;
}

// ============================================================================
// Worker Communication Types (Objective 5: Web Worker)
// ============================================================================

/** Messages sent TO the detection worker */
export type WorkerRequestMessage = {
  type: 'DETECT_PIECES';
  imageData: ImageData;
  sensitivity: number;
};

/** Messages sent FROM the detection worker */
export type WorkerResponseMessage =
  | { type: 'DETECT_PIECES_RESULT'; pieces: DetectedPiece[]; _messageId?: number }
  | { type: 'DETECT_PIECES_ERROR'; error: string; _messageId?: number };

/** Progress updates from the worker during processing */
export interface WorkerProgressMessage {
  type: 'PROGRESS';
  step: number;
  status: 'running' | 'complete' | 'error';
  message?: string;
}

// ============================================================================
// Detection Options & Configuration
// ============================================================================

/**
 * Configuration options for the piece detection pipeline.
 * Allows fine-tuning of all 15 objectives.
 */
export interface DetectionOptions {
  /** Detection sensitivity (0.2 - 2.0) */
  readonly sensitivity?: number;
  /** Enable shape clustering and standardization (Objective 2) */
  readonly enableShapeClustering?: boolean;
  /** Enable nested shape detection for appliqué (Objective 10) */
  readonly detectNestedShapes?: boolean;
  /** Enable CLAHE illumination normalization (Objective 5) */
  readonly enableCLAHE?: boolean;
  /** CLAHE clip limit (default: 2.0) */
  readonly claheClipLimit?: number;
  /** Enable Laplacian sharpening (Objective 4) */
  readonly enableSharpening?: boolean;
  /** Sharpening intensity (default: 0.5) */
  readonly sharpeningIntensity?: number;
  /** Enable morphological opening to remove topstitching (Objective 6) */
  readonly removeTopstitching?: boolean;
  /** Topstitching kernel size factor (default: 0.002 of image width) */
  readonly topstitchingKernelFactor?: number;
  /** Enable Sobel gradient filtering (Objective 8) */
  readonly useSobelGradient?: boolean;
  /** Sobel threshold multiplier (default: 1.0) */
  readonly sobelThresholdMultiplier?: number;
  /** Enable Watershed for low-contrast seams (Objective 9) */
  readonly enableWatershed?: boolean;
  /** Watershed marker distance threshold (default: 5) */
  readonly watershedDistanceThreshold?: number;
  /** Solidity threshold for artifact rejection (Objective 11, default: 0.5) */
  readonly minSolidity?: number;
  /** Maximum aspect ratio for sliver rejection (Objective 12, default: 20) */
  readonly maxAspectRatio?: number;
  /** Seam allowance in inches for polygon offset (Objective 3, default: 0.25) */
  readonly seamAllowanceInches?: number;
  /**
   * Quilter-friendly scan configuration.
   * Provides "priors" to help the CV engine make better decisions.
   */
  readonly quiltConfig?: QuiltDetectionConfig;
}

// ============================================================================
// Quilt Detection Configuration (Scan Profile)
// ============================================================================

/**
 * Quilter-friendly scan configuration options.
 * These "priors" help the CV engine make better decisions based on
the quilt's physical characteristics.
 */
export interface QuiltDetectionConfig {
  /**
   * Does the quilt have curved seams (e.g., Drunkard's Path, Orange Peel)?
   * When true, bypasses strict straight-line enforcement in cv.approxPolyDP
   * and routes flagged shapes to Bezier/Spline smoothing algorithms.
   */
  hasCurvedPiecing: boolean;

  /**
   * Are there appliqué shapes sewn on top of the background?
   * When true, changes contour retrieval mode from RETR_EXTERNAL to
   * RETR_TREE so inner shapes are not ignored.
   */
  hasApplique: boolean;

  /**
   * Are there pieces of the exact same fabric sewn touching each other?
   * When true, activates cv.distanceTransform and cv.watershed segmentation
   * to forcefully separate adjacent identical fabrics.
   */
  hasLowContrastSeams: boolean;

  /**
   * Is there heavy quilting or embroidery over the pieces?
   * When true, increases the kernel size of cv.morphologyEx (MORPH_OPEN)
   * to aggressively erase thick threads before edge detection.
   */
  hasHeavyTopstitching: boolean;

  /**
   * General size of the quilt pieces.
   * - 'tiny': Lowers the noise filter threshold so small pieces aren't
   discarded as lint
   * - 'standard': Default filtering thresholds
   * - 'large': Raises the minimum contour area threshold
   */
  pieceScale: 'tiny' | 'standard' | 'large';

  /**
   * Shape of the quilt (for non-rectangular quilts).
   * Used to calculate edge pieces and bounding box.
   */
  quiltShape: QuiltShapeType;
}

/**
 * Default scan configuration for a "typical" quilt.
 */
export const DEFAULT_QUILT_DETECTION_CONFIG: QuiltDetectionConfig = {
  hasCurvedPiecing: false,
  hasApplique: false,
  hasLowContrastSeams: false,
  hasHeavyTopstitching: false,
  pieceScale: 'standard',
  quiltShape: 'rectangular',
};

// ============================================================================
// Nested Shape / Appliqué Support (Objective 6)
// ============================================================================

/**
 * Hierarchy information for nested contours (parent-child relationships).
 * Used for appliqué designs where shapes contain inner shapes.
 *
 * OpenCV hierarchy format: [next, previous, first_child, parent]
 * - next: Index of next contour at same level
 * - prev: Index of previous contour at same level
 * - first_child: Index of first child contour
 * - parent: Index of parent contour (-1 if none)
 */
export interface ContourHierarchy {
  /** Index of the next sibling contour at the same level (-1 if none) */
  readonly nextIndex: number;
  /** Index of the previous sibling contour at the same level (-1 if none) */
  readonly prevIndex: number;
  /** Index of the first child contour (-1 if no children) */
  readonly firstChildIndex: number;
  /** Index of the parent contour (-1 if no parent/top-level) */
  readonly parentIndex: number;
}

/**
 * Extended detected piece with hierarchy information for appliqué support.
 */
export interface DetectedPieceWithHierarchy extends DetectedPiece {
  /** Original contour index from OpenCV */
  readonly contourIndex: number;
  /** Hierarchy information for nested shapes */
  readonly hierarchy: ContourHierarchy;
  /** IDs of child pieces (inner shapes/appliqué) */
  readonly childPieceIds: readonly string[];
  /** ID of parent piece (null if this is a top-level piece) */
  readonly parentPieceId: string | null;
  /** Depth level in the hierarchy (0 = top level) */
  readonly hierarchyLevel: number;
  /** True if this piece has children (is a parent) */
  readonly hasChildren: boolean;
  /** True if this piece has a parent (is a child/appliqué) */
  readonly isApplique: boolean;
}
