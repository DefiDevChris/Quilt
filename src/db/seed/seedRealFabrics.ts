/**
 * Seeds real fabric products from downloaded Andover Fabrics swatch images.
 * 
 * Collections:
 * - Snowberry by Andover Fabrics (24 swatches)
 * - Our Simple Life by Charisma Horton (26 swatches)  
 * - Dream Weaver by Charisma Horton (50 swatches)
 * - Countryside Classics by Makower UK (16 swatches)
 * - Color Camp - Grove by Alison Glass (21 swatches)
 * - Color Camp - Sun by Alison Glass (21 swatches)
 * - Color Camp - Bloom by Alison Glass (21 swatches)
 * 
 * Total: 179 fabrics
 * 
 * Usage: DATABASE_URL=postgresql://... npx tsx src/db/seed/seedRealFabrics.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const FABRIC_IMAGES_DIR = path.join(process.cwd(), 'public', 'fabrics');

// Collection definitions with real metadata
interface CollectionDef {
  name: string;
  designer: string;
  vendor: string;
  style: string; // traditional, modern, floral, geometric, etc.
  theme: string;
  description: string;
  priceMin: number;
  priceMax: number;
  // Map of SKU prefix to SKU codes found in this collection
  skuPrefix: string;
}

const COLLECTIONS: CollectionDef[] = [
  {
    name: 'Snowberry',
    designer: 'Andover Fabrics',
    vendor: 'Andover Fabrics',
    style: 'traditional',
    theme: 'delicate winter berries and soft tonal backgrounds with cottage charm',
    description: 'A cozy winter-inspired collection featuring delicate berry motifs, soft tonal prints, and cottage-style florals. Perfect for holiday quilts, table runners, and traditional projects.',
    priceMin: 9.99,
    priceMax: 13.99,
    skuPrefix: '1022', // 10229, 10230, 10231, 10232, 10233, 10234
  },
  {
    name: 'Our Simple Life',
    designer: 'Charisma Horton',
    vendor: 'Andover Fabrics',
    style: 'modern',
    theme: 'clean modern geometrics with fresh color palettes and minimalist appeal',
    description: 'Charisma Horton\'s Our Simple Life brings modern minimalism to quilting with clean geometrics, fresh colorways, and versatile prints. Ideal for contemporary quilts and modern home decor.',
    priceMin: 10.49,
    priceMax: 14.49,
    skuPrefix: '1039', // 10393-10400
  },
  {
    name: 'Dream Weaver',
    designer: 'Charisma Horton',
    vendor: 'Andover Fabrics',
    style: 'modern',
    theme: 'dreamy abstract weaves and organic textures in vibrant modern colors',
    description: 'Charisma Horton\'s Dream Weaver features dreamy abstract weaves, organic textures, and vibrant modern color palettes. A versatile collection for contemporary quilts, apparel, and modern projects.',
    priceMin: 10.49,
    priceMax: 14.49,
    skuPrefix: '10227',
  },
  {
    name: 'Countryside Classics',
    designer: 'Makower UK',
    vendor: 'Makower UK',
    style: 'traditional',
    theme: 'classic English countryside florals, gingham checks, and garden-inspired prints',
    description: 'Classic English countryside designs from Makower UK featuring beautiful florals (pansies, roses, daffodils, tulips), gingham checks, and garden-inspired prints. Perfect for traditional quilts and country-style projects.',
    priceMin: 11.99,
    priceMax: 15.99,
    skuPrefix: 'MU_',
  },
  {
    name: 'Color Camp - Grove',
    designer: 'Alison Glass',
    vendor: 'Andover Fabrics',
    style: 'modern',
    theme: 'nature-inspired greens and earthy tones with Alison Glass\'s signature style',
    description: 'Alison Glass\'s Color Camp Grove brings nature-inspired greens, earthy tones, and her signature modern aesthetic. Features leafy prints, organic textures, and fresh green palettes.',
    priceMin: 11.99,
    priceMax: 15.49,
    skuPrefix: '1042', // 10420-10429, Green variant
  },
  {
    name: 'Color Camp - Sun',
    designer: 'Alison Glass',
    vendor: 'Andover Fabrics',
    style: 'modern',
    theme: 'warm golden yellows and sunset tones with vibrant energy',
    description: 'Alison Glass\'s Color Camp Sun radiates with warm golden yellows, sunset oranges, and vibrant energy. Perfect for cheerful quilts, summer projects, and bold modern designs.',
    priceMin: 11.99,
    priceMax: 15.49,
    skuPrefix: '1042', // 10420-10429, Yellow/Orange variant
  },
  {
    name: 'Color Camp - Bloom',
    designer: 'Alison Glass',
    vendor: 'Andover Fabrics',
    style: 'modern',
    theme: 'floral-inspired prints in fresh pinks and rosy tones',
    description: 'Alison Glass\'s Color Camp Bloom features floral-inspired prints, fresh pinks, and rosy tones. A beautiful collection for feminine quilts, baby quilts, and garden-themed projects.',
    priceMin: 11.99,
    priceMax: 15.49,
    skuPrefix: '1042', // 10420-10429, Pink/Red variant
  },
];

// Color code to color family mapping
const COLOR_CODE_MAP: Record<string, { color: string; family: string; hex: string }> = {
  // Common suffix letters in fabric SKUs
  'G': { color: 'Green', family: 'green', hex: '#4CAF50' },
  'G1': { color: 'Green 1', family: 'green', hex: '#388E3C' },
  'G2': { color: 'Green 2', family: 'green', hex: '#4CAF50' },
  'G3': { color: 'Green 3', family: 'green', hex: '#66BB6A' },
  'G4': { color: 'Green 4', family: 'green', hex: '#81C784' },
  'G5': { color: 'Green 5', family: 'green', hex: '#A5D6A7' },
  'G6': { color: 'Green 6', family: 'green', hex: '#C8E6C9' },
  'G7': { color: 'Green 7', family: 'green', hex: '#E8F5E9' },
  'R': { color: 'Red', family: 'red', hex: '#E53935' },
  'R1': { color: 'Red 1', family: 'red', hex: '#C62828' },
  'R2': { color: 'Red 2', family: 'red', hex: '#E53935' },
  'R3': { color: 'Red 3', family: 'red', hex: '#EF5350' },
  'R5': { color: 'Red 5', family: 'red', hex: '#FF8A80' },
  'R6': { color: 'Red 6', family: 'red', hex: '#FFCDD2' },
  'LR': { color: 'Light Red', family: 'red', hex: '#FFCDD2' },
  'Y': { color: 'Yellow', family: 'yellow', hex: '#FFD600' },
  'Y1': { color: 'Yellow 1', family: 'yellow', hex: '#FFC107' },
  'Y2': { color: 'Yellow 2', family: 'yellow', hex: '#FFD54F' },
  'B': { color: 'Blue', family: 'blue', hex: '#1E88E5' },
  'B1': { color: 'Blue 1', family: 'blue', hex: '#1565C0' },
  'B2': { color: 'Blue 2', family: 'blue', hex: '#1E88E5' },
  'B3': { color: 'Blue 3', family: 'blue', hex: '#42A5F5' },
  'B4': { color: 'Blue 4', family: 'blue', hex: '#64B5F6' },
  'P': { color: 'Pink', family: 'pink', hex: '#EC407A' },
  'P1': { color: 'Pink 1', family: 'pink', hex: '#C2185B' },
  'P2': { color: 'Pink 2', family: 'pink', hex: '#D81B60' },
  'P3': { color: 'Pink 3', family: 'pink', hex: '#EC407A' },
  'P4': { color: 'Pink 4', family: 'pink', hex: '#F06292' },
  'P5': { color: 'Pink 5', family: 'pink', hex: '#F48FB1' },
  'P6': { color: 'Pink 6', family: 'pink', hex: '#F8BBD0' },
  'E': { color: 'Eggplant', family: 'purple', hex: '#7B1FA2' },
  'E1': { color: 'Eggplant 1', family: 'purple', hex: '#6A1B9A' },
  'E2': { color: 'Eggplant 2', family: 'purple', hex: '#7B1FA2' },
  'E3': { color: 'Eggplant 3', family: 'purple', hex: '#8E24AA' },
  'E4': { color: 'Eggplant 4', family: 'purple', hex: '#9C27B0' },
  'V': { color: 'Violet', family: 'purple', hex: '#8E24AA' },
  'V1': { color: 'Violet 1', family: 'purple', hex: '#7B1FA2' },
  'V2': { color: 'Violet 2', family: 'purple', hex: '#9C27B0' },
  'O': { color: 'Orange', family: 'orange', hex: '#FB8C00' },
  'O1': { color: 'Orange 1', family: 'orange', hex: '#F57C00' },
  'O2': { color: 'Orange 2', family: 'orange', hex: '#FB8C00' },
  'O3': { color: 'Orange 3', family: 'orange', hex: '#FFA726' },
  'O4': { color: 'Orange 4', family: 'orange', hex: '#FFB74D' },
  'T': { color: 'Teal', family: 'green', hex: '#00897B' },
  'T1': { color: 'Teal 1', family: 'green', hex: '#00695C' },
  'T2': { color: 'Teal 2', family: 'green', hex: '#00897B' },
  'T3': { color: 'Teal 3', family: 'green', hex: '#26A69A' },
  'L': { color: 'Lavender', family: 'purple', hex: '#AB47BC' },
  'L1': { color: 'Lavender 1', family: 'purple', hex: '#8E24AA' },
  'L2': { color: 'Lavender 2', family: 'purple', hex: '#AB47BC' },
  'LT': { color: 'Light Teal', family: 'green', hex: '#4DB6AC' },
  'LR': { color: 'Light Rose', family: 'pink', hex: '#F8BBD0' },
  'LG': { color: 'Light Green', family: 'green', hex: '#81C784' },
  'LE': { color: 'Light Eggplant', family: 'purple', hex: '#BA68C8' },
  'LB': { color: 'Light Blue', family: 'blue', hex: '#90CAF9' },
  'K': { color: 'Khaki', family: 'brown', hex: '#8D6E63' },
  'K1': { color: 'Khaki 1', family: 'brown', hex: '#795548' },
  'K2': { color: 'Khaki 2', family: 'brown', hex: '#8D6E63' },
  'C': { color: 'Charcoal', family: 'gray', hex: '#616161' },
  'C1': { color: 'Charcoal 1', family: 'gray', hex: '#424242' },
};

// Makower UK specific color mappings
const MAKOWER_COLOR_MAP: Record<string, { color: string; family: string; hex: string }> = {
  'pansy': { color: 'Pansy', family: 'purple', hex: '#7B1FA2' },
  'gingham': { color: 'Gingham', family: 'red', hex: '#E53935' },
  'daffodil': { color: 'Daffodil', family: 'yellow', hex: '#FFD600' },
  'rose': { color: 'Rose', family: 'pink', hex: '#EC407A' },
  'stripe': { color: 'Stripe', family: 'green', hex: '#4CAF50' },
  'tulip': { color: 'Tulip', family: 'pink', hex: '#F48FB1' },
  'strawberry': { color: 'Strawberry', family: 'red', hex: '#E53935' },
};

function getCollectionForImage(filename: string): CollectionDef | null {
  const baseName = filename.replace('.jpg', '');
  
  // Dream Weaver: all start with 10227
  if (baseName.startsWith('10227')) {
    return COLLECTIONS.find(c => c.name === 'Dream Weaver')!;
  }
  
  // Our Simple Life: 1039x, 1040x
  if (baseName.startsWith('1039') || baseName.startsWith('1040')) {
    return COLLECTIONS.find(c => c.name === 'Our Simple Life')!;
  }
  
  // Snowberry: 1022x-1023x (but not 10227)
  if (baseName.startsWith('1022') || baseName.startsWith('1023')) {
    if (!baseName.startsWith('10227')) {
      return COLLECTIONS.find(c => c.name === 'Snowberry')!;
    }
  }
  
  // Color Camp: 1042x, 1043x
  if (baseName.startsWith('1042') || baseName.startsWith('1043')) {
    // Determine which Color Camp variant by looking at the suffix
    const suffix = baseName.split('-').pop() || '';
    const colorInfo = COLOR_CODE_MAP[suffix];
    if (colorInfo) {
      if (colorInfo.family === 'green') return COLLECTIONS.find(c => c.name === 'Color Camp - Grove')!;
      if (colorInfo.family === 'yellow' || colorInfo.family === 'orange') return COLLECTIONS.find(c => c.name === 'Color Camp - Sun')!;
      if (colorInfo.family === 'pink' || colorInfo.family === 'red') return COLLECTIONS.find(c => c.name === 'Color Camp - Bloom')!;
    }
    // Default to Grove
    return COLLECTIONS.find(c => c.name === 'Color Camp - Grove')!;
  }
  
  // Countryside Classics: MU_ prefix
  if (baseName.startsWith('MU_')) {
    return COLLECTIONS.find(c => c.name === 'Countryside Classics')!;
  }
  
  return null;
}

function getColorInfo(filename: string, collection: CollectionDef): { color: string; family: string; hex: string } {
  const baseName = filename.replace('.jpg', '');
  
  // Makower UK: extract color from filename like MU_272_G_pansy
  if (collection.name === 'Countryside Classics') {
    // Last part of filename is the color name
    const parts = baseName.split('_');
    const colorName = parts[parts.length - 1];
    const colorCode = parts[parts.length - 2];
    
    if (MAKOWER_COLOR_MAP[colorName]) {
      return MAKOWER_COLOR_MAP[colorName];
    }
    // Fallback: try the letter code
    const letterInfo = COLOR_CODE_MAP[colorCode];
    if (letterInfo) return letterInfo;
    return { color: colorName, family: 'multicolor', hex: '#CCCCCC' };
  }
  
  // Other collections: extract suffix after SKU
  const suffixMatch = baseName.match(/-(\w+)$/);
  if (suffixMatch) {
    const suffix = suffixMatch[1];
    const colorInfo = COLOR_CODE_MAP[suffix];
    if (colorInfo) return colorInfo;
  }
  
  return { color: 'Multi', family: 'multicolor', hex: '#CCCCCC' };
}

function generateDescription(collection: CollectionDef, colorName: string): string {
  return `${collection.description}\n\n**Colorway:** ${colorName}\n**Material:** 100% Premium Cotton, 44-45" Wide\n\nPerfect for quilts, patchwork, home decor, and apparel. Machine wash cold, tumble dry low.`;
}

function getPrintType(filename: string): string {
  const name = filename.toLowerCase();
  if (name.includes('gingham') || name.includes('check')) return 'Check/Gingham';
  if (name.includes('stripe')) return 'Stripe';
  if (name.includes('floral') || name.includes('pansy') || name.includes('rose') || name.includes('tulip') || name.includes('daffodil') || name.includes('strawberry') || name.includes('berry')) return 'Floral';
  if (name.includes('geometric') || name.includes('geo')) return 'Geometric';
  return 'Tonal/Blender';
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

  // Get all fabric images
  const images = fs.readdirSync(FABRIC_IMAGES_DIR).filter(f => f.endsWith('.jpg'));
  console.log(`📦 Found ${images.length} fabric images`);

  // Build product data
  const products = images.map((filename, index) => {
    const collection = getCollectionForImage(filename);
    if (!collection) {
      console.warn(`⚠️  Could not identify collection for: ${filename}`);
      return null;
    }

    const colorInfo = getColorInfo(filename, collection);
    const printType = getPrintType(filename);
    const price = parseFloat(
      (collection.priceMin + Math.random() * (collection.priceMax - collection.priceMin)).toFixed(2)
    );

    // Build a nice product name
    let productName: string;
    if (collection.name === 'Countryside Classics') {
      const parts = filename.replace('.jpg', '').split('_');
      const colorName = parts[parts.length - 1];
      productName = `${collection.name} ${colorName.charAt(0).toUpperCase() + colorName.slice(1)} ${printType}`;
    } else {
      const baseName = filename.replace('.jpg', '');
      const suffix = baseName.split('-').pop() || '';
      const colorName = colorInfo.color;
      productName = `${collection.name} ${colorName}`;
    }

    // SKU from filename
    const sku = filename.replace('.jpg', '');

    return {
      filename,
      productName,
      collection: collection.name,
      designer: collection.designer,
      vendor: collection.vendor,
      style: collection.style,
      color: colorInfo.color,
      colorFamily: colorInfo.family,
      hex: colorInfo.hex,
      printType,
      price,
      description: generateDescription(collection, colorInfo.color),
      sku,
    };
  }).filter(Boolean);

  console.log(`✅ Built ${products.length} product records`);

  // Summary by collection
  const byCollection: Record<string, number> = {};
  products.forEach((p: any) => {
    byCollection[p.collection] = (byCollection[p.collection] || 0) + 1;
  });
  console.log('\n📊 Products by collection:');
  Object.entries(byCollection).forEach(([name, count]) => {
    console.log(`  ${name}: ${count}`);
  });

  // Save product data for seeding
  const outputDir = path.join(process.cwd(), 'temp');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, 'real-fabric-products.json'), JSON.stringify(products, null, 2));
  console.log(`\n💾 Product data saved to temp/real-fabric-products.json`);

  // Now seed the database
  const { drizzle } = await import('drizzle-orm/node-postgres');
  const { Pool } = await import('pg');
  const { eq } = await import('drizzle-orm');
  const { fabrics } = await import('@/db/schema');

  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool);

  // Clear existing shop fabrics
  console.log('\n🧹 Clearing existing shop fabrics...');
  const deleted = await db.delete(fabrics).where(eq(fabrics.isPurchasable, true)).returning({ id: fabrics.id });
  console.log(`   Deleted ${deleted.length} existing shop fabrics`);

  // Also clear default fabrics that are purchasable
  const deletedDefaults = await db.delete(fabrics).where(eq(fabrics.isDefault, true)).returning({ id: fabrics.id });
  console.log(`   Deleted ${deletedDefaults.length} existing default fabrics`);

  // Insert products in batches
  console.log(`\n📝 Inserting ${products.length} fabrics...`);
  const batchSize = 50;
  let inserted = 0;

  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize).map((p: any) => ({
      userId: null as string | null,
      name: p.productName,
      imageUrl: `/fabrics/${p.filename}`,
      thumbnailUrl: `/fabrics/${p.filename}`,
      manufacturer: p.vendor,
      sku: p.sku,
      collection: p.collection,
      colorFamily: p.colorFamily,
      value: p.style.substring(0, 10),
      hex: p.hex,
      scaleX: 1.0,
      scaleY: 1.0,
      rotation: 0.0,
      ppi: '150.0000',
      calibrated: false,
      isDefault: true,
      isPurchasable: true,
      shopifyProductId: null as string | null,
      shopifyVariantId: null as string | null,
      pricePerYard: p.price.toFixed(2),
      description: p.description,
      inStock: true,
    }));

    await db.insert(fabrics).values(batch);
    inserted += batch.length;
    console.log(`   Inserted ${inserted}/${products.length}`);
  }

  console.log(`\n✅ Successfully seeded ${inserted} real fabrics!`);
  console.log(`\n📊 Summary:`);
  console.log(`   Collections: ${Object.keys(byCollection).join(', ')}`);
  console.log(`   Total fabrics: ${inserted}`);
  console.log(`   Images: /fabrics/*.jpg (real Andover Fabrics swatches)`);
  console.log(`   All fabrics: isDefault=true, isPurchasable=true, inStock=true`);

  await pool.end();
}

main().catch((error) => {
  console.error('❌ Error seeding database:', error);
  process.exit(1);
});
