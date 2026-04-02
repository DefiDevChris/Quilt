#!/usr/bin/env tsx
/**
 * Seed fabrics from the /fabrics directory
 * Scans all collection folders and adds fabric images to the database
 */

import { readdirSync, statSync } from 'fs';
import { join, basename } from 'path';

const FABRICS_DIR = join(process.cwd(), '..', 'fabrics');

interface FabricEntry {
  name: string;
  manufacturer: string;
  sku: string;
  collection: string;
  colorFamily: string;
  imagePath: string;
}

function extractColorFamily(filename: string): string {
  const colorCode = filename.split('-')[1]?.replace('.jpg', '').toUpperCase();
  const colorMap: Record<string, string> = {
    B: 'Blue', L: 'Blue', LB: 'Blue', T: 'Teal', G: 'Green', LG: 'Green',
    Y: 'Yellow', LT: 'Yellow', O: 'Orange', R: 'Red', P: 'Pink', V: 'Purple',
    K: 'Black', E: 'Neutral', C: 'Neutral', N: 'Neutral', W: 'White'
  };
  return colorMap[colorCode] || 'Multi';
}

function scanFabrics(): FabricEntry[] {
  const entries: FabricEntry[] = [];
  
  const collections = readdirSync(FABRICS_DIR).filter(name => {
    const path = join(FABRICS_DIR, name);
    return statSync(path).isDirectory();
  });

  for (const collection of collections) {
    const collectionPath = join(FABRICS_DIR, collection);
    const [collectionName, manufacturer] = collection.includes(' by ')
      ? collection.split(' by ')
      : [collection, 'Unknown'];

    const files = readdirSync(collectionPath).filter(f => 
      f.endsWith('.jpg') && !f.startsWith('.')
    );

    for (const file of files) {
      const sku = file.replace('.jpg', '');
      entries.push({
        name: `${collectionName} - ${sku}`,
        manufacturer: manufacturer.trim(),
        sku,
        collection: collectionName,
        colorFamily: extractColorFamily(file),
        imagePath: join(collectionPath, file)
      });
    }
  }

  return entries;
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

  const entries = scanFabrics();
  console.log(`Found ${entries.length} fabric images across ${new Set(entries.map(e => e.collection)).size} collections`);

  const { fabrics } = await import('../src/db/schema');
  const { eq } = await import('drizzle-orm');

  const existingFabrics = await db
    .select({ sku: fabrics.sku })
    .from(fabrics)
    .where(eq(fabrics.isDefault, true));
  const existingSkus = new Set(existingFabrics.map(f => f.sku));

  const newEntries = entries.filter(e => !existingSkus.has(e.sku));

  if (newEntries.length === 0) {
    console.log('All fabrics already exist. Skipping seed.');
    await pool.end();
    return;
  }

  console.log(`Inserting ${newEntries.length} new fabrics...`);

  const BATCH_SIZE = 50;
  let inserted = 0;

  for (let i = 0; i < newEntries.length; i += BATCH_SIZE) {
    const batch = newEntries.slice(i, i + BATCH_SIZE);
    const values = batch.map(entry => {
      const collectionPath = entry.collection.includes(' by ')
        ? entry.collection
        : entry.collection;
      return {
        userId: null as string | null,
        name: entry.name,
        imageUrl: `/fabrics/${encodeURIComponent(collectionPath)}/${entry.sku}.jpg`,
        thumbnailUrl: `/fabrics/${encodeURIComponent(collectionPath)}/${entry.sku}.jpg`,
        manufacturer: entry.manufacturer,
        sku: entry.sku,
        collection: entry.collection,
        colorFamily: entry.colorFamily,
        scaleX: 1.0,
        scaleY: 1.0,
        rotation: 0.0,
        isDefault: true,
      };
    });

    await db.insert(fabrics).values(values);
    inserted += batch.length;
    console.log(`  Inserted ${inserted}/${newEntries.length} fabrics`);
  }

  console.log(`Done! ${inserted} fabrics seeded.`);
  await pool.end();
}

if (process.env.NODE_ENV === 'production') {
  console.error('ERROR: Seed scripts cannot run in production. Aborting.');
  process.exit(1);
}

seedFabrics().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
