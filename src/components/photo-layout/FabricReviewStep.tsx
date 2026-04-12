'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePhotoLayoutStore } from '@/stores/photoLayoutStore';
import { useFabricStore } from '@/stores/fabricStore';
import type { FabricListItem } from '@/types/fabric';
import type { WarpedImageRef } from '@/lib/photo-layout-types';
import {
  segmentQuilt,
  type SegmentationResult,
  type SegmentOptions,
} from '@/lib/quilt-segmentation-engine';
import { regularizeSegmentation } from '@/lib/shape-regularize';
import { matchFabricToColor, type FabricMatchCandidate } from '@/lib/fabric-match';
import { COLORS, SHADOW, MOTION } from '@/lib/design-system';

interface FabricReviewStepProps {
  /** Flattened block image produced by the calibration step. */
  warpedImage: WarpedImageRef;
  /** Raw ImageData of the warped block — feeds the segmentation engine. */
  warpedBitmap: ImageData | null;
  /** Real-world block size in inches — drives the SVG viewBox. */
  widthInches: number;
  heightInches: number;
  /** Fired on Continue — the wizard creates a project + routes to studio. */
  onConfirm: () => void;
  /** Fired on Back — returns to the calibration step. */
  onBack: () => void;
}

type ViewMode = 'overlay' | 'pattern' | 'photo';

const MIN_FABRICS = 2;
const MAX_FABRICS = 12;
const SEGMENTATION_SEED = 1;

/**
 * Step 3 of the fabric-first pipeline: the user picks how many fabrics
 * to resolve the block into, swaps colors for any patch, and ships the
 * resulting pattern to the studio.
 *
 * Re-runs `segmentQuilt` whenever the fabric-count slider moves (200ms
 * debounce). Never touches geometry — only clustering + simplification.
 */
export function FabricReviewStep(props: FabricReviewStepProps) {
  const { warpedImage, warpedBitmap, widthInches, heightInches, onConfirm, onBack } = props;

  const fabricCount = usePhotoLayoutStore((s) => s.fabricCount);
  const setFabricCount = usePhotoLayoutStore((s) => s.setFabricCount);
  const segmentation = usePhotoLayoutStore((s) => s.segmentation);
  const setSegmentation = usePhotoLayoutStore((s) => s.setSegmentation);
  const patchOverrides = usePhotoLayoutStore((s) => s.patchOverrides);
  const setPatchOverride = usePhotoLayoutStore((s) => s.setPatchOverride);
  const clearPatchOverrides = usePhotoLayoutStore((s) => s.clearPatchOverrides);

  const [viewMode, setViewMode] = useState<ViewMode>('overlay');
  const [selectedPatchId, setSelectedPatchId] = useState<string | null>(null);
  const [isSegmenting, setIsSegmenting] = useState(false);

  // Pull the user's fabric library so the review UI can suggest matches
  // and let them swap a patch to a real fabric from their collection.
  const fabrics = useFabricStore((s) => s.fabrics);
  const userFabrics = useFabricStore((s) => s.userFabrics);
  const fetchFabrics = useFabricStore((s) => s.fetchFabrics);
  const fetchUserFabrics = useFabricStore((s) => s.fetchUserFabrics);

  useEffect(() => {
    if (fabrics.length === 0) fetchFabrics();
    if (userFabrics.length === 0) fetchUserFabrics();
    // Only fire once on mount — the store dedupes parallel calls internally.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fabricCandidates = useMemo<FabricMatchCandidate[]>(() => {
    const all: FabricListItem[] = [...userFabrics, ...fabrics];
    return all
      .filter(
        (f): f is FabricListItem & { hex: string } => typeof f.hex === 'string' && f.hex.length > 0
      )
      .map((f) => ({ id: f.id, hex: f.hex }));
  }, [fabrics, userFabrics]);

  const fabricsById = useMemo(() => {
    const m = new Map<string, FabricListItem>();
    for (const f of userFabrics) m.set(f.id, f);
    for (const f of fabrics) if (!m.has(f.id)) m.set(f.id, f);
    return m;
  }, [fabrics, userFabrics]);

  // Run the fabric-first segmentation any time the warped bitmap, fabric
  // count, or library changes. The first run shows a spinner; later runs
  // happen in the background so the slider stays responsive.
  const isInitialRun = useRef(true);
  const segRunId = useRef(0);
  useEffect(() => {
    if (!warpedBitmap) return;
    const runId = ++segRunId.current;

    const runSegment = () => {
      if (runId !== segRunId.current) return;
      if (isInitialRun.current) setIsSegmenting(true);
      const nonNullCandidates = fabricCandidates.filter(
        (c): c is { id: string; hex: string } => typeof c.hex === 'string'
      );
      const opts: SegmentOptions = {
        fabricCount,
        libraryCandidates: nonNullCandidates,
        seed: SEGMENTATION_SEED,
      };
      const raw: SegmentationResult = segmentQuilt(warpedBitmap, opts);
      // Regularize: classify rects/right triangles, group by shape,
      // average canonical dims, and snap all vertices to a 0.5" inch
      // grid relative to the block's warped footprint. The Review UI
      // renders this result directly — what the user approves is what
      // the studio imports.
      const pxPerInch = raw.width > 0 ? raw.width / Math.max(widthInches, 1e-6) : 0;
      const result =
        pxPerInch > 0 ? regularizeSegmentation(raw, { pxPerInch, snapIncrementInches: 0.5 }) : raw;
      if (runId !== segRunId.current) return;
      setSegmentation(result);
      setIsSegmenting(false);
      isInitialRun.current = false;
    };

    // Debounce slider-driven re-runs by 200 ms. The first run fires
    // immediately so the user sees something fast on step entry.
    if (isInitialRun.current) {
      runSegment();
    } else {
      const handle = setTimeout(runSegment, 200);
      return () => clearTimeout(handle);
    }
  }, [warpedBitmap, fabricCount, fabricCandidates, widthInches, setSegmentation]);

  // Effective color for a patch — either the user's override or the
  // cluster color from the current segmentation.
  const patchColor = useCallback(
    (patchId: string, clusterIndex: number): string => {
      const override = patchOverrides[patchId];
      if (override) return override.hex;
      const cluster = segmentation?.palette.find((c) => c.index === clusterIndex);
      return cluster?.hex ?? '#d4ccc4';
    },
    [patchOverrides, segmentation]
  );

  const selectedPatch = useMemo(() => {
    if (!selectedPatchId || !segmentation) return null;
    return segmentation.patches.find((p) => p.id === selectedPatchId) ?? null;
  }, [selectedPatchId, segmentation]);

  const selectedPatchHex = selectedPatch
    ? patchColor(selectedPatch.id, selectedPatch.clusterIndex)
    : null;

  // Top 6 fabric suggestions for the selected patch, ranked by LAB
  // distance — each is a real library entry the user can tap to pin.
  const suggestedFabrics = useMemo<FabricListItem[]>(() => {
    if (!selectedPatch || !selectedPatchHex || fabricCandidates.length === 0) return [];
    const ranked = fabricCandidates
      .map((c) => {
        const m = matchFabricToColor(selectedPatchHex, [c]);
        return { id: c.id, distance: m.distance };
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 6)
      .map((r) => fabricsById.get(r.id))
      .filter((f): f is FabricListItem => f !== undefined);
    return ranked;
  }, [selectedPatch, selectedPatchHex, fabricCandidates, fabricsById]);

  // Prune overrides whose patch id no longer exists (re-segmenting can
  // invalidate them). Run after every segmentation update.
  useEffect(() => {
    if (!segmentation) return;
    const validIds = new Set(segmentation.patches.map((p) => p.id));
    const keys = Object.keys(patchOverrides);
    const stale = keys.filter((k) => !validIds.has(k));
    if (stale.length === keys.length && stale.length > 0) {
      clearPatchOverrides();
    }
    // If only some are stale, leave them — the user can still see the
    // valid ones; the stale ones simply won't render anywhere.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segmentation]);

  const handlePatchClick = useCallback((id: string) => {
    setSelectedPatchId((prev) => (prev === id ? null : id));
  }, []);

  const handlePaletteSwap = useCallback(
    (hex: string) => {
      if (!selectedPatchId) return;
      setPatchOverride(selectedPatchId, hex, null);
    },
    [selectedPatchId, setPatchOverride]
  );

  const handleCustomColor = useCallback(
    (hex: string) => {
      if (!selectedPatchId) return;
      setPatchOverride(selectedPatchId, hex, null);
    },
    [selectedPatchId, setPatchOverride]
  );

  const handleFabricPick = useCallback(
    (fabric: FabricListItem) => {
      if (!selectedPatchId || !fabric.hex) return;
      setPatchOverride(selectedPatchId, fabric.hex, fabric.id);
    },
    [selectedPatchId, setPatchOverride]
  );

  // Compute the palette legend with effective colors (i.e. overrides
  // collapse into the same legend entry).
  const paletteLegend = useMemo(() => {
    if (!segmentation) return [];
    const total = segmentation.palette.reduce((s, c) => s + c.pixelCount, 0) || 1;
    return segmentation.palette.map((cluster) => ({
      index: cluster.index,
      hex: cluster.hex,
      pixelCount: cluster.pixelCount,
      percent: Math.round((cluster.pixelCount / total) * 100),
      libraryFabric: cluster.libraryFabricId ? fabricsById.get(cluster.libraryFabricId) : undefined,
    }));
  }, [segmentation, fabricsById]);

  // Use the warped image's pixel dimensions for the overlay viewBox so
  // polygon coordinates (which are in warped-image pixels) land in place.
  const svgViewBox = `0 0 ${warpedImage.width} ${warpedImage.height}`;
  const strokeWidth = Math.max(1, warpedImage.width / 400);

  const patches = segmentation?.patches ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-headline-sm font-semibold text-[var(--color-text)]">
          Review your pattern
        </h3>
        <p className="text-body-sm text-[var(--color-text-dim)] mt-1">
          Drag the Fabrics slider to pick how many colors this block should collapse into. Tap any
          patch to change its color.
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
                ? ''
                : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-dim)]'
            }`}
            style={
              viewMode === mode
                ? {
                    backgroundColor: COLORS.primary,
                    color: COLORS.text,
                    borderColor: COLORS.primary,
                  }
                : undefined
            }
          >
            {mode === 'overlay' ? 'Overlay' : mode === 'pattern' ? 'Pattern only' : 'Photo only'}
          </button>
        ))}
      </div>

      {/* Preview + palette */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4">
        {/* Preview surface */}
        <div
          className="relative mx-auto w-full rounded-lg overflow-hidden border border-[var(--color-border)] bg-[var(--color-bg)]"
          style={{
            maxWidth: '520px',
            aspectRatio: `${widthInches} / ${heightInches}`,
          }}
        >
          {viewMode !== 'pattern' && (
            <img
              src={warpedImage.url}
              alt="Flattened block"
              draggable={false}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              style={{ opacity: viewMode === 'overlay' ? 0.35 : 1 }}
            />
          )}

          {viewMode !== 'photo' && patches.length > 0 && (
            <svg
              viewBox={svgViewBox}
              preserveAspectRatio="none"
              className="absolute inset-0 w-full h-full"
              aria-label="Detected pattern preview"
            >
              {patches.map((patch) => {
                if (patch.polygonPx.length < 3) return null;
                const points = patch.polygonPx.map((p) => `${p.x},${p.y}`).join(' ');
                const isSelected = patch.id === selectedPatchId;
                const color = patchColor(patch.id, patch.clusterIndex);
                const fill = viewMode === 'pattern' ? color : `${color}cc`;
                return (
                  <polygon
                    key={patch.id}
                    points={points}
                    fill={fill}
                    stroke={isSelected ? COLORS.text : `${COLORS.text}55`}
                    strokeWidth={isSelected ? strokeWidth * 2 : strokeWidth}
                    strokeLinejoin="miter"
                    vectorEffect="non-scaling-stroke"
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePatchClick(patch.id);
                    }}
                  />
                );
              })}
            </svg>
          )}

          {isSegmenting && (
            <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-surface)]/80 backdrop-blur-sm">
              <div className="text-body-sm text-[var(--color-text-dim)] animate-pulse">
                Analyzing fabrics…
              </div>
            </div>
          )}
        </div>

        {/* Palette + slider column */}
        <div className="flex flex-col gap-3">
          {/* Slider */}
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="fabric-count-slider"
                className="text-label-sm font-medium text-[var(--color-text)]"
              >
                Fabrics
              </label>
              <span
                className="text-label-sm font-semibold tabular-nums"
                style={{ color: COLORS.primary }}
              >
                {fabricCount}
              </span>
            </div>
            <input
              id="fabric-count-slider"
              type="range"
              min={MIN_FABRICS}
              max={MAX_FABRICS}
              step={1}
              value={fabricCount}
              onChange={(e) => setFabricCount(Number(e.target.value))}
              className="w-full"
              style={{ accentColor: COLORS.primary }}
              data-testid="fabric-count-slider"
            />
            <div className="mt-1 flex justify-between text-label-xs text-[var(--color-text-dim)] tabular-nums">
              <span>{MIN_FABRICS}</span>
              <span>{MAX_FABRICS}</span>
            </div>
          </div>

          {/* Palette entries */}
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 space-y-2">
            <p className="text-label-sm text-[var(--color-text-dim)]">
              Palette ({paletteLegend.length})
            </p>
            {paletteLegend.map((entry) => (
              <div
                key={entry.index}
                className="flex items-center gap-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] p-2"
              >
                <span
                  className="inline-block w-6 h-6 rounded-full border border-[var(--color-border)] flex-shrink-0"
                  style={{ backgroundColor: entry.hex }}
                  aria-hidden
                />
                <div className="flex-1 min-w-0">
                  <p className="text-label-xs font-medium text-[var(--color-text)] truncate">
                    {entry.hex}
                    <span className="text-[var(--color-text-dim)] font-normal">
                      {' '}
                      · {entry.percent}%
                    </span>
                  </p>
                  {entry.libraryFabric && (
                    <p className="text-label-xs text-[var(--color-text-dim)] truncate">
                      → {entry.libraryFabric.name}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {paletteLegend.length === 0 && (
              <p className="text-label-xs text-[var(--color-text-dim)] italic">
                Segmentation pending…
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Color swap panel — appears when a patch is selected */}
      {selectedPatch && selectedPatchHex && (
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="inline-block w-6 h-6 rounded-lg border border-[var(--color-border)]"
                style={{ backgroundColor: selectedPatchHex }}
                aria-hidden
              />
              <p className="text-body-sm font-medium text-[var(--color-text)]">
                {selectedPatch.id}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedPatchId(null)}
              className="text-label-xs text-[var(--color-text-dim)]"
              style={{
                transition: `color ${MOTION.transitionDuration}ms ${MOTION.transitionEasing}`,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = COLORS.primary)}
              onMouseLeave={(e) => (e.currentTarget.style.color = '')}
            >
              Close
            </button>
          </div>

          {suggestedFabrics.length > 0 && (
            <div>
              <p className="text-label-sm text-[var(--color-text-dim)] mb-2">
                Closest fabrics from your library:
              </p>
              <div className="grid grid-cols-3 gap-2">
                {suggestedFabrics.map((fabric) => {
                  const override = patchOverrides[selectedPatch.id];
                  const isSelected = override?.fabricId === fabric.id;
                  return (
                    <button
                      key={fabric.id}
                      type="button"
                      onClick={() => handleFabricPick(fabric)}
                      className={`rounded-lg border overflow-hidden text-left bg-[var(--color-bg)] transition-colors duration-150 ${
                        isSelected ? '' : 'border-[var(--color-border)]'
                      }`}
                      style={
                        isSelected
                          ? { borderColor: COLORS.primary, boxShadow: SHADOW.brand }
                          : undefined
                      }
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.borderColor = `${COLORS.primary}99`;
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.borderColor = '';
                      }}
                      aria-label={`Use fabric ${fabric.name}`}
                    >
                      <div
                        className="w-full h-10"
                        style={{ backgroundColor: fabric.hex ?? '#d4ccc4' }}
                        aria-hidden
                      />
                      <div className="p-1.5">
                        <p className="text-label-xs font-medium text-[var(--color-text)] truncate">
                          {fabric.name}
                        </p>
                        {fabric.manufacturer && (
                          <p className="text-label-xs text-[var(--color-text-dim)] truncate">
                            {fabric.manufacturer}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <p className="text-label-sm text-[var(--color-text-dim)] mb-2">
              Swap to an existing color:
            </p>
            <div className="flex flex-wrap gap-2">
              {paletteLegend.map((entry) => (
                <button
                  key={entry.index}
                  type="button"
                  onClick={() => handlePaletteSwap(entry.hex)}
                  className={`w-9 h-9 rounded-full border-2 transition-colors duration-150 ${
                    entry.hex === selectedPatchHex ? '' : 'border-[var(--color-border)]'
                  }`}
                  style={{
                    backgroundColor: entry.hex,
                    borderColor: entry.hex === selectedPatchHex ? COLORS.primary : '',
                  }}
                  onMouseEnter={(e) => {
                    if (entry.hex !== selectedPatchHex)
                      e.currentTarget.style.borderColor = `${COLORS.primary}99`;
                  }}
                  onMouseLeave={(e) => {
                    if (entry.hex !== selectedPatchHex) e.currentTarget.style.borderColor = '';
                  }}
                  aria-label={`Use color ${entry.hex}`}
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
              value={selectedPatchHex}
              onChange={(e) => handleCustomColor(e.target.value)}
              className="w-16 h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] cursor-pointer"
              aria-label="Custom color"
            />
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
          Back to calibrate
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={patches.length === 0}
          data-testid="send-to-studio-button"
          className="flex-1 px-6 py-3 rounded-full text-sm font-semibold text-[var(--color-text)] disabled:opacity-50"
          style={{
            backgroundColor: COLORS.primary,
            boxShadow: SHADOW.brand,
            transition: `background-color ${MOTION.transitionDuration}ms ${MOTION.transitionEasing}`,
          }}
          onMouseEnter={(e) => {
            if (patches.length > 0) e.currentTarget.style.backgroundColor = '#e67d3f';
          }}
          onMouseLeave={(e) => {
            if (patches.length > 0) e.currentTarget.style.backgroundColor = COLORS.primary;
          }}
        >
          Send to Studio
        </button>
      </div>
    </div>
  );
}
