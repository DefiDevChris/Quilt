'use client';

import { useMemo } from 'react';
import { BLOCK_GRID_PRESETS } from '@/lib/block-grid-presets';
import { buildCellPolygons } from '@/lib/grid-sampling-engine';
import type { BlockGridPreset, WarpedImageRef } from '@/lib/photo-layout-types';

interface LayoutPickerStepProps {
  /** Flattened block image produced by the calibration step. */
  warpedImage: WarpedImageRef;
  /** Real-world size of the flattened block in inches. */
  widthInches: number;
  heightInches: number;
  /** Currently selected preset. */
  selectedPreset: BlockGridPreset;
  /** Fired when the user taps a different preset thumbnail. */
  onSelectPreset: (preset: BlockGridPreset) => void;
  /** Fired when the user proceeds to color sampling. */
  onContinue: () => void;
  /** Fired when the user wants to re-calibrate. */
  onBack: () => void;
}

/**
 * Build a thumbnail-sized SVG overlay for a single preset. The grid lines
 * come straight from `buildCellPolygons` so the preview is identical to
 * what will actually be sampled in the next step.
 */
function PresetPreviewOverlay({
  preset,
  widthInches,
  heightInches,
}: {
  preset: BlockGridPreset;
  widthInches: number;
  heightInches: number;
}) {
  const polygons = useMemo(
    () => buildCellPolygons(preset, widthInches, heightInches),
    [preset, widthInches, heightInches]
  );

  return (
    <svg
      viewBox={`0 0 ${widthInches} ${heightInches}`}
      preserveAspectRatio="none"
      className="absolute inset-0 w-full h-full pointer-events-none"
    >
      {polygons.map((p) => (
        <polygon
          key={p.id}
          points={p.polygonInches.map((pt) => `${pt.x},${pt.y}`).join(' ')}
          fill="rgba(255, 141, 73, 0.08)"
          stroke="#ff8d49"
          strokeWidth={widthInches / 200}
          strokeLinejoin="miter"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}

/**
 * Step 2 of the perspective-first pipeline: the user picks a block-level
 * grid layout (4-Patch, 9-Patch, HST, ...) to overlay on the flattened
 * block from the calibration step.
 *
 * The live preview shows the warped image with the chosen grid drawn on
 * top so users can immediately tell whether the preset matches the real
 * block. All geometry is mathematical — no CV involvement anywhere.
 */
export function LayoutPickerStep(props: LayoutPickerStepProps) {
  const {
    warpedImage,
    widthInches,
    heightInches,
    selectedPreset,
    onSelectPreset,
    onContinue,
    onBack,
  } = props;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-headline-sm font-semibold text-[var(--color-text)]">
          Pick a block layout
        </h3>
        <p className="text-body-sm text-[var(--color-text-dim)] mt-1">
          Choose the grid that matches your block. We&apos;ll sample a fabric
          color for each patch on the next step.
        </p>
      </div>

      {/* Hero preview — big warped image with the selected grid overlaid */}
      <div
        className="relative mx-auto bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg overflow-hidden"
        style={{
          width: '100%',
          maxWidth: '480px',
          aspectRatio: `${widthInches} / ${heightInches}`,
        }}
      >
        <img
          src={warpedImage.url}
          alt="Flattened quilt block"
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />
        <PresetPreviewOverlay
          preset={selectedPreset}
          widthInches={widthInches}
          heightInches={heightInches}
        />
      </div>

      {/* Preset grid — clickable thumbnails */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {BLOCK_GRID_PRESETS.map((preset) => {
          const isSelected = preset.id === selectedPreset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelectPreset(preset)}
              className={`text-left rounded-lg border bg-[var(--color-surface)] overflow-hidden transition-colors duration-150 ${
                isSelected
                  ? 'border-[#ff8d49] shadow-[0_1px_2px_rgba(26,26,26,0.08)]'
                  : 'border-[var(--color-border)] hover:border-[#ff8d49]/60'
              }`}
            >
              <div
                className="relative w-full bg-[var(--color-bg)]"
                style={{ aspectRatio: '1 / 1' }}
              >
                <img
                  src={warpedImage.url}
                  alt=""
                  draggable={false}
                  className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none"
                />
                <PresetPreviewOverlay
                  preset={preset}
                  widthInches={widthInches}
                  heightInches={heightInches}
                />
              </div>
              <div className="p-2">
                <p className="text-label-sm font-medium text-[var(--color-text)]">
                  {preset.name}
                </p>
                <p className="text-label-xs text-[var(--color-text-dim)] line-clamp-2">
                  {preset.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2 rounded-full text-label-sm font-medium border border-[var(--color-border)] text-[var(--color-text-dim)] hover:bg-[var(--color-border)] transition-colors duration-150"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onContinue}
          className="flex-1 bg-[#ff8d49] text-[var(--color-text)] px-6 py-3 rounded-full text-sm font-semibold hover:bg-[#e67d3f] transition-colors duration-150 shadow-[0_1px_2px_rgba(26,26,26,0.08)]"
        >
          Sample colors
        </button>
      </div>
    </div>
  );
}
