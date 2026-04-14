/**
 * Download fabric images from quilting fabric websites and prepare product data.
 * Sources: Andover Fabrics, Moda Fabrics, Robert Kaufman, etc.
 */

import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = path.join(process.cwd(), 'temp', 'fabric-images');
const PRODUCT_DATA_FILE = path.join(process.cwd(), 'temp', 'fabric-products.json');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

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

const vendors = [
  'Andover Fabrics',
  'Moda Fabrics',
  'Robert Kaufman',
  'Riley Blake Designs',
  'Benartex',
  'Timeless Treasures',
  'Henry Glass Fabrics',
  'Camelot Cottons',
];

const categories = [
  'Quilting Cotton',
  'Precuts',
  'Fat Quarters',
  'Jelly Rolls',
  'Layer Cakes',
  'Charm Packs',
  'Border Prints',
  'Batiks',
];

const priceRanges = {
  'Quilting Cotton': { min: 8.99, max: 14.99 },
  'Precuts': { min: 6.99, max: 12.99 },
  'Fat Quarters': { min: 3.49, max: 5.99 },
  'Jelly Rolls': { min: 34.99, max: 54.99 },
  'Layer Cakes': { min: 24.99, max: 39.99 },
  'Charm Packs': { min: 8.99, max: 14.99 },
  'Border Prints': { min: 9.99, max: 15.99 },
  'Batiks': { min: 11.99, max: 18.99 },
};

// Realistic fabric collections organized by fabric lines
// Each line has a distinct style: floral, geometric, traditional, modern, batik, novelty, etc.
const fabricCollections = [
  // === ANDOVER FABRICS ===
  { vendor: 'Andover Fabrics', collection: 'Cottage Cloth', style: 'traditional', theme: 'soft cottage prints with delicate florals and tonal backgrounds', baseSku: 'A-500', count: 8 },
  { vendor: 'Andover Fabrics', collection: 'Garden Journal', style: 'floral', theme: 'botanical garden prints with roses, peonies, and trailing vines', baseSku: 'A-610', count: 6 },
  { vendor: 'Andover Fabrics', collection: 'Scandi Delight', style: 'modern', theme: 'Scandinavian-inspired geometrics with clean lines and muted tones', baseSku: 'A-720', count: 6 },
  { vendor: 'Andover Fabrics', collection: 'Heritage Batiks', style: 'batik', theme: 'rich batik prints with traditional motifs and depth of color', baseSku: 'A-830', count: 6 },

  // === MODA FABRICS ===
  { vendor: 'Moda Fabrics', collection: 'Bella Solids', style: 'solid', theme: 'premium solid cotton fabrics in a wide range of colors', baseSku: 'M-9900', count: 8 },
  { vendor: 'Moda Fabrics', collection: 'Grunge', style: 'textured', theme: 'grunge-style tonal prints with texture and visual depth', baseSku: 'M-5150', count: 6 },
  { vendor: 'Moda Fabrics', collection: 'Moda Love', style: 'floral', theme: 'romantic floral prints with roses and vintage charm', baseSku: 'M-3360', count: 6 },
  { vendor: 'Moda Fabrics', collection: 'Urban Chik', style: 'modern', theme: 'contemporary modern prints with abstract geometrics', baseSku: 'M-4200', count: 4 },

  // === ROBERT KAUFMAN ===
  { vendor: 'Robert Kaufman', collection: 'Kona Cotton', style: 'solid', theme: 'industry-leading solid cotton in timeless colors', baseSku: 'RK-700', count: 8 },
  { vendor: 'Robert Kaufman', collection: 'Artisan Batiks', style: 'batik', theme: 'handcrafted batik prints with artisan quality and rich colors', baseSku: 'RK-800', count: 6 },
  { vendor: 'Robert Kaufman', collection: 'Essex Linen Blend', style: 'textured', theme: 'linen-cotton blend with natural texture and rustic charm', baseSku: 'RK-900', count: 4 },

  // === RILEY BLAKE DESIGNS ===
  { vendor: 'Riley Blake Designs', collection: 'Floral Reflections', style: 'floral', theme: 'watercolor florals with soft reflections and garden beauty', baseSku: 'RB-F100', count: 6 },
  { vendor: 'Riley Blake Designs', collection: 'Geometric Splash', style: 'geometric', theme: 'bold geometric prints with splashes of vibrant color', baseSku: 'RB-G200', count: 6 },
  { vendor: 'Riley Blake Designs', collection: 'Shine Bright', style: 'modern', theme: 'modern metallic-look prints with shimmer and sparkle', baseSku: 'RB-S300', count: 4 },

  // === BENARTEX ===
  { vendor: 'Benartex', collection: 'ColorWorks Solids', style: 'solid', theme: 'versatile solid fabrics perfect for mixing and matching', baseSku: 'B-600', count: 6 },
  { vendor: 'Benartex', collection: 'Timeless Treasures', style: 'traditional', theme: 'classic traditional quilting prints with heritage appeal', baseSku: 'B-710', count: 4 },
];

const colorNames = [
  'Snow White', 'Ivory', 'Cream', 'Light Grey', 'Charcoal', 'Black',
  'Red', 'Crimson', 'Burgundy', 'Coral', 'Salmon', 'Peach',
  'Orange', 'Tangerine', 'Pumpkin', 'Rust',
  'Yellow', 'Lemon', 'Gold', 'Mustard',
  'Lime', 'Olive', 'Sage', 'Forest Green', 'Mint', 'Emerald',
  'Teal', 'Aqua', 'Turquoise', 'Sky Blue', 'Royal Blue', 'Navy', 'Indigo',
  'Lavender', 'Lilac', 'Plum', 'Purple', 'Magenta', 'Pink', 'Rose', 'Blush',
  'Chocolate', 'Tan', 'Khaki', 'Sand', 'Taupe',
];

const patternModifiers = [
  '', ' Tonal', ' Speckled', ' Textured', ' Mottled', ' Variegated',
  ' Floral', ' Geometric', ' Stripe', ' Dot', ' Leaf',
];

function generateProducts(): FabricProduct[] {
  const products: FabricProduct[] = [];
  let index = 0;

  // Color palettes per style — gives each fabric line its own character
  const styleColorPalettes: Record<string, string[]> = {
    traditional: ['Cream', 'Sage', 'Rose', 'Blush', 'Lavender', 'Sand', 'Plum', 'Taupe', 'Ivory', 'Burgundy'],
    floral: ['Pink', 'Coral', 'Sage', 'Lavender', 'Cream', 'Peach', 'Rose', 'Mint', 'Blush', 'Lilac'],
    modern: ['Charcoal', 'Sky Blue', 'Mint', 'Coral', 'Mustard', 'Light Grey', 'Teal', 'Snow White', 'Navy', 'Gold'],
    batik: ['Emerald', 'Ruby', 'Sapphire', 'Gold', 'Plum', 'Teal', 'Burgundy', 'Navy', 'Rust', 'Indigo'],
    solid: colorNames, // Full range for solids
    textured: ['Charcoal', 'Tan', 'Sage', 'Navy', 'Burgundy', 'Khaki', 'Light Grey', 'Rust', 'Olive', 'Chocolate'],
    geometric: ['Navy', 'Coral', 'Turquoise', 'Yellow', 'Royal Blue', 'Magenta', 'Lime', 'Orange', 'Black', 'Snow White'],
  };

  for (const coll of fabricCollections) {
    const palette = styleColorPalettes[coll.style] || colorNames;
    const category = getCategoryForStyle(coll.style);
    const priceRange = priceRanges[category as keyof typeof priceRanges] || priceRanges['Quilting Cotton'];
    
    for (let i = 0; i < coll.count && index < 80; i++) {
      const color = palette[index % palette.length];
      const pattern = coll.style === 'solid' ? '' : (i % 3 === 0 ? patternModifiers[Math.floor(Math.random() * patternModifiers.length)] : '');
      const sku = `${coll.baseSku}-${String(100 + i).padStart(3, '0')}`;
      const price = parseFloat(
        (priceRange.min + Math.random() * (priceRange.max - priceRange.min)).toFixed(2)
      );
      
      const title = `${coll.collection} ${color}${pattern}`;
      const description = generateDescription(coll.vendor, coll.collection, color, pattern, coll.style, coll.theme);
      
      products.push({
        title,
        description,
        price,
        category,
        subcategory: getSubcategoryForStyle(coll.style),
        collection: coll.collection,
        style: coll.style,
        imageUrl: '',
        localImagePath: '',
        sku,
        material: coll.style === 'textured' ? '55% Linen / 45% Cotton' : '100% Cotton',
        width: '43-44 inches',
        weight: coll.style === 'textured' ? 'Medium-Heavy Weight (5-5.5 oz/sq yd)' : 'Medium Weight (4.5-5 oz/sq yd)',
        care: 'Machine wash cold, tumble dry low',
        vendor: coll.vendor,
        tags: generateTags(coll.vendor, coll.collection, color, coll.style),
      });
      
      index++;
    }
  }

  // Add some precuts
  const precutVendors = ['Moda Fabrics', 'Robert Kaufman', 'Riley Blake Designs'];
  const precutTypes = ['Fat Quarter Bundle', 'Jelly Roll', 'Layer Cake', 'Charm Pack'];
  
  for (const vendor of precutVendors) {
    for (const precut of precutTypes) {
      if (index >= 80) break;
      
      const priceRange = priceRanges[precut.includes('Jelly') ? 'Jelly Rolls' : precut.includes('Layer') ? 'Layer Cakes' : precut.includes('Charm') ? 'Charm Packs' : 'Fat Quarters'];
      const price = parseFloat(
        (priceRange.min + Math.random() * (priceRange.max - priceRange.min)).toFixed(2)
      );
      
      const sku = `${vendor.substring(0, 2).toUpperCase()}-${precut.substring(0, 2).toUpperCase()}-${String(100 + index).padStart(3, '0')}`;
      
      products.push({
        title: `${vendor} ${precut} - Assorted Colors`,
        description: generatePrecutDescription(vendor, precut),
        price,
        category: precutTypes.find(t => precut.includes(t.split(' ')[0])) || 'Precuts',
        subcategory: 'Precut Bundles',
        collection: precut,
        style: 'precut',
        imageUrl: '',
        localImagePath: '',
        sku,
        material: '100% Cotton',
        width: precut.includes('Jelly') ? '2.5 inch strips' : precut.includes('Layer') ? '10 inch squares' : precut.includes('Charm') ? '5 inch squares' : 'Fat Quarter (~18x21 inches)',
        weight: 'Medium Weight (4.5-5 oz/sq yd)',
        care: 'Machine wash cold, tumble dry low',
        vendor,
        tags: [vendor, precut.toLowerCase().replace(' ', '-'), 'precut', 'quilting', 'bundle'],
      });
      
      index++;
    }
  }

  return products.slice(0, 80);
}

function getCategoryForStyle(style: string): string {
  const styleToCategory: Record<string, string> = {
    traditional: 'Quilting Cotton',
    floral: 'Quilting Cotton',
    modern: 'Quilting Cotton',
    batik: 'Batiks',
    solid: 'Quilting Cotton',
    textured: 'Quilting Cotton',
    geometric: 'Quilting Cotton',
  };
  return styleToCategory[style] || 'Quilting Cotton';
}

function getSubcategoryForStyle(style: string): string {
  const styleToSubcategory: Record<string, string> = {
    traditional: 'Traditional Prints',
    floral: 'Floral Prints',
    modern: 'Modern & Contemporary',
    batik: 'Handcrafted Batiks',
    solid: 'Solids & Basics',
    textured: 'Textured & Tonal',
    geometric: 'Geometric Prints',
  };
  return styleToSubcategory[style] || 'All Purpose';
}

function generateDescription(vendor: string, collection: string, color: string, pattern: string, style: string, theme: string): string {
  const styleDescriptors: Record<string, string> = {
    traditional: 'timeless traditional design',
    floral: 'beautiful floral motif',
    modern: 'contemporary modern aesthetic',
    batik: 'rich handcrafted batik technique',
    solid: 'premium solid color',
    textured: 'richly textured appearance',
    geometric: 'striking geometric pattern',
  };

  const descriptor = styleDescriptors[style] || 'beautiful design';
  
  return `Premium quilting cotton from ${vendor}'s ${collection} collection. This ${color.toLowerCase()} fabric features a ${descriptor} — ${theme}.

**Collection: ${collection}**
Style: ${style.charAt(0).toUpperCase() + style.slice(1)} | ${theme}

**Features:**
• 100% premium cotton (43-44" wide)
• High thread count for durability
• Colorfast and pre-shrunk
• Ideal for quilting, sewing, and crafts
• Sold by the half yard (multiple of 0.5 yards)

**About ${collection}:**
The ${collection} collection by ${vendor} offers exceptional quality and ${style} designs. Each fabric is carefully printed with vibrant colors that won't fade after washing.

**Care Instructions:**
Machine wash cold with like colors. Tumble dry low. Remove promptly. Do not bleach.

Perfect for: quilts, tote bags, pillows, clothing, baby items, table runners, wall hangings, and more!`;
}

function generatePrecutDescription(vendor: string, precut: string): string {
  return `Convenient pre-cut fabric bundle from ${vendor}. This ${precut.toLowerCase()} includes a curated selection of coordinating prints and solids from popular fabric collections.

**What's Included:**
• ${precut.includes('Jelly') ? '40 strips (2.5" x width of fabric)' : precut.includes('Layer') ? '42 squares (10" x 10")' : precut.includes('Charm') ? '42 squares (5" x 5")' : '20 fat quarters (~18" x 21")'}
• Mix of prints, tones, and solids
• Perfectly coordinated colors

**Benefits of Precuts:**
• No measuring or cutting required
• Professional-looking results
• Time-saving for large projects
• Coordinating colors guaranteed

**Material:** 100% Cotton
**Care:** Machine wash cold, tumble dry low

Great for: quilts, scrap projects, stash building, and beginner quilters!`;
}

function generateTags(vendor: string, collection: string, color: string, style: string): string[] {
  return [
    vendor.toLowerCase().replace(/ /g, '-'),
    collection.toLowerCase().replace(/ /g, '-'),
    'quilting-cotton',
    'cotton-fabric',
    color.toLowerCase().replace(/ /g, '-'),
    style,
    'by-the-yard',
  ];
}

function downloadImage(url: string, filename: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const filepath = path.join(OUTPUT_DIR, filename);
    
    if (fs.existsSync(filepath)) {
      resolve(filepath);
      return;
    }

    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          downloadImage(redirectUrl, filename).then(resolve).catch(reject);
        } else {
          reject(new Error(`Redirect without location: ${url}`));
        }
        return;
      }

      if (response.statusCode !== 200) {
        reject(new ImageDownloadError(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }

      const contentType = response.headers['content-type'];
      const ext = contentType?.includes('png') ? '.png' : contentType?.includes('webp') ? '.webp' : '.jpg';
      const finalPath = filepath.replace(/\.\w+$/, ext);

      const fileStream = fs.createWriteStream(finalPath);
      response.pipe(fileStream);
      
      fileStream.on('finish', () => {
        fileStream.close();
        resolve(finalPath);
      });
    }).on('error', reject);
  });
}

class ImageDownloadError extends Error {}

// Generate placeholder images (SVG with style-specific patterns)
function generatePlaceholderImage(index: number, color: string, style: string): Buffer {
  const hexColor = colorToHex(color);
  const patternOverlay = getStylePatternOverlay(style);
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
    <rect width="800" height="800" fill="${hexColor}"/>
    ${patternOverlay}
    <rect x="50" y="680" width="700" height="80" rx="10" fill="rgba(0,0,0,0.4)"/>
    <text x="400" y="725" font-family="Arial" font-size="28" fill="white" text-anchor="middle" dominant-baseline="middle">
      Fabric ${index + 1} — ${color}
    </text>
  </svg>`;
  
  return Buffer.from(svg);
}

function getStylePatternOverlay(style: string): string {
  const patterns: Record<string, string> = {
    traditional: '<circle cx="200" cy="200" r="60" fill="rgba(255,255,255,0.1)"/><circle cx="600" cy="400" r="80" fill="rgba(255,255,255,0.08)"/><circle cx="300" cy="600" r="50" fill="rgba(255,255,255,0.1)"/>',
    floral: '<path d="M200 300 Q250 200 300 300 Q250 400 200 300" fill="rgba(255,255,255,0.1)"/><path d="M500 400 Q550 300 600 400 Q550 500 500 400" fill="rgba(255,255,255,0.08)"/>',
    modern: '<rect x="150" y="150" width="100" height="100" fill="rgba(255,255,255,0.08)" transform="rotate(45 200 200)"/><rect x="500" y="300" width="120" height="120" fill="rgba(255,255,255,0.06)" transform="rotate(30 560 360)"/>',
    batik: '<ellipse cx="400" cy="400" rx="150" ry="100" fill="rgba(255,255,255,0.06)"/><ellipse cx="200" cy="200" rx="80" ry="60" fill="rgba(255,255,255,0.08)"/>',
    solid: '',
    textured: '<line x1="0" y1="100" x2="800" y2="100" stroke="rgba(255,255,255,0.05)" stroke-width="2"/><line x1="0" y1="200" x2="800" y2="200" stroke="rgba(255,255,255,0.05)" stroke-width="2"/><line x1="0" y1="300" x2="800" y2="300" stroke="rgba(255,255,255,0.05)" stroke-width="2"/><line x1="0" y1="400" x2="800" y2="400" stroke="rgba(255,255,255,0.05)" stroke-width="2"/><line x1="0" y1="500" x2="800" y2="500" stroke="rgba(255,255,255,0.05)" stroke-width="2"/><line x1="0" y1="600" x2="800" y2="600" stroke="rgba(255,255,255,0.05)" stroke-width="2"/>',
    geometric: '<polygon points="400,100 500,300 300,300" fill="rgba(255,255,255,0.08)"/><polygon points="200,400 300,600 100,600" fill="rgba(255,255,255,0.06)"/>',
  };
  return patterns[style] || '';
}

function colorToHex(color: string): string {
  const colorMap: Record<string, string> = {
    'Snow White': '#F8F8F8',
    'Ivory': '#FFFFF0',
    'Cream': '#FFFDD0',
    'Light Grey': '#D3D3D3',
    'Charcoal': '#36454F',
    'Black': '#1A1A1A',
    'Red': '#E63946',
    'Crimson': '#DC143C',
    'Burgundy': '#800020',
    'Coral': '#FF6F61',
    'Salmon': '#FA8072',
    'Peach': '#FFCBA4',
    'Orange': '#FF8C00',
    'Tangerine': '#FF9900',
    'Pumpkin': '#FF7518',
    'Rust': '#B7410E',
    'Yellow': '#FFD700',
    'Lemon': '#FFF44F',
    'Gold': '#FFD700',
    'Mustard': '#FFDB58',
    'Lime': '#32CD32',
    'Olive': '#808000',
    'Sage': '#9DC183',
    'Forest Green': '#228B22',
    'Mint': '#98FF98',
    'Emerald': '#50C878',
    'Teal': '#008080',
    'Aqua': '#00FFFF',
    'Turquoise': '#40E0D0',
    'Sky Blue': '#87CEEB',
    'Royal Blue': '#4169E1',
    'Navy': '#000080',
    'Indigo': '#4B0082',
    'Lavender': '#E6E6FA',
    'Lilac': '#C8A2C8',
    'Plum': '#8E4585',
    'Purple': '#800080',
    'Magenta': '#FF00FF',
    'Pink': '#FFC0CB',
    'Rose': '#FF007F',
    'Blush': '#DE5D83',
    'Chocolate': '#7B3F00',
    'Tan': '#D2B48C',
    'Khaki': '#C3B091',
    'Sand': '#C2B280',
    'Taupe': '#483C32',
  };
  
  return colorMap[color] || '#CCCCCC';
}

async function main() {
  console.log('🧵 Generating fabric product data...');
  
  const products = generateProducts();
  console.log(`✅ Generated ${products.length} products`);
  
  // Generate placeholder images as SVGs
  console.log('🎨 Creating placeholder images...');
  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const filename = `fabric-${String(i + 1).padStart(3, '0')}.svg`;
    const style = product.style || 'solid';
    // Extract the base color name (first word of the color portion)
    const colorPortion = product.title.replace(product.collection + ' ', '');
    const colorName = colorPortion.split(' ')[0];
    const svgBuffer = generatePlaceholderImage(i, colorName, style);
    const filepath = path.join(OUTPUT_DIR, filename);
    
    fs.writeFileSync(filepath, svgBuffer);
    product.localImagePath = filepath;
    console.log(`  ✓ ${filename} (${product.collection} — ${colorName})`);
  }
  
  // Save product data
  console.log('💾 Saving product data...');
  fs.writeFileSync(PRODUCT_DATA_FILE, JSON.stringify(products, null, 2));
  console.log(`✅ Product data saved to ${PRODUCT_DATA_FILE}`);
  
  console.log('\n📊 Summary:');
  console.log(`  Total products: ${products.length}`);
  console.log(`  Vendors: ${[...new Set(products.map(p => p.vendor))].join(', ')}`);
  console.log(`  Categories: ${[...new Set(products.map(p => p.category))].join(', ')}`);
  console.log(`  Price range: $${Math.min(...products.map(p => p.price)).toFixed(2)} - $${Math.max(...products.map(p => p.price)).toFixed(2)}`);
}

main().catch(console.error);
