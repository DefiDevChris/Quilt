export interface Fabric {
  id: string;
  userId: string | null;
  name: string;
  imageUrl: string;
  thumbnailUrl: string | null;
  manufacturer: string | null;
  sku: string | null;
  collection: string | null;
  colorFamily: string | null;
  scaleX: number;
  scaleY: number;
  rotation: number;
  isDefault: boolean;
  createdAt: Date;
  // Shopify Integration Fields (feature-flagged)
  isPurchasable: boolean;
  shopifyProductId: string | null;
  shopifyVariantId: string | null;
  pricePerYard: number | null;
  inStock: boolean;
}

export interface FabricListItem {
  id: string;
  name: string;
  imageUrl: string;
  thumbnailUrl: string | null;
  manufacturer: string | null;
  sku: string | null;
  collection: string | null;
  colorFamily: string | null;
  isDefault: boolean;
  // Shopify Integration Fields (feature-flagged)
  isPurchasable: boolean;
  shopifyProductId: string | null;
  shopifyVariantId: string | null;
  pricePerYard: number | null;
  inStock: boolean;
}
