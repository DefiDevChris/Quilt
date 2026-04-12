/**
 * Fabric Match — CIELAB nearest-neighbour matching against a fabric library.
 *
 * Extracted from the old `grid-sampling-engine.ts` so the fabric-first
 * segmentation pipeline has a stable home for it. Pure computation — zero
 * DOM / React / Fabric.js. Reuses `color-math.ts` for all color-space work.
 *
 * Two entry points:
 *   - `matchFabricToColor(hex, candidates)` → the single-color lookup
 *     used per palette entry in the segmentation engine and per patch swap
 *     in the review UI.
 *   - `matchFabricsToCells(cells, candidates, maxDistance)` → legacy helper
 *     kept so any remaining cell-based callers keep compiling. New code
 *     should prefer the single-color form.
 */

import { hexToRgb, rgbToLab, labDistance, type RGB } from '@/lib/color-math';
import type { GridCell } from '@/lib/photo-layout-types';

// ── Public types ─────────────────────────────────────────────────────────

/**
 * Minimal shape of a fabric entry used for matching. Accepts anything with
 * an id + hex so callers can pass either `FabricListItem`s from the store
 * or a hand-rolled default palette.
 */
export interface FabricMatchCandidate {
  readonly id: string;
  readonly hex: string | null;
}

export interface CellFabricMatch {
  /** Best fabric id, or null when the candidate list is empty / invalid. */
  readonly fabricId: string | null;
  /** Hex of the matched fabric — falls back to the sampled color. */
  readonly hex: string;
  /** LAB distance between sampled color and matched fabric (lower = better). */
  readonly distance: number;
}

// ── Single-color match ──────────────────────────────────────────────────

/**
 * Find the closest fabric in a library to a single sampled hex color.
 * Uses CIELAB distance (CIE76) which correlates much better with
 * perceived similarity than raw RGB distance.
 *
 * Returns `{ fabricId: null, hex: sampledHex, distance: Infinity }` when
 * the candidate list is empty or every candidate is missing a hex.
 */
export function matchFabricToColor(
  sampledHex: string,
  candidates: readonly FabricMatchCandidate[]
): CellFabricMatch {
  if (candidates.length === 0) {
    return { fabricId: null, hex: sampledHex, distance: Infinity };
  }

  const targetLab = rgbToLab(hexToRgb(sampledHex));
  let bestId: string | null = null;
  let bestHex: string = sampledHex;
  let bestDistance = Infinity;

  for (const candidate of candidates) {
    if (!candidate.hex) continue;
    const cRgb: RGB = hexToRgb(candidate.hex);
    const d = labDistance(targetLab, rgbToLab(cRgb));
    if (d < bestDistance) {
      bestDistance = d;
      bestId = candidate.id;
      bestHex = candidate.hex;
    }
  }

  if (bestId === null) {
    return { fabricId: null, hex: sampledHex, distance: Infinity };
  }

  return { fabricId: bestId, hex: bestHex, distance: bestDistance };
}

// ── Bulk cell match (legacy) ────────────────────────────────────────────

/**
 * Map every cell to its closest fabric from the library and return a new
 * cell list with `assignedFabricId` + `fabricColor` populated.
 *
 * Cells whose `assignedFabricId` is already set are left untouched so the
 * user's manual overrides survive re-matching.
 *
 * `maxDistance` guards against forcing a terrible match when the library
 * has nothing close — leave the cell on its sampled color in that case.
 * Default is 25 LAB units (roughly: "noticeably different but same hue
 * family").
 */
export function matchFabricsToCells(
  cells: readonly GridCell[],
  candidates: readonly FabricMatchCandidate[],
  maxDistance: number = 25
): readonly GridCell[] {
  if (candidates.length === 0) return cells;

  return cells.map((cell) => {
    if (cell.assignedFabricId) return cell;

    const match = matchFabricToColor(cell.fabricColor, candidates);
    if (match.fabricId === null || match.distance > maxDistance) return cell;

    return {
      ...cell,
      fabricColor: match.hex,
      assignedFabricId: match.fabricId,
    };
  });
}
