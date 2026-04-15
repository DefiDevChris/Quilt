'use client';

import { useCallback, useEffect, useRef } from 'react';
import { usePhotoDesignStore } from '@/stores/photoDesignStore';
import type { Patch, Point } from '@/lib/photo-to-design/types';

interface ReviewCanvasProps {
  process: (imageData: ImageData) => void;
  abort: () => void;
  addPatchAtPoint: (imageData: ImageData, point: Point) => void;
}

const STAGE_LABELS: Record<string, string> = {
  prescale: 'Preparing image',
  encode: 'Analyzing photo',
  autoMask: 'Finding patches',
  vectorize: 'Simplifying outlines',
  canonicalize: 'Snapping to grid',
  validate: 'Checking patches',
  interactive: 'Adding patch',
  starting: 'Starting',
};

const STAGE_COUNT = 6;

/**
 * Review Canvas — photo with SVG patch outline overlay, compact results panel.
 * Patches are outline-only (no fill, no color) — showing seam lines.
 *
 * Click-to-add (U6): clicking on the photo runs a single-point SAM decoder
 * and appends the resulting patch. `Cmd/Ctrl+Z` undoes the most recent
 * interactive addition, popping back to whatever patch set existed before.
 */
export function ReviewCanvas({ process, abort, addPatchAtPoint }: ReviewCanvasProps) {
  const correctedImageData = usePhotoDesignStore((s) => s.correctedImageData);
  const result = usePhotoDesignStore((s) => s.result);
  const isProcessing = usePhotoDesignStore((s) => s.isProcessing);
  const isInteractiveProcessing = usePhotoDesignStore((s) => s.isInteractiveProcessing);
  const processingProgress = usePhotoDesignStore((s) => s.processingProgress);
  const processingError = usePhotoDesignStore((s) => s.processingError);
  const patchUndoStack = usePhotoDesignStore((s) => s.patchUndoStack);

  const photoCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!correctedImageData || !photoCanvasRef.current) return;
    const ctx = photoCanvasRef.current.getContext('2d');
    if (!ctx) return;
    photoCanvasRef.current.width = correctedImageData.width;
    photoCanvasRef.current.height = correctedImageData.height;
    ctx.putImageData(correctedImageData, 0, 0);
  }, [correctedImageData]);

  const handleRescan = useCallback(() => {
    if (correctedImageData) {
      abort();
      process(correctedImageData);
    }
  }, [correctedImageData, process, abort]);

  const handleBack = useCallback(() => {
    usePhotoDesignStore.getState().setStep('grid');
  }, []);
  const handleDone = useCallback(() => {
    usePhotoDesignStore.getState().reset();
  }, []);

  const handleUndo = useCallback(() => {
    usePhotoDesignStore.getState().undoLastPatch();
  }, []);

  // Cmd/Ctrl+Z keybind — only active when this canvas is mounted, and only
  // when there's something to undo (otherwise bubble up to browser default).
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.shiftKey) return;
      if (e.key !== 'z' && e.key !== 'Z') return;
      const s = usePhotoDesignStore.getState();
      if (s.patchUndoStack.length === 0) return;
      e.preventDefault();
      s.undoLastPatch();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const imageWidth = correctedImageData?.width ?? 600;
  const imageHeight = correctedImageData?.height ?? 400;

  const maxH = typeof window !== 'undefined' ? window.innerHeight - 80 : 800;
  const maxW = typeof window !== 'undefined' ? window.innerWidth - 280 : 1000;
  const displayScale = Math.min(maxW / imageWidth, maxH / imageHeight);
  const displayW = Math.round(imageWidth * displayScale);
  const displayH = Math.round(imageHeight * displayScale);

  const canInteract = !!result && !!correctedImageData && !isProcessing && !isInteractiveProcessing;

  const handlePhotoClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!canInteract || !correctedImageData) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;
      const x = (offsetX / rect.width) * correctedImageData.width;
      const y = (offsetY / rect.height) * correctedImageData.height;
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
      addPatchAtPoint(correctedImageData, { x, y });
    },
    [canInteract, correctedImageData, addPatchAtPoint]
  );

  return (
    <div className="flex items-start justify-start gap-3 px-4 py-2 h-full overflow-hidden">
      {/* Photo with SVG outline overlay */}
      <div
        className="relative border border-[var(--color-border)] rounded-lg overflow-hidden shadow-[0_1px_2px_rgba(26,26,26,0.08)] flex-shrink-0"
        style={{
          width: displayW,
          height: displayH,
          cursor: canInteract ? 'crosshair' : 'default',
        }}
        onClick={handlePhotoClick}
      >
        <canvas
          ref={photoCanvasRef}
          className="absolute inset-0 pointer-events-none"
          style={{ width: displayW, height: displayH }}
        />

        {result && (
          <svg
            className="absolute inset-0 pointer-events-none"
            viewBox={`0 0 ${imageWidth} ${imageHeight}`}
            width={displayW}
            height={displayH}
          >
            {result.patches.map((patch: Patch) => (
              <path
                key={patch.id}
                d={patch.svgPath}
                fill="none"
                stroke="#ff8d49"
                strokeWidth={3 / displayScale}
                strokeLinejoin="round"
                strokeOpacity={0.9}
              />
            ))}
          </svg>
        )}

        {isProcessing && (
          <div className="absolute inset-0 bg-[var(--color-bg)]/70 flex flex-col items-center justify-center gap-3">
            <div className="w-40 h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden">
              <div
                className="h-full bg-[var(--color-primary)] transition-all duration-300 rounded-full"
                style={{
                  width: `${processingProgress ? (processingProgress.stage / STAGE_COUNT) * 100 : 0}%`,
                }}
              />
            </div>
            <span className="text-[13px] text-[var(--color-text-dim)]">
              {processingProgress
                ? (STAGE_LABELS[processingProgress.stageName] ?? processingProgress.stageName)
                : 'Starting...'}
            </span>
          </div>
        )}

        {isInteractiveProcessing && !isProcessing && (
          <div className="absolute top-2 right-2 bg-[var(--color-surface)] text-[var(--color-text-dim)] text-[11px] px-2 py-1 rounded-full shadow-[0_1px_2px_rgba(26,26,26,0.08)]">
            Adding patch…
          </div>
        )}
      </div>

      {/* Results panel */}
      <div className="w-[200px] flex-shrink-0 flex flex-col bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)]/30 shadow-[0_1px_2px_rgba(26,26,26,0.08)] overflow-hidden">
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
          {result && (
            <>
              <h3 className="text-[11px] font-semibold text-[var(--color-text)] uppercase tracking-[0.06em]">
                Results
              </h3>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[var(--color-bg)] rounded-lg p-2 text-center">
                  <div className="text-[18px] font-bold text-[var(--color-text)]">
                    {result.patches.length}
                  </div>
                  <div className="text-[10px] text-[var(--color-text-dim)]">Patches</div>
                </div>
                <div className="bg-[var(--color-bg)] rounded-lg p-2 text-center">
                  <div className="text-[18px] font-bold text-[var(--color-text)]">
                    {result.gridSpec.cols}×{result.gridSpec.rows}
                  </div>
                  <div className="text-[10px] text-[var(--color-text-dim)]">Grid</div>
                </div>
                <div className="bg-[var(--color-bg)] rounded-lg p-2 text-center col-span-2">
                  <div className="text-[18px] font-bold text-[var(--color-text)]">
                    {result.processingTime}
                  </div>
                  <div className="text-[10px] text-[var(--color-text-dim)]">ms</div>
                </div>
              </div>

              <p className="text-[11px] text-[var(--color-text-dim)] leading-snug">
                Click a missed area to add a patch.{' '}
                {patchUndoStack.length > 0 && <>Press ⌘/Ctrl+Z to undo.</>}
              </p>
            </>
          )}

          {processingError && <p className="text-[12px] text-red-600">{processingError}</p>}
        </div>

        {/* Bottom actions */}
        <div className="p-3 border-t border-[var(--color-border)]/20 flex flex-col gap-2">
          <button
            onClick={handleDone}
            className="w-full px-3 py-2 rounded-full bg-[var(--color-primary)] text-[var(--color-text)] text-[13px] font-medium hover:bg-[#e67d3f] transition-colors"
          >
            Done
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleBack}
              className="flex-1 px-3 py-1.5 rounded-full border-2 border-[var(--color-primary)] text-[var(--color-primary)] text-[12px] font-medium hover:bg-[var(--color-primary)]/10 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleUndo}
              disabled={patchUndoStack.length === 0}
              className="flex-1 px-3 py-1.5 rounded-full border border-[var(--color-border)] text-[12px] font-medium text-[var(--color-text-dim)] hover:bg-[var(--color-border)]/10 transition-colors disabled:opacity-50"
            >
              Undo
            </button>
            <button
              onClick={handleRescan}
              disabled={isProcessing}
              className="flex-1 px-3 py-1.5 rounded-full border border-[var(--color-border)] text-[12px] font-medium text-[var(--color-text-dim)] hover:bg-[var(--color-border)]/10 transition-colors disabled:opacity-50"
            >
              Rescan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
