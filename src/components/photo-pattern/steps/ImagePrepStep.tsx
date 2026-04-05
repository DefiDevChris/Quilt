'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePhotoPatternStore } from '@/stores/photoPatternStore';
import { loadOpenCv } from '@/lib/opencv-loader';
import type { Point2D } from '@/lib/photo-pattern-types';
import { PHOTO_PATTERN_OVERLAY_COLOR } from '@/lib/constants';

const HANDLE_RADIUS = 8;
const HIT_RADIUS = 20;

type PrepMode = 'straighten' | 'perspective';

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

async function applyPerspectiveTransform(
  image: HTMLImageElement,
  corners: [Point2D, Point2D, Point2D, Point2D]
): Promise<{ img: HTMLImageElement; url: string }> {
  const cv = await loadOpenCv();

  const w = image.naturalWidth;
  const h = image.naturalHeight;

  const srcPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
    corners[0].x,
    corners[0].y,
    corners[1].x,
    corners[1].y,
    corners[2].x,
    corners[2].y,
    corners[3].x,
    corners[3].y,
  ]);

  const dx1 = corners[1].x - corners[0].x;
  const dy1 = corners[1].y - corners[0].y;
  const dx2 = corners[2].x - corners[3].x;
  const dy2 = corners[2].y - corners[3].y;
  const dx3 = corners[3].x - corners[2].x;
  const dy3 = corners[3].y - corners[2].y;
  const dx4 = corners[0].x - corners[3].x;
  const dy4 = corners[0].y - corners[3].y;

  const topWidth = Math.sqrt(dx1 * dx1 + dy1 * dy1);
  const bottomWidth = Math.sqrt(dx2 * dx2 + dy2 * dy2);
  const leftHeight = Math.sqrt(dx4 * dx4 + dy4 * dy4);
  const rightHeight = Math.sqrt(dx3 * dx3 + dy3 * dy3);

  const outputWidth = Math.max(topWidth, bottomWidth);
  const outputHeight = Math.max(leftHeight, rightHeight);

  const dstPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
    0,
    0,
    outputWidth,
    0,
    outputWidth,
    outputHeight,
    0,
    outputHeight,
  ]);

  const transformMatrix = cv.getPerspectiveTransform(srcPoints, dstPoints);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');
  ctx.drawImage(image, 0, 0);

  const srcMat = cv.imread(canvas);
  const dstMat = new cv.Mat();
  cv.warpPerspective(
    srcMat,
    dstMat,
    transformMatrix,
    new cv.Size(Math.round(outputWidth), Math.round(outputHeight))
  );

  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = dstMat.cols;
  outputCanvas.height = dstMat.rows;
  cv.imshow(outputCanvas, dstMat);

  return new Promise((resolve, reject) => {
    outputCanvas.toBlob((blob) => {
      srcMat.delete();
      dstMat.delete();
      transformMatrix.delete();
      srcPoints.delete();
      dstPoints.delete();

      if (!blob) {
        reject(new Error('Failed to create perspective corrected image'));
        return;
      }
      const url = URL.createObjectURL(blob);
      const newImg = new Image();
      newImg.onload = () => resolve({ img: newImg, url });
      newImg.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load perspective corrected image'));
      };
      newImg.src = url;
    }, 'image/png');
  });
}

export function ImagePrepStep() {
  const originalImageUrl = usePhotoPatternStore((s) => s.originalImageUrl);
  const originalImage = usePhotoPatternStore((s) => s.originalImage);
  const perspectiveCorners = usePhotoPatternStore((s) => s.perspectiveCorners);
  const setPerspectiveCorners = usePhotoPatternStore((s) => s.setPerspectiveCorners);
  const setOriginalImage = usePhotoPatternStore((s) => s.setOriginalImage);
  const setStep = usePhotoPatternStore((s) => s.setStep);

  const [mode, setMode] = useState<PrepMode>('straighten');
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<Point2D>({ x: 0, y: 0 });

  const hasStraightenTransform = rotation !== 0 || flipH || flipV;
  const hasPerspectiveTransform = perspectiveCorners !== null;
  const hasTransform = mode === 'straighten' ? hasStraightenTransform : hasPerspectiveTransform;
  void hasTransform;

  useEffect(() => {
    if (!originalImage || !containerRef.current || mode !== 'perspective') return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const containerW = containerRect.width;
    const containerH = containerRect.height;
    const imgW = originalImage.naturalWidth;
    const imgH = originalImage.naturalHeight;

    const fitScale = Math.min(containerW / imgW, containerH / imgH, 1);
    setScale(fitScale);
    setOffset({
      x: (containerW - imgW * fitScale) / 2,
      y: (containerH - imgH * fitScale) / 2,
    });
  }, [originalImage, mode]);

  useEffect(() => {
    if (!originalImage || !containerRef.current || mode !== 'perspective') return;

    if (!perspectiveCorners) {
      const w = originalImage.naturalWidth;
      const h = originalImage.naturalHeight;
      const margin = Math.min(w, h) * 0.02;
      setPerspectiveCorners([
        { x: margin, y: margin },
        { x: w - margin, y: margin },
        { x: w - margin, y: h - margin },
        { x: margin, y: h - margin },
      ]);
    }
  }, [originalImage, perspectiveCorners, mode, setPerspectiveCorners]);

  useEffect(() => {
    if (mode !== 'perspective' || !canvasRef.current || !originalImage || !containerRef.current)
      return;

    const canvas = canvasRef.current;
    const containerRect = containerRef.current.getBoundingClientRect();
    canvas.width = containerRect.width;
    canvas.height = containerRect.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);
    ctx.drawImage(originalImage, 0, 0);
    ctx.restore();

    if (perspectiveCorners) {
      ctx.save();

      ctx.setLineDash([6, 4]);
      ctx.lineWidth = 2;
      ctx.strokeStyle = PHOTO_PATTERN_OVERLAY_COLOR;

      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const pt = perspectiveCorners[i];
        const sx = pt.x * scale + offset.x;
        const sy = pt.y * scale + offset.y;
        if (i === 0) {
          ctx.moveTo(sx, sy);
        } else {
          ctx.lineTo(sx, sy);
        }
      }
      ctx.closePath();
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.fillStyle = `${PHOTO_PATTERN_OVERLAY_COLOR}15`;
      ctx.fill();

      for (let i = 0; i < 4; i++) {
        const pt = perspectiveCorners[i];
        const sx = pt.x * scale + offset.x;
        const sy = pt.y * scale + offset.y;

        ctx.beginPath();
        ctx.arc(sx, sy, HANDLE_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = PHOTO_PATTERN_OVERLAY_COLOR;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
      }

      ctx.restore();
    }
  }, [originalImage, perspectiveCorners, scale, offset, mode]);

  const getCanvasPoint = useCallback(
    (e: React.MouseEvent): Point2D => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left - offset.x) / scale,
        y: (e.clientY - rect.top - offset.y) / scale,
      };
    },
    [scale, offset]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!perspectiveCorners) return;
      const pt = getCanvasPoint(e);
      const hitRadius = HIT_RADIUS / scale;

      for (let i = 0; i < 4; i++) {
        const corner = perspectiveCorners[i];
        const dx = pt.x - corner.x;
        const dy = pt.y - corner.y;
        if (dx * dx + dy * dy <= hitRadius * hitRadius) {
          setDragIndex(i);
          return;
        }
      }
    },
    [perspectiveCorners, getCanvasPoint, scale]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (dragIndex === null || !perspectiveCorners || !originalImage) return;

      const pt = getCanvasPoint(e);
      const clampedX = Math.max(0, Math.min(originalImage.naturalWidth, pt.x));
      const clampedY = Math.max(0, Math.min(originalImage.naturalHeight, pt.y));

      const updated: [Point2D, Point2D, Point2D, Point2D] = [
        perspectiveCorners[0],
        perspectiveCorners[1],
        perspectiveCorners[2],
        perspectiveCorners[3],
      ];
      updated[dragIndex] = { x: clampedX, y: clampedY };

      setPerspectiveCorners(updated);
    },
    [dragIndex, perspectiveCorners, originalImage, getCanvasPoint, setPerspectiveCorners]
  );

  const handleMouseUp = useCallback(() => {
    setDragIndex(null);
  }, []);

  const handleReset = useCallback(() => {
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
  }, []);

  const handleResetPerspective = useCallback(() => {
    if (!originalImage) return;
    const w = originalImage.naturalWidth;
    const h = originalImage.naturalHeight;
    const margin = Math.min(w, h) * 0.02;
    setPerspectiveCorners([
      { x: margin, y: margin },
      { x: w - margin, y: margin },
      { x: w - margin, y: h - margin },
      { x: margin, y: h - margin },
    ]);
  }, [originalImage, setPerspectiveCorners]);

  const handleContinue = useCallback(async () => {
    if (!originalImage) return;

    if (mode === 'straighten') {
      if (!hasStraightenTransform) {
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
    } else {
      const corners = perspectiveCorners;
      if (!corners) {
        setStep('scanSettings');
        return;
      }

      setApplying(true);
      setError(null);

      try {
        const { img, url } = await applyPerspectiveTransform(originalImage, corners);
        setOriginalImage(img, url);
        setPerspectiveCorners(null);
        setStep('scanSettings');
      } catch {
        setError('Failed to apply perspective correction. Please try again.');
      } finally {
        setApplying(false);
      }
    }
  }, [
    originalImage,
    mode,
    rotation,
    flipH,
    flipV,
    perspectiveCorners,
    hasStraightenTransform,
    setOriginalImage,
    setPerspectiveCorners,
    setStep,
  ]);

  const handleBack = useCallback(() => {
    setStep('upload');
  }, [setStep]);

  const transformStyle = {
    transform: [`rotate(${rotation}deg)`, flipH ? 'scaleX(-1)' : '', flipV ? 'scaleY(-1)' : '']
      .filter(Boolean)
      .join(' '),
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Mode tabs */}
      <div className="flex items-center gap-1 bg-surface-container rounded-lg p-1 flex-shrink-0">
        <button
          type="button"
          onClick={() => setMode('straighten')}
          className={`flex-1 px-3 py-1.5 text-[13px] font-medium rounded-md transition-colors ${
            mode === 'straighten'
              ? 'bg-surface text-on-surface shadow-sm'
              : 'text-secondary hover:text-on-surface'
          }`}
        >
          Straighten
        </button>
        <button
          type="button"
          onClick={() => setMode('perspective')}
          className={`flex-1 px-3 py-1.5 text-[13px] font-medium rounded-md transition-colors ${
            mode === 'perspective'
              ? 'bg-surface text-on-surface shadow-sm'
              : 'text-secondary hover:text-on-surface'
          }`}
        >
          Perspective
        </button>
      </div>

      {/* Content based on mode */}
      {mode === 'straighten' ? (
        <>
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

          {/* Straighten controls */}
          <div className="flex-shrink-0 space-y-4">
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

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRotation((r) => r - 90)}
                className="flex-1 bg-surface text-on-surface rounded-md py-2 text-[12px] font-medium hover:bg-surface-container-high transition-colors"
              >
                -90°
              </button>
              <button
                type="button"
                onClick={() => setRotation((r) => r + 90)}
                className="flex-1 bg-surface text-on-surface rounded-md py-2 text-[12px] font-medium hover:bg-surface-container-high transition-colors"
              >
                +90°
              </button>
              <button
                type="button"
                onClick={() => setFlipH((v) => !v)}
                className={`flex-1 rounded-md py-2 text-[12px] font-medium transition-colors ${
                  flipH
                    ? 'bg-primary/12 text-primary ring-1 ring-primary/20'
                    : 'bg-surface text-on-surface hover:bg-surface-container-high'
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
                    : 'bg-surface text-on-surface hover:bg-surface-container-high'
                }`}
              >
                Flip V
              </button>
              {hasStraightenTransform && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3 rounded-md py-2 text-[12px] font-medium text-on-surface/50 hover:text-on-surface bg-surface hover:bg-surface-container-high transition-colors"
                >
                  Reset
                </button>
              )}
            </div>

            {error && <p className="text-body-sm text-error">{error}</p>}
          </div>
        </>
      ) : (
        <>
          {/* Perspective mode: canvas */}
          <div className="flex-1 min-h-0 flex flex-col gap-2">
            <p className="text-body-sm text-secondary flex-shrink-0">
              Drag corners to align with the edges of a flat, rectangular quilt. This corrects for
              keystoning/perspective distortion.
            </p>
            <div
              ref={containerRef}
              className="flex-1 min-h-0 relative rounded-lg border border-outline-variant/20 bg-surface-container overflow-hidden"
            >
              <canvas
                ref={canvasRef}
                className="absolute inset-0 cursor-crosshair"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
            </div>
            {hasPerspectiveTransform && (
              <button
                type="button"
                onClick={handleResetPerspective}
                className="self-start px-3 py-1.5 text-[12px] font-medium text-on-surface/50 hover:text-on-surface bg-surface rounded-md hover:bg-surface-container-high transition-colors"
              >
                Reset Corners
              </button>
            )}
            {error && <p className="text-body-sm text-error">{error}</p>}
          </div>
        </>
      )}

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
          {applying
            ? 'Applying...'
            : mode === 'straighten'
              ? hasStraightenTransform
                ? 'Apply & Continue'
                : 'Continue'
              : 'Apply Perspective'}
        </button>
      </div>
    </div>
  );
}
