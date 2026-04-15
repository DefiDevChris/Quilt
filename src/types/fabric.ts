export interface FabricListItem {
  id: string;
  name: string;
  imageUrl: string;
  thumbnailUrl: string | null;
  manufacturer: string | null;
  sku: string | null;
  collection: string | null;
  colorFamily: string | null;
  value: string | null;
  hex: string | null;
  isDefault: boolean;
  // Shopify Integration Fields (feature-flagged)
  isPurchasable: boolean;
  shopifyProductId: string | null;
  shopifyVariantId: string | null;
  pricePerYard: number | null;
  inStock: boolean;
}

export interface ShopFabric {
  id: string;
  name: string;
  imageUrl: string;
  thumbnailUrl: string | null;
  manufacturer: string | null;
  collection: string | null;
  colorFamily: string | null;
  value: string | null;
  hex: string | null;
  pricePerYard: string | null;
  description: string | null;
  inStock: boolean;
  shopifyVariantId: string | null;
}
