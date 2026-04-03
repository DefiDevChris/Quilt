#!/usr/bin/env tsx
/**
 * Fix fabric image URLs to use proper URL encoding
 */

async function fixFabricUrls() {
  const { drizzle } = await import('drizzle-orm/node-postgres');
  const { Pool } = await import('pg');
  const { eq } = await import('drizzle-orm');

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });
  const db = drizzle(pool);
  const { fabrics } = await import('../src/db/schema');

  const allFabrics = await db
    .select()
    .from(fabrics)
    .where(eq(fabrics.isDefault, true));

  console.log(`Updating ${allFabrics.length} fabric URLs...`);

  for (const fabric of allFabrics) {
    if (fabric.imageUrl.includes('/fabrics/') && fabric.collection) {
      const newUrl = `/fabrics/${encodeURIComponent(fabric.collection)}/${fabric.sku}.jpg`;
      await db
        .update(fabrics)
        .set({ 
          imageUrl: newUrl,
          thumbnailUrl: newUrl
        })
        .where(eq(fabrics.id, fabric.id));
    }
  }

  console.log('Done!');
  await pool.end();
}

fixFabricUrls().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
