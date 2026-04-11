'use client';

import { useCallback, useMemo, useState } from 'react';
import type { GridCell, WarpedImageRef } from '@/lib/photo-layout-types';
import { buildFabricPalette } from '@/lib/grid-sampling-engine';

interface PhotoReviewStepProps {
  /** Flattened block image displayed behind the cell overlay. */
  warpedImage: WarpedImageRef;
  /** Grid cells with sampled colors from the layout step. */
  cells: readonly GridCell[];
  /** Real-world block size in inches — drives the SVG viewBox. */
  widthInches: number;
  heightInches: number;
  /** Fired when the user taps a cell to change its color. */
  onUpdateCellColor: (id: string, fabricColor: string, fabricId?: string | null) => void;
  /** Fired on Continue — the wizard creates a project + routes to studio. */
  onConfirm: () => void;
  /** Fired on Back — returns to the layout picker. */
  onBack: () => void;
}

type ViewMode = 'overlay' | 'pattern' | 'photo';

/**
 * Step 3 of the perspective-first pipeline: the user reviews the sampled
 * fabric colors and swaps any that look wrong.
 *
 * UI flow:
 *   1. The top preview shows the warped block (partially dimmed) with one
 *      filled polygon per `GridCell`.
 *   2. Clicking a cell reveals a color picker seeded with the current
 *      palette plus a free-form HTML color input.
 *   3. A legend at the bottom groups cells by color so the user can see at
 *      a glance which fabrics will end up in the print list.
 *
 * No tuning sliders — the grid is deterministic, so users only ever touch
 * colors, not geometry.
 */
export function PhotoReviewStep(props: PhotoReviewStepProps) {
  const {
    warpedImage,
    cells,
    widthInches,
    heightInches,
    onUpdateCellColor,
    onConfirm,
    onBack,
  } = props;

  const [viewMode, setViewMode] = useState<ViewMode>('overlay');
  const [selectedCellId, setSelectedCellId] = useState<string | null>(null);

  const palette = useMemo(() => buildFabricPalette(cells), [cells]);

  const selectedCell = useMemo(
    () => cells.find((c) => c.id === selectedCellId) ?? null,
    [cells, selectedCellId]
  );

  const handleCellClick = useCallback((id: string) => {
    setSelectedCellId((prev) => (prev === id ? null : id));
  }, []);

  const handlePaletteSwap = useCallback(
    (color: string) => {
      if (!selectedCellId) return;
      onUpdateCellColor(selectedCellId, color, null);
    },
    [selectedCellId, onUpdateCellColor]
  );

  const handleCustomColor = useCallback(
    (color: string) => {
      if (!selectedCellId) return;
      onUpdateCellColor(selectedCellId, color, null);
    },
    [selectedCellId, onUpdateCellColor]
  );

  const svgViewBox = `0 0 ${widthInches} ${heightInches}`;
  const strokeWidth = Math.max(0.02, widthInches / 300);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-headline-sm font-semibold text-[var(--color-text)]">
          Review your pattern
        </h3>
        <p className="text-body-sm text-[var(--color-text-dim)] mt-1">
          Tap any patch to change its color. {cells.length} patches in{' '}
          {palette.length} unique color{palette.length === 1 ? '' : 's'}.
        </p>
      </div>

      {/* View toggle */}
      <div className="flex gap-2" role="group" aria-label="Preview mode">
        {(['overlay', 'pattern', 'photo'] as ViewMode[]).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setViewMode(mode)}
            className={`px-4 py-2 rounded-full text-label-sm font-medium transition-colors duration-150 border ${
              viewMode === mode
                ? 'bg-[#ff8d49] text-[var(--color-text)] border-[#ff8d49]'
                : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-dim)] hover:bg-[var(--color-border)]'
            }`}
          >
            {mode === 'overlay' ? 'Overlay' : mode === 'pattern' ? 'Pattern only' : 'Photo only'}
          </button>
        ))}
      </div>

      {/* Preview surface */}
      <div
        className="relative mx-auto rounded-lg overflow-hidden border border-[var(--color-border)] bg-[var(--color-bg)]"
        style={{
          width: '100%',
          maxWidth: '480px',
          aspectRatio: `${widthInches} / ${heightInches}`,
        }}
      >
        {viewMode !== 'pattern' && (
          <img
            src={warpedImage.url}
            alt="Flattened block"
            draggable={false}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            style={{ opacity: viewMode === 'overlay' ? 0.4 : 1 }}
          />
        )}

        {viewMode !== 'photo' && cells.length > 0 && (
          <svg
            viewBox={svgViewBox}
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full"
            aria-label="Extracted pattern preview"
          >
            {cells.map((cell) => {
              if (cell.polygonInches.length < 3) return null;
              const points = cell.polygonInches
                .map((p) => `${p.x},${p.y}`)
                .join(' ');
              const isSelected = cell.id === selectedCellId;
              return (
                <polygon
                  key={cell.id}
                  points={points}
                  fill={viewMode === 'pattern' ? cell.fabricColor : `${cell.fabricColor}cc`}
                  stroke={isSelected ? '#1a1a1a' : '#1a1a1a55'}
                  strokeWidth={isSelected ? strokeWidth * 3 : strokeWidth}
                  strokeLinejoin="miter"
                  vectorEffect="non-scaling-stroke"
                  style={{ cursor: 'pointer' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCellClick(cell.id);
                  }}
                />
              );
            })}
          </svg>
        )}
      </div>

      {/* Color swap panel — appears when a cell is selected */}
      {selectedCell && (
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="inline-block w-6 h-6 rounded-lg border border-[var(--color-border)]"
                style={{ backgroundColor: selectedCell.fabricColor }}
                aria-hidden
              />
              <p className="text-body-sm font-medium text-[var(--color-text)]">
                Patch {selectedCell.id}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedCellId(null)}
              className="text-label-xs text-[var(--color-text-dim)] hover:text-[#ff8d49] transition-colors duration-150"
            >
              Close
            </button>
          </div>

          <div>
            <p className="text-label-sm text-[var(--color-text-dim)] mb-2">
              Swap to an existing color:
            </p>
            <div className="flex flex-wrap gap-2">
              {palette.map(({ color }) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handlePaletteSwap(color)}
                  className={`w-9 h-9 rounded-full border-2 transition-transform duration-150 ${
                    color === selectedCell.fabricColor
                      ? 'border-[#ff8d49]'
                      : 'border-[var(--color-border)] hover:border-[#ff8d49]/60'
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Use color ${color}`}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="text-label-sm text-[var(--color-text-dim)] block mb-1">
              Or pick a custom color:
            </label>
            <input
              type="color"
              value={selectedCell.fabricColor}
              onChange={(e) => handleCustomColor(e.target.value)}
              className="w-16 h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] cursor-pointer"
              aria-label="Custom color"
            />
          </div>
        </div>
      )}

      {/* Palette legend */}
      {palette.length > 0 && (
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
          <p className="text-label-sm text-[var(--color-text-dim)] mb-2">Fabric palette</p>
          <div className="flex flex-wrap gap-2">
            {palette.map(({ color, count }) => (
              <span
                key={color}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-bg)] border border-[var(--color-border)] text-label-xs text-[var(--color-text)]"
              >
                <span
                  className="inline-block w-3 h-3 rounded-full border border-[var(--color-border)]"
                  style={{ backgroundColor: color }}
                  aria-hidden
                />
                <span>{color}</span>
                <span className="text-[var(--color-text-dim)]">×{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Action row */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2 rounded-full text-label-sm font-medium border border-[var(--color-border)] text-[var(--color-text-dim)] hover:bg-[var(--color-border)] transition-colors duration-150"
        >
          Back to layout
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={cells.length === 0}
          className="flex-1 bg-[#ff8d49] text-[var(--color-text)] px-6 py-3 rounded-full text-sm font-semibold hover:bg-[#e67d3f] transition-colors duration-150 shadow-[0_1px_2px_rgba(26,26,26,0.08)] disabled:opacity-50"
        >
          Send to Studio
        </button>
      </div>
    </div>
  );
}
