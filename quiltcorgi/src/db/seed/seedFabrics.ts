/**
 * Fabric Library Seeding Script
 *
 * Usage: npx tsx src/db/seed/seedFabrics.ts
 *
 * Generates 170+ system fabric entries (solids from major manufacturers)
 * and inserts them into the `fabrics` table as system fabrics (isDefault=true, userId=null).
 *
 * Since these are solid-color fabrics, the imageUrl is set to a placeholder SVG data URI
 * using the fabric's approximate color. In production, these would point to real images
 * on S3/CloudFront. The seeding script can be re-run after uploading real images.
 */
import { getAllFabricDefinitions } from './fabricDefinitions';

// Color approximations for solid fabric names -> hex codes
const COLOR_MAP: Record<string, string> = {
  white: '#FFFFFF',
  snow: '#FFFAFA',
  ivory: '#FFFFF0',
  bone: '#E3DAC9',
  natural: '#F5F0E8',
  cream: '#FFFDD0',
  butter: '#FFE4A1',
  canary: '#FFEF00',
  'corn yellow': '#FFF4C1',
  sunflower: '#FFDA03',
  'school bus': '#FFD800',
  goldfinch: '#FCD116',
  gold: '#FFD700',
  saffron: '#F4C430',
  orange: '#FF8C00',
  tangerine: '#FF9966',
  terracotta: '#CC7755',
  coral: '#FF7F50',
  tomato: '#FF6347',
  red: '#FF0000',
  'rich red': '#CC0000',
  crimson: '#DC143C',
  ruby: '#9B111E',
  pomegranate: '#C0392B',
  wine: '#722F37',
  blossom: '#FFB7C5',
  'baby pink': '#F4C2C2',
  pink: '#FFC0CB',
  carnation: '#FFA6C9',
  'bright pink': '#FF69B4',
  'hot pink': '#FF1493',
  magenta: '#FF00FF',
  berry: '#8E4585',
  geranium: '#D73B3E',
  lilac: '#C8A2C8',
  lavender: '#E6E6FA',
  wisteria: '#C9A0DC',
  amethyst: '#9966CC',
  purple: '#800080',
  eggplant: '#614051',
  'deep purple': '#4B0082',
  'light blue': '#ADD8E6',
  'baby blue': '#89CFF0',
  lake: '#5F9EA0',
  cornflower: '#6495ED',
  periwinkle: '#CCCCFF',
  blueprint: '#264B96',
  royal: '#4169E1',
  regatta: '#003399',
  pacific: '#1C86EE',
  celestial: '#4997D0',
  windsor: '#3C1F76',
  navy: '#000080',
  indigo: '#4B0082',
  midnight: '#191970',
  aqua: '#00FFFF',
  pool: '#00CED1',
  'teal blue': '#367588',
  'jade green': '#00A86B',
  fern: '#4F7942',
  kelly: '#4CBB17',
  'grass green': '#7CFC00',
  peridot: '#B4C424',
  lime: '#BFFF00',
  chartreuse: '#7FFF00',
  kiwi: '#8EE53F',
  sage: '#BCB88A',
  olive: '#808000',
  oregano: '#5D6238',
  hunter: '#355E3B',
  evergreen: '#115740',
  spruce: '#2E473B',
  tan: '#D2B48C',
  wheat: '#F5DEB3',
  camel: '#C19A6B',
  sienna: '#A0522D',
  mocha: '#967969',
  coffee: '#6F4E37',
  chestnut: '#954535',
  chocolate: '#7B3F00',
  ash: '#B2BEB5',
  silver: '#C0C0C0',
  'medium gray': '#808080',
  pewter: '#96A8A1',
  iron: '#48494B',
  charcoal: '#36454F',
  coal: '#2C2C2C',
  black: '#000000',
  // Bella Solids extras
  porcelain: '#F0E6D8',
  'egg shell': '#F0EAD6',
  buttercup: '#F9E236',
  cheddar: '#FFC72C',
  clementine: '#E96E18',
  scarlet: '#FF2400',
  'christmas red': '#B22222',
  peony: '#DE3163',
  'mimi pink': '#FFD2E5',
  hyacinth: '#7B68EE',
  'amelia purple': '#7851A9',
  'robin egg': '#00CCCC',
  'horizon blue': '#00B0F0',
  'admiral blue': '#003E7E',
  teal: '#008080',
  pistachio: '#93C572',
  grass: '#68BB59',
  'kelly green': '#4CBB17',
  pine: '#2E5539',
  lead: '#595959',
  graphite: '#474747',
  // FreeSpirit extras
  'true white': '#FFFFFF',
  lemon: '#FFF44F',
  'fire engine red': '#CE2029',
  bubblegum: '#FFC1CC',
  orchid: '#DA70D6',
  'sky blue': '#87CEEB',
  ocean: '#006994',
  'leaf green': '#4ABF35',
  espresso: '#4E3629',
  raven: '#0D0D0D',
  // Riley Blake extras
  daisy: '#FFD700',
  pumpkin: '#FF7518',
  'barn red': '#7C0A02',
  violet: '#7F00FF',
  blueberry: '#4F86F7',
  denim: '#1560BD',
  clover: '#00A550',
  'jet black': '#0A0A0A',
  // Art Gallery extras
  'bright white': '#FFFFFF',
  oat: '#DFC8A5',
  sunshine: '#FFD700',
  autumn: '#EB9605',
  fuchsia: '#FF00FF',
  grape: '#6F2DA8',
  sapphire: '#0F52BA',
  marine: '#006C7A',
  emerald: '#50C878',
  walnut: '#773F1A',
  elephant: '#808080',
  panther: '#1B1B1B',
  steel: '#43464B',
};

function getColorHex(fabricName: string): string {
  const colorPart = fabricName.replace(/^[^-]+-\s*/, '').toLowerCase();
  return COLOR_MAP[colorPart] ?? '#CCCCCC';
}

function generatePlaceholderSvg(hex: string): string {
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="${hex}"/></svg>`
  )}`;
}

async function seedFabrics() {
  const { drizzle } = await import('drizzle-orm/node-postgres');
  const { Pool } = await import('pg');

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });
  const db = drizzle(pool);

  const definitions = getAllFabricDefinitions();
  console.log(`Seeding ${definitions.length} system fabrics...`);

  const { fabrics } = await import('@/db/schema');

  const BATCH_SIZE = 50;
  let inserted = 0;

  for (let i = 0; i < definitions.length; i += BATCH_SIZE) {
    const batch = definitions.slice(i, i + BATCH_SIZE);
    const values = batch.map((def) => {
      const hex = getColorHex(def.name);
      const placeholderUrl = generatePlaceholderSvg(hex);
      return {
        userId: null as string | null,
        name: def.name,
        imageUrl: placeholderUrl,
        thumbnailUrl: placeholderUrl,
        manufacturer: def.manufacturer,
        sku: def.sku,
        collection: def.collection,
        colorFamily: def.colorFamily,
        scaleX: 1.0,
        scaleY: 1.0,
        rotation: 0.0,
        isDefault: true,
      };
    });

    await db.insert(fabrics).values(values);
    inserted += batch.length;
    console.log(`  Inserted ${inserted}/${definitions.length} fabrics`);
  }

  console.log(`Done! ${inserted} fabrics seeded.`);
  await pool.end();
}

seedFabrics().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
