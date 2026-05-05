import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { retailers } from '@/db/schema';
import { getRequiredSession, requireAdmin } from '@/lib/auth-helpers';
import { errorResponse, validationErrorResponse } from '@/lib/api-responses';
import { runJob } from '@/lib/affiliate/ingest/runJob';
import { makeAwinAdapter } from '@/lib/affiliate/ingest/awinFeedAdapter';
import { makeScrapingBeeAdapter } from '@/lib/affiliate/ingest/scrapingBeeAdapter';
import type { Retailer } from '@/lib/affiliate/ingest/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * POST /api/admin/ingest/run
 *
 * Triggers an affiliate fabric ingest job for a specific retailer.
 * Admin-only. Accepts { retailerSlug: string }.
 */
export async function POST(request: NextRequest) {
  const session = await getRequiredSession();
  if (!session) return new Response('Unauthorized', { status: 401 });
  const check = requireAdmin(session.user.role);
  if (check instanceof Response) return check;

  let body: { retailerSlug?: string };
  try {
    body = await request.json();
  } catch {
    return validationErrorResponse('Invalid JSON body');
  }

  const { retailerSlug } = body;
  if (!retailerSlug || typeof retailerSlug !== 'string') {
    return validationErrorResponse('retailerSlug is required');
  }

  const [retailerRow] = await db
    .select()
    .from(retailers)
    .where(eq(retailers.slug, retailerSlug))
    .limit(1);

  if (!retailerRow) {
    return errorResponse(
      `Retailer "${retailerSlug}" not found`,
      'NOT_FOUND',
      404,
    );
  }

  if (!retailerRow.isActive) {
    return errorResponse(
      `Retailer "${retailerSlug}" is inactive`,
      'BAD_REQUEST',
      400,
    );
  }

  const retailer: Retailer = {
    id: retailerRow.id,
    slug: retailerRow.slug,
    name: retailerRow.name,
    websiteUrl: retailerRow.websiteUrl,
    network: retailerRow.network,
    networkMerchantId: retailerRow.networkMerchantId,
    logoUrl: retailerRow.logoUrl,
    isActive: retailerRow.isActive,
  };

  const adapter =
    makeAwinAdapter(retailer.slug, retailerRow.feedUrl ?? undefined) ??
    makeScrapingBeeAdapter(
      retailer.slug,
      retailer.websiteUrl,
      `${retailer.websiteUrl}/sitemap.xml`,
    );

  try {
    const result = await runJob({ retailer, adapter });

    return Response.json({
      success: true,
      data: {
        retailerSlug: retailer.slug,
        ...result,
      },
    });
  } catch (error) {
    console.error(`[admin:ingest] job failed for ${retailerSlug}:`, error);
    return errorResponse(
      `Ingest job failed: ${error instanceof Error ? error.message : 'unknown error'}`,
      'INTERNAL_ERROR',
      500,
    );
  }
}
