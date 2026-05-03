'use client';

import { Columns } from 'lucide-react';
import { useCanvasStore } from '@/stores/canvasStore';
import { TooltipHint } from '@/components/ui/TooltipHint';

/**
 * Toggle the side-by-side reference-photo panel in Photo-to-Quilt mode.
 * Only renders when a reference image has been uploaded.
 */
export function ReferenceImageToggle() {
  const referenceImageUrl = useCanvasStore((s) => s.referenceImageUrl);
  const showReferencePanel = useCanvasStore((s) => s.showReferencePanel);
  const setShowReferencePanel = useCanvasStore((s) => s.setShowReferencePanel);

  if (!referenceImageUrl) return null;

  return (
    <TooltipHint
      name={showReferencePanel ? 'Hide Reference Photo' : 'Show Reference Photo'}
      description="Side-by-side view of the original photo used in Photo to Design"
    >
      <button
        type="button"
        onClick={() => setShowReferencePanel(!showReferencePanel)}
        className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
          showReferencePanel
            ? 'bg-primary/12 text-primary ring-1 ring-primary/30'
            : 'text-[var(--color-text-dim)]/50 hover:text-[var(--color-text)] hover:bg-[var(--color-border)]'
        }`}
        aria-label={showReferencePanel ? 'Hide reference photo' : 'Show reference photo'}
        aria-pressed={showReferencePanel}
      >
        <Columns size={18} />
      </button>
    </TooltipHint>
  );
}
