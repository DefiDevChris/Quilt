'use client';

import React from 'react';
import { useProjectStore } from '@/stores/projectStore';

/**
 * Mode-selection modal — the first thing users see when creating a new project.
 *
 * Each mode card uses a hand-crafted SVG thumbnail (rather than an abstract
 * Lucide icon) so beginners can recognize the mode at a glance:
 *
 *   • Template — A finished quilt with fabrics filled in
 *   • Layout   — A grid with empty block outlines
 *   • Freeform — A blank canvas with dimension arrows
 *
 * The SVGs reuse the same DBEAFE / 93C5FD blueprint palette as
 * `LayoutThumbnail` / `TemplateThumbnail` so the modal feels of a piece
 * with the rest of the studio.
 */

const MODES = [
  {
    id: 'template' as const,
    label: 'Template',
    description: 'Start from a pre-made quilt with fabrics',
    Thumbnail: TemplateThumbnail,
  },
  {
    id: 'layout' as const,
    label: 'Layout',
    description: 'Choose a structure and fill it with blocks',
    Thumbnail: LayoutThumbnail,
  },
  {
    id: 'free-form' as const,
    label: 'Freeform',
    description: 'Blank canvas with full creative freedom',
    Thumbnail: FreeformThumbnail,
  },
] as const;

export function ProjectModeModal() {
  const setMode = useProjectStore((s) => s.setMode);

  const handleSelect = (mode: 'template' | 'layout' | 'free-form') => {
    setMode(mode);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-[var(--color-text)]/40" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="mode-modal-title"
        className="relative z-10 w-full max-w-2xl rounded-lg bg-[var(--color-surface)] p-8 shadow-elevated"
      >
        <h2
          id="mode-modal-title"
          className="mb-2 text-center text-2xl font-semibold text-[var(--color-text)]"
        >
          Choose Your Mode
        </h2>
        <p className="mb-6 text-center text-sm text-[var(--color-text-dim)]">
          How would you like to start designing?
        </p>

        <div className="grid grid-cols-3 gap-4">
          {MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => handleSelect(mode.id)}
              className="
                group flex flex-col items-center gap-3 rounded-lg border-2 border-transparent
                bg-[var(--color-bg)] p-4
                transition-colors duration-150
                hover:border-[var(--color-primary)] hover:bg-[var(--color-secondary)]
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]
              "
            >
              <div className="w-full aspect-square rounded-lg overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border)]/40">
                <mode.Thumbnail />
              </div>
              <div className="text-center">
                <div className="font-semibold text-[var(--color-text)]">{mode.label}</div>
                <div className="mt-1 text-xs leading-snug text-[var(--color-text-dim)]">
                  {mode.description}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────
 * Thumbnails — kept colocated with the modal so the visual language
 * lives next to the labels they accompany.
 * ────────────────────────────────────────────────────────────────── */

/**
 * Template — a 4×4 patchwork quilt with assorted fabric fills using the
 * brand's Easter-spring palette. Communicates "the design is already
 * filled in for you; just swap fabrics."
 */
function TemplateThumbnail() {
  // Palette draws from the CSS theme tokens (sky, secondary, accent
  // blush, accent yellow, surface). Hex values used here mirror what
  // those tokens resolve to so the SVG is self-contained for previews.
  const FABRICS = [
    '#7CB9E8', // primary sky
    '#C5DFF3', // secondary pale sky
    '#FFE08A', // accent buttercup
    '#F6C6C8', // accent blush
    '#EBF4FF', // tinted primary background
    '#FEFDFB', // bg
  ];
  // Deterministic seed so re-renders look identical
  const SEEDED_PATTERN = [
    [0, 1, 0, 1],
    [3, 4, 3, 2],
    [1, 0, 5, 0],
    [2, 3, 4, 3],
  ];

  const padding = 6;
  const viewBox = 120;
  const available = viewBox - padding * 2;
  const sashing = 1.5;
  const cellSize = (available - sashing * 5) / 4;

  return (
    <svg viewBox={`0 0 ${viewBox} ${viewBox}`} className="w-full h-full" aria-hidden="true">
      <rect
        x={padding - 2}
        y={padding - 2}
        width={available + 4}
        height={available + 4}
        rx="3"
        fill="#FEFDFB"
        stroke="#E6E1DC"
        strokeWidth="0.6"
      />
      {SEEDED_PATTERN.map((row, r) =>
        row.map((fabricIdx, c) => {
          const x = padding + sashing * (c + 1) + cellSize * c;
          const y = padding + sashing * (r + 1) + cellSize * r;
          return (
            <rect
              key={`${r}-${c}`}
              x={x}
              y={y}
              width={cellSize}
              height={cellSize}
              rx="0.8"
              fill={FABRICS[fabricIdx]}
              stroke="#7A726C"
              strokeOpacity="0.18"
              strokeWidth="0.4"
            />
          );
        }),
      )}
      {/* Subtle quilting stitch lines diagonally across two cells */}
      <path
        d={`M ${padding + 4} ${padding + 4} L ${padding + available - 4} ${padding + available - 4}`}
        stroke="#7A726C"
        strokeOpacity="0.12"
        strokeWidth="0.4"
        strokeDasharray="1.5 1.5"
      />
    </svg>
  );
}

/**
 * Layout — a 4×4 grid of empty block outlines on a sky-blue tinted
 * background. Communicates "structure first, fabrics later."
 */
function LayoutThumbnail() {
  const padding = 6;
  const viewBox = 120;
  const available = viewBox - padding * 2;
  const cellSize = available / 4;

  const cells: React.ReactNode[] = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const x = padding + c * cellSize + 2;
      const y = padding + r * cellSize + 2;
      const size = cellSize - 4;
      cells.push(
        <rect
          key={`${r}-${c}`}
          x={x}
          y={y}
          width={size}
          height={size}
          rx="1"
          fill="#FEFDFB"
          stroke="#7CB9E8"
          strokeWidth="0.8"
        />,
      );
      // Faint X marker hinting at "block placement here"
      cells.push(
        <g
          key={`x-${r}-${c}`}
          stroke="#C5DFF3"
          strokeWidth="0.5"
          strokeLinecap="round"
        >
          <line x1={x + 4} y1={y + 4} x2={x + size - 4} y2={y + size - 4} />
          <line x1={x + size - 4} y1={y + 4} x2={x + 4} y2={y + size - 4} />
        </g>,
      );
    }
  }

  return (
    <svg viewBox={`0 0 ${viewBox} ${viewBox}`} className="w-full h-full" aria-hidden="true">
      <rect
        x={padding - 2}
        y={padding - 2}
        width={available + 4}
        height={available + 4}
        rx="3"
        fill="#EBF4FF"
        stroke="#7CB9E8"
        strokeWidth="0.6"
        strokeDasharray="2 2"
      />
      {cells}
    </svg>
  );
}

/**
 * Freeform — an empty rectangular canvas with dimension arrows along
 * the top and left edges. Communicates "blank slate, you set the size."
 */
function FreeformThumbnail() {
  const viewBox = 120;
  // Inner empty canvas
  const canvasX = 22;
  const canvasY = 22;
  const canvasW = 78;
  const canvasH = 78;

  return (
    <svg viewBox={`0 0 ${viewBox} ${viewBox}`} className="w-full h-full" aria-hidden="true">
      {/* Outer page background */}
      <rect width={viewBox} height={viewBox} fill="#FEFDFB" />

      {/* Empty quilt canvas */}
      <rect
        x={canvasX}
        y={canvasY}
        width={canvasW}
        height={canvasH}
        rx="1"
        fill="#FFFFFF"
        stroke="#7CB9E8"
        strokeWidth="1"
      />

      {/* Dotted interior grid hint */}
      <g stroke="#C5DFF3" strokeWidth="0.4">
        <line x1={canvasX + canvasW / 3} y1={canvasY} x2={canvasX + canvasW / 3} y2={canvasY + canvasH} strokeDasharray="1 2" />
        <line x1={canvasX + (canvasW * 2) / 3} y1={canvasY} x2={canvasX + (canvasW * 2) / 3} y2={canvasY + canvasH} strokeDasharray="1 2" />
        <line x1={canvasX} y1={canvasY + canvasH / 3} x2={canvasX + canvasW} y2={canvasY + canvasH / 3} strokeDasharray="1 2" />
        <line x1={canvasX} y1={canvasY + (canvasH * 2) / 3} x2={canvasX + canvasW} y2={canvasY + (canvasH * 2) / 3} strokeDasharray="1 2" />
      </g>

      {/* Top dimension arrow (horizontal) */}
      <g stroke="#36312D" strokeWidth="0.7" fill="none" strokeLinecap="round">
        {/* Tick marks */}
        <line x1={canvasX} y1={canvasY - 6} x2={canvasX} y2={canvasY - 14} />
        <line x1={canvasX + canvasW} y1={canvasY - 6} x2={canvasX + canvasW} y2={canvasY - 14} />
        {/* Arrow line */}
        <line x1={canvasX + 1} y1={canvasY - 10} x2={canvasX + canvasW - 1} y2={canvasY - 10} />
        {/* Arrowheads */}
        <polyline points={`${canvasX + 4},${canvasY - 13} ${canvasX},${canvasY - 10} ${canvasX + 4},${canvasY - 7}`} />
        <polyline
          points={`${canvasX + canvasW - 4},${canvasY - 13} ${canvasX + canvasW},${canvasY - 10} ${canvasX + canvasW - 4},${canvasY - 7}`}
        />
      </g>

      {/* Left dimension arrow (vertical) */}
      <g stroke="#36312D" strokeWidth="0.7" fill="none" strokeLinecap="round">
        <line x1={canvasX - 6} y1={canvasY} x2={canvasX - 14} y2={canvasY} />
        <line x1={canvasX - 6} y1={canvasY + canvasH} x2={canvasX - 14} y2={canvasY + canvasH} />
        <line x1={canvasX - 10} y1={canvasY + 1} x2={canvasX - 10} y2={canvasY + canvasH - 1} />
        <polyline points={`${canvasX - 13},${canvasY + 4} ${canvasX - 10},${canvasY} ${canvasX - 7},${canvasY + 4}`} />
        <polyline
          points={`${canvasX - 13},${canvasY + canvasH - 4} ${canvasX - 10},${canvasY + canvasH} ${canvasX - 7},${canvasY + canvasH - 4}`}
        />
      </g>
    </svg>
  );
}
