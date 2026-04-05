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
  isPurchasable: boolean;
  shopifyProductId: string | null;
  shopifyVariantId: string | null;
  pricePerYard: number | null;
  inStock: boolean;
  createdAt: Date;
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
  isPurchasable: boolean;
  shopifyProductId: string | null;
  shopifyVariantId: string | null;
  pricePerYard: number | null;
  inStock: boolean;
}
