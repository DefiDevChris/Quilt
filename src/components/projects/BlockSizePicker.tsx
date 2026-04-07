'use client';

import { STANDARD_BLOCK_SIZES, type StandardBlockSize } from '@/lib/quilt-sizing';

interface BlockSizePickerProps {
  readonly value: StandardBlockSize;
  readonly onChange: (size: StandardBlockSize) => void;
}

export function BlockSizePicker({ value, onChange }: BlockSizePickerProps) {
  return (
    <div role="radiogroup" aria-label="Block size" className="flex flex-wrap gap-2">
      {STANDARD_BLOCK_SIZES.map((size) => {
        const isActive = value === size;
        return (
          <button
            key={size}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(size)}
            className={
              isActive
                ? 'rounded-full bg-gradient-to-r from-orange-500 to-rose-400 px-4 py-1.5 text-sm font-semibold text-white shadow-elevation-1'
                : 'rounded-full bg-surface-container px-4 py-1.5 text-sm font-medium text-on-surface hover:bg-surface-container-high transition-colors'
            }
          >
            {size}″
          </button>
        );
      })}
    </div>
  );
}
