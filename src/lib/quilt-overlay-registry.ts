/**
 * Quilt Block & Layout Overlay Registry
 *
 * Maps block and layout names to their SVG overlay files in /quilt_blocks/ and /quilt_layouts/.
 * All block SVGs use a 300×300 viewBox with filled patches.
 * Layout SVGs use proportional viewBoxes at 10px/inch with structural data-role attributes.
 * Layouts are fixed-aspect-ratio worktables: resizable but always maintain proportions.
 */

export interface BlockOverlay {
  id: string;
  name: string;
  displayName: string;
  svgPath: string;
  commonSizes: string[];
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  gridUnits: number;
}

export interface LayoutOverlay {
  id: string;
  name: string;
  displayName: string;
  svgPath: string;
  dimensions: { width: number; height: number };
  description: string;
  blockLayout?: { cols: number; rows: number };
}

export const BLOCK_OVERLAYS: BlockOverlay[] = [];

export const LAYOUT_OVERLAYS: LayoutOverlay[] = [
  {
    id: 'straight-3x3',
    name: 'straight_3x3',
    displayName: 'Straight Set 3×3',
    svgPath: '/quilt_layouts/straight_3x3.svg',
    dimensions: { width: 36, height: 36 },
    description: '3×3 grid of blocks edge-to-edge',
    blockLayout: { cols: 3, rows: 3 },
  },
  {
    id: 'straight-4x4',
    name: 'straight_4x4',
    displayName: 'Straight Set 4×4',
    svgPath: '/quilt_layouts/straight_4x4.svg',
    dimensions: { width: 48, height: 48 },
    description: '4×4 grid of blocks edge-to-edge',
    blockLayout: { cols: 4, rows: 4 },
  },
  {
    id: 'straight-5x5',
    name: 'straight_5x5',
    displayName: 'Straight Set 5×5',
    svgPath: '/quilt_layouts/straight_5x5.svg',
    dimensions: { width: 60, height: 60 },
    description: '5×5 grid of blocks edge-to-edge',
    blockLayout: { cols: 5, rows: 5 },
  },
  {
    id: 'sashing-3x3',
    name: 'sashing_3x3',
    displayName: 'Sashing 3×3',
    svgPath: '/quilt_layouts/sashing_3x3.svg',
    dimensions: { width: 40, height: 40 },
    description: '3×3 grid with sashing strips and cornerstones',
    blockLayout: { cols: 3, rows: 3 },
  },
  {
    id: 'sashing-4x4',
    name: 'sashing_4x4',
    displayName: 'Sashing 4×4',
    svgPath: '/quilt_layouts/sashing_4x4.svg',
    dimensions: { width: 54, height: 54 },
    description: '4×4 grid with sashing strips and cornerstones',
    blockLayout: { cols: 4, rows: 4 },
  },
  {
    id: 'on-point-3x3',
    name: 'on_point_3x3',
    displayName: 'On Point 3×3',
    svgPath: '/quilt_layouts/on_point_3x3.svg',
    dimensions: { width: 51, height: 51 },
    description: '3×3 blocks set on point with setting triangles',
    blockLayout: { cols: 3, rows: 3 },
  },
  {
    id: 'on-point-2x2-border',
    name: 'on_point_2x2_border',
    displayName: 'On Point 2×2 with Border',
    svgPath: '/quilt_layouts/on_point_2x2_border.svg',
    dimensions: { width: 36, height: 36 },
    description: '2×2 blocks on point with border — Garden Gate style',
    blockLayout: { cols: 2, rows: 2 },
  },
  {
    id: 'strippy-5col',
    name: 'strippy_5col',
    displayName: 'Strippy 5 Column',
    svgPath: '/quilt_layouts/strippy_5col.svg',
    dimensions: { width: 44, height: 60 },
    description: '3 block columns separated by vertical sashing strips',
    blockLayout: { cols: 3, rows: 5 },
  },
  {
    id: 'lattice-5x3',
    name: 'lattice_5x3',
    displayName: 'Lattice 5×3',
    svgPath: '/quilt_layouts/lattice_5x3.svg',
    dimensions: { width: 26, height: 34 },
    description: '5×3 wall hanging with horizontal lattice strips — Country Star style',
    blockLayout: { cols: 5, rows: 3 },
  },
  {
    id: 'medallion-center',
    name: 'medallion_center',
    displayName: 'Medallion Center',
    svgPath: '/quilt_layouts/medallion_center.svg',
    dimensions: { width: 44, height: 44 },
    description: 'Center medallion block with concentric borders',
  },
];

/**
 * Get a block overlay by ID
 */
export function getBlockOverlay(id: string): BlockOverlay | undefined {
  return BLOCK_OVERLAYS.find((b) => b.id === id);
}

/**
 * Get a layout overlay by ID
 */
export function getLayoutOverlay(id: string): LayoutOverlay | undefined {
  return LAYOUT_OVERLAYS.find((p) => p.id === id);
}

/**
 * Get all blocks by difficulty level
 */
export function getBlocksByDifficulty(difficulty: BlockOverlay['difficulty']): BlockOverlay[] {
  return BLOCK_OVERLAYS.filter((b) => b.difficulty === difficulty);
}

/**
 * Calculate how many blocks are needed for a given layout and block size
 */
export function calculateBlockCount(
  layout: LayoutOverlay,
  blockSize: number
): { cols: number; rows: number; total: number } {
  const cols = Math.ceil(layout.dimensions.width / blockSize);
  const rows = Math.ceil(layout.dimensions.height / blockSize);
  return { cols, rows, total: cols * rows };
}
