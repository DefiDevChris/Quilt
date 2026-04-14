/**
 * Seeds 80 quilting fabric products into the local PostgreSQL database.
 * Products include realistic prices, descriptions, and categories.
 * Images use local file paths (not uploaded to S3).
 *
 * Organized by fabric lines: Cottage Cloth, Garden Journal, Kona Cotton, Bella Solids, etc.
 * Each line has distinct style (floral, geometric, batik, modern, traditional, textured, solid).
 *
 * Usage: DATABASE_URL=postgresql://... npx tsx src/db/seed/seedShopProducts.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface FabricProduct {
  title: string;
  description: string;
  price: number;
  category: string;
  subcategory: string;
  collection: string;
  style: string;
  imageUrl: string;
  localImagePath: string;
  sku: string;
  material: string;
  width: string;
  weight: string;
  care: string;
  vendor: string;
  tags: string[];
}

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ This script should NOT be run in production!');
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const PRODUCT_DATA_FILE = path.join(process.cwd(), 'temp', 'fabric-products.json');

  // Load product data
  if (!fs.existsSync(PRODUCT_DATA_FILE)) {
    console.error('❌ Product data file not found. Run scripts/download-fabrics.ts first.');
    process.exit(1);
  }

  const products: FabricProduct[] = JSON.parse(fs.readFileSync(PRODUCT_DATA_FILE, 'utf-8'));
  console.log(`📦 Loaded ${products.length} products from ${PRODUCT_DATA_FILE}`);

  // Dynamic imports (matches seedFabrics.ts pattern)
  const { drizzle } = await import('drizzle-orm/node-postgres');
  const { Pool } = await import('pg');
  const { eq } = await import('drizzle-orm');
  const { fabrics } = await import('@/db/schema');

  // Connect to database
  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool);

  // Clear existing system fabrics (isDefault=true, userId=null)
  console.log('🧹 Clearing existing system fabrics...');
  const deleted = await db
    .delete(fabrics)
    .where(eq(fabrics.isDefault, true))
    .returning({ id: fabrics.id });
  console.log(`   Deleted ${deleted.length} existing system fabrics`);

  // Transform products into fabric records
  const fabricRecords = products.map((product) => {
    const colorName = product.title.replace(product.collection + ' ', '').split(' ')[0];
    const colorHex = getColorHex(colorName);
    const colorFamily = getColorFamily(colorName);

    return {
      userId: null as string | null,
      name: product.title,
      imageUrl: `/fabrics/${path.basename(product.localImagePath)}`,
      thumbnailUrl: `/fabrics/${path.basename(product.localImagePath)}`,
      manufacturer: product.vendor,
      sku: product.sku,
      collection: product.collection,
      colorFamily,
      value: product.style.substring(0, 10), // value column is varchar(10)
      hex: colorHex,
      scaleX: 1.0,
      scaleY: 1.0,
      rotation: 0.0,
      ppi: '150.0000',
      calibrated: false,
      isDefault: true,
      isPurchasable: true, // Shop fabrics
      shopifyProductId: null as string | null,
      shopifyVariantId: null as string | null,
      pricePerYard: product.price.toFixed(2),
      inStock: true,
    };
  });

  // Insert in batches of 50
  console.log(`📝 Inserting ${fabricRecords.length} fabrics in batches...`);
  let inserted = 0;
  const batchSize = 50;

  for (let i = 0; i < fabricRecords.length; i += batchSize) {
    const batch = fabricRecords.slice(i, i + batchSize);
    await db.insert(fabrics).values(batch);
    inserted += batch.length;
    console.log(`   Inserted ${inserted}/${fabricRecords.length} fabrics`);
  }

  console.log(`\n✅ Successfully seeded ${inserted} fabrics into the database!`);
  console.log(`\n📊 Summary:`);
  console.log(`   Vendors: ${[...new Set(products.map((p) => p.vendor))].join(', ')}`);
  console.log(`   Collections: ${[...new Set(products.map((p) => p.collection))].join(', ')}`);
  console.log(`   Styles: ${[...new Set(products.map((p) => p.style))].join(', ')}`);
  console.log(
    `   Price range: $${Math.min(...products.map((p) => p.price)).toFixed(2)} - $${Math.max(...products.map((p) => p.price)).toFixed(2)}`
  );
  console.log(`   Images: Local file paths (temp/fabric-images/)`);
  console.log(`   All fabrics marked as: isDefault=true, userId=null`);

  await pool.end();
}

function getColorHex(colorName: string): string | null {
  const colorMap: Record<string, string> = {
    White: '#F8F8F8',
    Ivory: '#FFFFF0',
    Cream: '#FFFDD0',
    Grey: '#D3D3D3',
    Charcoal: '#36454F',
    Black: '#1A1A1A',
    Red: '#E63946',
    Crimson: '#DC143C',
    Burgundy: '#800020',
    Coral: '#FF6F61',
    Salmon: '#FA8072',
    Peach: '#FFCBA4',
    Orange: '#FF8C00',
    Tangerine: '#FF9900',
    Pumpkin: '#FF7518',
    Rust: '#B7410E',
    Yellow: '#FFD700',
    Lemon: '#FFF44F',
    Gold: '#FFD700',
    Mustard: '#FFDB58',
    Lime: '#32CD32',
    Olive: '#808000',
    Sage: '#9DC183',
    Green: '#228B22',
    Mint: '#98FF98',
    Emerald: '#50C878',
    Teal: '#008080',
    Aqua: '#00FFFF',
    Turquoise: '#40E0D0',
    Blue: '#87CEEB',
    Navy: '#000080',
    Indigo: '#4B0082',
    Lavender: '#E6E6FA',
    Lilac: '#C8A2C8',
    Plum: '#8E4585',
    Purple: '#800080',
    Magenta: '#FF00FF',
    Pink: '#FFC0CB',
    Rose: '#FF007F',
    Blush: '#DE5D83',
    Chocolate: '#7B3F00',
    Tan: '#D2B48C',
    Khaki: '#C3B091',
    Sand: '#C2B280',
    Taupe: '#483C32',
    Ruby: '#E0115F',
    Sapphire: '#0F52BA',
  };

  if (colorMap[colorName]) return colorMap[colorName];
  for (const [key, hex] of Object.entries(colorMap)) {
    if (colorName.toLowerCase().includes(key.toLowerCase())) return hex;
  }
  return '#CCCCCC';
}

function getColorFamily(colorName: string): string {
  const families: Record<string, string[]> = {
    white: ['White', 'Ivory', 'Cream'],
    gray: ['Grey', 'Charcoal'],
    black: ['Black'],
    red: ['Red', 'Crimson', 'Burgundy', 'Ruby'],
    orange: ['Orange', 'Tangerine', 'Pumpkin', 'Rust', 'Coral', 'Salmon', 'Peach'],
    yellow: ['Yellow', 'Lemon', 'Gold', 'Mustard'],
    green: ['Green', 'Lime', 'Olive', 'Sage', 'Mint', 'Emerald'],
    blue: ['Blue', 'Teal', 'Aqua', 'Turquoise', 'Navy', 'Indigo', 'Sapphire'],
    purple: ['Purple', 'Lavender', 'Lilac', 'Plum', 'Magenta'],
    pink: ['Pink', 'Rose', 'Blush'],
    brown: ['Chocolate', 'Tan', 'Khaki', 'Sand', 'Taupe'],
  };

  for (const [family, colors] of Object.entries(families)) {
    for (const color of colors) {
      if (colorName.toLowerCase().includes(color.toLowerCase())) return family;
    }
  }
  return 'multicolor';
}

main().catch((error) => {
  console.error('❌ Error seeding database:', error);
  process.exit(1);
});
