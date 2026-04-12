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
import { COLORS, CANVAS } from '@/lib/design-system';

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
 * Compute the tight bounding box of Fabric.js objects.
 * Handles Rect, Polygon, Path, Circle, and Line primitives.
 */
function computeBoundingBox(objects: FabricPrimitive[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const obj of objects) {
    switch (obj.type) {
      case 'Rect': {
        const left = (obj.left as number) ?? 0;
        const top = (obj.top as number) ?? 0;
        const width = (obj.width as number) ?? 0;
        const height = (obj.height as number) ?? 0;
        minX = Math.min(minX, left);
        minY = Math.min(minY, top);
        maxX = Math.max(maxX, left + width);
        maxY = Math.max(maxY, top + height);
        break;
      }
      case 'Polygon': {
        const points = obj.points as Array<{ x: number; y: number }>;
        if (points) {
          for (const p of points) {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
          }
        }
        break;
      }
      case 'Circle': {
        const left = (obj.left as number) ?? 0;
        const top = (obj.top as number) ?? 0;
        const radius = (obj.radius as number) ?? 0;
        // left/top are already adjusted by (center - radius) in Circle creation
        minX = Math.min(minX, left);
        minY = Math.min(minY, top);
        maxX = Math.max(maxX, left + radius * 2);
        maxY = Math.max(maxY, top + radius * 2);
        break;
      }
      case 'Line': {
        const x1 = (obj.x1 as number) ?? 0;
        const y1 = (obj.y1 as number) ?? 0;
        const x2 = (obj.x2 as number) ?? 0;
        const y2 = (obj.y2 as number) ?? 0;
        minX = Math.min(minX, x1, x2);
        minY = Math.min(minY, y1, y2);
        maxX = Math.max(maxX, x1, x2);
        maxY = Math.max(maxY, y1, y2);
        break;
      }
      case 'Path': {
        // For paths, we use the viewBox as a fallback since parsing path
        // data would be complex. The seed script sets width/height to
        // VIEW_BOX, so paths that span the full viewBox will be correct.
        minX = Math.min(minX, 0);
        minY = Math.min(minY, 0);
        maxX = Math.max(maxX, VIEW_BOX);
        maxY = Math.max(maxY, VIEW_BOX);
        break;
      }
    }
  }

  return { minX, minY, maxX, maxY };
}

/**
 * Convert a 300×300 block SVG string into a Fabric.js Group JSON.
 *
 * Supports the primitives used by the quilt_blocks/*.svg files: <rect>,
 * <polygon>, <path>, <circle>, <line>. Computes the actual tight bounding
 * box of all primitives so the Group's width/height match the real content,
 * ensuring correct scaling when blocks are dropped into layout cells.
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
      fill: a.fill ?? COLORS.text,
      stroke: a.stroke === 'none' ? null : (a.stroke ?? CANVAS.strokeDefault),
      strokeWidth: parseFloat(a['stroke-width'] ?? '1'),
      __shade: a['data-shade'] ?? 'unknown',
      __pieceRole: a['data-role'] ?? 'patch',
      __blockPatchIndex: objects.length,
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
      fill: a.fill ?? COLORS.text,
      stroke: a.stroke === 'none' ? null : (a.stroke ?? CANVAS.strokeDefault),
      strokeWidth: parseFloat(a['stroke-width'] ?? '1'),
      __shade: a['data-shade'] ?? 'unknown',
      __pieceRole: a['data-role'] ?? 'patch',
      __blockPatchIndex: objects.length,
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
      fill: a.fill === 'none' ? '' : (a.fill ?? COLORS.text),
      stroke: a.stroke === 'none' ? null : (a.stroke ?? CANVAS.strokeDefault),
      strokeWidth: parseFloat(a['stroke-width'] ?? '1'),
      __shade: a['data-shade'] ?? 'unknown',
      __pieceRole: a['data-role'] ?? 'patch',
      __blockPatchIndex: objects.length,
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
      fill: a.fill ?? COLORS.text,
      stroke: a.stroke === 'none' ? null : (a.stroke ?? CANVAS.strokeDefault),
      strokeWidth: parseFloat(a['stroke-width'] ?? '1'),
      __shade: a['data-shade'] ?? 'unknown',
      __pieceRole: a['data-role'] ?? 'patch',
      __blockPatchIndex: objects.length,
    });
  }

  // <line ... /> — structural seam lines, not fillable patches
  const lineRegex = /<line\s+([^>]+?)\/>/g;
  while ((m = lineRegex.exec(svgData)) !== null) {
    const a = parseAttributes(m[1]);
    objects.push({
      type: 'Line',
      x1: parseFloat(a.x1 ?? '0'),
      y1: parseFloat(a.y1 ?? '0'),
      x2: parseFloat(a.x2 ?? '0'),
      y2: parseFloat(a.y2 ?? '0'),
      stroke: a.stroke ?? CANVAS.strokeDefault,
      strokeWidth: parseFloat(a['stroke-width'] ?? '1'),
      __pieceRole: 'seam',
      __blockPatchIndex: objects.length,
    });
  }

  // Compute the tight bounding box from all primitives
  const bbox = computeBoundingBox(objects);
  const actualWidth = bbox.maxX - bbox.minX;
  const actualHeight = bbox.maxY - bbox.minY;

  // Use the computed dimensions (fallback to VIEW_BOX if no objects)
  const groupWidth = objects.length > 0 ? actualWidth : VIEW_BOX;
  const groupHeight = objects.length > 0 ? actualHeight : VIEW_BOX;

  return {
    type: 'Group',
    version: '6.0.0',
    originX: 'left',
    originY: 'top',
    left: bbox.minX,
    top: bbox.minY,
    width: groupWidth,
    height: groupHeight,
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
