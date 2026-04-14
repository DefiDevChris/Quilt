'use client';

import { useDesignerStore } from '@/stores/designerStore';
import { Z_INDEX } from '@/lib/design-system';

/**
 * RealisticRenderToggle — Toggle button for realistic rendering mode.
 *
 * Positioned in the canvas corner. When enabled, adds drop shadows,
 * stitch lines, and fabric texture jitter to the quilt preview.
 * Connected to designerStore.realisticMode.
 */
export function RealisticRenderToggle() {
  const realisticMode = useDesignerStore((s) => s.realisticMode);
  const setRealisticMode = useDesignerStore((s) => s.setRealisticMode);

  return (
    <button
      type="button"
      onClick={() => setRealisticMode(!realisticMode)}
      className={`
        absolute bottom-4 right-4 px-3 py-1.5 rounded-full text-xs font-medium
        border transition-colors duration-150 select-none
        ${
          realisticMode
            ? 'bg-[var(--color-primary)] text-[var(--color-text)] border-[var(--color-primary)]'
            : 'bg-[var(--color-surface)] text-[var(--color-text-dim)] border-[var(--color-border)] hover:bg-[var(--color-bg)]'
        }
      `}
      style={{ zIndex: Z_INDEX.overlay }}
      aria-pressed={realisticMode}
      aria-label="Toggle realistic rendering"
    >
      Realistic View
    </button>
  );
}
