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
  retailerId: string | null;
  retailerName: string | null;
  affiliateUrl: string | null;
  affiliateDeeplink: string | null;
  pricePerYard: number | null;
  isActive: boolean;
}
