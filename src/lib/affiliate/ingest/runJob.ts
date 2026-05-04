import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { ingestJobs } from '@/db/schema';
import type { SourceAdapter, Retailer } from './types';
import { isQuiltingCotton } from './filter';
import { normalize } from './normalize';
import { upsertFabric, sweepStale } from './upsert';

interface IngestConfig {
  retailer: Retailer;
  adapter: SourceAdapter;
  staleDays?: number;
}

export async function runJob(config: IngestConfig): Promise<{
  seen: number;
  upserted: number;
  skipped: number;
  errored: number;
}> {
  const { retailer, adapter, staleDays = 7 } = config;

  const job = await db
    .insert(ingestJobs)
    .values({
      retailerSlug: retailer.slug,
      sourceType: adapter.sourceType,
      status: 'running',
      startedAt: new Date(),
    })
    .returning();

  let seen = 0;
  let upserted = 0;
  let skipped = 0;
  let errored = 0;

  try {
    for await (const raw of adapter.fetchProducts()) {
      seen++;
      try {
        if (!isQuiltingCotton(raw, retailer.slug)) {
          skipped++;
          continue;
        }
        const normalized = normalize(raw, retailer);
        if (!normalized) {
          skipped++;
          continue;
        }
        await upsertFabric(normalized, retailer);
        upserted++;
      } catch (e) {
        errored++;
        console.error(
          `[ingest:${retailer.slug}] error on ${raw.externalId}:`,
          e instanceof Error ? e.message : e,
        );
      }
    }

    const sweepResult = await sweepStale(retailer.id, staleDays);
    console.log(
      `[ingest:${retailer.slug}] swept ${sweepResult.deactivated} stale fabrics`,
    );

    await db
      .update(ingestJobs)
      .set({
        status: 'success',
        finishedAt: new Date(),
        productsSeen: seen,
        productsUpserted: upserted,
        productsSkipped: skipped,
        productsErrored: errored,
      })
      .where(eq(ingestJobs.id, job[0].id));
  } catch (e) {
    await db
      .update(ingestJobs)
      .set({
        status: 'failed',
        finishedAt: new Date(),
        productsSeen: seen,
        productsUpserted: upserted,
        productsSkipped: skipped,
        productsErrored: errored,
        errorLog: String(e),
      })
      .where(eq(ingestJobs.id, job[0].id));
    throw e;
  }

  return { seen, upserted, skipped, errored };
}

