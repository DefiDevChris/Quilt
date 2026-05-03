'use client';

import { useLayoutStore } from '@/stores/layoutStore';
import { useProjectStore } from '@/stores/projectStore';

/**
 * Read-only chip showing the current mode and grid summary so the user
 * always knows which locked mode they are in.
 */
export function ModeChip() {
  const layoutType = useLayoutStore((s) => s.layoutType);
  const rows = useLayoutStore((s) => s.rows);
  const cols = useLayoutStore((s) => s.cols);
  const canvasWidth = useProjectStore((s) => s.canvasWidth);
  const canvasHeight = useProjectStore((s) => s.canvasHeight);
  const projectMode = useProjectStore((s) => s.mode);

  const sizeLabel = `${canvasWidth}″×${canvasHeight}″`;

  if (projectMode === 'free-form') {
    return (
      <span
        className="rounded-full border border-[var(--color-border)]/40 bg-[var(--color-surface)] px-3 py-1 text-[12px] leading-[18px] text-[var(--color-text)]/75"
        title={`Mode: Freeform · ${sizeLabel}`}
      >
        <span className="font-semibold text-[var(--color-text)]">Freeform</span>
        <span className="text-[var(--color-text-dim)]"> · {sizeLabel}</span>
      </span>
    );
  }

  if (projectMode === 'template') {
    return (
      <span
        className="rounded-full border border-[var(--color-border)]/40 bg-[var(--color-surface)] px-3 py-1 text-[12px] leading-[18px] text-[var(--color-text)]/75"
        title={`Mode: Template · ${sizeLabel}`}
      >
        <span className="font-semibold text-[var(--color-text)]">Template</span>
        <span className="text-[var(--color-text-dim)]"> · {sizeLabel}</span>
      </span>
    );
  }

  // Layout mode
  const MODE_LABELS: Record<string, string> = {
    'free-form': 'Free-form',
    medallion: 'Medallion',
    'on-point': 'On-point',
    strippy: 'Strippy',
    sashing: 'Sashing',
    grid: 'Grid',
  };
  const modeLabel = MODE_LABELS[layoutType] ?? 'Grid';
  const gridLabel = `${rows}×${cols}`;

  return (
    <span
      className="rounded-full border border-[var(--color-border)]/40 bg-[var(--color-surface)] px-3 py-1 text-[12px] leading-[18px] text-[var(--color-text)]/75"
      title={`Mode: Layout · ${modeLabel} · ${gridLabel} · ${sizeLabel}`}
    >
      <span className="font-semibold text-[var(--color-text)]">Layout</span>
      <span className="text-[var(--color-text-dim)]"> · {modeLabel} · {gridLabel}</span>
      <span className="text-[var(--color-text-dim)]"> · {sizeLabel}</span>
    </span>
  );
}
