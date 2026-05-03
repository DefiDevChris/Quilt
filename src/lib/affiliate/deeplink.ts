import type { Retailer } from './ingest/types';

interface FabricLike {
  id: string;
  deeplinkOverride: string | null;
  retailerProductUrl: string | null;
  retailerId: string | null;
}

export function buildDeeplink(fabric: FabricLike, retailer: Retailer): string {
  if (fabric.deeplinkOverride) return fabric.deeplinkOverride;

  if (!fabric.retailerProductUrl) {
    throw new Error(`no retailer product URL for fabric ${fabric.id}`);
  }

  const target = encodeURIComponent(fabric.retailerProductUrl);

  switch (retailer.network) {
    case 'awin': {
      if (!retailer.networkMerchantId || !process.env.AWIN_PUBLISHER_ID) {
        return fabric.retailerProductUrl;
      }
      return (
        `https://www.awin1.com/cread.php` +
        `?awinmid=${retailer.networkMerchantId}` +
        `&awinaffid=${process.env.AWIN_PUBLISHER_ID}` +
        `&ued=${target}`
      );
    }
    default:
      return fabric.retailerProductUrl;
  }
}
