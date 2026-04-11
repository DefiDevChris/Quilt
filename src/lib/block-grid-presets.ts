/**
 * Block Grid Presets — the set of block-level layouts users can pick on the
 * calibration → layout step of the photo pipeline.
 *
 * These are *block* layouts (the geometry inside one quilt block), distinct
 * from the *quilt* layouts in {@link ./layout-library.ts} which describe how
 * blocks are assembled into a quilt top.
 */

import type { BlockGridPreset } from './photo-layout-types';

export const BLOCK_GRID_PRESETS: readonly BlockGridPreset[] = [
  {
    id: 'grid-2x2',
    name: '4-Patch',
    description: '2×2 grid — four equal squares (the classic Four-Patch).',
    rows: 2,
    cols: 2,
  },
  {
    id: 'grid-3x3',
    name: '9-Patch',
    description: '3×3 grid — nine equal squares.',
    rows: 3,
    cols: 3,
  },
  {
    id: 'grid-4x4',
    name: '16-Patch',
    description: '4×4 grid — sixteen equal squares.',
    rows: 4,
    cols: 4,
  },
  {
    id: 'grid-5x5',
    name: '25-Patch',
    description: '5×5 grid — twenty-five equal squares.',
    rows: 5,
    cols: 5,
  },
  {
    id: 'hst-2x2',
    name: 'Half-Square Triangles (2×2)',
    description:
      '2×2 grid of blocks, each split diagonally into two triangles. The go-to setup for pinwheels and broken dishes.',
    rows: 2,
    cols: 2,
    splits: [
      { row: 0, col: 0, split: 'tl-br' },
      { row: 0, col: 1, split: 'tr-bl' },
      { row: 1, col: 0, split: 'tr-bl' },
      { row: 1, col: 1, split: 'tl-br' },
    ],
  },
  {
    id: 'hst-4x4',
    name: 'Half-Square Triangles (4×4)',
    description: '4×4 grid with every cell split along the top-left / bottom-right diagonal.',
    rows: 4,
    cols: 4,
    splits: Array.from({ length: 16 }, (_, i) => ({
      row: Math.floor(i / 4),
      col: i % 4,
      split: ((Math.floor(i / 4) + (i % 4)) % 2 === 0 ? 'tl-br' : 'tr-bl') as 'tl-br' | 'tr-bl',
    })),
  },
];

export function getBlockGridPreset(id: string): BlockGridPreset | undefined {
  return BLOCK_GRID_PRESETS.find((p) => p.id === id);
}

/** Default preset when the user has not selected one yet. */
export const DEFAULT_BLOCK_GRID_PRESET_ID = 'grid-3x3';
