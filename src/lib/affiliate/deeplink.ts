import type { Retailer } from './ingest/types';

interface FabricLike {
  id: string;
  deeplinkOverride: string | null;
  retailerProductUrl: string | null;
  retailerId: string | null;
  isInStockAtRetailer?: boolean | null;
}

export function buildDeeplink(fabric: FabricLike, retailer: Retailer): string {
  if (fabric.deeplinkOverride) return fabric.deeplinkOverride;

  // Out-of-stock: send to the retailer homepage instead of a dead product page.
  // The Awin cookie still gets set, so any purchase earns commission.
  const isOos = fabric.isInStockAtRetailer === false;
  const destination = isOos
    ? retailer.websiteUrl
    : (fabric.retailerProductUrl ?? retailer.websiteUrl);

  const target = encodeURIComponent(destination);

  switch (retailer.network) {
    case 'awin': {
      if (!retailer.networkMerchantId || !process.env.AWIN_PUBLISHER_ID) {
        return destination;
      }
      return (
        `https://www.awin1.com/cread.php` +
        `?awinmid=${retailer.networkMerchantId}` +
        `&awinaffid=${process.env.AWIN_PUBLISHER_ID}` +
        `&ued=${target}`
      );
    }
    default:
      return destination;
  }
}

