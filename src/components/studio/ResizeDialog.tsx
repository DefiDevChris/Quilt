'use client';

import { useState, useCallback, useRef, useLayoutEffect } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { useLayoutStore } from '@/stores/layoutStore';
import { useQuiltResize } from '@/hooks/useQuiltResize';
import { formatMeasurement, getUnitLabel } from '@/lib/canvas-utils';

interface ResizeDialogProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

type ConfirmStep = null | 'confirm';

export function ResizeDialog({ isOpen, onClose }: ResizeDialogProps) {
  const canvasWidth = useProjectStore((s) => s.canvasWidth);
  const canvasHeight = useProjectStore((s) => s.canvasHeight);
  const unitSystem = useCanvasStore((s) => s.unitSystem);
  const layoutType = useLayoutStore((s) => s.layoutType);
  const { applyResize } = useQuiltResize();

  const [width, setWidth] = useState(canvasWidth);
  const [height, setHeight] = useState(canvasHeight);
  const [lockAspectRatio, setLockAspectRatio] = useState(true);
  const [tilePattern, setTilePattern] = useState(false);
  const [step, setStep] = useState<ConfirmStep>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const unitLabel = getUnitLabel(unitSystem);
  const aspectRatio = canvasWidth / canvasHeight;
  const isSameDimensions = width === canvasWidth && height === canvasHeight;

  useLayoutEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setWidth(canvasWidth);
      setHeight(canvasHeight);
      setLockAspectRatio(true);
      setTilePattern(false);
      setStep(null);
    }
  }, [isOpen, canvasWidth, canvasHeight]);

  const handleWidthChange = useCallback(
    (newWidth: number) => {
      setWidth(newWidth);
      if (lockAspectRatio) {
        setHeight(Math.round((newWidth / aspectRatio) * 100) / 100);
      }
    },
    [lockAspectRatio, aspectRatio]
  );

  const handleHeightChange = useCallback(
    (newHeight: number) => {
      setHeight(newHeight);
      if (lockAspectRatio) {
        setWidth(Math.round(newHeight * aspectRatio * 100) / 100);
      }
    },
    [lockAspectRatio, aspectRatio]
  );

  const handleSubmit = useCallback(() => {
    setStep('confirm');
  }, []);

  const getAddBlocksLabel = useCallback(() => {
    if (layoutType === 'free-form') return 'Expand Canvas';
    return 'Add Empty Blocks';
  }, [layoutType]);

  const handleConfirm = useCallback(
    (mode: 'scale' | 'add-blocks') => {
      const container = containerRef.current?.closest('[data-studio-canvas]');
      const containerWidth = container?.clientWidth ?? window.innerWidth;
      const containerHeight = container?.clientHeight ?? window.innerHeight;
      applyResize(
        mode,
        width,
        height,
        lockAspectRatio,
        tilePattern,
        containerWidth,
        containerHeight
      );
      onClose();
    },
    [applyResize, width, height, lockAspectRatio, tilePattern, onClose]
  );

  if (!isOpen) return null;

  const formattedCurrent = `${formatMeasurement(canvasWidth, unitSystem)} \u00d7 ${formatMeasurement(canvasHeight, unitSystem)}`;
  const formattedNew = `${formatMeasurement(width, unitSystem)} \u00d7 ${formatMeasurement(height, unitSystem)}`;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-surface rounded-xl shadow-elevation-3 w-[380px] max-w-[90vw]"
        role="dialog"
        aria-label="Resize Quilt"
      >
        {step === null ? (
          <div className="p-6">
            <h2 className="text-title-lg text-on-surface font-semibold mb-4">Resize Quilt</h2>

            <div className="flex items-end gap-3 mb-4">
              <div className="flex-1">
                <label htmlFor="resize-width" className="block text-label-sm text-secondary mb-1">
                  Width ({unitLabel})
                </label>
                <input
                  id="resize-width"
                  type="number"
                  min={1}
                  max={200}
                  step={0.25}
                  value={width}
                  onChange={(e) => handleWidthChange(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-surface-container rounded-md border border-outline-variant/20 text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <button
                type="button"
                title={lockAspectRatio ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
                onClick={() => setLockAspectRatio((prev) => !prev)}
                className="w-10 h-10 flex items-center justify-center text-secondary hover:text-on-surface transition-colors"
              >
                {lockAspectRatio ? (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <rect
                      x="5"
                      y="9"
                      width="10"
                      height="8"
                      rx="1.5"
                      stroke="currentColor"
                      strokeWidth="1.4"
                    />
                    <path
                      d="M7 9V6C7 4.34315 8.34315 3 10 3C11.6569 3 13 4.34315 13 6V9"
                      stroke="currentColor"
                      strokeWidth="1.4"
                    />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <rect
                      x="5"
                      y="9"
                      width="10"
                      height="8"
                      rx="1.5"
                      stroke="currentColor"
                      strokeWidth="1.4"
                    />
                    <path
                      d="M13 9V6C13 4.34315 14.3431 3 16 3C17.6569 3 19 4.34315 19 6"
                      stroke="currentColor"
                      strokeWidth="1.4"
                    />
                  </svg>
                )}
              </button>

              <div className="flex-1">
                <label htmlFor="resize-height" className="block text-label-sm text-secondary mb-1">
                  Height ({unitLabel})
                </label>
                <input
                  id="resize-height"
                  type="number"
                  min={1}
                  max={200}
                  step={0.25}
                  value={height}
                  onChange={(e) => handleHeightChange(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-surface-container rounded-md border border-outline-variant/20 text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            <p className="text-body-sm text-secondary mb-4">Current: {formattedCurrent}</p>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-body-md text-secondary hover:text-on-surface transition-colors rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSameDimensions}
                onClick={handleSubmit}
                className="px-4 py-2 text-body-md text-on-primary bg-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <h2 className="text-title-lg text-on-surface font-semibold mb-2">Confirm Resize</h2>
            <p className="text-body-md text-secondary mb-6">
              This changes the entire quilt dimensions from {formattedCurrent} to {formattedNew}.
            </p>

            {layoutType !== 'free-form' && (
              <label className="flex items-center gap-2 mb-4 text-body-sm text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={tilePattern}
                  onChange={(e) => setTilePattern(e.target.checked)}
                  className="rounded border-outline-variant"
                />
                Tile existing pattern into new blocks
              </label>
            )}

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => handleConfirm('scale')}
                className="w-full px-4 py-2.5 text-body-md text-on-primary bg-primary rounded-lg hover:bg-primary/90 transition-colors"
              >
                Resize Current Pattern
              </button>
              <button
                type="button"
                onClick={() => handleConfirm('add-blocks')}
                className="w-full px-4 py-2.5 text-body-md text-on-surface bg-surface-container rounded-lg hover:bg-surface-container-high transition-colors border border-outline-variant/20"
              >
                {getAddBlocksLabel()}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full px-4 py-2.5 text-body-md text-secondary hover:text-on-surface transition-colors rounded-lg"
              >
                Keep {formattedCurrent}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
