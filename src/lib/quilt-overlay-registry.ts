/**
 * Quilt Block Overlay Registry
 *
 * Maps block names to their SVG overlay files in /quilt_blocks/.
 * All block SVGs use a 300x300 viewBox with filled patches.
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

export const BLOCK_OVERLAYS: BlockOverlay[] = [
  {
    id: 'nine-patch',
    name: 'nine_patch',
    displayName: 'Nine Patch',
    svgPath: '/quilt_blocks/01_nine_patch.svg',
    commonSizes: ['6"', '9"', '12"'],
    description: '9 squares in a 3×3 grid — the most fundamental quilt block',
    difficulty: 'beginner',
    gridUnits: 3,
  },
  {
    id: 'churn-dash',
    name: 'churn_dash',
    displayName: 'Churn Dash',
    svgPath: '/quilt_blocks/02_churn_dash.svg',
    commonSizes: ['6"', '9"', '12"'],
    description: '4 HSTs and 4 rectangles around a center square, resembling a butter churn',
    difficulty: 'intermediate',
    gridUnits: 3,
  },
  {
    id: 'log-cabin',
    name: 'log_cabin',
    displayName: 'Log Cabin',
    svgPath: '/quilt_blocks/03_log_cabin.svg',
    commonSizes: ['6"', '8"', '12"'],
    description: 'Concentric strips around a central square, mimicking log cabin construction',
    difficulty: 'intermediate',
    gridUnits: 6,
  },
  {
    id: 'ohio-star',
    name: 'ohio_star',
    displayName: 'Ohio Star',
    svgPath: '/quilt_blocks/04_ohio_star.svg',
    commonSizes: ['6"', '9"', '12"'],
    description: 'Classic 8-pointed star in a 9-patch layout using quarter-square triangles',
    difficulty: 'intermediate',
    gridUnits: 6,
  },
  {
    id: 'bear-paw',
    name: 'bear_paw',
    displayName: 'Bear Paw',
    svgPath: '/quilt_blocks/05_bear_paw.svg',
    commonSizes: ['12"'],
    description: 'Squares and HSTs forming a bear paw shape with distinct claws',
    difficulty: 'intermediate',
    gridUnits: 6,
  },
  {
    id: 'pinwheel',
    name: 'pinwheel',
    displayName: 'Pinwheel',
    svgPath: '/quilt_blocks/06_pinwheel.svg',
    commonSizes: ['3"', '4"', '5"', '6"', '8"'],
    description: '4 HSTs rotating around a center point creating a spinning effect',
    difficulty: 'beginner',
    gridUnits: 2,
  },
  {
    id: 'flying-geese',
    name: 'flying_geese',
    displayName: 'Flying Geese',
    svgPath: '/quilt_blocks/07_flying_geese.svg',
    commonSizes: ['2"x4"', '3"x6"'],
    description:
      'Rectangular block with a center triangle and two side triangles (width = 2× height)',
    difficulty: 'beginner',
    gridUnits: 6,
  },
  {
    id: 'drunkards-path',
    name: 'drunkards_path',
    displayName: "Drunkard's Path",
    svgPath: '/quilt_blocks/08_drunkards_path.svg',
    commonSizes: ['6"', '9"', '12"'],
    description: 'Quarter circle set in a square — great introduction to curved piecing',
    difficulty: 'advanced',
    gridUnits: 2,
  },
  {
    id: 'shoo-fly',
    name: 'shoo_fly',
    displayName: 'Shoo Fly',
    svgPath: '/quilt_blocks/09_shoo_fly.svg',
    commonSizes: ['6"', '9"', '12"'],
    description: '9-patch with 4 HSTs and 4 squares around a center square',
    difficulty: 'beginner',
    gridUnits: 3,
  },
  {
    id: 'sawtooth-star',
    name: 'sawtooth_star',
    displayName: 'Sawtooth Star',
    svgPath: '/quilt_blocks/10_sawtooth_star.svg',
    commonSizes: ['6"', '9"', '12"'],
    description: '8-pointed star constructed from flying geese around a center square',
    difficulty: 'intermediate',
    gridUnits: 6,
  },
  {
    id: 'friendship-star',
    name: 'friendship_star',
    displayName: 'Friendship Star',
    svgPath: '/quilt_blocks/11_friendship_star.svg',
    commonSizes: ['6"', '9"', '12"'],
    description: '9-patch with HSTs arranged to form a four-pointed star',
    difficulty: 'beginner',
    gridUnits: 3,
  },
  {
    id: 'square-in-square',
    name: 'square_in_square',
    displayName: 'Square in a Square',
    svgPath: '/quilt_blocks/12_square_in_square.svg',
    commonSizes: ['6"', '9"', '12"'],
    description: 'Central square surrounded by 4 triangles creating a diamond illusion',
    difficulty: 'intermediate',
    gridUnits: 4,
  },
  {
    id: 'rail-fence',
    name: 'rail_fence',
    displayName: 'Rail Fence',
    svgPath: '/quilt_blocks/13_rail_fence.svg',
    commonSizes: ['6"', '9"', '12"'],
    description: 'Simple striped square block — versatile for many layouts',
    difficulty: 'beginner',
    gridUnits: 4,
  },
  {
    id: 'card-trick',
    name: 'card_trick',
    displayName: 'Card Trick',
    svgPath: '/quilt_blocks/14_card_trick.svg',
    commonSizes: ['4.5"', '6"', '9"', '12"'],
    description: 'HST arrangement resembling playing cards in a 9-patch',
    difficulty: 'intermediate',
    gridUnits: 6,
  },
  {
    id: 'double-star',
    name: 'double_star',
    displayName: 'Double Star',
    svgPath: '/quilt_blocks/15_double_star.svg',
    commonSizes: ['7.5"', '10"', '12.5"', '15"'],
    description: 'Layered star design with inner and outer star points',
    difficulty: 'advanced',
    gridUnits: 6,
  },
  {
    id: 'lone-star',
    name: 'lone_star',
    displayName: 'Lone Star',
    svgPath: '/quilt_blocks/16_lone_star.svg',
    commonSizes: ['12"+'],
    description:
      '8-pointed diamond star radiating from center — often used as a single-block quilt',
    difficulty: 'advanced',
    gridUnits: 8,
  },
  {
    id: 'tumbling-blocks',
    name: 'tumbling_blocks',
    displayName: 'Tumbling Blocks',
    svgPath: '/quilt_blocks/17_tumbling_blocks.svg',
    commonSizes: ['6"', '9"', '12"'],
    description: '3D cube illusion created with diamonds and careful color placement',
    difficulty: 'advanced',
    gridUnits: 6,
  },
  {
    id: 'dresden-plate',
    name: 'dresden_plate',
    displayName: 'Dresden Plate',
    svgPath: '/quilt_blocks/18_dresden_plate.svg',
    commonSizes: ['12"+'],
    description: 'Circular petal design with radiating wedges around a center circle',
    difficulty: 'advanced',
    gridUnits: 8,
  },
  {
    id: 'irish-chain',
    name: 'irish_chain',
    displayName: 'Irish Chain',
    svgPath: '/quilt_blocks/19_irish_chain.svg',
    commonSizes: ['6"', '9"', '12"'],
    description: '9-patch blocks and solid squares forming diagonal chain patterns',
    difficulty: 'beginner',
    gridUnits: 5,
  },
  {
    id: 'hst',
    name: 'hst',
    displayName: 'Half-Square Triangle',
    svgPath: '/quilt_blocks/20_hst.svg',
    commonSizes: ['2"', '3"', '4"', '6"', '8"', '12"'],
    description: 'Two triangles forming a square — the most versatile building block in quilting',
    difficulty: 'beginner',
    gridUnits: 1,
  },
];

/**
 * Get a block overlay by ID
 */
export function getBlockOverlay(id: string): BlockOverlay | undefined {
  return BLOCK_OVERLAYS.find((b) => b.id === id);
}

/**
 * Get all blocks by difficulty level
 */
export function getBlocksByDifficulty(difficulty: BlockOverlay['difficulty']): BlockOverlay[] {
  return BLOCK_OVERLAYS.filter((b) => b.difficulty === difficulty);
}
