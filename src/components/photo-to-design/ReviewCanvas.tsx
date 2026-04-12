'use client';

import { useCallback, useEffect, useRef } from 'react';
import { usePhotoDesignStore } from '@/stores/photoDesignStore';
import { usePhotoToDesign } from '@/hooks/usePhotoToDesign';
import type { Patch } from '@/lib/photo-to-design/types';

const STAGE_LABELS: Record<string, string> = {
  edgeDetection: 'Detecting edges',
  seamTracing: 'Tracing seams',
  graphConstruction: 'Building graph',
  regularization: 'Regularizing geometry',
  svgGeneration: 'Generating outlines',
  starting: 'Starting',
};

/**
 * Review Canvas — photo with SVG patch outline overlay, compact results panel.
 * Patches are outline-only (no fill, no color) — showing seam lines.
 */
export function ReviewCanvas() {
  const correctedImageData = usePhotoDesignStore((s) => s.correctedImageData);
  const result = usePhotoDesignStore((s) => s.result);
  const isProcessing = usePhotoDesignStore((s) => s.isProcessing);
  const processingProgress = usePhotoDesignStore((s) => s.processingProgress);
  const processingError = usePhotoDesignStore((s) => s.processingError);

  const { process, abort } = usePhotoToDesign();
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

  const imageWidth = correctedImageData?.width ?? 600;
  const imageHeight = correctedImageData?.height ?? 400;

  const maxH = typeof window !== 'undefined' ? window.innerHeight - 80 : 800;
  const maxW = typeof window !== 'undefined' ? window.innerWidth - 280 : 1000;
  const displayScale = Math.min(maxW / imageWidth, maxH / imageHeight);
  const displayW = Math.round(imageWidth * displayScale);
  const displayH = Math.round(imageHeight * displayScale);

  return (
    <div className="flex items-start justify-start gap-3 px-4 py-2 h-full overflow-hidden">
      {/* Photo with SVG outline overlay */}
      <div
        className="relative border border-[var(--color-border)] rounded-lg overflow-hidden shadow-[0_1px_2px_rgba(26,26,26,0.08)] flex-shrink-0"
        style={{ width: displayW, height: displayH }}
      >
        <canvas
          ref={photoCanvasRef}
          className="absolute inset-0"
          style={{ width: displayW, height: displayH }}
        />

        {result && (
          <svg
            className="absolute inset-0"
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
                  width: `${processingProgress ? (processingProgress.stage / 5) * 100 : 0}%`,
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
