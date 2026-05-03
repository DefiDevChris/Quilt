/**
 * Canonical seed data for template blocks and fabrics.
 *
 * All IDs are fixed UUIDs so that local, CI, and production environments
 * receive the same rows.  The seed script checks for the first block ID
 * before inserting — re-runs are safe.
 */

function solidFabricImageUrl(hex: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect width="128" height="128" fill="${hex}"/></svg>`;
  const base64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

/* ── Fixed block IDs ── */
export const BLOCK_LOG_CABIN = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
export const BLOCK_NINE_PATCH = 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e';
export const BLOCK_STAR = 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f';
export const BLOCK_SOLID = 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a';
export const BLOCK_BABY_STAR = 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b';
export const BLOCK_DIAMOND = 'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c';
export const BLOCK_SNOWFLAKE = 'a7b8c9d0-e1f2-4a3b-4c5d-6e7f8a9b0c1d';
export const BLOCK_MEDALLION = 'b8c9d0e1-f2a3-4b4c-5d6e-7f8a9b0c1d2e';

/* ── Factory ── */
function fabricSeed(
  id: string,
  name: string,
  hex: string,
  colorFamily: string,
  value: string,
  overrides?: Partial<{
    manufacturer: string;
    collection: string;
    description: string;
    isDefault: boolean;
    isActive: boolean;
  }>,
) {
  return {
    id,
    userId: null as string | null,
    name,
    imageUrl: solidFabricImageUrl(hex),
    thumbnailUrl: null as string | null,
    manufacturer: overrides?.manufacturer ?? 'QuiltCorgi',
    sku: null as string | null,
    collection: overrides?.collection ?? 'Default Solids',
    colorFamily,
    value,
    hex,
    scaleX: 1.0,
    scaleY: 1.0,
    rotation: 0.0,
    ppi: null as number | null,
    calibrated: false,
    isDefault: overrides?.isDefault ?? true,
    retailerId: null as string | null,
    deeplinkOverride: null as string | null,
    pricePerYard: null as number | null,
    description: overrides?.description ?? `Default solid ${name.toLowerCase()}`,
    isActive: overrides?.isActive ?? true,
  };
}

/* ── Fixed fabric IDs ── */
export const FABRIC_WARM_TAN = '10000000-0000-0000-0000-000000000001';
export const FABRIC_GRAY_BROWN = '10000000-0000-0000-0000-000000000002';
export const FABRIC_TAUPE = '10000000-0000-0000-0000-000000000003';
export const FABRIC_CREAM = '10000000-0000-0000-0000-000000000004';
export const FABRIC_SKY_BLUE = '10000000-0000-0000-0000-000000000005';
export const FABRIC_LIGHT_BLUE = '10000000-0000-0000-0000-000000000006';
export const FABRIC_WHITE = '10000000-0000-0000-0000-000000000007';
export const FABRIC_YELLOW = '10000000-0000-0000-0000-000000000008';
export const FABRIC_AMBER = '10000000-0000-0000-0000-000000000009';
export const FABRIC_PALE_YELLOW = '10000000-0000-0000-0000-000000000010';
export const FABRIC_CHARCOAL = '10000000-0000-0000-0000-000000000011';
export const FABRIC_CYAN = '10000000-0000-0000-0000-000000000012';
export const FABRIC_PINK = '10000000-0000-0000-0000-000000000013';
export const FABRIC_GREEN = '10000000-0000-0000-0000-000000000014';
export const FABRIC_PEACH = '10000000-0000-0000-0000-000000000015';
export const FABRIC_MINT = '10000000-0000-0000-0000-000000000016';
export const FABRIC_BLUSH = '10000000-0000-0000-0000-000000000017';
export const FABRIC_ROSE = '10000000-0000-0000-0000-000000000018';
export const FABRIC_IVORY = '10000000-0000-0000-0000-000000000019';
export const FABRIC_LAVENDER = '10000000-0000-0000-0000-000000000020';
export const FABRIC_LIGHT_LAVENDER = '10000000-0000-0000-0000-000000000021';
export const FABRIC_NAVY = '10000000-0000-0000-0000-000000000022';
export const FABRIC_CORNFLOWER = '10000000-0000-0000-0000-000000000023';
export const FABRIC_PALE_BLUE = '10000000-0000-0000-0000-000000000024';
export const FABRIC_ALICE_BLUE = '10000000-0000-0000-0000-000000000025';
export const FABRIC_CREAM_WHITE = '10000000-0000-0000-0000-000000000026';
export const FABRIC_BROWN = '10000000-0000-0000-0000-000000000027';

export const canonicalBlocks = [
  {
    id: BLOCK_LOG_CABIN,
    userId: null as string | null,
    name: 'Log Cabin',
    category: 'traditional',
    subcategory: 'log-cabin',
    svgData:
      '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="40" y="40" width="20" height="20" fill="#8b4513"/>' +
      '<rect x="35" y="35" width="30" height="5" fill="#d4a574"/>' +
      '<rect x="35" y="60" width="30" height="5" fill="#d4a574"/>' +
      '<rect x="35" y="35" width="5" height="30" fill="#d4a574"/>' +
      '<rect x="60" y="35" width="5" height="30" fill="#d4a574"/>' +
      '<rect x="30" y="30" width="40" height="5" fill="#b8a698"/>' +
      '<rect x="30" y="65" width="40" height="5" fill="#b8a698"/>' +
      '<rect x="30" y="30" width="5" height="40" fill="#b8a698"/>' +
      '<rect x="65" y="30" width="5" height="40" fill="#b8a698"/>' +
      '</svg>',
    fabricJsData: null as unknown,
    tags: ['log-cabin', 'traditional'],
    isDefault: true,
    thumbnailUrl: null as string | null,
    widthIn: '12',
    heightIn: '12',
  },
  {
    id: BLOCK_NINE_PATCH,
    userId: null,
    name: 'Nine Patch',
    category: 'traditional',
    subcategory: 'nine-patch',
    svgData:
      '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="0" y="0" width="33.33" height="33.33" fill="#93c5fd"/>' +
      '<rect x="33.33" y="0" width="33.33" height="33.33" fill="#ffffff"/>' +
      '<rect x="66.66" y="0" width="33.34" height="33.33" fill="#93c5fd"/>' +
      '<rect x="0" y="33.33" width="33.33" height="33.33" fill="#ffffff"/>' +
      '<rect x="33.33" y="33.33" width="33.33" height="33.33" fill="#93c5fd"/>' +
      '<rect x="66.66" y="33.33" width="33.34" height="33.33" fill="#ffffff"/>' +
      '<rect x="0" y="66.66" width="33.33" height="33.34" fill="#93c5fd"/>' +
      '<rect x="33.33" y="66.66" width="33.33" height="33.34" fill="#ffffff"/>' +
      '<rect x="66.66" y="66.66" width="33.34" height="33.34" fill="#93c5fd"/>' +
      '</svg>',
    fabricJsData: null,
    tags: ['nine-patch', 'traditional'],
    isDefault: true,
    thumbnailUrl: null,
    widthIn: '10',
    heightIn: '10',
  },
  {
    id: BLOCK_STAR,
    userId: null,
    name: 'Star',
    category: 'traditional',
    subcategory: 'star',
    svgData:
      '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="0" y="0" width="100" height="100" fill="#fef3c7"/>' +
      '<polygon points="50,0 61,35 100,35 68,57 79,100 50,75 21,100 32,57 0,35 39,35" fill="#f59e0b"/>' +
      '</svg>',
    fabricJsData: null,
    tags: ['star', 'traditional'],
    isDefault: true,
    thumbnailUrl: null,
    widthIn: '12',
    heightIn: '12',
  },
  {
    id: BLOCK_SOLID,
    userId: null,
    name: 'Solid Block',
    category: 'modern',
    subcategory: 'solid',
    svgData:
      '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">' +
      '<rect width="100" height="100" fill="#06b6d4"/>' +
      '</svg>',
    fabricJsData: null,
    tags: ['solid', 'modern'],
    isDefault: true,
    thumbnailUrl: null,
    widthIn: '10',
    heightIn: '10',
  },
  {
    id: BLOCK_BABY_STAR,
    userId: null,
    name: 'Baby Star',
    category: 'baby',
    subcategory: 'star',
    svgData:
      '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="0" y="0" width="100" height="100" fill="#fff7ed"/>' +
      '<polygon points="50,10 58,38 88,38 64,56 72,86 50,68 28,86 36,56 12,38 42,38" fill="#fbcfe8"/>' +
      '</svg>',
    fabricJsData: null,
    tags: ['star', 'baby'],
    isDefault: true,
    thumbnailUrl: null,
    widthIn: '8',
    heightIn: '8',
  },
  {
    id: BLOCK_DIAMOND,
    userId: null,
    name: 'Diamond',
    category: 'traditional',
    subcategory: 'on-point',
    svgData:
      '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="0" y="0" width="100" height="100" fill="#ddd6fe"/>' +
      '<polygon points="50,0 100,50 50,100 0,50" fill="#a78bfa"/>' +
      '</svg>',
    fabricJsData: null,
    tags: ['diamond', 'traditional'],
    isDefault: true,
    thumbnailUrl: null,
    widthIn: '10',
    heightIn: '10',
  },
  {
    id: BLOCK_SNOWFLAKE,
    userId: null,
    name: 'Snowflake',
    category: 'seasonal',
    subcategory: 'winter',
    svgData:
      '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="0" y="0" width="100" height="100" fill="#eff6ff"/>' +
      '<g stroke="#1e3a5f" stroke-width="2" fill="none">' +
      '<line x1="50" y1="10" x2="50" y2="90"/>' +
      '<line x1="10" y1="50" x2="90" y2="50"/>' +
      '<line x1="22" y1="22" x2="78" y2="78"/>' +
      '<line x1="22" y1="78" x2="78" y2="22"/>' +
      '</g>' +
      '<circle cx="50" cy="50" r="8" fill="#60a5fa"/>' +
      '<circle cx="50" cy="10" r="4" fill="#60a5fa"/>' +
      '<circle cx="50" cy="90" r="4" fill="#60a5fa"/>' +
      '<circle cx="10" cy="50" r="4" fill="#60a5fa"/>' +
      '<circle cx="90" cy="50" r="4" fill="#60a5fa"/>' +
      '<circle cx="22" cy="22" r="4" fill="#60a5fa"/>' +
      '<circle cx="78" cy="78" r="4" fill="#60a5fa"/>' +
      '<circle cx="22" cy="78" r="4" fill="#60a5fa"/>' +
      '<circle cx="78" cy="22" r="4" fill="#60a5fa"/>' +
      '</svg>',
    fabricJsData: null,
    tags: ['snowflake', 'seasonal', 'winter'],
    isDefault: true,
    thumbnailUrl: null,
    widthIn: '9',
    heightIn: '9',
  },
  {
    id: BLOCK_MEDALLION,
    userId: null,
    name: 'Medallion',
    category: 'traditional',
    subcategory: 'medallion',
    svgData:
      '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="0" y="0" width="100" height="100" fill="#fffbeb"/>' +
      '<rect x="25" y="25" width="50" height="50" fill="#fef3c7"/>' +
      '<polygon points="0,0 25,25 0,25" fill="#d4a574"/>' +
      '<polygon points="100,0 75,25 100,25" fill="#d4a574"/>' +
      '<polygon points="0,100 25,75 0,75" fill="#8b6914"/>' +
      '<polygon points="100,100 75,75 100,75" fill="#8b6914"/>' +
      '</svg>',
    fabricJsData: null,
    tags: ['medallion', 'traditional'],
    isDefault: true,
    thumbnailUrl: null,
    widthIn: '16',
    heightIn: '16',
  },
];

export const canonicalFabrics = [
  fabricSeed(FABRIC_WARM_TAN, 'Warm Tan', '#d4a574', 'brown', 'medium'),
  fabricSeed(FABRIC_GRAY_BROWN, 'Gray Brown', '#b8a698', 'brown', 'medium'),
  fabricSeed(FABRIC_TAUPE, 'Taupe', '#d4c4b5', 'brown', 'light'),
  fabricSeed(FABRIC_CREAM, 'Cream', '#e5d5c5', 'neutral', 'light'),
  fabricSeed(FABRIC_SKY_BLUE, 'Sky Blue', '#93c5fd', 'blue', 'light'),
  fabricSeed(FABRIC_LIGHT_BLUE, 'Light Blue', '#bfdbfe', 'blue', 'light'),
  fabricSeed(FABRIC_WHITE, 'White', '#ffffff', 'neutral', 'light'),
  fabricSeed(FABRIC_YELLOW, 'Yellow', '#fcd34d', 'yellow', 'light'),
  fabricSeed(FABRIC_AMBER, 'Amber', '#f59e0b', 'orange', 'medium'),
  fabricSeed(FABRIC_PALE_YELLOW, 'Pale Yellow', '#fef3c7', 'yellow', 'light'),
  fabricSeed(FABRIC_CHARCOAL, 'Charcoal', '#1a1a1a', 'gray', 'dark'),
  fabricSeed(FABRIC_CYAN, 'Cyan', '#06b6d4', 'blue', 'medium'),
  fabricSeed(FABRIC_PINK, 'Pink', '#f472b6', 'pink', 'medium'),
  fabricSeed(FABRIC_GREEN, 'Green', '#22c55e', 'green', 'medium'),
  fabricSeed(FABRIC_PEACH, 'Peach', '#fed7aa', 'orange', 'light'),
  fabricSeed(FABRIC_MINT, 'Mint', '#cbfafe', 'blue', 'light'),
  fabricSeed(FABRIC_BLUSH, 'Blush', '#fce7f3', 'pink', 'light'),
  fabricSeed(FABRIC_ROSE, 'Rose', '#fbcfe8', 'pink', 'light'),
  fabricSeed(FABRIC_IVORY, 'Ivory', '#fff7ed', 'neutral', 'light'),
  fabricSeed(FABRIC_LAVENDER, 'Lavender', '#a78bfa', 'purple', 'medium'),
  fabricSeed(FABRIC_LIGHT_LAVENDER, 'Light Lavender', '#ddd6fe', 'purple', 'light'),
  fabricSeed(FABRIC_NAVY, 'Navy', '#1e3a5f', 'blue', 'dark'),
  fabricSeed(FABRIC_CORNFLOWER, 'Cornflower', '#60a5fa', 'blue', 'medium'),
  fabricSeed(FABRIC_PALE_BLUE, 'Pale Blue', '#dbeafe', 'blue', 'light'),
  fabricSeed(FABRIC_ALICE_BLUE, 'Alice Blue', '#eff6ff', 'blue', 'light'),
  fabricSeed(FABRIC_CREAM_WHITE, 'Cream White', '#fffbeb', 'neutral', 'light'),
  fabricSeed(FABRIC_BROWN, 'Brown', '#8b6914', 'brown', 'dark'),
];
