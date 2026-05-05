/**
 * Seed script for affiliate retailers.
 * Run with: npx tsx src/db/seed/seed-retailers.ts
 *
 * Idempotent: uses ON CONFLICT DO UPDATE on slug so re-runs
 * update existing rows rather than failing.
 */

import { db } from '@/lib/db';
import { retailers } from '@/db/schema';
import { sql } from 'drizzle-orm';
import { retailerSeedData } from './retailer-seed-data';

async function seedRetailers() {
  console.log('🏪 Seeding affiliate retailers...\n');

  let upserted = 0;

  for (const data of retailerSeedData) {
    await db
      .insert(retailers)
      .values(data)
      .onConflictDoUpdate({
        target: retailers.slug,
        set: {
          name: sql`excluded.name`,
          websiteUrl: sql`excluded.website_url`,
          network: sql`excluded.network`,
          networkMerchantId: sql`excluded.network_merchant_id`,
          feedUrl: sql`excluded.feed_url`,
          logoUrl: sql`excluded.logo_url`,
          isActive: sql`excluded.is_active`,
          updatedAt: sql`now()`,
        },
      });

    console.log(`✅ Retailer: ${data.name} (${data.slug})`);
    upserted++;
  }

  console.log(`\n🎉 Done! ${upserted} retailer(s) upserted.`);
}

seedRetailers().catch((error) => {
  console.error('❌ Failed to seed retailers:', error);
  process.exit(1);
});
