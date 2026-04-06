/**
 * Structure Detection Orchestrator — Combines grid, sashing, and border detection
 * to assign a role to every detected piece.
 *
 * Pure computation — zero DOM / React / Fabric.js dependencies.
 * Called by the photo-to-design pipeline after OpenCV piece extraction.
 *
 * Flow: grid detection → sashing detection → border detection → role assignment
 * Gracefully degrades: if any detector fails, remaining pieces get role 'unknown'.
 */

import type {
  DetectedPiece,
  QuiltStructure,
  PieceRole,
} from './photo-layout-types';
import { detectBlockGrid } from './grid-detection-engine';
import { detectSashing } from './sashing-detection-engine';
import { detectBorders } from './border-detection-engine';

/**
 * Detects the full quilt structure from extracted pieces.
 *
 * @param pieces - All detected pieces from the CV pipeline
 * @param imageWidth - Width of the source image in pixels
 * @param imageHeight - Height of the source image in pixels
 * @param colorSampler - Samples average color from a rectangular region
 * @returns Complete quilt structure with role assignments for every piece
 */
export function detectQuiltStructure(
  pieces: readonly DetectedPiece[],
  imageWidth: number,
  imageHeight: number,
  colorSampler: (x: number, y: number, w: number, h: number) => string
): QuiltStructure {
  const pieceRoles = new Map<string, PieceRole>();

  // Initialize all pieces as 'unknown'
  for (const piece of pieces) {
    pieceRoles.set(piece.id, 'unknown');
  }

  // Step 1: Detect block grid
  const grid = detectBlockGrid(pieces, imageWidth, imageHeight);

  // If we found a grid, mark grid-assigned pieces as 'block'
  if (grid) {
    for (const cell of grid.cells) {
      for (const id of cell.pieceIds) {
        pieceRoles.set(id, 'block');
      }
    }
  }

  // Step 2: Detect sashing (requires grid)
  const sashingResult = grid
    ? detectSashing(pieces, grid, colorSampler)
    : null;

  if (sashingResult) {
    for (const id of sashingResult.sashingPieceIds) {
      pieceRoles.set(id, 'sashing');
    }
    for (const id of sashingResult.cornerstonePieceIds) {
      pieceRoles.set(id, 'cornerstone');
    }
  }

  // Collect all assigned IDs for border detection
  const assignedIds = new Set<string>();
  for (const [id, role] of pieceRoles) {
    if (role !== 'unknown') {
      assignedIds.add(id);
    }
  }

  // Step 3: Detect borders and binding
  const borderResult = detectBorders(
    pieces,
    imageWidth,
    imageHeight,
    grid,
    assignedIds,
    colorSampler
  );

  for (const id of borderResult.borderPieceIds) {
    pieceRoles.set(id, 'border');
  }
  for (const id of borderResult.bindingPieceIds) {
    pieceRoles.set(id, 'binding');
  }

  // Build the QuiltStructure result
  const sashingInfo = sashingResult?.sashingInfo ?? {
    detected: false,
    widthInches: 0,
    color: '',
    hasCornerStones: false,
    totalSashingLength: 0,
  };

  return {
    grid,
    sashing: sashingInfo,
    borders: borderResult.borderInfo,
    binding: borderResult.bindingInfo,
    blockTemplate: null, // Block template extraction is a future enhancement
    pieceRoles,
  };
}
