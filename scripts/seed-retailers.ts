import { db } from '@/lib/db';
import { retailers } from '@/db/schema';
import { eq } from 'drizzle-orm';

const RETAILER_SEEDS = [
  {
    slug: 'fat-quarter-shop',
    name: 'Fat Quarter Shop',
    websiteUrl: 'https://www.fatquartershop.com',
    network: 'awin',
    networkMerchantId: '89535',
  },
  {
    slug: 'connecting-threads',
    name: 'Connecting Threads',
    websiteUrl: 'https://www.connectingthreads.com',
    network: 'awin',
    networkMerchantId: null,
  },
] as const;

async function main() {
  for (const seed of RETAILER_SEEDS) {
    const [existing] = await db
      .select({ id: retailers.id })
      .from(retailers)
      .where(eq(retailers.slug, seed.slug))
      .limit(1);

    if (existing) {
      console.log(`[seed] retailer "${seed.slug}" already exists (id: ${existing.id}), skipping`);
      continue;
    }

    const [inserted] = await db
      .insert(retailers)
      .values({
        slug: seed.slug,
        name: seed.name,
        websiteUrl: seed.websiteUrl,
        network: seed.network,
        networkMerchantId: seed.networkMerchantId,
        isActive: true,
      })
      .returning({ id: retailers.id });

    console.log(`[seed] created retailer "${seed.slug}" (id: ${inserted.id})`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
