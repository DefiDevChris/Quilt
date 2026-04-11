/**
 * Photo → Pattern Types (Perspective-First Pipeline)
 *
 * The old CV-heuristic types (DetectionOptions, QuiltDetectionConfig,
 * WorkerRequestMessage, ShapeCluster, ContourHierarchy, ...) were deleted
 * when the 15-step OpenCV pipeline was ripped out. We now run a
 * perspective-first pipeline:
 *
 *   upload → calibrate → layout → review
 *
 * At each step we only need two kinds of geometric data:
 *   1. The four corners the user pinned to the real quilt block.
 *   2. The grid cells produced by the chosen block layout.
 *
 * Final output is a list of {@link GridCell}s — one per patch — each with a
 * real-world size in inches, a polygon in inch-space, and a sampled fabric
 * color. Because the polygons come from a strict mathematical grid, they
 * never need "polygon cleanup" downstream.
 */

import type { Point2D } from '@/types/geometry';

export type { Point2D };

/**
 * Normalized four-corner calibration from the CalibrationStep.
 * Coordinates are in the pixel space of the source photo
 * (`HTMLImageElement.naturalWidth/naturalHeight`).
 *
 * Order is clockwise starting from the top-left: [TL, TR, BR, BL].
 */
export type QuadCorners = readonly [Point2D, Point2D, Point2D, Point2D];

/**
 * Real-world dimensions of the calibrated block in inches.
 */
export interface RealWorldSizeInches {
  readonly widthInches: number;
  readonly heightInches: number;
}

/**
 * Grid preset describing a block-level layout (4-patch, 9-patch, HST, etc.).
 * Lives in {@link BLOCK_GRID_PRESETS}.
 */
export interface BlockGridPreset {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly rows: number;
  readonly cols: number;
  /**
   * Optional diagonal split pattern for Half-Square-Triangle style blocks.
   * Each entry maps a (row, col) cell to a split type.
   *   - 'tl-br' splits from the top-left to bottom-right diagonal.
   *   - 'tr-bl' splits from the top-right to bottom-left diagonal.
   */
  readonly splits?: ReadonlyArray<{ row: number; col: number; split: 'tl-br' | 'tr-bl' }>;
}

/**
 * One patch in the final block layout. Coordinates are in inches, relative
 * to the top-left of the block.
 */
export interface GridCell {
  /** Stable id such as `cell-r0c0` or `cell-r0c0-a` for split halves. */
  readonly id: string;
  /** Row index in the preset grid. */
  readonly row: number;
  /** Column index in the preset grid. */
  readonly col: number;
  /** Polygon in inch-space. Always axis-aligned squares or right triangles. */
  readonly polygonInches: readonly Point2D[];
  /** Centroid in inch-space (used for the K-Means sample center). */
  readonly centroidInches: Point2D;
  /** Sampled dominant color as `#rrggbb`. */
  readonly fabricColor: string;
  /**
   * Optional fabric id the user assigned from their fabric library.
   * Null means the cell is still using its auto-sampled color.
   */
  readonly assignedFabricId: string | null;
}

/**
 * Wizard steps — rebuilt for the perspective-first pipeline.
 */
export type PhotoLayoutStep =
  | 'upload'
  | 'calibrate'
  | 'layout'
  | 'review'
  | 'complete';

/**
 * Lightweight blob-url reference for the warped (flattened) image.
 * Stored as a url rather than ImageData to avoid Zustand bloat.
 */
export interface WarpedImageRef {
  readonly url: string;
  readonly width: number;
  readonly height: number;
}
