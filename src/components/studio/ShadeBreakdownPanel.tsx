'use client';

import { useMemo } from 'react';
import { getRecentFabrics } from '@/lib/recent-fabrics';
import type { Shade, ShadeBreakdown } from '@/types/shade';

/** Shade visualization colors (match useShadeAssignment). */
const SHADE_SWATCH_COLORS: Record<Shade, string> = {
  dark: '#505050',
  light: '#E0E0E0',
  background: '#F5F5F5',
  unknown: '#CCCCCC',
};

const SHADE_LABELS: Record<Shade, string> = {
  dark: 'Dark',
  light: 'Light',
  background: 'Background',
  unknown: 'Unknown',
};

const SHADE_ORDER: readonly Shade[] = ['dark', 'light', 'background', 'unknown'];

interface ShadeBreakdownPanelProps {
  readonly breakdown: ShadeBreakdown;
  readonly onBulkApply: (shade: Shade) => void;
  readonly isApplying: boolean;
}

export function ShadeBreakdownPanel({
  breakdown,
  onBulkApply,
  isApplying,
}: ShadeBreakdownPanelProps) {
  const recentFabric = useMemo(() => {
    const recents = getRecentFabrics();
    return recents.length > 0 ? recents[0] : null;
  }, []);

  const visibleShades = useMemo(
    () => SHADE_ORDER.filter((shade) => breakdown[shade] > 0),
    [breakdown]
  );

  if (visibleShades.length === 0) return null;

  const truncatedName = recentFabric
    ? recentFabric.name.length > 15
      ? recentFabric.name.slice(0, 15) + '\u2026'
      : recentFabric.name
    : null;

  return (
    <div className="px-3 py-2 border-b border-neutral-200/40 bg-neutral flex-shrink-0">
      <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
        Shade Breakdown
      </p>

      <div className="flex flex-col gap-1">
        {visibleShades.map((shade) => (
          <div key={shade} className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span
                className="inline-block w-3 h-3 rounded-full border border-neutral-300/50 flex-shrink-0"
                style={{ backgroundColor: SHADE_SWATCH_COLORS[shade] }}
              />
              <span className="text-[11px] text-neutral-700">
                {SHADE_LABELS[shade]}
              </span>
              <span className="text-[10px] text-neutral-400">
                {breakdown[shade]}
              </span>
            </div>

            {recentFabric ? (
              <button
                type="button"
                disabled={isApplying}
                onClick={() => onBulkApply(shade)}
                className="rounded-full bg-primary/10 text-primary text-[10px] px-2 py-0.5 hover:bg-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isApplying ? 'Applying\u2026' : `Apply ${truncatedName}`}
              </button>
            ) : (
              <span className="text-[10px] text-neutral-400 italic">
                Select fabric first
              </span>
            )}
          </div>
        ))}
      </div>

      {!recentFabric && (
        <p className="text-[9px] text-neutral-400 mt-1.5">
          Drag a fabric onto the canvas first, then use these buttons to fill all matching patches.
        </p>
      )}
    </div>
  );
}
