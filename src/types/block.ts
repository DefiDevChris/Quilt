export interface BlockListItem {
  id: string;
  name: string;
  category: string;
  subcategory: string | null;
  tags: string[];
  thumbnailUrl: string | null;
  svgData: string | null;
  photoUrl: string | null;
  isDefault: boolean;
  widthIn: number;
  heightIn: number;
}

/** Full block shape returned by GET /api/blocks/[id]. */
export interface BlockDetail {
  id: string;
  name: string;
  category: string;
  subcategory: string | null;
  svgData: string;
  fabricJsData: Record<string, unknown> | null;
  tags: string[];
  isDefault: boolean;
}
