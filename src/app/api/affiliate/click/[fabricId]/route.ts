import { eq } from 'drizzle-orm';
import { createHash } from 'crypto';
import { db } from '@/lib/db';
import { fabrics, retailers, affiliateClicks } from '@/db/schema';
import { buildDeeplink } from '@/lib/affiliate/deeplink';
import { notFoundResponse } from '@/lib/api-responses';

const BOT_UA_REGEX =
  /(googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|ahrefsbot|semrushbot|mj12bot|dotbot|petalbot|curl|wget|python-requests|node-fetch|axios|java\/|go-http-client)/i;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ fabricId: string }> },
) {
  const { fabricId } = await params;

  const [row] = await db
    .select({
      fabricId: fabrics.id,
      fabricName: fabrics.name,
      isAffiliate: fabrics.isAffiliate,
      retailerId: fabrics.retailerId,
      retailerProductUrl: fabrics.retailerProductUrl,
      deeplinkOverride: fabrics.deeplinkOverride,
      isActive: fabrics.isActive,
      retailerSlug: retailers.slug,
      retailerName: retailers.name,
      retailerWebsiteUrl: retailers.websiteUrl,
      retailerNetwork: retailers.network,
      retailerNetworkMerchantId: retailers.networkMerchantId,
      retailerLogoUrl: retailers.logoUrl,
      retailerIsActive: retailers.isActive,
    })
    .from(fabrics)
    .leftJoin(retailers, eq(fabrics.retailerId, retailers.id))
    .where(eq(fabrics.id, fabricId))
    .limit(1);

  if (!row || !row.isAffiliate || !row.retailerId) {
    return notFoundResponse('Fabric not found.');
  }

  const retailer = {
    id: row.retailerId,
    slug: row.retailerSlug ?? '',
    name: row.retailerName ?? '',
    websiteUrl: row.retailerWebsiteUrl ?? '',
    network: row.retailerNetwork ?? 'awin',
    networkMerchantId: row.retailerNetworkMerchantId,
    logoUrl: row.retailerLogoUrl,
    isActive: row.retailerIsActive ?? false,
  };

  const fabric = {
    id: row.fabricId,
    deeplinkOverride: row.deeplinkOverride,
    retailerProductUrl: row.retailerProductUrl,
    retailerId: row.retailerId,
  };

  const target =
    fabric.deeplinkOverride ?? buildDeeplink(fabric, retailer);

  const ua = req.headers.get('user-agent') ?? '';
  const dnt = req.headers.get('dnt') === '1';
  const gpc = req.headers.get('sec-gpc') === '1';
  const isBot = BOT_UA_REGEX.test(ua);

  if (!isBot && !dnt && !gpc) {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '';
    const dailySalt =
      process.env.IP_HASH_SALT ??
      new Date().toISOString().slice(0, 10);
    const ipHash = createHash('sha256')
      .update(ip + dailySalt)
      .digest('hex');

    const referrer = req.headers.get('referer');

    db.insert(affiliateClicks)
      .values({
        fabricId: fabric.id,
        retailerId: retailer.id,
        userId: null,
        sessionId:
          req.headers
            .get('cookie')
            ?.match(/sessionId=([^;]+)/)?.[1] ?? null,
        referrerPath: referrer
          ? (() => { try { return new URL(referrer).pathname; } catch { return null; } })()
          : null,
        userAgent: ua.slice(0, 500),
        ipHash,
      })
      .catch((e) => console.error('[click-log] insert failed', e));
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: target,
      'Cache-Control': 'no-store, private',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}
