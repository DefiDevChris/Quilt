import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { retailers } from '@/db/schema';
import { runJob } from '@/lib/affiliate/ingest/runJob';
import { makeAwinAdapter } from '@/lib/affiliate/ingest/awinFeedAdapter';
import { makeScrapingBeeAdapter } from '@/lib/affiliate/ingest/scrapingBeeAdapter';
import type { Retailer } from '@/lib/affiliate/ingest/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * GET /api/cron/ingest
 *
 * Scheduled endpoint to ingest affiliate fabric feeds for all active retailers.
 * Protected by a bearer token (CRON_SECRET) to prevent unauthorized access.
 *
 * Configure your scheduler (Vercel Cron, AWS EventBridge, GitHub Actions, etc.)
 * to call this endpoint daily with the Authorization header:
 *   Authorization: Bearer <CRON_SECRET>
 */
export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error('[cron:ingest] CRON_SECRET not configured');
    return new Response('Server misconfiguration', { status: 500 });
  }

  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const activeRetailers = await db
    .select()
    .from(retailers)
    .where(eq(retailers.isActive, true));

  if (activeRetailers.length === 0) {
    return Response.json({
      success: true,
      message: 'No active retailers found',
      results: [],
    });
  }

  const results: Array<{
    retailerSlug: string;
    status: 'success' | 'failed';
    seen?: number;
    upserted?: number;
    skipped?: number;
    errored?: number;
    error?: string;
  }> = [];

  for (const row of activeRetailers) {
    const retailer: Retailer = {
      id: row.id,
      slug: row.slug,
      name: row.name,
      websiteUrl: row.websiteUrl,
      network: row.network,
      networkMerchantId: row.networkMerchantId,
      logoUrl: row.logoUrl,
      isActive: row.isActive,
    };

    const adapter =
      makeAwinAdapter(retailer.slug, row.feedUrl ?? undefined) ??
      makeScrapingBeeAdapter(
        retailer.slug,
        retailer.websiteUrl,
        `${retailer.websiteUrl}/sitemap.xml`,
      );

    try {
      const result = await runJob({ retailer, adapter });
      console.log(
        `[cron:ingest] ${retailer.slug}: seen=${result.seen} upserted=${result.upserted} skipped=${result.skipped} errored=${result.errored}`,
      );
      results.push({
        retailerSlug: retailer.slug,
        status: 'success',
        ...result,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      console.error(`[cron:ingest] ${retailer.slug} FAILED:`, message);
      results.push({
        retailerSlug: retailer.slug,
        status: 'failed',
        error: message,
      });
    }
  }

  const allSucceeded = results.every((r) => r.status === 'success');

  return Response.json(
    {
      success: allSucceeded,
      message: `Processed ${results.length} retailer(s)`,
      results,
    },
    { status: allSucceeded ? 200 : 207 },
  );
}
