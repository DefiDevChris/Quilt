/**
 * Seed script for canonical template blocks and fabrics.
 * Run with: npx tsx src/db/seed/seed-templates.ts
 *
 * Idempotent: checks each canonical ID before inserting.
 * Safe to re-run — missing rows are back-filled, duplicates are skipped.
 */

import { db } from '@/lib/db';
import { blocks, fabrics } from '@/db/schema';
import { eq } from 'drizzle-orm';
import {
  canonicalBlocks,
  canonicalFabrics,
} from './template-seed-data';

async function seedTemplates() {
  console.log('🌱 Seeding template blocks & fabrics...\n');

  let blocksInserted = 0;
  let blocksSkipped = 0;

  for (const block of canonicalBlocks) {
    const existing = await db.query.blocks.findFirst({
      where: eq(blocks.id, block.id),
    });
    if (existing) {
      console.log(`⏭️  Block "${block.name}" already exists`);
      blocksSkipped++;
      continue;
    }
    await db.insert(blocks).values(block as typeof blocks.$inferInsert);
    console.log(`✅ Block: ${block.name} (${block.id})`);
    blocksInserted++;
  }

  let fabricsInserted = 0;
  let fabricsSkipped = 0;

  for (const fabric of canonicalFabrics) {
    const existing = await db.query.fabrics.findFirst({
      where: eq(fabrics.id, fabric.id),
    });
    if (existing) {
      console.log(`⏭️  Fabric "${fabric.name}" already exists`);
      fabricsSkipped++;
      continue;
    }
    await db.insert(fabrics).values(fabric as typeof fabrics.$inferInsert);
    console.log(`✅ Fabric: ${fabric.name} (${fabric.id})`);
    fabricsInserted++;
  }

  console.log(
    `\n🎉 Done! Blocks: ${blocksInserted} inserted, ${blocksSkipped} skipped. Fabrics: ${fabricsInserted} inserted, ${fabricsSkipped} skipped.`
  );
}

seedTemplates().catch((error) => {
  console.error('❌ Failed to seed templates:', error);
  process.exit(1);
});
