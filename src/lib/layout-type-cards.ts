/**
 * Layout Type Card definitions for the LayoutSelector UI.
 *
 * Each card represents one of the 6 fundamental quilt layout types.
 * Cards display in the right-panel Layouts tab as stacked vertical items
 * that expand in-place when clicked to reveal an inline configuration form.
 */

export interface LayoutTypeCard {
  /** Matches the preset id prefix (e.g. 'grid', 'sashing') */
  id: string;
  /** Display name shown on the card */
  name: string;
  /** Icon emoji or identifier */
  icon: string;
  /** One-line description shown below the name */
  description: string;
  /** Whether this type supports sashing configuration */
  hasSashing: boolean;
  /** Whether this type supports cornerstones */
  hasCornerstones: boolean;
  /** Whether this type supports rows/cols configuration */
  hasGridConfig: boolean;
  /** Whether this type supports border configuration */
  hasBorders: boolean;
  /** Whether this type supports binding */
  hasBinding: boolean;
  /** Default preset id to use when applying this type */
  defaultPresetId: string;
}

export const LAYOUT_TYPE_CARDS: LayoutTypeCard[] = [
  {
    id: 'grid',
    name: 'Grid',
    icon: '📐',
    description: 'Simple rows × columns of evenly sized blocks',
    hasSashing: false,
    hasCornerstones: false,
    hasGridConfig: true,
    hasBorders: true,
    hasBinding: true,
    defaultPresetId: 'grid-4x4',
  },
  {
    id: 'sashing',
    name: 'Sashing',
    icon: '▤',
    description: 'Blocks separated by fabric strips',
    hasSashing: true,
    hasCornerstones: true,
    hasGridConfig: true,
    hasBorders: true,
    hasBinding: true,
    defaultPresetId: 'sashing-4x4',
  },
  {
    id: 'on-point',
    name: 'On-Point',
    icon: '◇',
    description: '45° rotated blocks with setting triangles',
    hasSashing: false,
    hasCornerstones: false,
    hasGridConfig: true,
    hasBorders: true,
    hasBinding: true,
    defaultPresetId: 'on-point-3x3',
  },
  {
    id: 'strippy',
    name: 'Strip',
    icon: '≡',
    description: 'Alternating block columns and fabric strips',
    hasSashing: true,
    hasCornerstones: false,
    hasGridConfig: true,
    hasBorders: false,
    hasBinding: true,
    defaultPresetId: 'strippy-4x3',
  },
  {
    id: 'medallion',
    name: 'Border + Center',
    icon: '⊞',
    description: 'Center block with concentric borders',
    hasSashing: false,
    hasCornerstones: false,
    hasGridConfig: false,
    hasBorders: true,
    hasBinding: true,
    defaultPresetId: 'medallion-1x1',
  },
  {
    id: 'free-form',
    name: 'Free-Form',
    icon: '✎',
    description: 'No layout fence — draw freely on the grid',
    hasSashing: false,
    hasCornerstones: false,
    hasGridConfig: false,
    hasBorders: false,
    hasBinding: false,
    defaultPresetId: 'free-form',
  },
];

export function getLayoutTypeCard(id: string): LayoutTypeCard | undefined {
  return LAYOUT_TYPE_CARDS.find((c) => c.id === id);
}
