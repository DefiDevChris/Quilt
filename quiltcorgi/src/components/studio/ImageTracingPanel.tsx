'use client';

import { useRef, useState, useCallback } from 'react';
import { useReferenceImage } from '@/hooks/useReferenceImage';
import { useCanvasStore } from '@/stores/canvasStore';
import { ACCEPTED_IMAGE_TYPES } from '@/lib/constants';

const ACCEPTED_TYPES_STRING = ACCEPTED_IMAGE_TYPES.join(',');

const MIN_OPACITY_PERCENT = 10;
const MAX_OPACITY_PERCENT = 100;

function percentToOpacity(percent: number): number {
  return percent / 100;
}

function opacityToPercent(opacity: number): number {
  return Math.round(opacity * 100);
}

export function ImageTracingPanel() {
  const {
    hasImage,
    isVisible,
    isLocked,
    importImage,
    removeImage,
    setOpacity,
    toggleVisibility,
    toggleLock,
    fitToCanvas,
  } = useReferenceImage();

  const referenceImageOpacity = useCanvasStore((s) => s.referenceImageOpacity);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setError(null);
      setIsImporting(true);

      try {
        await importImage(file);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to import image';
        setError(message);
      } finally {
        setIsImporting(false);
        // Reset file input so the same file can be re-selected
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [importImage]
  );

  const handleOpacityChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const percent = parseInt(e.target.value, 10);
      if (!Number.isNaN(percent)) {
        setOpacity(percentToOpacity(percent));
      }
    },
    [setOpacity]
  );

  const handleRemoveClick = useCallback(() => {
    setShowRemoveConfirm(true);
  }, []);

  const handleConfirmRemove = useCallback(() => {
    removeImage();
    setShowRemoveConfirm(false);
    setError(null);
  }, [removeImage]);

  const handleCancelRemove = useCallback(() => {
    setShowRemoveConfirm(false);
  }, []);

  return (
    <div className="border-t border-outline-variant px-4 py-4">
      <h3 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-3">
        Image Tracing
      </h3>

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES_STRING}
        onChange={handleFileChange}
        className="hidden"
        aria-label="Import reference image"
      />

      {error && (
        <div className="mb-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
      )}

      {!hasImage ? (
        <div className="flex flex-col items-center gap-3 py-4">
          <p className="text-xs text-secondary text-center">
            Import a reference image to trace over on the canvas.
          </p>
          <button
            type="button"
            onClick={handleImportClick}
            disabled={isImporting}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isImporting ? 'Importing...' : 'Import Reference Image'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Opacity slider */}
          <div>
            <label htmlFor="ref-opacity-slider" className="block text-xs text-secondary mb-1">
              Opacity: {opacityToPercent(referenceImageOpacity)}%
            </label>
            <input
              id="ref-opacity-slider"
              type="range"
              min={MIN_OPACITY_PERCENT}
              max={MAX_OPACITY_PERCENT}
              step={1}
              value={opacityToPercent(referenceImageOpacity)}
              onChange={handleOpacityChange}
              className="w-full accent-primary"
            />
          </div>

          {/* Toggle buttons row */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={toggleVisibility}
              className={`flex-1 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                isVisible
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-outline-variant bg-surface text-secondary'
              }`}
            >
              {isVisible ? 'Visible' : 'Hidden'}
            </button>

            <button
              type="button"
              onClick={toggleLock}
              className={`flex-1 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                isLocked
                  ? 'border-outline-variant bg-surface text-secondary'
                  : 'border-primary bg-primary/10 text-primary'
              }`}
            >
              {isLocked ? 'Locked' : 'Unlocked'}
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={fitToCanvas}
              className="flex-1 rounded-md border border-outline-variant bg-surface px-3 py-1.5 text-xs font-medium text-on-surface hover:bg-surface-dim transition-colors"
            >
              Fit to Canvas
            </button>

            <button
              type="button"
              onClick={handleImportClick}
              disabled={isImporting}
              className="flex-1 rounded-md border border-outline-variant bg-surface px-3 py-1.5 text-xs font-medium text-on-surface hover:bg-surface-dim transition-colors disabled:opacity-50"
            >
              Replace
            </button>
          </div>

          {/* Remove with confirmation */}
          {!showRemoveConfirm ? (
            <button
              type="button"
              onClick={handleRemoveClick}
              className="w-full rounded-md border border-red-300 bg-surface px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              Remove Reference Image
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleConfirmRemove}
                className="flex-1 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 transition-colors"
              >
                Confirm Remove
              </button>
              <button
                type="button"
                onClick={handleCancelRemove}
                className="flex-1 rounded-md border border-outline-variant bg-surface px-3 py-1.5 text-xs font-medium text-secondary hover:bg-surface-dim transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
