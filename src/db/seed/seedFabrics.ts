/**
 * Fabric Library Seeding Script
 *
 * Usage: npx tsx src/db/seed/seedFabrics.ts
 *
 * Seeds 2,764 solid fabric swatches from 16 manufacturers into the `fabrics` table
 * as system fabrics (isDefault=true, userId=null).
 *
 * Uses SVG data URIs colored with the actual hex value from the QuiltySolid dataset.
 * Clears existing system fabrics before inserting to ensure a clean slate.
 */
import { getAllFabricDefinitions } from './fabricDefinitions';

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

  const { fabrics } = await import('@/db/schema');
  const { eq } = await import('drizzle-orm');

  // Clear existing system fabrics
  const deleted = await db
    .delete(fabrics)
    .where(eq(fabrics.isDefault, true))
    .returning({ id: fabrics.id });
  console.log(`Cleared ${deleted.length} existing system fabrics.`);

  const definitions = getAllFabricDefinitions();
  console.log(`Seeding ${definitions.length} system fabrics from 16 manufacturers...`);

  const BATCH_SIZE = 100;
  let inserted = 0;

  for (let i = 0; i < definitions.length; i += BATCH_SIZE) {
    const batch = definitions.slice(i, i + BATCH_SIZE);
    const values = batch.map((def) => {
      const placeholderUrl = generatePlaceholderSvg(def.hex);
      return {
        userId: null as string | null,
        name: def.name,
        imageUrl: placeholderUrl,
        thumbnailUrl: placeholderUrl,
        manufacturer: def.manufacturer,
        sku: null as string | null,
        collection: def.collection,
        colorFamily: def.colorFamily,
        value: def.value,
        hex: def.hex,
        scaleX: 1.0,
        scaleY: 1.0,
        rotation: 0.0,
        isDefault: true,
      };
    });

    await db.insert(fabrics).values(values);
    inserted += batch.length;

    if (inserted % 500 === 0 || inserted === definitions.length) {
      console.log(`  Inserted ${inserted}/${definitions.length} fabrics`);
    }
  }

  console.log(
    `Done! ${inserted} fabrics seeded across ${new Set(definitions.map((d) => d.manufacturer)).size} manufacturers.`
  );
  await pool.end();
}

if (process.env.NODE_ENV === 'production') {
  console.error('ERROR: Seed scripts cannot run in production. Aborting.');
  process.exit(1);
}

seedFabrics().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
