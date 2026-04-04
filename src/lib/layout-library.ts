/**
 * Layout Library — Predefined quilt layout presets
 */

import type { LayoutConfig } from '@/lib/layout-utils';
import { DEFAULT_SASHING_COLOR, DEFAULT_BORDER_COLOR } from '@/lib/constants';

export interface LayoutPreset {
  id: string;
  name: string;
  description: string;
  category: 'grid' | 'sashing' | 'on-point';
  config: Omit<LayoutConfig, 'type'> & { type: 'grid' | 'sashing' | 'on-point' };
}

export const LAYOUT_PRESETS: LayoutPreset[] = [
  // Grid Layouts
  {
    id: 'grid-3x3',
    name: 'Grid 3×3',
    description: '9 blocks in a simple grid',
    category: 'grid',
    config: {
      type: 'grid',
      rows: 3,
      cols: 3,
      blockSize: 6,
      sashing: { width: 0, color: DEFAULT_SASHING_COLOR, fabricId: null },
      borders: [],
    },
  },
  {
    id: 'grid-4x4',
    name: 'Grid 4×4',
    description: '16 blocks in a simple grid',
    category: 'grid',
    config: {
      type: 'grid',
      rows: 4,
      cols: 4,
      blockSize: 6,
      sashing: { width: 0, color: DEFAULT_SASHING_COLOR, fabricId: null },
      borders: [],
    },
  },
  {
    id: 'grid-5x5',
    name: 'Grid 5×5',
    description: '25 blocks in a simple grid',
    category: 'grid',
    config: {
      type: 'grid',
      rows: 5,
      cols: 5,
      blockSize: 6,
      sashing: { width: 0, color: DEFAULT_SASHING_COLOR, fabricId: null },
      borders: [],
    },
  },

  // Sashing Layouts
  {
    id: 'sashing-3x3',
    name: 'Sashing 3×3',
    description: '9 blocks with sashing strips',
    category: 'sashing',
    config: {
      type: 'sashing',
      rows: 3,
      cols: 3,
      blockSize: 6,
      sashing: { width: 1, color: DEFAULT_SASHING_COLOR, fabricId: null },
      borders: [],
    },
  },
  {
    id: 'sashing-4x4',
    name: 'Sashing 4×4',
    description: '16 blocks with sashing strips',
    category: 'sashing',
    config: {
      type: 'sashing',
      rows: 4,
      cols: 4,
      blockSize: 6,
      sashing: { width: 1, color: DEFAULT_SASHING_COLOR, fabricId: null },
      borders: [],
    },
  },
  {
    id: 'sashing-5x5-border',
    name: 'Sashing 5×5 + Border',
    description: '25 blocks with sashing and border',
    category: 'sashing',
    config: {
      type: 'sashing',
      rows: 5,
      cols: 5,
      blockSize: 6,
      sashing: { width: 1, color: DEFAULT_SASHING_COLOR, fabricId: null },
      borders: [
        {
          id: crypto.randomUUID(),
          width: 2,
          color: DEFAULT_BORDER_COLOR,
          fabricId: null,
          type: 'solid',
        },
      ],
    },
  },

  // On-Point Layouts
  {
    id: 'on-point-3x3',
    name: 'On-Point 3×3',
    description: '9 blocks rotated 45° with setting triangles',
    category: 'on-point',
    config: {
      type: 'on-point',
      rows: 3,
      cols: 3,
      blockSize: 6,
      sashing: { width: 0, color: DEFAULT_SASHING_COLOR, fabricId: null },
      borders: [],
    },
  },
  {
    id: 'on-point-4x4',
    name: 'On-Point 4×4',
    description: '16 blocks rotated 45° with setting triangles',
    category: 'on-point',
    config: {
      type: 'on-point',
      rows: 4,
      cols: 4,
      blockSize: 6,
      sashing: { width: 0, color: DEFAULT_SASHING_COLOR, fabricId: null },
      borders: [],
    },
  },
  {
    id: 'on-point-5x5-border',
    name: 'On-Point 5×5 + Border',
    description: '25 blocks on-point with border',
    category: 'on-point',
    config: {
      type: 'on-point',
      rows: 5,
      cols: 5,
      blockSize: 6,
      sashing: { width: 0, color: DEFAULT_SASHING_COLOR, fabricId: null },
      borders: [
        {
          id: crypto.randomUUID(),
          width: 2,
          color: DEFAULT_BORDER_COLOR,
          fabricId: null,
          type: 'solid',
        },
      ],
    },
  },
];

export function getLayoutPreset(id: string): LayoutPreset | undefined {
  return LAYOUT_PRESETS.find((p) => p.id === id);
}
