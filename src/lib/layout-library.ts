/**
 * Layout Library — Predefined quilt layout presets
 *
 * Six layout type presets that cover the most common quilt constructions.
 * Each preset includes default configuration values, an SVG thumbnail,
 * and descriptive metadata.
 */

import type { LayoutConfig, SashingConfig, BorderConfig } from '@/lib/layout-utils';

export interface LayoutPreset {
  id: string;
  name: string;
  description: string;
  category: 'grid' | 'sashing' | 'on-point' | 'strippy' | 'medallion' | 'free-form';
  config: Omit<LayoutConfig, 'type'> & {
    type: 'grid' | 'sashing' | 'on-point' | 'strippy' | 'medallion' | 'free-form';
    bindingWidth?: number;
    hasCornerstones?: boolean;
  };
}

/**
 * The 6 core layout type presets.
 */
export const LAYOUT_PRESETS: LayoutPreset[] = [
  {
    id: 'grid-4x4',
    name: 'Grid',
    description: 'Simple rows and columns of equally sized blocks',
    category: 'grid',
    config: {
      type: 'grid',
      rows: 4,
      cols: 4,
      blockSize: 12,
      sashing: { width: 0, color: '#e5d5c5', fabricId: null },
      borders: [],
    },
  },
  {
    id: 'sashing-4x4',
    name: 'Sashing',
    description: 'Blocks separated by fabric strips with optional cornerstones',
    category: 'sashing',
    config: {
      type: 'sashing',
      rows: 4,
      cols: 4,
      blockSize: 12,
      sashing: { width: 1, color: '#e5d5c5', fabricId: null },
      borders: [],
    },
  },
  {
    id: 'on-point-3x3',
    name: 'On-Point',
    description: 'Blocks rotated 45° with setting triangles at the edges',
    category: 'on-point',
    config: {
      type: 'on-point',
      rows: 3,
      cols: 3,
      blockSize: 10,
      sashing: { width: 0, color: '#e5d5c5', fabricId: null },
      borders: [],
    },
  },
  {
    id: 'strippy-4x3',
    name: 'Strip',
    description: 'Alternating columns of blocks and fabric strips',
    category: 'strippy',
    config: {
      type: 'strippy',
      rows: 4,
      cols: 5, // 3 block cols + 2 strip cols = 5 visual columns
      blockSize: 10,
      sashing: { width: 3, color: '#e5d5c5', fabricId: null },
      borders: [],
    },
  },
  {
    id: 'medallion-1x1',
    name: 'Border + Center',
    description: 'A center focus block surrounded by concentric borders',
    category: 'medallion',
    config: {
      type: 'medallion',
      rows: 1,
      cols: 1,
      blockSize: 18,
      sashing: { width: 0, color: '#e5d5c5', fabricId: null },
      borders: [
        { width: 3, color: '#d4c4b5', fabricId: null },
        { width: 4, color: '#b8a698', fabricId: null },
      ],
    },
  },
  {
    id: 'free-form',
    name: 'Free-Form',
    description: 'No layout fence — draw and place blocks freely on the grid',
    category: 'free-form',
    config: {
      type: 'free-form',
      rows: 1,
      cols: 1,
      blockSize: 12,
      sashing: { width: 0, color: '#e5d5c5', fabricId: null },
      borders: [],
    },
  },
];

export function getLayoutPreset(id: string): LayoutPreset | undefined {
  return LAYOUT_PRESETS.find((p) => p.id === id);
}
