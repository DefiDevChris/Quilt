/**
 * Real Quilt Block Seeder
 *
 * Reads the 50 traditional quilt block SVGs from /quilt_blocks/*.svg on disk,
 * parses them into Fabric.js Group JSON, and inserts them into the `blocks`
 * table as system blocks (isDefault=true, userId=null). Metadata (display
 * name, description, difficulty, tags) comes from BLOCK_OVERLAYS in
 * src/lib/quilt-overlay-registry.ts.
 *
 * Before inserting, ALL existing system blocks (isDefault=true) are deleted
 * so the library is replaced wholesale. User blocks are untouched.
 *
 * Usage:
 *   DATABASE_URL=postgresql://quiltcorgi:localdev@localhost:5432/quiltcorgi \
 *     npx tsx src/db/seed/seedBlocksFromFiles.ts
 */

import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { eq, and, isNull } from 'drizzle-orm';

import { BLOCK_OVERLAYS, type BlockOverlay } from '@/lib/quilt-overlay-registry';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const QUILT_BLOCKS_DIR = resolve(__dirname, '..', '..', '..', 'quilt_blocks');

/** Block SVGs use a 300×300 viewBox. */
const VIEW_BOX = 300;

type FabricPrimitive = Record<string, unknown>;

/**
 * Parse attributes of a single SVG element.
 */
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
 * Convert a 300×300 block SVG string into a Fabric.js Group JSON.
 *
 * Supports the primitives used by the quilt_blocks/*.svg files: <rect>,
 * <polygon>, <path>, <circle>, <line>. All primitives are normalized so the
 * resulting group has width=300 / height=300 and origin (0,0).
 */
export function svgToFabricGroup(svgData: string): Record<string, unknown> {
  const objects: FabricPrimitive[] = [];

  // <rect ... />
  const rectRegex = /<rect\s+([^>]+?)\/>/g;
  let m: RegExpExecArray | null;
  while ((m = rectRegex.exec(svgData)) !== null) {
    const a = parseAttributes(m[1]);
    objects.push({
      type: 'Rect',
      left: parseFloat(a.x ?? '0'),
      top: parseFloat(a.y ?? '0'),
      width: parseFloat(a.width ?? '0'),
      height: parseFloat(a.height ?? '0'),
      fill: a.fill ?? '#000',
      stroke: a.stroke === 'none' ? null : (a.stroke ?? '#333'),
      strokeWidth: parseFloat(a['stroke-width'] ?? '1'),
    });
  }

  // <polygon ... />
  const polyRegex = /<polygon\s+([^>]+?)\/>/g;
  while ((m = polyRegex.exec(svgData)) !== null) {
    const a = parseAttributes(m[1]);
    const points = (a.points ?? '')
      .trim()
      .split(/\s+/)
      .map((p) => {
        const [x, y] = p.split(',').map(Number);
        return { x, y };
      })
      .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
    if (points.length < 3) continue;
    objects.push({
      type: 'Polygon',
      points,
      fill: a.fill ?? '#000',
      stroke: a.stroke === 'none' ? null : (a.stroke ?? '#333'),
      strokeWidth: parseFloat(a['stroke-width'] ?? '1'),
    });
  }

  // <path ... />
  const pathRegex = /<path\s+([^>]+?)\/>/g;
  while ((m = pathRegex.exec(svgData)) !== null) {
    const a = parseAttributes(m[1]);
    if (!a.d) continue;
    objects.push({
      type: 'Path',
      path: a.d,
      fill: a.fill === 'none' ? '' : (a.fill ?? '#000'),
      stroke: a.stroke === 'none' ? null : (a.stroke ?? '#333'),
      strokeWidth: parseFloat(a['stroke-width'] ?? '1'),
    });
  }

  // <circle ... />
  const circleRegex = /<circle\s+([^>]+?)\/>/g;
  while ((m = circleRegex.exec(svgData)) !== null) {
    const a = parseAttributes(m[1]);
    const cx = parseFloat(a.cx ?? '0');
    const cy = parseFloat(a.cy ?? '0');
    const r = parseFloat(a.r ?? '0');
    if (r <= 0) continue;
    objects.push({
      type: 'Circle',
      left: cx - r,
      top: cy - r,
      radius: r,
      fill: a.fill ?? '#000',
      stroke: a.stroke === 'none' ? null : (a.stroke ?? '#333'),
      strokeWidth: parseFloat(a['stroke-width'] ?? '1'),
    });
  }

  // <line ... />
  const lineRegex = /<line\s+([^>]+?)\/>/g;
  while ((m = lineRegex.exec(svgData)) !== null) {
    const a = parseAttributes(m[1]);
    objects.push({
      type: 'Line',
      x1: parseFloat(a.x1 ?? '0'),
      y1: parseFloat(a.y1 ?? '0'),
      x2: parseFloat(a.x2 ?? '0'),
      y2: parseFloat(a.y2 ?? '0'),
      stroke: a.stroke ?? '#333',
      strokeWidth: parseFloat(a['stroke-width'] ?? '1'),
    });
  }

  return {
    type: 'Group',
    version: '6.0.0',
    originX: 'left',
    originY: 'top',
    left: 0,
    top: 0,
    width: VIEW_BOX,
    height: VIEW_BOX,
    scaleX: 1,
    scaleY: 1,
    angle: 0,
    objects,
  };
}

/**
 * Derive category + tags from the block overlay metadata so searching /
 * filtering in BlockLibrary works nicely.
 */
function categoryFor(overlay: BlockOverlay): { category: string; subcategory: string | null } {
  const name = overlay.name.toLowerCase();

  if (name.includes('star') || name.includes('pinwheel')) {
    return { category: 'Stars', subcategory: 'Traditional' };
  }
  if (name.includes('patch') || name.includes('four_patch') || name.includes('nine_patch')) {
    return { category: 'Patches', subcategory: 'Traditional' };
  }
  if (name.includes('log_cabin') || name.includes('courthouse_steps')) {
    return { category: 'Log Cabin', subcategory: 'Traditional' };
  }
  if (name.includes('hst') || name.includes('flying_geese') || name.includes('hourglass')) {
    return { category: 'Triangles', subcategory: 'Traditional' };
  }
  if (name.includes('drunkards_path') || name.includes('dresden')) {
    return { category: 'Curves', subcategory: 'Traditional' };
  }
  return { category: 'Traditional', subcategory: null };
}

function tagsFor(overlay: BlockOverlay): string[] {
  const parts = overlay.name.split(/[_-]/).filter(Boolean);
  const base = [overlay.difficulty, ...parts];
  return Array.from(new Set(base));
}

interface SeedRecord {
  name: string;
  category: string;
  subcategory: string | null;
  svgData: string;
  fabricJsData: Record<string, unknown>;
  tags: string[];
  isDefault: boolean;
}

async function buildRecords(): Promise<SeedRecord[]> {
  const records: SeedRecord[] = [];

  for (const overlay of BLOCK_OVERLAYS) {
    // svgPath is served at /quilt_blocks/XX.svg — load the corresponding file
    // from the project directory.
    const relative = overlay.svgPath.replace(/^\/+/, '');
    if (!relative.startsWith('quilt_blocks/')) continue;
    const fsPath = resolve(QUILT_BLOCKS_DIR, '..', relative);

    let svgData: string;
    try {
      svgData = await readFile(fsPath, 'utf8');
    } catch (err) {
      console.warn(`  ! Skipping ${overlay.name} — could not read ${fsPath}`);
      continue;
    }

    const fabricJsData = svgToFabricGroup(svgData);
    const { category, subcategory } = categoryFor(overlay);
    records.push({
      name: overlay.displayName,
      category,
      subcategory,
      svgData,
      fabricJsData,
      tags: tagsFor(overlay),
      isDefault: true,
    });
  }

  return records;
}

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

  console.log(`Reading SVGs from ${QUILT_BLOCKS_DIR}...`);
  const records = await buildRecords();
  console.log(`Built ${records.length} block records.`);

  if (records.length === 0) {
    console.error('No records to insert — aborting.');
    await pool.end();
    process.exit(1);
  }

  console.log('Deleting existing system blocks (isDefault=true, userId=null)...');
  const deleted = await db
    .delete(blocks)
    .where(and(eq(blocks.isDefault, true), isNull(blocks.userId)))
    .returning({ id: blocks.id });
  console.log(`  Deleted ${deleted.length} system blocks.`);

  console.log(`Inserting ${records.length} real quilt blocks...`);
  await db.insert(blocks).values(records);
  console.log('  Done.');

  await pool.end();
}

// Run only when invoked directly via tsx/node, not when imported.
const entry = process.argv[1] ? resolve(process.argv[1]) : '';
if (entry === __filename) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
