'use client';

import { EyeOff, Eye } from 'lucide-react';
import { useLayoutStore } from '@/stores/layoutStore';
import { TooltipHint } from '@/components/ui/TooltipHint';

/**
 * Toggle between edit mode (full fence visible, blocks selectable) and
 * preview mode (fence faded, blocks locked, WYSIWYG view).
 * Only visible when a layout has been applied.
 */
export function EditPreviewToggle() {
  const hasAppliedLayout = useLayoutStore((s) => s.hasAppliedLayout);
  const previewMode = useLayoutStore((s) => s.previewMode);

  if (!hasAppliedLayout) return null;

  return (
    <TooltipHint
      name={previewMode ? 'Switch to Edit Mode' : 'Switch to Preview Mode'}
      description={
        previewMode
          ? 'Show fence areas and enable editing'
          : 'Hide fence overlay for a clean preview'
      }
    >
      <button
        type="button"
        onClick={() => useLayoutStore.getState().setPreviewMode(!previewMode)}
        className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
          previewMode
            ? 'bg-primary/12 text-primary ring-1 ring-primary/30'
            : 'text-[var(--color-text-dim)]/50 hover:text-[var(--color-text)] hover:bg-[var(--color-border)]'
        }`}
        aria-label={previewMode ? 'Switch to edit mode' : 'Switch to preview mode'}
        aria-pressed={previewMode}
      >
        {previewMode ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </TooltipHint>
  );
}
