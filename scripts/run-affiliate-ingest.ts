import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { retailers } from '@/db/schema';
import { makeAwinAdapter } from '@/lib/affiliate/ingest/awinFeedAdapter';
import { runJob } from '@/lib/affiliate/ingest/runJob';
import type { SourceAdapter } from '@/lib/affiliate/ingest/types';

const ADAPTER_FACTORIES: Record<
  string,
  () => SourceAdapter | null
> = {
  'fat-quarter-shop': () =>
    makeAwinAdapter('fat-quarter-shop', process.env.AWIN_FQS_FEED_URL),
  'connecting-threads': () =>
    makeAwinAdapter('connecting-threads', process.env.AWIN_CONNECTING_THREADS_FEED_URL),
};

async function main() {
  const activeRetailers = await db
    .select()
    .from(retailers)
    .where(eq(retailers.isActive, true));

  for (const row of activeRetailers) {
    const adapterFactory = ADAPTER_FACTORIES[row.slug];
    if (!adapterFactory) {
      console.warn(`[ingest] no adapter for ${row.slug}, skipping`);
      continue;
    }

    const adapter = adapterFactory();
    if (!adapter) {
      console.warn(`[ingest] env vars missing for ${row.slug}, skipping`);
      continue;
    }

    const retailer = {
      id: row.id,
      slug: row.slug,
      name: row.name,
      websiteUrl: row.websiteUrl,
      network: row.network,
      networkMerchantId: row.networkMerchantId,
      logoUrl: row.logoUrl,
      isActive: row.isActive,
    };

    const result = await runJob({ retailer, adapter });
    console.log(
      `[ingest:${row.slug}] done — seen: ${result.seen}, upserted: ${result.upserted}, skipped: ${result.skipped}, errored: ${result.errored}`,
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
