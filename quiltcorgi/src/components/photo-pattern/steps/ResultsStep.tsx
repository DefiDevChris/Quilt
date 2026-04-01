'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePhotoPatternStore } from '@/stores/photoPatternStore';
import {
  PHOTO_PATTERN_OVERLAY_COLOR,
  PHOTO_PATTERN_OVERLAY_OPACITY,
  PHOTO_PATTERN_SENSITIVITY_MIN,
  PHOTO_PATTERN_SENSITIVITY_MAX,
  PHOTO_PATTERN_SENSITIVITY_DEBOUNCE_MS,
} from '@/lib/constants';

export function ResultsStep() {
  const originalImage = usePhotoPatternStore((s) => s.originalImage);
  const correctedImageData = usePhotoPatternStore((s) => s.correctedImageData);
  const detectedPieces = usePhotoPatternStore((s) => s.detectedPieces);
  const sensitivity = usePhotoPatternStore((s) => s.sensitivity);
  const setSensitivity = usePhotoPatternStore((s) => s.setSensitivity);
  const setStep = usePhotoPatternStore((s) => s.setStep);
  const setPipelineSteps = usePhotoPatternStore((s) => s.setPipelineSteps);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [localSensitivity, setLocalSensitivity] = useState(sensitivity);

  // Draw the corrected image + piece contour overlays
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const imageSource = correctedImageData ?? null;
    if (!imageSource && !originalImage) return;

    const imgWidth = imageSource ? imageSource.width : originalImage!.naturalWidth;
    const imgHeight = imageSource ? imageSource.height : originalImage!.naturalHeight;

    const containerRect = container.getBoundingClientRect();
    const fitScale = Math.min(containerRect.width / imgWidth, containerRect.height / imgHeight, 1);

    canvas.width = containerRect.width;
    canvas.height = containerRect.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const drawX = (containerRect.width - imgWidth * fitScale) / 2;
    const drawY = (containerRect.height - imgHeight * fitScale) / 2;

    // Draw the image
    if (imageSource) {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = imageSource.width;
      tempCanvas.height = imageSource.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCtx.putImageData(imageSource, 0, 0);
        ctx.drawImage(tempCanvas, drawX, drawY, imgWidth * fitScale, imgHeight * fitScale);
      }
    } else if (originalImage) {
      ctx.drawImage(originalImage, drawX, drawY, imgWidth * fitScale, imgHeight * fitScale);
    }

    // Draw piece contours
    ctx.save();
    ctx.strokeStyle = PHOTO_PATTERN_OVERLAY_COLOR;
    ctx.lineWidth = 2;
    ctx.globalAlpha = PHOTO_PATTERN_OVERLAY_OPACITY;

    for (const piece of detectedPieces) {
      if (piece.contour.length < 2) continue;

      ctx.beginPath();
      const first = piece.contour[0];
      ctx.moveTo(first.x * fitScale + drawX, first.y * fitScale + drawY);

      for (let i = 1; i < piece.contour.length; i++) {
        const pt = piece.contour[i];
        ctx.lineTo(pt.x * fitScale + drawX, pt.y * fitScale + drawY);
      }
      ctx.closePath();
      ctx.stroke();
    }

    ctx.restore();
  }, [originalImage, correctedImageData, detectedPieces]);

  // Debounced sensitivity change triggers re-scan
  const handleSensitivityChange = useCallback(
    (value: number) => {
      setLocalSensitivity(value);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        setSensitivity(value);
        setPipelineSteps([]);
        setStep('processing');
      }, PHOTO_PATTERN_SENSITIVITY_DEBOUNCE_MS);
    },
    [setSensitivity, setPipelineSteps, setStep]
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleRescan = useCallback(() => {
    setPipelineSteps([]);
    setStep('processing');
  }, [setPipelineSteps, setStep]);

  const handleAddToProject = useCallback(() => {
    setStep('dimensions');
  }, [setStep]);

  const pieceCount = detectedPieces.length;

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Canvas area */}
      <div
        ref={containerRef}
        className="flex-1 min-h-0 relative rounded-lg border border-outline-variant/20 bg-surface-container overflow-hidden"
      >
        <canvas ref={canvasRef} className="absolute inset-0" />
      </div>

      {/* Bottom toolbar */}
      <div className="flex items-center gap-4 flex-shrink-0 flex-wrap">
        {/* Piece count */}
        <span className="text-body-sm text-secondary whitespace-nowrap">
          {pieceCount === 0
            ? 'No pieces detected'
            : `${pieceCount} piece${pieceCount === 1 ? '' : 's'} found`}
        </span>

        {/* Sensitivity slider */}
        <div className="flex items-center gap-2 flex-1 min-w-[180px]">
          <label
            htmlFor="sensitivity-slider"
            className="text-label-sm text-secondary whitespace-nowrap"
          >
            Sensitivity
          </label>
          <input
            id="sensitivity-slider"
            type="range"
            min={PHOTO_PATTERN_SENSITIVITY_MIN}
            max={PHOTO_PATTERN_SENSITIVITY_MAX}
            step={0.1}
            value={localSensitivity}
            onChange={(e) => handleSensitivityChange(Number(e.target.value))}
            className="flex-1 accent-primary"
          />
          <span className="text-label-sm text-secondary w-8 text-right">
            {localSensitivity.toFixed(1)}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRescan}
            className="px-3 py-1.5 text-body-sm text-on-surface bg-surface-container rounded-md hover:bg-surface-container-high transition-colors border border-outline-variant/20"
          >
            Re-scan
          </button>

          <button
            type="button"
            onClick={handleAddToProject}
            disabled={pieceCount === 0}
            className="px-4 py-2 text-body-md font-medium text-on-primary bg-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Add to Project
          </button>
        </div>
      </div>

      {/* Zero pieces error */}
      {pieceCount === 0 && (
        <p className="text-body-sm text-error">
          No pieces were detected. Try adjusting the sensitivity slider or go back to correct the
          perspective.
        </p>
      )}
    </div>
  );
}
