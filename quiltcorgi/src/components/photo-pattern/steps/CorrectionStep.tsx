'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePhotoPatternStore } from '@/stores/photoPatternStore';
import { loadOpenCv } from '@/lib/opencv-loader';
import { autoDetectQuiltBoundary, sortCornersClockwise } from '@/lib/perspective-utils';
import type { Point2D } from '@/lib/photo-pattern-types';
import { PHOTO_PATTERN_OVERLAY_COLOR } from '@/lib/constants';

const HANDLE_RADIUS = 8;
const HIT_RADIUS = 16;

function rotateImage90(
  image: HTMLImageElement,
  clockwise: boolean
): Promise<{ img: HTMLImageElement; url: string }> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalHeight;
    canvas.height = image.naturalWidth;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    ctx.save();
    if (clockwise) {
      ctx.translate(canvas.width, 0);
      ctx.rotate(Math.PI / 2);
    } else {
      ctx.translate(0, canvas.height);
      ctx.rotate(-Math.PI / 2);
    }
    ctx.drawImage(image, 0, 0);
    ctx.restore();

    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to create rotated image'));
        return;
      }
      const url = URL.createObjectURL(blob);
      const newImg = new Image();
      newImg.onload = () => resolve({ img: newImg, url });
      newImg.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load rotated image'));
      };
      newImg.src = url;
    }, 'image/png');
  });
}

export function CorrectionStep() {
  const originalImage = usePhotoPatternStore((s) => s.originalImage);
  const perspectiveCorners = usePhotoPatternStore((s) => s.perspectiveCorners);
  const setPerspectiveCorners = usePhotoPatternStore((s) => s.setPerspectiveCorners);
  const setOriginalImage = usePhotoPatternStore((s) => s.setOriginalImage);
  const setStep = usePhotoPatternStore((s) => s.setStep);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [autoLoading, setAutoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<Point2D>({ x: 0, y: 0 });

  // Initialize corners to image edges if not set
  useEffect(() => {
    if (!originalImage) return;
    if (perspectiveCorners) return;

    const w = originalImage.naturalWidth;
    const h = originalImage.naturalHeight;
    const margin = Math.min(w, h) * 0.02;

    setPerspectiveCorners([
      { x: margin, y: margin },
      { x: w - margin, y: margin },
      { x: w - margin, y: h - margin },
      { x: margin, y: h - margin },
    ]);
  }, [originalImage, perspectiveCorners, setPerspectiveCorners]);

  // Compute scale to fit container
  useEffect(() => {
    if (!originalImage || !containerRef.current) return;

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
  }, [originalImage]);

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !originalImage || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    canvas.width = containerRect.width;
    canvas.height = containerRect.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw image
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);
    ctx.drawImage(originalImage, 0, 0);
    ctx.restore();

    // Draw quad and handles
    if (perspectiveCorners) {
      ctx.save();

      // Draw quad outline
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

      // Draw fill with low opacity
      ctx.setLineDash([]);
      ctx.fillStyle = `${PHOTO_PATTERN_OVERLAY_COLOR}15`;
      ctx.fill();

      // Draw corner handles
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
  }, [originalImage, perspectiveCorners, scale, offset]);

  // Corner dragging handlers
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

  const handleAutoCorrect = useCallback(async () => {
    if (!originalImage) return;

    setAutoLoading(true);
    setError(null);

    try {
      const cv = await loadOpenCv();

      const canvas = document.createElement('canvas');
      canvas.width = originalImage.naturalWidth;
      canvas.height = originalImage.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');
      ctx.drawImage(originalImage, 0, 0);

      const imageMat = cv.imread(canvas);
      try {
        const detected = autoDetectQuiltBoundary(cv, imageMat);
        const sorted = detected ? sortCornersClockwise(detected) : null;
        if (sorted) {
          setPerspectiveCorners(sorted);
        } else {
          setError('No quilt boundary detected. Try adjusting corners manually.');
        }
      } finally {
        imageMat.delete();
      }
    } catch {
      setError('Auto-detection failed. You can still adjust corners manually.');
    } finally {
      setAutoLoading(false);
    }
  }, [originalImage, setPerspectiveCorners]);

  const handleRotate = useCallback(
    async (clockwise: boolean) => {
      if (!originalImage) return;

      try {
        const { img, url } = await rotateImage90(originalImage, clockwise);
        setOriginalImage(img, url);
        // Reset corners for the rotated image
        setPerspectiveCorners([
          { x: img.naturalWidth * 0.02, y: img.naturalHeight * 0.02 },
          { x: img.naturalWidth * 0.98, y: img.naturalHeight * 0.02 },
          { x: img.naturalWidth * 0.98, y: img.naturalHeight * 0.98 },
          { x: img.naturalWidth * 0.02, y: img.naturalHeight * 0.98 },
        ]);
      } catch {
        setError('Rotation failed. Please try again.');
      }
    },
    [originalImage, setOriginalImage, setPerspectiveCorners]
  );

  const handleRenderPattern = useCallback(() => {
    setStep('processing');
  }, [setStep]);

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Top toolbar */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={handleAutoCorrect}
          disabled={autoLoading}
          className="px-3 py-1.5 text-body-sm font-medium text-on-surface bg-surface-container rounded-md hover:bg-surface-container-high transition-colors border border-outline-variant/20 disabled:opacity-40"
        >
          {autoLoading ? 'Detecting...' : 'Auto-detect Boundary'}
        </button>

        <div className="w-px h-6 bg-outline-variant/30" />

        <button
          type="button"
          onClick={() => handleRotate(false)}
          title="Rotate 90\u00b0 counter-clockwise"
          className="w-8 h-8 flex items-center justify-center text-secondary hover:text-on-surface transition-colors rounded-md hover:bg-surface-container"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              d="M3 9C3 5.68629 5.68629 3 9 3C12.3137 3 15 5.68629 15 9C15 12.3137 12.3137 15 9 15"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M6 3L3 6L0 3"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              transform="translate(1, -1)"
            />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => handleRotate(true)}
          title="Rotate 90\u00b0 clockwise"
          className="w-8 h-8 flex items-center justify-center text-secondary hover:text-on-surface transition-colors rounded-md hover:bg-surface-container"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              d="M15 9C15 5.68629 12.3137 3 9 3C5.68629 3 3 5.68629 3 9C3 12.3137 5.68629 15 9 15"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M12 3L15 6L18 3"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              transform="translate(-1, -1)"
            />
          </svg>
        </button>

        {error && <p className="text-body-sm text-error ml-2">{error}</p>}
      </div>

      {/* Canvas area */}
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

      {/* Bottom action */}
      <div className="flex items-center justify-between flex-shrink-0">
        <p className="text-body-sm text-secondary">Drag corners to align with your quilt edges</p>
        <button
          type="button"
          onClick={handleRenderPattern}
          className="px-6 py-2.5 text-body-md font-medium text-on-primary bg-primary rounded-lg hover:bg-primary/90 transition-colors"
        >
          Render Pattern
        </button>
      </div>
    </div>
  );
}
