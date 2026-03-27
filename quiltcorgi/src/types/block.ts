export interface Block {
  id: string;
  userId: string | null;
  name: string;
  category: string;
  subcategory: string | null;
  svgData: string;
  fabricJsData: Record<string, unknown> | null;
  tags: string[];
  isDefault: boolean;
  thumbnailUrl: string | null;
  createdAt: Date;
}

export interface BlockListItem {
  id: string;
  name: string;
  category: string;
  subcategory: string | null;
  tags: string[];
  thumbnailUrl: string | null;
  isDefault: boolean;
  isLocked: boolean;
}
