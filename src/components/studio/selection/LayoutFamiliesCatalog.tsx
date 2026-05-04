'use client';

import { LayoutThumbnail } from '@/components/layout/LayoutThumbnail';
import { LAYOUT_TYPE_CARDS } from '@/lib/layout-type-cards';
import type { LayoutType } from '@/lib/layout-utils';
import { LAYOUT_FAMILIES } from './layout-helpers';

interface LayoutFamiliesCatalogProps {
  readonly selectedFamily: LayoutType;
  readonly onFamilyClick: (family: LayoutType) => void;
}

/**
 * Flat list of all layout families (Grid, Sashing, On-Point, Medallion,
 * Strip). The currently selected family is highlighted with the primary
 * accent and the "applied" thumbnail tint; clicking a different card
 * swaps the family and seeds the right-rail config from that family's
 * curated default preset.
 *
 * No drill-down preset picker — preset selection has been folded into
 * the family selection so the user always sees layout settings on the
 * right and the canvas fence updates immediately.
 */
export function LayoutFamiliesCatalog({ selectedFamily, onFamilyClick }: LayoutFamiliesCatalogProps) {
  return (
    <>
      <div className="flex items-center px-4 py-3 border-b border-[var(--color-border)]/50 flex-shrink-0">
        <h2 className="text-[16px] font-semibold text-[var(--color-text)]">Layout Families</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-1 gap-3">
          {LAYOUT_FAMILIES.map(({ type, cardIndex }) => {
            const card = LAYOUT_TYPE_CARDS[cardIndex];
            const isSelected = type === selectedFamily;
            return (
              <button
                key={type}
                type="button"
                onClick={() => onFamilyClick(type)}
                aria-pressed={isSelected}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors text-left ${
                  isSelected
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                    : 'border-[var(--color-border)]/30 bg-[var(--color-bg)] hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-surface)]'
                }`}
              >
                <div className="w-14 h-14 flex-shrink-0 rounded-md overflow-hidden bg-[var(--color-bg)]">
                  <LayoutThumbnail type={type} rows={3} cols={3} className="w-full h-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3
                    className={`text-[14px] font-semibold truncate ${
                      isSelected ? 'text-[var(--color-primary)]' : 'text-[var(--color-text)]'
                    }`}
                  >
                    {card.name}
                  </h3>
                  <p className="text-[12px] text-[var(--color-text-dim)] line-clamp-2 mt-0.5">
                    {card.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
