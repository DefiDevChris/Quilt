/**
 * Shape Picker Engine — user-driven piece identification.
 *
 * Instead of auto-detecting shape types, the user clicks representative
 * patches in the segmented pattern. This engine extracts a shape
 * signature (vertex count + dimensions in 1/8" increments), finds all
 * patches with matching dimensions, and produces named piece groups.
 *
 * Pure computation — zero DOM, zero Fabric.js, zero React.
 */

import type { DetectedPatch } from '@/lib/quilt-segmentation-engine';

// ── Public types ─────────────────────────────────────────────────────────

/** Shape signature: vertex count + dimensions in 1/8" units. */
export interface ShapeSignature {
  /** 3 = triangle, 4 = rectangle. */
  readonly vertexCount: number;
  /** Width in 1/8" units (integer), always >= heightEighths. */
  readonly widthEighths: number;
  /** Height in 1/8" units (integer), always <= widthEighths. */
  readonly heightEighths: number;
}

/** A named group of patches that share the same shape. */
export interface PieceGroup {
  readonly label: string;
  readonly signature: ShapeSignature;
  readonly patchIds: readonly string[];
  readonly displayWidth: string;
  readonly displayHeight: string;
  readonly shapeType: 'rect' | 'triangle';
}

// ── Constants ────────────────────────────────────────────────────────────

const PIECE_LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** Categorical stroke colors for groups — muted, accessible. */
export const GROUP_COLORS = [
  '#e07050',
  '#5090d0',
  '#50b060',
  '#c070c0',
  '#d0a040',
  '#60b0b0',
  '#d07090',
  '#8080c0',
] as const;

// ── Public API ───────────────────────────────────────────────────────────

/**
 * Extract a shape signature from a patch. Dimensions are converted to
 * 1/8" units and normalized so width >= height (a 2×3 matches a 3×2).
 */
export function extractSignature(
  patch: DetectedPatch,
  pxPerInch: number
): ShapeSignature {
  const widthInches = (patch.bboxPx.maxX - patch.bboxPx.minX) / pxPerInch;
  const heightInches = (patch.bboxPx.maxY - patch.bboxPx.minY) / pxPerInch;
  const wEighths = Math.round(widthInches * 8);
  const hEighths = Math.round(heightInches * 8);
  const vertexCount = patch.polygonPx.length;

  return {
    vertexCount,
    widthEighths: Math.max(wEighths, hEighths),
    heightEighths: Math.min(wEighths, hEighths),
  };
}

/**
 * Check whether two signatures match within tolerance.
 * Vertex count must match exactly; dimensions may differ by up to
 * `toleranceEighths` (default 1 = 1/8").
 */
export function signaturesMatch(
  a: ShapeSignature,
  b: ShapeSignature,
  toleranceEighths = 1
): boolean {
  if (a.vertexCount !== b.vertexCount) return false;
  return (
    Math.abs(a.widthEighths - b.widthEighths) <= toleranceEighths &&
    Math.abs(a.heightEighths - b.heightEighths) <= toleranceEighths
  );
}

/**
 * Find all patches whose signature matches the target (including the
 * target itself). Returns their IDs.
 */
export function findMatchingPatches(
  targetPatch: DetectedPatch,
  allPatches: readonly DetectedPatch[],
  pxPerInch: number,
  toleranceEighths = 1
): readonly string[] {
  const targetSig = extractSignature(targetPatch, pxPerInch);
  const matches: string[] = [];
  for (const p of allPatches) {
    const sig = extractSignature(p, pxPerInch);
    if (signaturesMatch(targetSig, sig, toleranceEighths)) {
      matches.push(p.id);
    }
  }
  return matches;
}

/**
 * Build a `PieceGroup` from a target patch and all matching patch IDs.
 */
export function buildPieceGroup(
  targetPatch: DetectedPatch,
  matchingIds: readonly string[],
  groupIndex: number,
  pxPerInch: number
): PieceGroup {
  const signature = extractSignature(targetPatch, pxPerInch);
  const { width, height, shapeType } = signatureToDisplay(signature);
  return {
    label: assignPieceLabel(groupIndex),
    signature,
    patchIds: matchingIds,
    displayWidth: width,
    displayHeight: height,
    shapeType,
  };
}

/**
 * Convert a signature to human-readable dimensions.
 * E.g. 16 eighths = "2\"", 12 = "1 1/2\"", 4 = "1/2\"".
 */
export function signatureToDisplay(sig: ShapeSignature): {
  width: string;
  height: string;
  shapeType: 'rect' | 'triangle';
} {
  return {
    width: eighthsToFraction(sig.widthEighths),
    height: eighthsToFraction(sig.heightEighths),
    shapeType: sig.vertexCount === 3 ? 'triangle' : 'rect',
  };
}

/** Generate a piece label: 0→"Piece A", 25→"Piece Z", 26→"Piece AA". */
export function assignPieceLabel(index: number): string {
  if (index < PIECE_LABELS.length) {
    return `Piece ${PIECE_LABELS[index]}`;
  }
  const first = PIECE_LABELS[Math.floor(index / PIECE_LABELS.length) - 1];
  const second = PIECE_LABELS[index % PIECE_LABELS.length];
  return `Piece ${first}${second}`;
}

/**
 * Build a lookup map from patch ID → piece label for fast rendering.
 */
export function buildPatchLabelMap(
  groups: readonly PieceGroup[]
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const group of groups) {
    for (const id of group.patchIds) {
      map[id] = group.label;
    }
  }
  return map;
}

// ── Internal helpers ─────────────────────────────────────────────────────

/**
 * Convert 1/8" units to a quilter-friendly fraction string.
 * 8→"1\"", 12→"1 1/2\"", 4→"1/2\"", 6→"3/4\"", 10→"1 1/4\"", etc.
 */
function eighthsToFraction(eighths: number): string {
  if (eighths <= 0) return '0"';
  const whole = Math.floor(eighths / 8);
  const remainder = eighths % 8;

  const fractionMap: Record<number, string> = {
    0: '',
    1: '1/8',
    2: '1/4',
    3: '3/8',
    4: '1/2',
    5: '5/8',
    6: '3/4',
    7: '7/8',
  };

  const frac = fractionMap[remainder] ?? '';
  if (whole === 0) return `${frac}"`;
  if (frac === '') return `${whole}"`;
  return `${whole} ${frac}"`;
}
