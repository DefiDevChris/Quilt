'use client';

import { X } from 'lucide-react';

interface TapToPlaceIndicatorProps {
  itemName: string;
  onCancel: () => void;
  type: 'block' | 'fabric';
}

export function TapToPlaceIndicator({ itemName, onCancel, type }: TapToPlaceIndicatorProps) {
  const message =
    type === 'block'
      ? `Tap canvas to place ${itemName}`
      : `Tap a patch to fill with ${itemName}`;

  return (
    <div
      className="fixed top-20 left-1/2 -translate-x-1/2 z-50 glass-elevated border-white/60 rounded-full px-6 py-3 shadow-elevation-3 flex items-center gap-3"
      role="status"
      aria-live="polite"
    >
      <span className="text-on-surface text-sm font-semibold">{message}</span>
      <button
        type="button"
        onClick={onCancel}
        className="min-w-[44px] min-h-[44px] rounded-full hover:bg-surface-container transition-colors flex items-center justify-center"
        aria-label="Cancel selection"
      >
        <X size={16} className="text-secondary" />
      </button>
    </div>
  );
}
