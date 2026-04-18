/**
 * Quilt Templates — Predefined fully-designed quilt patterns
 *
 * 8 curated starter templates covering popular quilt designs.
 * Each template carries its own layout configuration, block placements,
 * and default fabric assignments.
 *
 * Block and fabric IDs reference seeded database IDs.
 * These should be replaced with actual IDs from the seed data.
 */

import type { LayoutConfig } from '@/lib/layout-utils';

export type TemplateCategory = 'traditional' | 'modern' | 'baby' | 'seasonal';

export interface TemplateBlockPlacement {
  blockId: string;
  row: number;
  col: number;
  rotation?: number;
}

export interface TemplateFabricAssignment {
  /** Use specific fabric ID or fallback color */
  fabricId: string | null;
  fillColor?: string;
  target: 'block' | 'sashing' | 'border' | 'background';
}

export interface QuiltTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  thumbnail: string;
  layoutConfig: LayoutConfig;
  blocks: TemplateBlockPlacement[];
  fabricAssignments: TemplateFabricAssignment[];
  /** Canvas width in pixels (derived from layout config) */
  canvasWidth: number;
  /** Canvas height in pixels */
  canvasHeight: number;
}

/**
 * 8 starter templates. Block and fabric IDs are placeholders that should
 * be replaced with actual seeded IDs when available.
 */
export const QUILT_TEMPLATES: QuiltTemplate[] = [
  {
    id: 'template-log-cabin',
    name: 'Log Cabin',
    description: 'Classic log cabin pattern with warm earth tones',
    category: 'traditional',
    thumbnail: 'log-cabin',
    layoutConfig: {
      type: 'grid',
      rows: 3,
      cols: 3,
      blockSize: 12,
      sashing: { width: 0, color: '#d4c4b5', fabricId: null },
      borders: [{ width: 2, color: '#b8a698', fabricId: null }],
    },
    blocks: [
      { blockId: 'block-log-cabin', row: 0, col: 0 },
      { blockId: 'block-log-cabin', row: 0, col: 1 },
      { blockId: 'block-log-cabin', row: 0, col: 2 },
      { blockId: 'block-log-cabin', row: 1, col: 0 },
      { blockId: 'block-log-cabin', row: 1, col: 1 },
      { blockId: 'block-log-cabin', row: 1, col: 2 },
      { blockId: 'block-log-cabin', row: 2, col: 0 },
      { blockId: 'block-log-cabin', row: 2, col: 1 },
      { blockId: 'block-log-cabin', row: 2, col: 2 },
    ],
    fabricAssignments: [
      { fabricId: null, fillColor: '#d4a574', target: 'background' },
      { fabricId: null, fillColor: '#8b6914', target: 'border' },
    ],
    canvasWidth: 36,
    canvasHeight: 36,
  },
  {
    id: 'template-nine-patch',
    name: 'Nine Patch',
    description: 'Simple nine-patch blocks in soft blue and white',
    category: 'traditional',
    thumbnail: 'nine-patch',
    layoutConfig: {
      type: 'grid',
      rows: 4,
      cols: 4,
      blockSize: 10,
      sashing: { width: 1, color: '#e5d5c5', fabricId: null },
      borders: [{ width: 2.5, color: '#93c5fd', fabricId: null }],
    },
    blocks: [
      { blockId: 'block-nine-patch', row: 0, col: 0 },
      { blockId: 'block-nine-patch', row: 0, col: 1 },
      { blockId: 'block-nine-patch', row: 0, col: 2 },
      { blockId: 'block-nine-patch', row: 0, col: 3 },
      { blockId: 'block-nine-patch', row: 1, col: 0 },
      { blockId: 'block-nine-patch', row: 1, col: 1 },
      { blockId: 'block-nine-patch', row: 1, col: 2 },
      { blockId: 'block-nine-patch', row: 1, col: 3 },
      { blockId: 'block-nine-patch', row: 2, col: 0 },
      { blockId: 'block-nine-patch', row: 2, col: 1 },
      { blockId: 'block-nine-patch', row: 2, col: 2 },
      { blockId: 'block-nine-patch', row: 2, col: 3 },
      { blockId: 'block-nine-patch', row: 3, col: 0 },
      { blockId: 'block-nine-patch', row: 3, col: 1 },
      { blockId: 'block-nine-patch', row: 3, col: 2 },
      { blockId: 'block-nine-patch', row: 3, col: 3 },
    ],
    fabricAssignments: [
      { fabricId: null, fillColor: '#bfdbfe', target: 'block' },
      { fabricId: null, fillColor: '#ffffff', target: 'block' },
      { fabricId: null, fillColor: '#e5d5c5', target: 'sashing' },
      { fabricId: null, fillColor: '#93c5fd', target: 'border' },
    ],
    canvasWidth: 54,
    canvasHeight: 54,
  },
  {
    id: 'template-star-border',
    name: 'Star Border',
    description: 'Star blocks surrounded by alternating sashing',
    category: 'traditional',
    thumbnail: 'star-border',
    layoutConfig: {
      type: 'sashing',
      rows: 3,
      cols: 3,
      blockSize: 12,
      sashing: { width: 1.5, color: '#fcd34d', fabricId: null },
      borders: [{ width: 3, color: '#f59e0b', fabricId: null }],
    },
    blocks: [
      { blockId: 'block-star', row: 0, col: 0 },
      { blockId: 'block-star', row: 0, col: 1 },
      { blockId: 'block-star', row: 0, col: 2 },
      { blockId: 'block-star', row: 1, col: 0 },
      { blockId: 'block-star', row: 1, col: 1 },
      { blockId: 'block-star', row: 1, col: 2 },
      { blockId: 'block-star', row: 2, col: 0 },
      { blockId: 'block-star', row: 2, col: 1 },
      { blockId: 'block-star', row: 2, col: 2 },
    ],
    fabricAssignments: [
      { fabricId: null, fillColor: '#fef3c7', target: 'block' },
      { fabricId: null, fillColor: '#fcd34d', target: 'sashing' },
      { fabricId: null, fillColor: '#f59e0b', target: 'border' },
    ],
    canvasWidth: 54,
    canvasHeight: 54,
  },
  {
    id: 'template-bars',
    name: 'Strippy Bars',
    description: 'Modern straight bars with alternating colors',
    category: 'modern',
    thumbnail: 'strippy-bars',
    layoutConfig: {
      type: 'strippy',
      rows: 4,
      cols: 3,
      blockSize: 10,
      sashing: { width: 2, color: '#1a1a1a', fabricId: null },
      borders: [],
    },
    blocks: [
      { blockId: 'block-solid', row: 0, col: 0 },
      { blockId: 'block-solid', row: 1, col: 0 },
      { blockId: 'block-solid', row: 2, col: 0 },
      { blockId: 'block-solid', row: 3, col: 0 },
      { blockId: 'block-solid', row: 0, col: 2 },
      { blockId: 'block-solid', row: 1, col: 2 },
      { blockId: 'block-solid', row: 2, col: 2 },
      { blockId: 'block-solid', row: 3, col: 2 },
    ],
    fabricAssignments: [
      { fabricId: null, fillColor: '#06b6d4', target: 'block' },
      { fabricId: null, fillColor: '#f472b6', target: 'block' },
      { fabricId: null, fillColor: '#22c55e', target: 'block' },
      { fabricId: null, fillColor: '#1a1a1a', target: 'sashing' },
    ],
    canvasWidth: 46,
    canvasHeight: 52,
  },
  {
    id: 'template-baby-quilt',
    name: 'Baby Blocks',
    description: 'Soft pastel baby quilt with easy-care fabrics',
    category: 'baby',
    thumbnail: 'baby-blocks',
    layoutConfig: {
      type: 'grid',
      rows: 3,
      cols: 3,
      blockSize: 8,
      sashing: { width: 0.5, color: '#fce7f3', fabricId: null },
      borders: [{ width: 1.5, color: '#fbcfe8', fabricId: null }],
    },
    blocks: [
      { blockId: 'block-baby-star', row: 0, col: 0 },
      { blockId: 'block-baby-star', row: 0, col: 1 },
      { blockId: 'block-baby-star', row: 0, col: 2 },
      { blockId: 'block-baby-star', row: 1, col: 0 },
      { blockId: 'block-baby-star', row: 1, col: 1 },
      { blockId: 'block-baby-star', row: 1, col: 2 },
      { blockId: 'block-baby-star', row: 2, col: 0 },
      { blockId: 'block-baby-star', row: 2, col: 1 },
      { blockId: 'block-baby-star', row: 2, col: 2 },
    ],
    fabricAssignments: [
      { fabricId: null, fillColor: '#fed7aa', target: 'block' },
      { fabricId: null, fillColor: '#cbfafe', target: 'block' },
      { fabricId: null, fillColor: '#fce7f3', target: 'sashing' },
      { fabricId: null, fillColor: '#fbcfe8', target: 'border' },
      { fabricId: null, fillColor: '#fff7ed', target: 'background' },
    ],
    canvasWidth: 27,
    canvasHeight: 27,
  },
  {
    id: 'template-on-point',
    name: 'On Point Diamonds',
    description: 'Diamond arrangement with setting triangles',
    category: 'traditional',
    thumbnail: 'on-point',
    layoutConfig: {
      type: 'on-point',
      rows: 3,
      cols: 3,
      blockSize: 10,
      sashing: { width: 0, color: '#e5d5c5', fabricId: null },
      borders: [{ width: 2, color: '#d4c4b5', fabricId: null }],
    },
    blocks: [
      { blockId: 'block-diamond', row: 0, col: 0, rotation: 45 },
      { blockId: 'block-diamond', row: 0, col: 1, rotation: 45 },
      { blockId: 'block-diamond', row: 0, col: 2, rotation: 45 },
      { blockId: 'block-diamond', row: 1, col: 0, rotation: 45 },
      { blockId: 'block-diamond', row: 1, col: 1, rotation: 45 },
      { blockId: 'block-diamond', row: 1, col: 2, rotation: 45 },
      { blockId: 'block-diamond', row: 2, col: 0, rotation: 45 },
      { blockId: 'block-diamond', row: 2, col: 1, rotation: 45 },
      { blockId: 'block-diamond', row: 2, col: 2, rotation: 45 },
    ],
    fabricAssignments: [
      { fabricId: null, fillColor: '#a78bfa', target: 'block' },
      { fabricId: null, fillColor: '#ddd6fe', target: 'block' },
      { fabricId: null, fillColor: '#d4c4b5', target: 'border' },
    ],
    canvasWidth: 42,
    canvasHeight: 42,
  },
  {
    id: 'template-winter-snowflake',
    name: 'Winter Snowflakes',
    description: 'Cool blue winter quilt with snowflake blocks',
    category: 'seasonal',
    thumbnail: 'winter-snowflakes',
    layoutConfig: {
      type: 'grid',
      rows: 4,
      cols: 4,
      blockSize: 9,
      sashing: { width: 1, color: '#1e3a5f', fabricId: null },
      borders: [
        { width: 2, color: '#60a5fa', fabricId: null },
        { width: 1, color: '#1e3a5f', fabricId: null },
      ],
    },
    blocks: [
      { blockId: 'block-snowflake', row: 0, col: 0 },
      { blockId: 'block-snowflake', row: 0, col: 1 },
      { blockId: 'block-snowflake', row: 0, col: 2 },
      { blockId: 'block-snowflake', row: 0, col: 3 },
      { blockId: 'block-snowflake', row: 1, col: 0 },
      { blockId: 'block-snowflake', row: 1, col: 1 },
      { blockId: 'block-snowflake', row: 1, col: 2 },
      { blockId: 'block-snowflake', row: 1, col: 3 },
      { blockId: 'block-snowflake', row: 2, col: 0 },
      { blockId: 'block-snowflake', row: 2, col: 1 },
      { blockId: 'block-snowflake', row: 2, col: 2 },
      { blockId: 'block-snowflake', row: 2, col: 3 },
      { blockId: 'block-snowflake', row: 3, col: 0 },
      { blockId: 'block-snowflake', row: 3, col: 1 },
      { blockId: 'block-snowflake', row: 3, col: 2 },
      { blockId: 'block-snowflake', row: 3, col: 3 },
    ],
    fabricAssignments: [
      { fabricId: null, fillColor: '#dbeafe', target: 'block' },
      { fabricId: null, fillColor: '#93c5fd', target: 'block' },
      { fabricId: null, fillColor: '#60a5fa', target: 'block' },
      { fabricId: null, fillColor: '#1e3a5f', target: 'sashing' },
      { fabricId: null, fillColor: '#eff6ff', target: 'background' },
    ],
    canvasWidth: 52,
    canvasHeight: 52,
  },
  {
    id: 'template-medallion',
    name: 'Medallion Center',
    description: 'Large center block with concentric borders',
    category: 'traditional',
    thumbnail: 'medallion',
    layoutConfig: {
      type: 'medallion',
      rows: 1,
      cols: 1,
      blockSize: 16,
      sashing: { width: 0, color: '#e5d5c5', fabricId: null },
      borders: [
        { width: 2, color: '#d4a574', fabricId: null },
        { width: 2.5, color: '#8b6914', fabricId: null },
        { width: 1.5, color: '#d4a574', fabricId: null },
      ],
    },
    blocks: [{ blockId: 'block-medallion', row: 0, col: 0 }],
    fabricAssignments: [
      { fabricId: null, fillColor: '#fef3c7', target: 'block' },
      { fabricId: null, fillColor: '#d4a574', target: 'border' },
      { fabricId: null, fillColor: '#8b6914', target: 'border' },
      { fabricId: null, fillColor: '#fffbeb', target: 'background' },
    ],
    canvasWidth: 32,
    canvasHeight: 32,
  },
];

export function getTemplate(id: string): QuiltTemplate | undefined {
  return QUILT_TEMPLATES.find((t) => t.id === id);
}

export function getTemplatesByCategory(category: TemplateCategory): QuiltTemplate[] {
  return QUILT_TEMPLATES.filter((t) => t.category === category);
}