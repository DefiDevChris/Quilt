/**
 * Shade Assignment Engine Tests
 *
 * Tests the pure computation engine for shade-aware patch queries.
 * Zero React/DOM/Fabric.js dependencies.
 */

import { describe, it, expect } from 'vitest';
import {
  findPatchesByShade,
  getShadeBreakdown,
  hasShadeMetadata,
  EMPTY_BREAKDOWN,
} from '@/lib/shade-assignment-engine';
import type { Shade, PatchDescriptor } from '@/types/shade';

// ── Helper factories ────────────────────────────────────────────────

function createPatch(shade: Shade, role: string = 'patch', index: number = 0): PatchDescriptor {
  return {
    __pieceRole: role,
    __shade: shade,
    __blockPatchIndex: index,
    __blockId: 'block-1',
  };
}

function createGroup(
  patches: Array<{ shade: Shade; role?: string }>,
  blockId: string = 'block-1'
): PatchDescriptor {
  return {
    __isBlockGroup: true,
    __blockId: blockId,
    children: patches.map((p, i) => createPatch(p.shade, p.role ?? 'patch', i)),
  };
}

// ── findPatchesByShade ──────────────────────────────────────────────

describe('findPatchesByShade', () => {
  it('should return empty array for empty objects', () => {
    const result = findPatchesByShade([], 'dark', 'all');
    expect(result).toEqual([]);
  });

  it('should return empty array when no block groups exist', () => {
    const objects: PatchDescriptor[] = [
      { __pieceRole: 'patch', __shade: 'dark' },
      { __pieceRole: 'patch', __shade: 'light' },
    ];
    const result = findPatchesByShade(objects, 'dark', 'all');
    expect(result).toEqual([]);
  });

  it('should find all dark patches across multiple groups', () => {
    const objects = [
      createGroup([{ shade: 'dark' }, { shade: 'light' }, { shade: 'dark' }], 'block-1'),
      createGroup([{ shade: 'dark' }, { shade: 'background' }], 'block-2'),
    ];
    const result = findPatchesByShade(objects, 'dark', 'all');
    expect(result).toEqual([
      { groupIndex: 0, patchIndex: 0 },
      { groupIndex: 0, patchIndex: 2 },
      { groupIndex: 1, patchIndex: 0 },
    ]);
  });

  it('should find light patches', () => {
    const objects = [
      createGroup([{ shade: 'dark' }, { shade: 'light' }, { shade: 'light' }]),
    ];
    const result = findPatchesByShade(objects, 'light', 'all');
    expect(result).toEqual([
      { groupIndex: 0, patchIndex: 1 },
      { groupIndex: 0, patchIndex: 2 },
    ]);
  });

  it('should find background patches', () => {
    const objects = [
      createGroup([{ shade: 'background' }, { shade: 'dark' }]),
    ];
    const result = findPatchesByShade(objects, 'background', 'all');
    expect(result).toEqual([{ groupIndex: 0, patchIndex: 0 }]);
  });

  it('should ignore children with non-patch roles (seam lines)', () => {
    const objects = [
      createGroup([
        { shade: 'dark', role: 'patch' },
        { shade: 'dark', role: 'seam' },
        { shade: 'dark', role: 'patch' },
      ]),
    ];
    const result = findPatchesByShade(objects, 'dark', 'all');
    // Only 2 patches, seam is filtered out — indices are within the patch-filtered list
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ groupIndex: 0, patchIndex: 0 });
    expect(result[1]).toEqual({ groupIndex: 0, patchIndex: 1 });
  });

  it('should handle groups with no children', () => {
    const objects: PatchDescriptor[] = [
      { __isBlockGroup: true, __blockId: 'empty' },
    ];
    const result = findPatchesByShade(objects, 'dark', 'all');
    expect(result).toEqual([]);
  });

  it('should handle groups with empty children array', () => {
    const objects: PatchDescriptor[] = [
      { __isBlockGroup: true, __blockId: 'empty', children: [] },
    ];
    const result = findPatchesByShade(objects, 'dark', 'all');
    expect(result).toEqual([]);
  });

  it('should filter to selected groups when scope is selected', () => {
    const group1 = createGroup([{ shade: 'dark' }, { shade: 'dark' }], 'block-1');
    const group2 = createGroup([{ shade: 'dark' }, { shade: 'light' }], 'block-2');
    const objects = [group1, group2];
    const result = findPatchesByShade(objects, 'dark', 'selected', [group2]);
    // Only 1 dark patch in the selected group2
    expect(result).toEqual([{ groupIndex: 0, patchIndex: 0 }]);
  });

  it('should return empty when no patches match the shade', () => {
    const objects = [
      createGroup([{ shade: 'light' }, { shade: 'background' }]),
    ];
    const result = findPatchesByShade(objects, 'dark', 'all');
    expect(result).toEqual([]);
  });
});

// ── getShadeBreakdown ───────────────────────────────────────────────

describe('getShadeBreakdown', () => {
  it('should return zeros for empty input', () => {
    const result = getShadeBreakdown([], 'all');
    expect(result).toEqual(EMPTY_BREAKDOWN);
  });

  it('should return zeros when no block groups exist', () => {
    const objects: PatchDescriptor[] = [
      { __pieceRole: 'patch', __shade: 'dark' },
    ];
    const result = getShadeBreakdown(objects, 'all');
    expect(result).toEqual(EMPTY_BREAKDOWN);
  });

  it('should count patches correctly with mixed shades', () => {
    const objects = [
      createGroup([
        { shade: 'dark' },
        { shade: 'dark' },
        { shade: 'light' },
        { shade: 'background' },
      ]),
    ];
    const result = getShadeBreakdown(objects, 'all');
    expect(result).toEqual({ dark: 2, light: 1, background: 1, unknown: 0 });
  });

  it('should count across multiple groups', () => {
    const objects = [
      createGroup([{ shade: 'dark' }, { shade: 'light' }], 'block-1'),
      createGroup([{ shade: 'dark' }, { shade: 'background' }, { shade: 'background' }], 'block-2'),
    ];
    const result = getShadeBreakdown(objects, 'all');
    expect(result).toEqual({ dark: 2, light: 1, background: 2, unknown: 0 });
  });

  it('should treat missing __shade as unknown', () => {
    const group: PatchDescriptor = {
      __isBlockGroup: true,
      __blockId: 'test',
      children: [
        { __pieceRole: 'patch', __blockPatchIndex: 0 },
        { __pieceRole: 'patch', __shade: 'dark', __blockPatchIndex: 1 },
      ],
    };
    const result = getShadeBreakdown([group], 'all');
    expect(result).toEqual({ dark: 1, light: 0, background: 0, unknown: 1 });
  });

  it('should ignore seam children', () => {
    const objects = [
      createGroup([
        { shade: 'dark', role: 'patch' },
        { shade: 'dark', role: 'seam' },
      ]),
    ];
    const result = getShadeBreakdown(objects, 'all');
    expect(result).toEqual({ dark: 1, light: 0, background: 0, unknown: 0 });
  });

  it('should only count selected groups when scope is selected', () => {
    const group1 = createGroup([{ shade: 'dark' }, { shade: 'dark' }], 'block-1');
    const group2 = createGroup([{ shade: 'light' }], 'block-2');
    const result = getShadeBreakdown([group1, group2], 'selected', [group1]);
    expect(result).toEqual({ dark: 2, light: 0, background: 0, unknown: 0 });
  });
});

// ── hasShadeMetadata ────────────────────────────────────────────────

describe('hasShadeMetadata', () => {
  it('should return false for empty input', () => {
    expect(hasShadeMetadata([])).toBe(false);
  });

  it('should return false when no block groups exist', () => {
    const objects: PatchDescriptor[] = [
      { __pieceRole: 'patch', __shade: 'dark' },
    ];
    expect(hasShadeMetadata(objects)).toBe(false);
  });

  it('should return false when all shades are unknown', () => {
    const objects = [
      createGroup([{ shade: 'unknown' }, { shade: 'unknown' }]),
    ];
    expect(hasShadeMetadata(objects)).toBe(false);
  });

  it('should return false when patches have no shade set', () => {
    const group: PatchDescriptor = {
      __isBlockGroup: true,
      __blockId: 'test',
      children: [
        { __pieceRole: 'patch', __blockPatchIndex: 0 },
      ],
    };
    expect(hasShadeMetadata([group])).toBe(false);
  });

  it('should return true when at least one non-unknown shade exists', () => {
    const objects = [
      createGroup([{ shade: 'unknown' }, { shade: 'dark' }]),
    ];
    expect(hasShadeMetadata(objects)).toBe(true);
  });

  it('should return true for light shade', () => {
    const objects = [createGroup([{ shade: 'light' }])];
    expect(hasShadeMetadata(objects)).toBe(true);
  });

  it('should return true for background shade', () => {
    const objects = [createGroup([{ shade: 'background' }])];
    expect(hasShadeMetadata(objects)).toBe(true);
  });

  it('should check across multiple groups', () => {
    const objects = [
      createGroup([{ shade: 'unknown' }], 'block-1'),
      createGroup([{ shade: 'dark' }], 'block-2'),
    ];
    expect(hasShadeMetadata(objects)).toBe(true);
  });
});
