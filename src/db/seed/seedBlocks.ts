/**
 * Block Library Seeding Script
 *
 * Usage: npx tsx src/db/seed/seedBlocks.ts
 *
 * Generates 200+ quilt blocks with SVG geometry and Fabric.js JSON data,
 * then inserts them into the `blocks` table as system blocks (isDefault=true, userId=null).
 */
import { getAllBlockDefinitions, type BlockDefinition } from './blockDefinitions';
import { eq } from 'drizzle-orm';
import { COLORS, CANVAS } from '../../lib/design-system';

/**
 * Convert an SVG block definition to Fabric.js group JSON.
 * The block is represented as a Fabric.js Group containing Path/Rect objects
 * parsed from the SVG data. Uses a simplified parser since blocks are
 * generated from known SVG primitives (rect, polygon, path, circle, line).
 */
export function svgToFabricJsData(svgData: string): Record<string, unknown> {
  const objects: Record<string, unknown>[] = [];

  // Parse rect elements
  const rectRegex = /<rect\s+([^>]+)\/>/g;
  let match: RegExpExecArray | null;
  while ((match = rectRegex.exec(svgData)) !== null) {
    const attrs = parseAttributes(match[1]);
    const x = parseFloat(attrs.x ?? '0');
    const y = parseFloat(attrs.y ?? '0');
    const width = parseFloat(attrs.width ?? '0');
    const height = parseFloat(attrs.height ?? '0');
    objects.push({
      type: 'Rect',
      left: x,
      top: y,
      width,
      height,
      fill: attrs.fill ?? COLORS.text,
      stroke: attrs.stroke === 'none' ? null : (attrs.stroke ?? CANVAS.strokeDefault),
      strokeWidth: parseFloat(attrs['stroke-width'] ?? '0.5'),
      opacity: parseFloat(attrs.opacity ?? '1'),
    });
  }

  // Parse polygon elements
  const polygonRegex = /<polygon\s+([^>]+)\/>/g;
  while ((match = polygonRegex.exec(svgData)) !== null) {
    const attrs = parseAttributes(match[1]);
    const pointsStr = attrs.points ?? '';
    const points = pointsStr
      .trim()
      .split(/\s+/)
      .map((p) => {
        const [x, y] = p.split(',').map(Number);
        return { x, y };
      });

    if (points.length > 0) {
      objects.push({
        type: 'Polygon',
        points,
        fill: attrs.fill ?? COLORS.text,
        stroke: attrs.stroke === 'none' ? null : (attrs.stroke ?? CANVAS.strokeDefault),
        strokeWidth: parseFloat(attrs['stroke-width'] ?? '0.5'),
      });
    }
  }

  // Parse path elements
  const pathRegex = /<path\s+([^>]+)\/>/g;
  while ((match = pathRegex.exec(svgData)) !== null) {
    const attrs = parseAttributes(match[1]);
    if (attrs.d) {
      objects.push({
        type: 'Path',
        path: attrs.d,
        fill: attrs.fill === 'none' ? '' : (attrs.fill ?? COLORS.text),
        stroke: attrs.stroke === 'none' ? null : (attrs.stroke ?? CANVAS.strokeDefault),
        strokeWidth: parseFloat(attrs['stroke-width'] ?? '0.5'),
      });
    }
  }

  // Parse circle elements
  const circleRegex = /<circle\s+([^>]+)\/>/g;
  while ((match = circleRegex.exec(svgData)) !== null) {
    const attrs = parseAttributes(match[1]);
    const cx = parseFloat(attrs.cx ?? '0');
    const cy = parseFloat(attrs.cy ?? '0');
    const r = parseFloat(attrs.r ?? '0');
    objects.push({
      type: 'Circle',
      left: cx - r,
      top: cy - r,
      radius: r,
      fill: attrs.fill ?? COLORS.text,
      stroke: attrs.stroke === 'none' ? null : (attrs.stroke ?? CANVAS.strokeDefault),
      strokeWidth: parseFloat(attrs['stroke-width'] ?? '0.5'),
    });
  }

  // Parse line elements
  const lineRegex = /<line\s+([^>]+)\/>/g;
  while ((match = lineRegex.exec(svgData)) !== null) {
    const attrs = parseAttributes(match[1]);
    const x1 = parseFloat(attrs.x1 ?? '0');
    const y1 = parseFloat(attrs.y1 ?? '0');
    const x2 = parseFloat(attrs.x2 ?? '0');
    const y2 = parseFloat(attrs.y2 ?? '0');
    objects.push({
      type: 'Line',
      x1,
      y1,
      x2,
      y2,
      stroke: attrs.stroke ?? CANVAS.strokeDefault,
      strokeWidth: parseFloat(attrs['stroke-width'] ?? '1'),
    });
  }

  return {
    type: 'Group',
    objects,
    width: 100,
    height: 100,
    left: 0,
    top: 0,
  };
}

function parseAttributes(attrString: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const attrRegex = /([\w-]+)="([^"]*)"/g;
  let match: RegExpExecArray | null;
  while ((match = attrRegex.exec(attrString)) !== null) {
    attrs[match[1]] = match[2];
  }
  return attrs;
}

/**
 * Generate the full block records ready for database insertion.
 */
export function generateBlockRecords(): Array<{
  name: string;
  category: string;
  subcategory: string | null;
  svgData: string;
  fabricJsData: Record<string, unknown>;
  tags: string[];
  isDefault: boolean;
}> {
  const definitions = getAllBlockDefinitions();
  return definitions.map((def: BlockDefinition) => ({
    name: def.name,
    category: def.category,
    subcategory: def.subcategory,
    svgData: def.svgData,
    fabricJsData: svgToFabricJsData(def.svgData),
    tags: def.tags,
    isDefault: true,
  }));
}

/**
 * Seed the database with block records.
 * Only runs when executed directly (not when imported).
 */
async function main() {
  const { drizzle } = await import('drizzle-orm/node-postgres');
  const { Pool } = await import('pg');

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });
  const { blocks } = await import('@/db/schema');
  const db = drizzle(pool, { schema: { blocks } });

  const records = generateBlockRecords();
  console.log(`Preparing to seed ${records.length} blocks...`);

  // Check for existing blocks to ensure idempotency
  const existingBlocks = await db
    .select({ name: blocks.name })
    .from(blocks)
    .where(eq(blocks.isDefault, true));
  const existingNames = new Set(existingBlocks.map((b) => b.name));

  // Filter out already-existing blocks
  const newRecords = records.filter((r) => !existingNames.has(r.name));

  if (newRecords.length === 0) {
    console.log('All blocks already exist. Skipping seed.');
    await pool.end();
    return;
  }

  console.log(
    `Inserting ${newRecords.length} new blocks (${records.length - newRecords.length} already exist)...`
  );

  // Insert in batches of 50
  const BATCH_SIZE = 50;
  for (let i = 0; i < newRecords.length; i += BATCH_SIZE) {
    const batch = newRecords.slice(i, i + BATCH_SIZE);
    await db.insert(blocks).values(batch);
    console.log(
      `  Inserted batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(newRecords.length / BATCH_SIZE)}`
    );
  }

  console.log(`Done! Seeded ${newRecords.length} new blocks.`);
  await pool.end();
}

// Only run main() when executed directly
const isDirectExecution = process.argv[1]?.includes('seedBlocks');
if (isDirectExecution) {
  if (process.env.NODE_ENV === 'production') {
    console.error('ERROR: Seed scripts cannot run in production. Aborting.');
    process.exit(1);
  }
  main().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
}
