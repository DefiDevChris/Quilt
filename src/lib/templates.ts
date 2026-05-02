/**
 * Quilt Templates — Predefined fully-designed quilt patterns
 *
 * 8 curated starter templates covering popular quilt designs.
 * Each template carries its own layout configuration, block placements,
 * and default fabric assignments.
 *
 * Block and fabric IDs reference canonical seeded database rows.
 * Keep in sync with src/db/seed/template-seed-data.ts.
 */

import type { LayoutConfig } from '@/lib/layout-utils';

/* ── Canonical block IDs (sync with template-seed-data.ts) ── */
const BLOCK_LOG_CABIN = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
const BLOCK_NINE_PATCH = 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e';
const BLOCK_STAR = 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f';
const BLOCK_SOLID = 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a';
const BLOCK_BABY_STAR = 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b';
const BLOCK_DIAMOND = 'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c';
const BLOCK_SNOWFLAKE = 'a7b8c9d0-e1f2-4a3b-4c5d-6e7f8a9b0c1d';
const BLOCK_MEDALLION = 'b8c9d0e1-f2a3-4b4c-5d6e-7f8a9b0c1d2e';

/* ── Canonical fabric IDs (sync with template-seed-data.ts) ── */
const FABRIC_WARM_TAN = '10000000-0000-0000-0000-000000000001';
const FABRIC_GRAY_BROWN = '10000000-0000-0000-0000-000000000002';
const FABRIC_TAUPE = '10000000-0000-0000-0000-000000000003';
const FABRIC_CREAM = '10000000-0000-0000-0000-000000000004';
const FABRIC_SKY_BLUE = '10000000-0000-0000-0000-000000000005';
const FABRIC_LIGHT_BLUE = '10000000-0000-0000-0000-000000000006';
const FABRIC_WHITE = '10000000-0000-0000-0000-000000000007';
const FABRIC_YELLOW = '10000000-0000-0000-0000-000000000008';
const FABRIC_AMBER = '10000000-0000-0000-0000-000000000009';
const FABRIC_PALE_YELLOW = '10000000-0000-0000-0000-000000000010';
const FABRIC_CHARCOAL = '10000000-0000-0000-0000-000000000011';
const FABRIC_CYAN = '10000000-0000-0000-0000-000000000012';
const FABRIC_PINK = '10000000-0000-0000-0000-000000000013';
const FABRIC_GREEN = '10000000-0000-0000-0000-000000000014';
const FABRIC_PEACH = '10000000-0000-0000-0000-000000000015';
const FABRIC_MINT = '10000000-0000-0000-0000-000000000016';
const FABRIC_BLUSH = '10000000-0000-0000-0000-000000000017';
const FABRIC_ROSE = '10000000-0000-0000-0000-000000000018';
const FABRIC_IVORY = '10000000-0000-0000-0000-000000000019';
const FABRIC_LAVENDER = '10000000-0000-0000-0000-000000000020';
const FABRIC_LIGHT_LAVENDER = '10000000-0000-0000-0000-000000000021';
const FABRIC_NAVY = '10000000-0000-0000-0000-000000000022';
const FABRIC_CORNFLOWER = '10000000-0000-0000-0000-000000000023';
const FABRIC_PALE_BLUE = '10000000-0000-0000-0000-000000000024';
const FABRIC_ALICE_BLUE = '10000000-0000-0000-0000-000000000025';
const FABRIC_CREAM_WHITE = '10000000-0000-0000-0000-000000000026';
const FABRIC_BROWN = '10000000-0000-0000-0000-000000000027';

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
 * 8 starter templates. Block and fabric IDs are canonical seeded UUIDs
 * that map to rows inserted by src/db/seed/seed-templates.ts.
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
      sashing: { width: 0, color: '#d4c4b5', fabricId: FABRIC_TAUPE },
      borders: [{ width: 2, color: '#b8a698', fabricId: FABRIC_GRAY_BROWN }],
    },
    blocks: [
      { blockId: BLOCK_LOG_CABIN, row: 0, col: 0 },
      { blockId: BLOCK_LOG_CABIN, row: 0, col: 1 },
      { blockId: BLOCK_LOG_CABIN, row: 0, col: 2 },
      { blockId: BLOCK_LOG_CABIN, row: 1, col: 0 },
      { blockId: BLOCK_LOG_CABIN, row: 1, col: 1 },
      { blockId: BLOCK_LOG_CABIN, row: 1, col: 2 },
      { blockId: BLOCK_LOG_CABIN, row: 2, col: 0 },
      { blockId: BLOCK_LOG_CABIN, row: 2, col: 1 },
      { blockId: BLOCK_LOG_CABIN, row: 2, col: 2 },
    ],
    fabricAssignments: [
      { fabricId: FABRIC_WARM_TAN, fillColor: '#d4a574', target: 'background' },
      { fabricId: FABRIC_BROWN, fillColor: '#8b6914', target: 'border' },
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
      sashing: { width: 1, color: '#e5d5c5', fabricId: FABRIC_CREAM },
      borders: [{ width: 2.5, color: '#93c5fd', fabricId: FABRIC_SKY_BLUE }],
    },
    blocks: [
      { blockId: BLOCK_NINE_PATCH, row: 0, col: 0 },
      { blockId: BLOCK_NINE_PATCH, row: 0, col: 1 },
      { blockId: BLOCK_NINE_PATCH, row: 0, col: 2 },
      { blockId: BLOCK_NINE_PATCH, row: 0, col: 3 },
      { blockId: BLOCK_NINE_PATCH, row: 1, col: 0 },
      { blockId: BLOCK_NINE_PATCH, row: 1, col: 1 },
      { blockId: BLOCK_NINE_PATCH, row: 1, col: 2 },
      { blockId: BLOCK_NINE_PATCH, row: 1, col: 3 },
      { blockId: BLOCK_NINE_PATCH, row: 2, col: 0 },
      { blockId: BLOCK_NINE_PATCH, row: 2, col: 1 },
      { blockId: BLOCK_NINE_PATCH, row: 2, col: 2 },
      { blockId: BLOCK_NINE_PATCH, row: 2, col: 3 },
      { blockId: BLOCK_NINE_PATCH, row: 3, col: 0 },
      { blockId: BLOCK_NINE_PATCH, row: 3, col: 1 },
      { blockId: BLOCK_NINE_PATCH, row: 3, col: 2 },
      { blockId: BLOCK_NINE_PATCH, row: 3, col: 3 },
    ],
    fabricAssignments: [
      { fabricId: FABRIC_LIGHT_BLUE, fillColor: '#bfdbfe', target: 'block' },
      { fabricId: FABRIC_WHITE, fillColor: '#ffffff', target: 'block' },
      { fabricId: FABRIC_CREAM, fillColor: '#e5d5c5', target: 'sashing' },
      { fabricId: FABRIC_SKY_BLUE, fillColor: '#93c5fd', target: 'border' },
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
      sashing: { width: 1.5, color: '#fcd34d', fabricId: FABRIC_YELLOW },
      borders: [{ width: 3, color: '#f59e0b', fabricId: FABRIC_AMBER }],
    },
    blocks: [
      { blockId: BLOCK_STAR, row: 0, col: 0 },
      { blockId: BLOCK_STAR, row: 0, col: 1 },
      { blockId: BLOCK_STAR, row: 0, col: 2 },
      { blockId: BLOCK_STAR, row: 1, col: 0 },
      { blockId: BLOCK_STAR, row: 1, col: 1 },
      { blockId: BLOCK_STAR, row: 1, col: 2 },
      { blockId: BLOCK_STAR, row: 2, col: 0 },
      { blockId: BLOCK_STAR, row: 2, col: 1 },
      { blockId: BLOCK_STAR, row: 2, col: 2 },
    ],
    fabricAssignments: [
      { fabricId: FABRIC_PALE_YELLOW, fillColor: '#fef3c7', target: 'block' },
      { fabricId: FABRIC_YELLOW, fillColor: '#fcd34d', target: 'sashing' },
      { fabricId: FABRIC_AMBER, fillColor: '#f59e0b', target: 'border' },
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
      sashing: { width: 2, color: '#1a1a1a', fabricId: FABRIC_CHARCOAL },
      borders: [],
    },
    blocks: [
      { blockId: BLOCK_SOLID, row: 0, col: 0 },
      { blockId: BLOCK_SOLID, row: 1, col: 0 },
      { blockId: BLOCK_SOLID, row: 2, col: 0 },
      { blockId: BLOCK_SOLID, row: 3, col: 0 },
      { blockId: BLOCK_SOLID, row: 0, col: 2 },
      { blockId: BLOCK_SOLID, row: 1, col: 2 },
      { blockId: BLOCK_SOLID, row: 2, col: 2 },
      { blockId: BLOCK_SOLID, row: 3, col: 2 },
    ],
    fabricAssignments: [
      { fabricId: FABRIC_CYAN, fillColor: '#06b6d4', target: 'block' },
      { fabricId: FABRIC_PINK, fillColor: '#f472b6', target: 'block' },
      { fabricId: FABRIC_GREEN, fillColor: '#22c55e', target: 'block' },
      { fabricId: FABRIC_CHARCOAL, fillColor: '#1a1a1a', target: 'sashing' },
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
      sashing: { width: 0.5, color: '#fce7f3', fabricId: FABRIC_BLUSH },
      borders: [{ width: 1.5, color: '#fbcfe8', fabricId: FABRIC_ROSE }],
    },
    blocks: [
      { blockId: BLOCK_BABY_STAR, row: 0, col: 0 },
      { blockId: BLOCK_BABY_STAR, row: 0, col: 1 },
      { blockId: BLOCK_BABY_STAR, row: 0, col: 2 },
      { blockId: BLOCK_BABY_STAR, row: 1, col: 0 },
      { blockId: BLOCK_BABY_STAR, row: 1, col: 1 },
      { blockId: BLOCK_BABY_STAR, row: 1, col: 2 },
      { blockId: BLOCK_BABY_STAR, row: 2, col: 0 },
      { blockId: BLOCK_BABY_STAR, row: 2, col: 1 },
      { blockId: BLOCK_BABY_STAR, row: 2, col: 2 },
    ],
    fabricAssignments: [
      { fabricId: FABRIC_PEACH, fillColor: '#fed7aa', target: 'block' },
      { fabricId: FABRIC_MINT, fillColor: '#cbfafe', target: 'block' },
      { fabricId: FABRIC_BLUSH, fillColor: '#fce7f3', target: 'sashing' },
      { fabricId: FABRIC_ROSE, fillColor: '#fbcfe8', target: 'border' },
      { fabricId: FABRIC_IVORY, fillColor: '#fff7ed', target: 'background' },
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
      sashing: { width: 0, color: '#e5d5c5', fabricId: FABRIC_CREAM },
      borders: [{ width: 2, color: '#d4c4b5', fabricId: FABRIC_TAUPE }],
    },
    blocks: [
      { blockId: BLOCK_DIAMOND, row: 0, col: 0, rotation: 45 },
      { blockId: BLOCK_DIAMOND, row: 0, col: 1, rotation: 45 },
      { blockId: BLOCK_DIAMOND, row: 0, col: 2, rotation: 45 },
      { blockId: BLOCK_DIAMOND, row: 1, col: 0, rotation: 45 },
      { blockId: BLOCK_DIAMOND, row: 1, col: 1, rotation: 45 },
      { blockId: BLOCK_DIAMOND, row: 1, col: 2, rotation: 45 },
      { blockId: BLOCK_DIAMOND, row: 2, col: 0, rotation: 45 },
      { blockId: BLOCK_DIAMOND, row: 2, col: 1, rotation: 45 },
      { blockId: BLOCK_DIAMOND, row: 2, col: 2, rotation: 45 },
    ],
    fabricAssignments: [
      { fabricId: FABRIC_LAVENDER, fillColor: '#a78bfa', target: 'block' },
      { fabricId: FABRIC_LIGHT_LAVENDER, fillColor: '#ddd6fe', target: 'block' },
      { fabricId: FABRIC_TAUPE, fillColor: '#d4c4b5', target: 'border' },
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
      sashing: { width: 1, color: '#1e3a5f', fabricId: FABRIC_NAVY },
      borders: [
        { width: 2, color: '#60a5fa', fabricId: FABRIC_CORNFLOWER },
        { width: 1, color: '#1e3a5f', fabricId: FABRIC_NAVY },
      ],
    },
    blocks: [
      { blockId: BLOCK_SNOWFLAKE, row: 0, col: 0 },
      { blockId: BLOCK_SNOWFLAKE, row: 0, col: 1 },
      { blockId: BLOCK_SNOWFLAKE, row: 0, col: 2 },
      { blockId: BLOCK_SNOWFLAKE, row: 0, col: 3 },
      { blockId: BLOCK_SNOWFLAKE, row: 1, col: 0 },
      { blockId: BLOCK_SNOWFLAKE, row: 1, col: 1 },
      { blockId: BLOCK_SNOWFLAKE, row: 1, col: 2 },
      { blockId: BLOCK_SNOWFLAKE, row: 1, col: 3 },
      { blockId: BLOCK_SNOWFLAKE, row: 2, col: 0 },
      { blockId: BLOCK_SNOWFLAKE, row: 2, col: 1 },
      { blockId: BLOCK_SNOWFLAKE, row: 2, col: 2 },
      { blockId: BLOCK_SNOWFLAKE, row: 2, col: 3 },
      { blockId: BLOCK_SNOWFLAKE, row: 3, col: 0 },
      { blockId: BLOCK_SNOWFLAKE, row: 3, col: 1 },
      { blockId: BLOCK_SNOWFLAKE, row: 3, col: 2 },
      { blockId: BLOCK_SNOWFLAKE, row: 3, col: 3 },
    ],
    fabricAssignments: [
      { fabricId: FABRIC_PALE_BLUE, fillColor: '#dbeafe', target: 'block' },
      { fabricId: FABRIC_SKY_BLUE, fillColor: '#93c5fd', target: 'block' },
      { fabricId: FABRIC_CORNFLOWER, fillColor: '#60a5fa', target: 'block' },
      { fabricId: FABRIC_NAVY, fillColor: '#1e3a5f', target: 'sashing' },
      { fabricId: FABRIC_ALICE_BLUE, fillColor: '#eff6ff', target: 'background' },
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
      sashing: { width: 0, color: '#e5d5c5', fabricId: FABRIC_CREAM },
      borders: [
        { width: 2, color: '#d4a574', fabricId: FABRIC_WARM_TAN },
        { width: 2.5, color: '#8b6914', fabricId: FABRIC_BROWN },
        { width: 1.5, color: '#d4a574', fabricId: FABRIC_WARM_TAN },
      ],
    },
    blocks: [{ blockId: BLOCK_MEDALLION, row: 0, col: 0 }],
    fabricAssignments: [
      { fabricId: FABRIC_PALE_YELLOW, fillColor: '#fef3c7', target: 'block' },
      { fabricId: FABRIC_WARM_TAN, fillColor: '#d4a574', target: 'border' },
      { fabricId: FABRIC_BROWN, fillColor: '#8b6914', target: 'border' },
      { fabricId: FABRIC_CREAM_WHITE, fillColor: '#fffbeb', target: 'background' },
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