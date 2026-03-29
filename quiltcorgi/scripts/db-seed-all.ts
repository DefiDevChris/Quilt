/**
 * Unified seed script — runs all seeds in dependency order.
 *
 * Usage: npx tsx scripts/db-seed-all.ts
 *
 * Order:
 *   1. Blocks (system library — no user dependency)
 *   2. Fabrics (system library — no user dependency)
 *   3. Blog posts (creates system user if needed)
 *   4. Community content (creates sample users + posts)
 *   5. Pattern templates (reads from src/data/patterns/)
 */

import { execSync } from 'child_process';
import { db } from '@/lib/db';
import { blocks, fabrics, patternTemplates, users } from '@/db/schema';
import { getAllBlockDefinitions } from '../src/db/seed/blockDefinitions';
import { svgToFabricJsData } from '../src/db/seed/seedBlocks';
import { getAllFabricDefinitions } from '../src/db/seed/fabricDefinitions';
import { sql, eq } from 'drizzle-orm';

// --- Fabric color helpers (mirrors seedFabrics.ts) ---
const COLOR_MAP: Record<string, string> = {
  white: '#FFFFFF',
  snow: '#FFFAFA',
  ivory: '#FFFFF0',
  bone: '#E3DAC9',
  natural: '#F5F0E8',
  cream: '#FFFDD0',
  butter: '#FFE4A1',
  canary: '#FFEF00',
  gold: '#FFD700',
  orange: '#FF8C00',
  coral: '#FF7F50',
  red: '#FF0000',
  crimson: '#DC143C',
  pink: '#FFC0CB',
  magenta: '#FF00FF',
  purple: '#800080',
  lavender: '#E6E6FA',
  navy: '#000080',
  royal: '#4169E1',
  aqua: '#00FFFF',
  teal: '#008080',
  sage: '#BCB88A',
  olive: '#808000',
  lime: '#BFFF00',
  tan: '#D2B48C',
  chocolate: '#7B3F00',
  charcoal: '#36454F',
  black: '#000000',
};

function getColorHex(fabricName: string): string {
  const colorPart = fabricName.replace(/^[^-]+-\s*/, '').toLowerCase();
  return COLOR_MAP[colorPart] ?? '#CCCCCC';
}

function placeholderSvg(hex: string): string {
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="${hex}"/></svg>`
  )}`;
}

function runSeedScript(label: string, scriptPath: string) {
  try {
    execSync(`npx tsx ${scriptPath}`, {
      stdio: 'inherit',
      env: { ...process.env },
    });
  } catch {
    console.log(`  ${label}: seed script failed — continuing`);
  }
}

async function seedBlocks() {
  const existing = await db.execute(
    sql`SELECT count(*)::int AS n FROM blocks WHERE "isDefault" = true`
  );
  const count = (existing.rows[0] as { n: number }).n;
  if (count > 0) {
    console.log(`  Blocks: ${count} system blocks already exist — skipping`);
    return;
  }

  const defs = getAllBlockDefinitions();
  const seen = new Set<string>();
  const rows = [];

  for (const def of defs) {
    if (seen.has(def.name)) continue;
    seen.add(def.name);
    rows.push({
      name: def.name,
      category: def.category,
      subcategory: def.subcategory ?? null,
      svgData: def.svgData,
      fabricJsData: svgToFabricJsData(def.svgData),
      tags: def.tags ?? [],
      isDefault: true,
      thumbnailUrl: null,
    });
  }

  for (let i = 0; i < rows.length; i += 100) {
    await db.insert(blocks).values(rows.slice(i, i + 100));
  }
  console.log(`  Blocks: seeded ${rows.length} system blocks`);
}

async function seedFabrics() {
  const existing = await db.execute(
    sql`SELECT count(*)::int AS n FROM fabrics WHERE "isDefault" = true`
  );
  const count = (existing.rows[0] as { n: number }).n;
  if (count > 0) {
    console.log(`  Fabrics: ${count} system fabrics already exist — skipping`);
    return;
  }

  const defs = getAllFabricDefinitions();
  const rows = defs.map((f) => {
    const hex = getColorHex(f.name);
    const url = placeholderSvg(hex);
    return {
      name: f.name,
      manufacturer: f.manufacturer,
      sku: f.sku,
      collection: f.collection,
      colorFamily: f.colorFamily,
      imageUrl: url,
      thumbnailUrl: url,
      isDefault: true,
    };
  });

  for (let i = 0; i < rows.length; i += 100) {
    await db.insert(fabrics).values(rows.slice(i, i + 100));
  }
  console.log(`  Fabrics: seeded ${rows.length} system fabrics`);
}

async function seedPatternTemplates() {
  const existing = await db.execute(sql`SELECT count(*)::int AS n FROM pattern_templates`);
  const count = (existing.rows[0] as { n: number }).n;
  if (count > 0) {
    console.log(`  Patterns: ${count} templates already exist — skipping`);
    return;
  }

  try {
    const mod = await import('../src/db/seed/patternTemplateSeed');
    const getSeeds = (mod as Record<string, unknown>).getPatternTemplateSeeds;
    if (typeof getSeeds !== 'function') {
      console.log('  Patterns: no getPatternTemplateSeeds export — skipping');
      return;
    }
    const seeds = getSeeds() as Array<Record<string, unknown>>;
    if (!seeds.length) {
      console.log('  Patterns: no pattern files found — skipping');
      return;
    }
    for (let i = 0; i < seeds.length; i += 50) {
      await db.insert(patternTemplates).values(
        seeds.slice(i, i + 50).map((s) => ({
          slug: s.slug as string,
          name: s.name as string,
          description: s.description as string,
          skillLevel: s.skillLevel as string,
          finishedWidth: s.finishedWidth as number,
          finishedHeight: s.finishedHeight as number,
          blockCount: s.blockCount as number,
          fabricCount: s.fabricCount as number,
          thumbnailUrl: s.thumbnailUrl as string | null,
          patternData: s.patternData as Record<string, unknown>,
          tags: s.tags as string[],
          importCount: 0,
          isPublished: s.isPublished as boolean,
        }))
      );
    }
    console.log(`  Patterns: seeded ${seeds.length} templates`);
  } catch (err) {
    console.log(`  Patterns: skipped (${(err as Error).message})`);
  }
}

async function seedDevUser() {
  const DEV_USER_ID = '00000000-0000-0000-0000-000000000001';
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.id, DEV_USER_ID));

  if (existing.length > 0) {
    console.log('  Dev user: already exists — skipping');
    return;
  }

  await db.insert(users).values({
    id: DEV_USER_ID,
    name: 'Dev User',
    email: 'dev@localhost',
    role: 'pro',
    emailVerified: new Date(),
  });
  console.log('  Dev user: created (pro, dev@localhost)');
}

async function main() {
  console.log('\n=== QuiltCorgi Local Database Seeding ===\n');

  console.log('0/5  Dev bypass user...');
  await seedDevUser();

  console.log('1/5  System blocks...');
  await seedBlocks();

  console.log('2/5  System fabrics...');
  await seedFabrics();

  // Blog and community seeds call process.exit() — run as child processes
  console.log('3/5  Blog posts...');
  runSeedScript('Blog', 'src/db/seed/seed-blog.ts');

  console.log('4/5  Community content...');
  runSeedScript('Community', 'src/db/seed/seed-community-content.ts');

  console.log('5/5  Pattern templates...');
  await seedPatternTemplates();

  console.log('\n=== Seeding complete ===\n');
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
