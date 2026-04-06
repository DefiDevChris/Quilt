/**
 * Pattern Import Printlist
 *
 * Build printlist items from parsed layout data.
 */

import type { ParsedPattern } from './layout-parser-types';
import type { FabricMatch } from './layout-fabric-matcher';
import type { ImportedPrintlistItem } from './layout-import-types';
import {
  findFabricMatch,
  generateShapeId,
  generateShapeSvg,
  printlistKey,
  inferFabricGroup,
  FALLBACK_BLOCK_COLOR,
} from './layout-import-helpers';
import { DEFAULT_SEAM_ALLOWANCE_INCHES } from '@/lib/constants';

/**
 * Builds printlist items from the parsed layout's blocks and their pieces.
 *
 * Each piece in each block contributes to the printlist. Quantities are
 * multiplied by the block's quantity to get the total cuts needed.
 * Identical cuts (same fabric, shape, and dimensions) are deduplicated
 * and their quantities summed.
 */
export function buildPrintlistFromPattern(
  parsed: ParsedPattern,
  fabricMatches: readonly FabricMatch[]
): ImportedPrintlistItem[] {
  const itemMap = new Map<string, ImportedPrintlistItem>();

  for (const block of parsed.blocks) {
    for (const piece of block.pieces) {
      const totalQuantity = piece.quantity * block.quantity;
      const match = findFabricMatch(piece.fabricLabel, fabricMatches);
      const colorHex = match?.colorHex ?? FALLBACK_BLOCK_COLOR;

      const key = printlistKey(piece.fabricLabel, piece.shape, piece.cutWidth, piece.cutHeight);

      const existing = itemMap.get(key);
      if (existing != null) {
        // Sum quantities for identical cuts — create new object (immutable)
        itemMap.set(key, {
          ...existing,
          quantity: existing.quantity + totalQuantity,
        });
      } else {
        const shapeId = generateShapeId(
          piece.fabricLabel,
          piece.shape,
          piece.cutWidth,
          piece.cutHeight
        );
        const svgData = generateShapeSvg(piece.shape, piece.cutWidth, piece.cutHeight, colorHex);

        itemMap.set(key, {
          shapeId,
          shapeName: `${piece.shape} ${piece.cutWidth}" x ${piece.cutHeight}"`,
          svgData,
          quantity: totalQuantity,
          seamAllowance: DEFAULT_SEAM_ALLOWANCE_INCHES,
          seamAllowanceEnabled: true,
          unitSystem: 'imperial',
          fabricLabel: piece.fabricLabel,
          colorHex,
          cutWidth: piece.cutWidth,
          cutHeight: piece.cutHeight,
          shape: piece.shape,
        });
      }
    }
  }

  // Sort by fabric label for consistent ordering
  return Array.from(itemMap.values()).sort((a, b) => a.fabricLabel.localeCompare(b.fabricLabel));
}

/**
 * Assign fabricGroup to each printlist item when the pattern has many
 * unique fabrics (> 20). Groups by inferred color family to prevent
 * the printlist from being overwhelming.
 */
export function assignFabricGroups(
  items: readonly ImportedPrintlistItem[],
  parsed: ParsedPattern
): ImportedPrintlistItem[] {
  const uniqueFabricLabels = new Set(parsed.fabrics.map((f) => f.label));

  if (uniqueFabricLabels.size <= 20) {
    return items.map((item) => item);
  }

  // Build a label → colorFamily map from parsed fabrics
  const labelToFamily = new Map<string, string>();
  for (const fabric of parsed.fabrics) {
    if (fabric.colorFamily != null) {
      labelToFamily.set(fabric.label, fabric.colorFamily);
    }
  }

  return items.map((item) => {
    const explicitFamily = labelToFamily.get(item.fabricLabel);
    const group = explicitFamily ?? inferFabricGroup(item.fabricLabel, item.colorHex);
    return { ...item, fabricGroup: group };
  });
}
