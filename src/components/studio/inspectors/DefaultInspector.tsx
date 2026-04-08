'use client';

import { useLayoutStore } from '@/stores/layoutStore';

/**
 * The "nothing selected" inspector.
 * Quilt-level controls (dimensions, grid) have been moved to the top bar
 * dropdown for better accessibility. This inspector now shows a simple
 * hint directing users there, plus layout status info.
 */
export function DefaultInspector() {
  const layoutType = useLayoutStore((s) => s.layoutType);

  return (
    <div className="p-3 space-y-4">
      {/* ── Hint: Quilt controls moved to top bar ────────────── */}
      <section className="rounded-lg bg-primary-container/30 p-3 border border-primary/20">
        <p className="text-xs text-on-surface mb-1 font-medium">Quilt Settings</p>
        <p className="text-xs text-secondary">
          Adjust quilt dimensions and grid settings from the{' '}
          <span className="font-medium">Quilt</span> dropdown in the top bar.
        </p>
      </section>

      {/* ── Hint when no layout is set ─────────────────────── */}
      {(layoutType === 'none' || layoutType === 'free-form') && (
        <section className="rounded-lg bg-primary-container/30 p-3 border border-primary/20">
          <p className="text-xs text-on-surface mb-1 font-medium">Add a layout</p>
          <p className="text-xs text-secondary">
            Pick a layout from the <span className="font-medium">Layouts</span> tab above to drop a
            grid onto your quilt. Blocks will snap into the layout cells.
          </p>
        </section>
      )}
    </div>
  );
}
