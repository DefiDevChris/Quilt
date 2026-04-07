'use client';

import React from 'react';
import { STANDARD_BLOCK_SIZES } from '@/lib/quilt-sizing';
import { cn } from '@/lib/cn';

interface BlockSizePickerProps {
  value: number;
  onChange: (size: number) => void;
}

export function BlockSizePicker({ value, onChange }: BlockSizePickerProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {STANDARD_BLOCK_SIZES.map((size) => (
        <button
          key={size}
          type="button"
          onClick={() => onChange(size)}
          className={cn(
            'px-4 py-2 rounded-xl border text-sm font-medium transition-all duration-200',
            value === size
              ? 'bg-gradient-to-r from-orange-500 to-rose-400 text-white border-transparent shadow-lg'
              : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
          )}
        >
          {size}″ Block
        </button>
      ))}
    </div>
  );
}
