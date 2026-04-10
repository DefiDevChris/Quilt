/**
 * Shade Assignment Engine
 *
 * Pure computation for shade-aware patch queries. Zero React/Fabric/DOM
 * dependencies — fully testable.
 */

import type { Shade, ShadeBreakdown, PatchDescriptor } from '@/types/shade';

const EMPTY_BREAKDOWN: ShadeBreakdown = {
  dark: 0,
  light: 0,
  background: 0,
  unknown: 0,
};

/**
 * Collect all block groups from an objects array.
 */
function collectGroups(
  objects: readonly PatchDescriptor[],
  scope: 'selected' | 'all',
  selectedGroupDescriptors?: readonly PatchDescriptor[]
): readonly PatchDescriptor[] {
  const source = scope === 'selected' && selectedGroupDescriptors
    ? selectedGroupDescriptors
    : objects;
  return source.filter((obj) => obj.__isBlockGroup === true);
}

/**
 * Get patch children from a block group descriptor.
 */
function patchChildren(group: PatchDescriptor): readonly PatchDescriptor[] {
  if (!group.children) return [];
  return group.children.filter((child) => child.__pieceRole === 'patch');
}

/**
 * Find all patches matching a given shade across canvas object descriptors.
 *
 * Walks block groups (__isBlockGroup), filters children by
 * __pieceRole === 'patch' and __shade === shade.
 *
 * @param objects - Flat array of top-level canvas object descriptors
 * @param shade - Target shade to match
 * @param scope - 'all' searches every block group; 'selected' only searches selectedGroupDescriptors
 * @param selectedGroupDescriptors - When scope='selected', only these are searched
 * @returns Indices identifying matched patches: { groupIndex, patchIndex }
 */
export function findPatchesByShade(
  objects: readonly PatchDescriptor[],
  shade: Shade,
  scope: 'selected' | 'all',
  selectedGroupDescriptors?: readonly PatchDescriptor[]
): ReadonlyArray<{ readonly groupIndex: number; readonly patchIndex: number }> {
  const groups = collectGroups(objects, scope, selectedGroupDescriptors);
  const results: Array<{ readonly groupIndex: number; readonly patchIndex: number }> = [];

  for (let gi = 0; gi < groups.length; gi++) {
    const patches = patchChildren(groups[gi]);
    for (let pi = 0; pi < patches.length; pi++) {
      if (patches[pi].__shade === shade) {
        results.push({ groupIndex: gi, patchIndex: pi });
      }
    }
  }

  return results;
}

/**
 * Count patches by shade category across block groups.
 */
export function getShadeBreakdown(
  objects: readonly PatchDescriptor[],
  scope: 'selected' | 'all',
  selectedGroupDescriptors?: readonly PatchDescriptor[]
): ShadeBreakdown {
  const groups = collectGroups(objects, scope, selectedGroupDescriptors);
  let dark = 0;
  let light = 0;
  let background = 0;
  let unknown = 0;

  for (const group of groups) {
    for (const patch of patchChildren(group)) {
      switch (patch.__shade) {
        case 'dark':
          dark++;
          break;
        case 'light':
          light++;
          break;
        case 'background':
          background++;
          break;
        default:
          unknown++;
          break;
      }
    }
  }

  return { dark, light, background, unknown };
}

/**
 * Return true if any block group in the objects array has shade metadata
 * (at least one patch with a non-'unknown' shade).
 */
export function hasShadeMetadata(
  objects: readonly PatchDescriptor[]
): boolean {
  const groups = objects.filter((obj) => obj.__isBlockGroup === true);

  for (const group of groups) {
    for (const patch of patchChildren(group)) {
      if (
        patch.__shade !== undefined &&
        patch.__shade !== 'unknown'
      ) {
        return true;
      }
    }
  }

  return false;
}

export { EMPTY_BREAKDOWN };
