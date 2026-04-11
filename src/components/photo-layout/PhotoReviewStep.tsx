'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import type { DetectedPiece, ScaledPiece } from '@/lib/photo-layout-types';
import { requantizeDetectedPieces } from '@/lib/photo-layout-utils';
import { DEFAULT_QUANTIZER_CONFIG } from '@/lib/shape-quantizer-engine';

interface PhotoReviewStepProps {
  /** Source photo URL — shown under the pattern overlay. */
  originalImageUrl: string;
  /** Raw detected pieces (input to quantizer — needed for cheap re-quantize). */
  detectedPieces: readonly DetectedPiece[];
  /** Currently-quantized pieces on the inferred grid. */
  scaledPieces: readonly ScaledPiece[];
  /** Detection-resolution image size — required for scaling contour math. */
  imageWidthPx: number;
  imageHeightPx: number;
  /** Target canvas dimensions in inches (from photoLayoutStore). */
  targetWidthInches: number;
  targetHeightInches: number;
  /** Seam allowance in inches. */
  seamAllowance: number;
  /** Inferred base unit from the last quantization pass (display-only). */
  inferredUnitPx: number;
  /** Inferred rotation from the last quantization pass (display-only). */
  inferredRotationDeg: number;
  /** Cluster class count from the last pass (display-only). */
  classCount: number;
  /** Called after a re-quantize pass to hand new ScaledPieces back to the store. */
  onUpdateScaledPieces: (pieces: readonly ScaledPiece[]) => void;
  /** Triggers a full OpenCV re-scan (expensive). */
  onRescan: () => void;
  /** Called when the user confirms the pattern is ready. */
  onConfirm: () => void;
  /** Called when the user wants to go back to Scan Settings. */
  onBack: () => void;
}

type ViewMode = 'overlay' | 'outlines' | 'photo';

/**
 * Review & correction step. Shows the extracted outline pattern on top of
 * the source photo and offers tuning knobs (min area, unit override, rotation
 * offset) plus cheap re-quantization and a "delete selected" correction.
 *
 * Design notes:
 * - Kept the review step non-blocking. The Confirm button is the primary
 *   CTA and users can hit it immediately if the first scan looks fine.
 * - Preview is an SVG overlay for simple click-to-select and resolution
 *   independence. Rendering is purely a pattern (strokes only, no fills).
 * - "Re-snap" is the cheap path — re-runs only the quantizer on cached
 *   detected pieces with new settings. "Re-scan" goes all the way back to
 *   the CV worker with the full scan config.
 * - Undo stores a single prior snapshot so the user can A/B the last change.
 *
 * Not implemented (deferred — scope too large for this change):
 * - Vertex drag to fix individual wobbly edges
 * - Merge two adjacent pieces
 * - Split a piece along a line
 * The common correction needs — delete stray, rescan, retune — are covered.
 */
export function PhotoReviewStep(props: PhotoReviewStepProps) {
  const {
    originalImageUrl,
    detectedPieces,
    scaledPieces,
    imageWidthPx,
    imageHeightPx,
    targetWidthInches,
    targetHeightInches,
    seamAllowance,
    inferredUnitPx,
    inferredRotationDeg,
    classCount,
    onUpdateScaledPieces,
    onRescan,
    onConfirm,
    onBack,
  } = props;

  const [viewMode, setViewMode] = useState<ViewMode>('overlay');

  // Quantizer overrides. Start with "auto" — empty means use inferred value.
  const [unitOverridePx, setUnitOverridePx] = useState<number | null>(null);
  const [rotationOffsetDeg, setRotationOffsetDeg] = useState<number>(0);
  const [minAreaPx, setMinAreaPx] = useState<number>(DEFAULT_QUANTIZER_CONFIG.minAreaPx);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Undo history — single entry is enough for A/B.
  const previousScaledRef = useRef<readonly ScaledPiece[] | null>(null);

  // Derived: current class counts for the summary strip. The `key` field is
  // the unique cluster key (used for React reconciliation); `label` is the
  // display string, which is intentionally allowed to repeat across classes
  // for families like Right Triangles where multiple sizes may share a label.
  const currentClassCounts = useMemo(() => {
    const counts = new Map<string, { key: string; label: string; count: number }>();
    for (const p of scaledPieces) {
      const key = p.classKey ?? p.id;
      const label = p.classLabel ?? 'Piece';
      const existing = counts.get(key);
      if (existing) existing.count += 1;
      else counts.set(key, { key, label, count: 1 });
    }
    return Array.from(counts.values()).sort((a, b) => b.count - a.count);
  }, [scaledPieces]);

  const canUndo = previousScaledRef.current !== null;

  // --- Actions -----------------------------------------------------------

  const handleRequantize = useCallback(async () => {
    if (isBusy) return;
    setIsBusy(true);
    setMessage(null);
    try {
      previousScaledRef.current = scaledPieces;
      const result = await requantizeDetectedPieces(
        detectedPieces,
        imageWidthPx,
        imageHeightPx,
        targetWidthInches,
        targetHeightInches,
        seamAllowance,
        {
          unitOverridePx,
          rotationOffsetDeg,
          minAreaPx,
        }
      );
      onUpdateScaledPieces(result.scaledPieces);
      setSelectedIds(new Set());
      setMessage(
        `Re-quantized: ${result.scaledPieces.length} pieces, ${result.classCount} classes, u=${result.unitPx.toFixed(1)}px`
      );
    } catch (err) {
      console.error('[PhotoReview] re-quantize failed:', err);
      setMessage('Re-quantize failed. See console.');
    } finally {
      setIsBusy(false);
    }
  }, [
    isBusy,
    scaledPieces,
    detectedPieces,
    imageWidthPx,
    imageHeightPx,
    targetWidthInches,
    targetHeightInches,
    seamAllowance,
    unitOverridePx,
    rotationOffsetDeg,
    minAreaPx,
    onUpdateScaledPieces,
  ]);

  const handleUndo = useCallback(() => {
    if (!previousScaledRef.current) return;
    const prev = previousScaledRef.current;
    previousScaledRef.current = scaledPieces;
    onUpdateScaledPieces(prev);
    setSelectedIds(new Set());
    setMessage('Reverted to previous scan.');
  }, [scaledPieces, onUpdateScaledPieces]);

  const handleDeleteSelected = useCallback(() => {
    if (selectedIds.size === 0) return;
    previousScaledRef.current = scaledPieces;
    const next = scaledPieces.filter((p) => !selectedIds.has(p.id));
    onUpdateScaledPieces(next);
    setSelectedIds(new Set());
    setMessage(`Deleted ${scaledPieces.length - next.length} piece(s).`);
  }, [selectedIds, scaledPieces, onUpdateScaledPieces]);

  const togglePieceSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleResetOverrides = useCallback(() => {
    setUnitOverridePx(null);
    setRotationOffsetDeg(0);
    setMinAreaPx(DEFAULT_QUANTIZER_CONFIG.minAreaPx);
  }, []);

  // --- Preview: SVG overlay ----------------------------------------------

  const svgViewBox = `0 0 ${targetWidthInches} ${targetHeightInches}`;
  const strokeWidth = Math.max(0.02, targetWidthInches / 600);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-headline-sm font-semibold text-[var(--color-text)]">Review your pattern</h3>
        <p className="text-body-sm text-[var(--color-text-dim)] mt-1">
          We found <strong>{scaledPieces.length}</strong> pieces in <strong>{classCount}</strong>{' '}
          shape classes. Adjust if needed, or send straight to the studio.
        </p>
      </div>

      {/* View toggle */}
      <div className="flex gap-2" role="group" aria-label="Preview mode">
        {(['overlay', 'outlines', 'photo'] as ViewMode[]).map((mode) => (
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
            {mode === 'overlay' ? 'Overlay' : mode === 'outlines' ? 'Outlines only' : 'Photo only'}
          </button>
        ))}
      </div>

      {/* Preview surface */}
      <div className="relative rounded-lg overflow-hidden border border-[var(--color-border)] bg-[var(--color-bg)] aspect-[4/3]">
        {/* Source photo layer */}
        {viewMode !== 'outlines' && originalImageUrl && (
          <img
            src={originalImageUrl}
            alt="Source photo"
            className="absolute inset-0 w-full h-full object-contain"
            style={{ opacity: viewMode === 'overlay' ? 0.55 : 1 }}
          />
        )}

        {/* SVG pattern overlay */}
        {viewMode !== 'photo' && scaledPieces.length > 0 && (
          <svg
            viewBox={svgViewBox}
            preserveAspectRatio="xMidYMid meet"
            className="absolute inset-0 w-full h-full"
            aria-label="Extracted pattern preview"
          >
            {scaledPieces.map((piece) => {
              if (piece.contourInches.length < 3) return null;
              const points = piece.contourInches.map((p) => `${p.x},${p.y}`).join(' ');
              const isSelected = selectedIds.has(piece.id);
              return (
                <polygon
                  key={piece.id}
                  points={points}
                  fill={isSelected ? 'rgba(255,141,73,0.25)' : 'transparent'}
                  stroke={isSelected ? '#ff8d49' : 'var(--color-text)'}
                  strokeWidth={isSelected ? strokeWidth * 2 : strokeWidth}
                  strokeLinejoin="miter"
                  vectorEffect="non-scaling-stroke"
                  style={{ cursor: 'pointer' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePieceSelection(piece.id);
                  }}
                />
              );
            })}
          </svg>
        )}

        {scaledPieces.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-body-sm text-[var(--color-text-dim)]">
              No pieces extracted. Try adjusting scan settings and re-scanning.
            </p>
          </div>
        )}
      </div>

      {/* Class breakdown */}
      {currentClassCounts.length > 0 && (
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
          <p className="text-label-sm text-[var(--color-text-dim)] mb-2">Detected shape classes</p>
          <div className="flex flex-wrap gap-2">
            {currentClassCounts.slice(0, 12).map((c) => (
              <span
                key={c.key}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-bg)] border border-[var(--color-border)] text-label-xs text-[var(--color-text)]"
              >
                <span>{c.label}</span>
                <span className="text-[var(--color-text-dim)]">×{c.count}</span>
              </span>
            ))}
            {currentClassCounts.length > 12 && (
              <span className="text-label-xs text-[var(--color-text-dim)] px-2 py-1">
                +{currentClassCounts.length - 12} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Tuning controls */}
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-body-sm font-medium text-[var(--color-text)]">Fine-tune quantization</p>
          <button
            type="button"
            onClick={handleResetOverrides}
            className="text-label-xs text-[var(--color-text-dim)] hover:text-[#ff8d49] transition-colors duration-150"
          >
            Reset
          </button>
        </div>

        <div>
          <label className="block text-label-sm text-[var(--color-text)] mb-1">
            Base unit:{' '}
            {unitOverridePx !== null
              ? `${unitOverridePx.toFixed(0)} px (override)`
              : `${inferredUnitPx.toFixed(1)} px (auto)`}
          </label>
          <input
            type="range"
            min="4"
            max={Math.max(80, Math.round(inferredUnitPx * 2 || 80))}
            step="1"
            value={unitOverridePx ?? Math.round(inferredUnitPx)}
            onChange={(e) => setUnitOverridePx(Number(e.target.value))}
            className="w-full"
          />
          {unitOverridePx !== null && (
            <button
              type="button"
              onClick={() => setUnitOverridePx(null)}
              className="mt-1 text-label-xs text-[var(--color-text-dim)] hover:text-[#ff8d49]"
            >
              Use auto-inferred
            </button>
          )}
        </div>

        <div>
          <label className="block text-label-sm text-[var(--color-text)] mb-1">
            Rotation offset: {rotationOffsetDeg.toFixed(1)}° (auto {inferredRotationDeg.toFixed(1)}
            °)
          </label>
          <input
            type="range"
            min="-5"
            max="5"
            step="0.1"
            value={rotationOffsetDeg}
            onChange={(e) => setRotationOffsetDeg(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-label-sm text-[var(--color-text)] mb-1">
            Minimum piece area: {minAreaPx} px²
          </label>
          <input
            type="range"
            min="0"
            max="500"
            step="5"
            value={minAreaPx}
            onChange={(e) => setMinAreaPx(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <button
            type="button"
            onClick={handleRequantize}
            disabled={isBusy || detectedPieces.length === 0}
            className="px-4 py-2 rounded-full text-label-sm font-medium bg-[#ff8d49] text-[var(--color-text)] hover:bg-[#e67d3f] transition-colors duration-150 disabled:opacity-50"
          >
            {isBusy ? 'Re-snapping…' : 'Re-snap to grid'}
          </button>
          <button
            type="button"
            onClick={onRescan}
            disabled={isBusy}
            className="px-4 py-2 rounded-full text-label-sm font-medium border-2 border-[#ff8d49] text-[#ff8d49] hover:bg-[#ff8d49]/10 transition-colors duration-150 disabled:opacity-50"
          >
            Full re-scan
          </button>
          <button
            type="button"
            onClick={handleUndo}
            disabled={!canUndo}
            className="px-4 py-2 rounded-full text-label-sm font-medium border border-[var(--color-border)] text-[var(--color-text-dim)] hover:bg-[var(--color-border)] transition-colors duration-150 disabled:opacity-50"
          >
            Undo last change
          </button>
          <button
            type="button"
            onClick={handleDeleteSelected}
            disabled={selectedIds.size === 0}
            className="px-4 py-2 rounded-full text-label-sm font-medium border border-[var(--color-border)] text-[var(--color-text-dim)] hover:bg-[var(--color-border)] transition-colors duration-150 disabled:opacity-50"
          >
            Delete {selectedIds.size > 0 ? `(${selectedIds.size})` : 'selected'}
          </button>
        </div>

        {message && <p className="text-label-xs text-[var(--color-text-dim)] pt-1">{message}</p>}
      </div>

      {/* Action row */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2 rounded-full text-label-sm font-medium border border-[var(--color-border)] text-[var(--color-text-dim)] hover:bg-[var(--color-border)] transition-colors duration-150"
        >
          Back to settings
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={scaledPieces.length === 0}
          className="flex-1 bg-[#ff8d49] text-[var(--color-text)] px-6 py-3 rounded-full text-sm font-semibold hover:bg-[#e67d3f] transition-colors duration-150 shadow-[0_1px_2px_rgba(45,42,38,0.08)] disabled:opacity-50"
        >
          Send to Studio
        </button>
      </div>
    </div>
  );
}
