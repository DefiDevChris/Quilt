'use client';

import { useCallback, useState } from 'react';
import { usePhotoPatternStore } from '@/stores/photoPatternStore';
import { scalePiecesToDimensions } from '@/lib/piece-detection-engine';
import { QUILT_SIZE_PRESETS } from '@/lib/constants';

export function DimensionsStep() {
  const originalImage = usePhotoPatternStore((s) => s.originalImage);
  const correctedImageData = usePhotoPatternStore((s) => s.correctedImageData);
  const detectedPieces = usePhotoPatternStore((s) => s.detectedPieces);
  const targetWidth = usePhotoPatternStore((s) => s.targetWidth);
  const targetHeight = usePhotoPatternStore((s) => s.targetHeight);
  const seamAllowance = usePhotoPatternStore((s) => s.seamAllowance);
  const lockAspectRatio = usePhotoPatternStore((s) => s.lockAspectRatio);
  const setTargetDimensions = usePhotoPatternStore((s) => s.setTargetDimensions);
  const setSeamAllowance = usePhotoPatternStore((s) => s.setSeamAllowance);
  const setLockAspectRatio = usePhotoPatternStore((s) => s.setLockAspectRatio);
  const setScaledPieces = usePhotoPatternStore((s) => s.setScaledPieces);
  const setStep = usePhotoPatternStore((s) => s.setStep);

  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const imageWidth = correctedImageData
    ? correctedImageData.width
    : originalImage?.naturalWidth ?? 1;
  const imageHeight = correctedImageData
    ? correctedImageData.height
    : originalImage?.naturalHeight ?? 1;
  const aspectRatio = imageWidth / imageHeight;

  const handlePresetSelect = useCallback(
    (preset: { readonly label: string; readonly width: number; readonly height: number }) => {
      setSelectedPreset(preset.label);
      setTargetDimensions(preset.width, preset.height);
    },
    [setTargetDimensions]
  );

  const handleWidthChange = useCallback(
    (newWidth: number) => {
      setSelectedPreset(null);
      if (lockAspectRatio) {
        const newHeight = Math.round(newWidth / aspectRatio);
        setTargetDimensions(newWidth, newHeight);
      } else {
        setTargetDimensions(newWidth, targetHeight);
      }
    },
    [lockAspectRatio, aspectRatio, targetHeight, setTargetDimensions]
  );

  const handleHeightChange = useCallback(
    (newHeight: number) => {
      setSelectedPreset(null);
      if (lockAspectRatio) {
        const newWidth = Math.round(newHeight * aspectRatio);
        setTargetDimensions(newWidth, newHeight);
      } else {
        setTargetDimensions(targetWidth, newHeight);
      }
    },
    [lockAspectRatio, aspectRatio, targetWidth, setTargetDimensions]
  );

  const handleToggleLock = useCallback(() => {
    setLockAspectRatio(!lockAspectRatio);
  }, [lockAspectRatio, setLockAspectRatio]);

  const handleCalculatePieces = useCallback(() => {
    const scaled = scalePiecesToDimensions(
      detectedPieces,
      imageWidth,
      imageHeight,
      targetWidth,
      targetHeight,
      seamAllowance
    );
    setScaledPieces(scaled);
    setStep('complete');
  }, [
    detectedPieces,
    imageWidth,
    imageHeight,
    targetWidth,
    targetHeight,
    seamAllowance,
    setScaledPieces,
    setStep,
  ]);

  return (
    <div className="flex flex-col gap-6 h-full overflow-y-auto">
      {/* Presets */}
      <div>
        <h3 className="text-body-md font-medium text-on-surface mb-3">
          Choose a quilt size
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {QUILT_SIZE_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => handlePresetSelect(preset)}
              className={`px-3 py-2.5 text-body-sm rounded-md border transition-colors text-center ${
                selectedPreset === preset.label
                  ? 'border-primary bg-primary/10 text-on-surface font-medium'
                  : 'border-outline-variant/20 bg-surface-container text-secondary hover:bg-surface-container-high hover:text-on-surface'
              }`}
            >
              <span className="block font-medium">{preset.label}</span>
              <span className="block text-label-sm mt-0.5">
                {preset.width}&quot; \u00d7 {preset.height}&quot;
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom dimensions */}
      <div>
        <h3 className="text-body-md font-medium text-on-surface mb-3">
          Or enter custom dimensions
        </h3>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label htmlFor="dim-width" className="block text-label-sm text-secondary mb-1">
              Width (inches)
            </label>
            <input
              id="dim-width"
              type="number"
              min={1}
              max={200}
              step={1}
              value={targetWidth}
              onChange={(e) => handleWidthChange(Number(e.target.value))}
              className="w-full px-3 py-2 bg-surface-container rounded-md border border-outline-variant/20 text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <button
            type="button"
            title={lockAspectRatio ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
            onClick={handleToggleLock}
            className="w-10 h-10 flex items-center justify-center text-secondary hover:text-on-surface transition-colors"
          >
            {lockAspectRatio ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="5" y="9" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
                <path d="M7 9V6C7 4.34315 8.34315 3 10 3C11.6569 3 13 4.34315 13 6V9" stroke="currentColor" strokeWidth="1.4" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="5" y="9" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
                <path d="M13 9V6C13 4.34315 14.3431 3 16 3C17.6569 3 19 4.34315 19 6" stroke="currentColor" strokeWidth="1.4" />
              </svg>
            )}
          </button>

          <div className="flex-1">
            <label htmlFor="dim-height" className="block text-label-sm text-secondary mb-1">
              Height (inches)
            </label>
            <input
              id="dim-height"
              type="number"
              min={1}
              max={200}
              step={1}
              value={targetHeight}
              onChange={(e) => handleHeightChange(Number(e.target.value))}
              className="w-full px-3 py-2 bg-surface-container rounded-md border border-outline-variant/20 text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
      </div>

      {/* Seam allowance */}
      <div>
        <h3 className="text-body-md font-medium text-on-surface mb-3">
          Seam allowance
        </h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSeamAllowance(0.25)}
            className={`flex-1 px-4 py-2 text-body-sm rounded-md border transition-colors ${
              seamAllowance === 0.25
                ? 'border-primary bg-primary/10 text-on-surface font-medium'
                : 'border-outline-variant/20 bg-surface-container text-secondary hover:bg-surface-container-high'
            }`}
          >
            1/4&quot;
          </button>
          <button
            type="button"
            onClick={() => setSeamAllowance(0.375)}
            className={`flex-1 px-4 py-2 text-body-sm rounded-md border transition-colors ${
              seamAllowance === 0.375
                ? 'border-primary bg-primary/10 text-on-surface font-medium'
                : 'border-outline-variant/20 bg-surface-container text-secondary hover:bg-surface-container-high'
            }`}
          >
            3/8&quot;
          </button>
        </div>
      </div>

      {/* Calculate button */}
      <div className="flex justify-end mt-auto flex-shrink-0">
        <button
          type="button"
          onClick={handleCalculatePieces}
          className="px-6 py-2.5 text-body-md font-medium text-on-primary bg-primary rounded-lg hover:bg-primary/90 transition-colors"
        >
          Calculate Pieces
        </button>
      </div>
    </div>
  );
}
