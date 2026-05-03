export interface RawProduct {
  externalId: string;
  externalUrl: string;
  affiliateDeeplink?: string;
  name: string;
  description?: string;
  imageUrl: string;
  price: number;
  currency?: string;
  brand?: string;
  category?: string;
  colour?: string;
  inStock: boolean;
  sku?: string;
}

export interface NormalizedFabric {
  name: string;
  imageUrl: string;
  description?: string;
  manufacturer: string | null;
  collection: string | null;
  colorFamily: string | null;
  pricePerYard: number;
  retailerProductSku: string;
  retailerProductUrl: string;
  deeplinkOverride: string | null;
  isInStockAtRetailer: boolean;
}

export interface Retailer {
  id: string;
  slug: string;
  name: string;
  websiteUrl: string;
  network: string;
  networkMerchantId: string | null;
  logoUrl: string | null;
  isActive: boolean;
}

export interface SourceAdapter {
  readonly sourceType: 'awin-feed' | 'scrapingbee' | 'csv';
  fetchProducts(): AsyncIterable<RawProduct>;
}
