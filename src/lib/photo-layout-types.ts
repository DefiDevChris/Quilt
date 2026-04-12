/**
 * Photo → Design Types (Fabric-First Pipeline)
 *
 * The wizard is: upload → calibrate → review. Calibration pins four
 * corners onto one block; warping flattens it; segmentation (k-means in
 * LAB + connected components + contour trace + simplify) produces a list
 * of `DetectedPatch` polygons in `quilt-segmentation-engine.ts`; the
 * review step lets the user pick a target fabric count and swap colors.
 *
 * Types kept here are the durable geometry contracts shared across
 * multiple modules. The live segmentation output lives alongside the
 * engine in `quilt-segmentation-engine.ts`.
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
 * Legacy type kept for the bulk `matchFabricsToCells` helper in
 * `fabric-match.ts`. New code should use `DetectedPatch` from
 * `quilt-segmentation-engine.ts` instead.
 */
export interface GridCell {
  readonly id: string;
  readonly row: number;
  readonly col: number;
  readonly polygonInches: readonly Point2D[];
  readonly centroidInches: Point2D;
  readonly fabricColor: string;
  readonly assignedFabricId: string | null;
}

/**
 * Wizard steps — three real steps in the fabric-first pipeline.
 */
export type PhotoLayoutStep =
  | 'upload'
  | 'calibrate'
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
