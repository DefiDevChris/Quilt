import { LAYOUT_PRESETS } from '@/lib/layout-library';
import { LAYOUT_TYPE_CARDS } from '@/lib/layout-type-cards';
import type { LayoutType } from '@/lib/layout-utils';

export type TemplateCategoryFilter = 'all' | 'traditional' | 'modern' | 'baby' | 'seasonal';
export type TemplateSubTab = 'library' | 'my-templates';

export const CATEGORIES: { readonly id: TemplateCategoryFilter; readonly label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'traditional', label: 'Traditional' },
  { id: 'modern', label: 'Modern' },
  { id: 'baby', label: 'Baby' },
  { id: 'seasonal', label: 'Seasonal' },
];

export const LAYOUT_FAMILIES: Array<{ readonly type: LayoutType; readonly cardIndex: number }> = [
  { type: 'grid', cardIndex: 0 },
  { type: 'sashing', cardIndex: 1 },
  { type: 'on-point', cardIndex: 2 },
  { type: 'medallion', cardIndex: 4 },
  { type: 'strippy', cardIndex: 3 },
];

export const DEFAULT_LAYOUT_FAMILY: LayoutType = 'grid';

export interface FreeformSizePreset {
  readonly id: string;
  readonly name: string;
  readonly width: number;
  readonly height: number;
  readonly description: string;
}

export const FREEFORM_SIZE_PRESETS: FreeformSizePreset[] = [
  { id: 'mini', name: 'Mini', width: 24, height: 24, description: 'Small wall hanging' },
  { id: 'lap', name: 'Lap', width: 50, height: 60, description: 'Classic lap quilt' },
  { id: 'twin', name: 'Twin', width: 65, height: 95, description: 'Twin bed' },
  { id: 'queen', name: 'Queen', width: 90, height: 100, description: 'Queen bed' },
  { id: 'king', name: 'King', width: 108, height: 100, description: 'King bed' },
];

export const FREEFORM_DIM_MIN = 12;
export const FREEFORM_DIM_MAX = 144;

export function getFamilyPresets(family: LayoutType) {
  return LAYOUT_PRESETS.filter((p) => p.category === family);
}

/**
 * Default preset id for a layout family. Prefers the family card's
 * `defaultPresetId` (curated choice) and falls back to the first preset in
 * `LAYOUT_PRESETS`. Used as the seed config when the user picks a family
 * in the flat family list — there is no longer a drill-down preset picker.
 */
export function getDefaultPreset(family: LayoutType): string {
  const card = LAYOUT_TYPE_CARDS.find((c) => c.id === family);
  if (card?.defaultPresetId) return card.defaultPresetId;
  const presets = getFamilyPresets(family);
  return presets[0]?.id ?? '';
}
