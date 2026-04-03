'use client';

import { useCallback, useState } from 'react';
import { usePhotoPatternStore } from '@/stores/photoPatternStore';

function applyTransform(
  image: HTMLImageElement,
  rotationDeg: number,
  flipH: boolean,
  flipV: boolean
): Promise<{ img: HTMLImageElement; url: string }> {
  return new Promise((resolve, reject) => {
    const rad = (rotationDeg * Math.PI) / 180;
    const absRad = Math.abs(rad);
    const cos = Math.cos(absRad);
    const sin = Math.sin(absRad);

    const w = image.naturalWidth;
    const h = image.naturalHeight;
    const newW = Math.ceil(w * cos + h * sin);
    const newH = Math.ceil(w * sin + h * cos);

    const canvas = document.createElement('canvas');
    canvas.width = newW;
    canvas.height = newH;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    ctx.save();
    ctx.translate(newW / 2, newH / 2);
    ctx.rotate(rad);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.drawImage(image, -w / 2, -h / 2);
    ctx.restore();

    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to create transformed image'));
        return;
      }
      const url = URL.createObjectURL(blob);
      const newImg = new Image();
      newImg.onload = () => resolve({ img: newImg, url });
      newImg.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load transformed image'));
      };
      newImg.src = url;
    }, 'image/png');
  });
}

export function ImagePrepStep() {
  const originalImageUrl = usePhotoPatternStore((s) => s.originalImageUrl);
  const originalImage = usePhotoPatternStore((s) => s.originalImage);
  const setOriginalImage = usePhotoPatternStore((s) => s.setOriginalImage);
  const setStep = usePhotoPatternStore((s) => s.setStep);

  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasTransform = rotation !== 0 || flipH || flipV;

  const handleReset = useCallback(() => {
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
  }, []);

  const handleContinue = useCallback(async () => {
    if (!originalImage) return;

    if (!hasTransform) {
      setStep('scanSettings');
      return;
    }

    setApplying(true);
    setError(null);

    try {
      const { img, url } = await applyTransform(originalImage, rotation, flipH, flipV);
      setOriginalImage(img, url);
      setRotation(0);
      setFlipH(false);
      setFlipV(false);
      setStep('scanSettings');
    } catch {
      setError('Failed to apply adjustments. Please try again.');
    } finally {
      setApplying(false);
    }
  }, [originalImage, rotation, flipH, flipV, hasTransform, setOriginalImage, setStep]);

  const handleBack = useCallback(() => {
    setStep('upload');
  }, [setStep]);

  const transformStyle = {
    transform: [
      `rotate(${rotation}deg)`,
      flipH ? 'scaleX(-1)' : '',
      flipV ? 'scaleY(-1)' : '',
    ]
      .filter(Boolean)
      .join(' '),
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Image preview */}
      <div className="flex-1 min-h-0 flex justify-center items-center rounded-lg border border-outline-variant/20 bg-surface-container p-4 overflow-hidden">
        {originalImageUrl && (
          <img
            src={originalImageUrl}
            alt="Image preview with adjustments"
            className="max-h-full max-w-full rounded-md object-contain transition-transform duration-200"
            style={transformStyle}
          />
        )}
      </div>

      {/* Controls */}
      <div className="flex-shrink-0 space-y-4">
        {/* Rotation slider */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-medium text-on-surface/60 uppercase tracking-wider">
              Straighten
            </span>
            <span className="text-[12px] font-mono text-on-surface/50">{rotation}°</span>
          </div>
          <input
            type="range"
            min={-45}
            max={45}
            step={0.5}
            value={rotation}
            onChange={(e) => setRotation(parseFloat(e.target.value))}
            className="w-full accent-primary"
          />
        </div>

        {/* Quick actions row */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setRotation((r) => r - 90)}
            className="flex-1 bg-surface-container text-on-surface rounded-md py-2 text-[12px] font-medium hover:bg-surface-container-high transition-colors"
          >
            -90°
          </button>
          <button
            type="button"
            onClick={() => setRotation((r) => r + 90)}
            className="flex-1 bg-surface-container text-on-surface rounded-md py-2 text-[12px] font-medium hover:bg-surface-container-high transition-colors"
          >
            +90°
          </button>
          <button
            type="button"
            onClick={() => setFlipH((v) => !v)}
            className={`flex-1 rounded-md py-2 text-[12px] font-medium transition-colors ${
              flipH
                ? 'bg-primary/12 text-primary ring-1 ring-primary/20'
                : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
            }`}
          >
            Flip H
          </button>
          <button
            type="button"
            onClick={() => setFlipV((v) => !v)}
            className={`flex-1 rounded-md py-2 text-[12px] font-medium transition-colors ${
              flipV
                ? 'bg-primary/12 text-primary ring-1 ring-primary/20'
                : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
            }`}
          >
            Flip V
          </button>
          {hasTransform && (
            <button
              type="button"
              onClick={handleReset}
              className="px-3 rounded-md py-2 text-[12px] font-medium text-on-surface/50 hover:text-on-surface bg-surface-container hover:bg-surface-container-high transition-colors"
            >
              Reset
            </button>
          )}
        </div>

        {error && <p className="text-body-sm text-error">{error}</p>}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between flex-shrink-0">
        <button
          type="button"
          onClick={handleBack}
          className="px-4 py-2 text-body-sm font-medium text-secondary hover:text-on-surface transition-colors"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleContinue}
          disabled={applying}
          className="px-6 py-2.5 text-body-md font-medium text-on-primary bg-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {applying ? 'Applying...' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
