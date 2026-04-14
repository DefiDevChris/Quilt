'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface Point2D {
  x: number;
  y: number;
}

const HANDLE_RADIUS = 8;
const HIT_RADIUS = 16;

interface BlockCropDialogProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  filename: string;
  onSaved: (blockId: string) => void;
}

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

function applyPerspectiveCorrection(
  image: HTMLImageElement,
  corners: [Point2D, Point2D, Point2D, Point2D]
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const minX = Math.min(corners[0].x, corners[1].x, corners[2].x, corners[3].x);
  const minY = Math.min(corners[0].y, corners[1].y, corners[2].y, corners[3].y);
  const maxX = Math.max(corners[0].x, corners[1].x, corners[2].x, corners[3].x);
  const maxY = Math.max(corners[0].y, corners[1].y, corners[2].y, corners[3].y);

  canvas.width = maxX - minX;
  canvas.height = maxY - minY;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(image, -minX, -minY);
  return canvas;
}

function applyCrop(
  image: HTMLImageElement,
  corners: [Point2D, Point2D, Point2D, Point2D]
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const minX = Math.min(corners[0].x, corners[1].x, corners[2].x, corners[3].x);
  const minY = Math.min(corners[0].y, corners[1].y, corners[2].y, corners[3].y);
  const maxX = Math.max(corners[0].x, corners[1].x, corners[2].x, corners[3].x);
  const maxY = Math.max(corners[0].y, corners[1].y, corners[2].y, corners[3].y);

  canvas.width = maxX - minX;
  canvas.height = maxY - minY;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(image, -minX, -minY);
  return canvas;
}

function drawCropOverlay(
  ctx: CanvasRenderingContext2D,
  corners: [Point2D, Point2D, Point2D, Point2D],
  scale: number,
  offset: Point2D
) {
  ctx.save();
  ctx.setLineDash([6, 4]);
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#ffc8a6';
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const pt = corners[i];
    const sx = pt.x * scale + offset.x;
    const sy = pt.y * scale + offset.y;
    if (i === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#ffc8a610';
  ctx.fill();

  for (let i = 0; i < 4; i++) {
    const pt = corners[i];
    const sx = pt.x * scale + offset.x;
    const sy = pt.y * scale + offset.y;
    ctx.beginPath();
    ctx.arc(sx, sy, HANDLE_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = '#ffc8a6';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
  }
  ctx.restore();
}

async function uploadCroppedToS3(blob: Blob, filename: string): Promise<string> {
  const presignRes = await fetch('/api/upload/presigned-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: `cropped-${filename}.png`,
      contentType: 'image/png',
      purpose: 'block',
    }),
  });

  if (!presignRes.ok) throw new Error('Failed to get upload URL');
  const { data } = await presignRes.json();

  const uploadRes = await fetch(data.uploadUrl as string, {
    method: 'PUT',
    headers: { 'Content-Type': 'image/png' },
    body: blob,
  });

  if (!uploadRes.ok) throw new Error('Upload to S3 failed');
  return data.publicUrl as string;
}

type CropStep = 'straighten' | 'crop';

export function BlockCropDialog({
  isOpen,
  onClose,
  imageUrl,
  filename,
  onSaved,
}: BlockCropDialogProps) {
  const [step, setStep] = useState<CropStep>('straighten');
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [displayUrl, setDisplayUrl] = useState(imageUrl);
  const [corners, setCorners] = useState<[Point2D, Point2D, Point2D, Point2D] | null>(null);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<Point2D>({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blockName, setBlockName] = useState(filename);
  const [category, setCategory] = useState('Custom');

  const [prepMode, setPrepMode] = useState<'straighten' | 'perspective'>('straighten');
  const [perspectiveCorners, setPerspectiveCorners] = useState<
    [Point2D, Point2D, Point2D, Point2D] | null
  >(null);
  const [applying, setApplying] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImage(img);
    };
    img.onerror = () => setError('Failed to load image');
    img.src = imageUrl;
  }, [imageUrl]);

  // Fit image to container
  useEffect(() => {
    if (!image || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const fitScale = Math.min(
      rect.width / image.naturalWidth,
      rect.height / image.naturalHeight,
      1
    );
    setScale(fitScale);
    setOffset({
      x: (rect.width - image.naturalWidth * fitScale) / 2,
      y: (rect.height - image.naturalHeight * fitScale) / 2,
    });
  }, [image, displayUrl]);

  // Initialize perspective corners
  useEffect(() => {
    if (!image || perspectiveCorners || prepMode !== 'perspective') return;
    const w = image.naturalWidth;
    const h = image.naturalHeight;
    const margin = Math.min(w, h) * 0.02;
    setPerspectiveCorners([
      { x: margin, y: margin },
      { x: w - margin, y: margin },
      { x: w - margin, y: h - margin },
      { x: margin, y: h - margin },
    ]);
  }, [image, perspectiveCorners, prepMode]);

  // Initialize crop corners
  useEffect(() => {
    if (!image || corners || step !== 'crop') return;
    const w = image.naturalWidth;
    const h = image.naturalHeight;
    const margin = Math.min(w, h) * 0.02;
    setCorners([
      { x: margin, y: margin },
      { x: w - margin, y: margin },
      { x: w - margin, y: h - margin },
      { x: margin, y: h - margin },
    ]);
  }, [image, corners, step]);

  // Draw canvas
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current || !image) return;
    const canvas = canvasRef.current;
    const rect = containerRef.current.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);

    if (step === 'straighten' && prepMode === 'straighten') {
      // Apply CSS-like transform for preview
      const rad = (rotation * Math.PI) / 180;
      const cx = image.naturalWidth / 2;
      const cy = image.naturalHeight / 2;
      ctx.translate(cx, cy);
      ctx.rotate(rad);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      ctx.drawImage(image, -cx, -cy);
    } else {
      ctx.drawImage(image, 0, 0);
    }

    ctx.restore();

    // Draw overlay
    const activeCorners =
      step === 'straighten' && prepMode === 'perspective' ? perspectiveCorners : corners;
    if (activeCorners) {
      drawCropOverlay(ctx, activeCorners, scale, offset);
    }
  }, [image, scale, offset, rotation, flipH, flipV, corners, perspectiveCorners, step, prepMode]);

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
      if (step === 'straighten' && prepMode !== 'perspective') return;
      const activeCorners = prepMode === 'perspective' ? perspectiveCorners : corners;
      if (!activeCorners) return;
      const pt = getCanvasPoint(e);
      const hitRadius = HIT_RADIUS / scale;
      for (let i = 0; i < 4; i++) {
        const corner = activeCorners[i];
        const dx = pt.x - corner.x;
        const dy = pt.y - corner.y;
        if (dx * dx + dy * dy <= hitRadius * hitRadius) {
          setDragIndex(i);
          return;
        }
      }
    },
    [step, prepMode, perspectiveCorners, corners, getCanvasPoint, scale]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (dragIndex === null) return;
      const pt = getCanvasPoint(e);

      if (prepMode === 'perspective' && perspectiveCorners && image) {
        const clampedX = Math.max(0, Math.min(image.naturalWidth, pt.x));
        const clampedY = Math.max(0, Math.min(image.naturalHeight, pt.y));
        const updated: [Point2D, Point2D, Point2D, Point2D] = [...perspectiveCorners];
        updated[dragIndex] = { x: clampedX, y: clampedY };
        setPerspectiveCorners(updated);
      } else if (step === 'crop' && corners && image) {
        const clampedX = Math.max(0, Math.min(image.naturalWidth, pt.x));
        const clampedY = Math.max(0, Math.min(image.naturalHeight, pt.y));
        const updated: [Point2D, Point2D, Point2D, Point2D] = [...corners];
        updated[dragIndex] = { x: clampedX, y: clampedY };
        setCorners(updated);
      }
    },
    [dragIndex, prepMode, perspectiveCorners, corners, image, step, getCanvasPoint]
  );

  const handleMouseUp = useCallback(() => setDragIndex(null), []);

  const handleContinue = useCallback(async () => {
    if (!image) return;

    if (step === 'straighten') {
      if (prepMode === 'straighten') {
        const hasTransform = rotation !== 0 || flipH || flipV;
        if (!hasTransform) {
          setStep('crop');
          return;
        }
        setApplying(true);
        setError(null);
        try {
          const { img, url } = await applyTransform(image, rotation, flipH, flipV);
          setImage(img);
          setDisplayUrl(url);
          setRotation(0);
          setFlipH(false);
          setFlipV(false);
          setStep('crop');
        } catch {
          setError('Failed to apply adjustments');
        } finally {
          setApplying(false);
        }
      } else {
        if (!perspectiveCorners) {
          setStep('crop');
          return;
        }
        setApplying(true);
        setError(null);
        try {
          const canvas = applyPerspectiveCorrection(image, perspectiveCorners);
          const blob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob((b) => (b ? resolve(b) : reject()), 'image/png');
          });
          const url = URL.createObjectURL(blob);
          const newImg = new Image();
          newImg.onload = () => {
            setImage(newImg);
            setDisplayUrl(url);
            setPerspectiveCorners(null);
            setStep('crop');
            setApplying(false);
          };
          newImg.onerror = () => {
            URL.revokeObjectURL(url);
            setError('Failed to load corrected image');
            setApplying(false);
          };
          newImg.src = url;
        } catch {
          setError('Failed to apply perspective correction');
          setApplying(false);
        }
      }
    } else {
      // Already in crop step, go to save
      handleSave();
    }
  }, [image, step, prepMode, rotation, flipH, flipV, perspectiveCorners]);

  const handleSave = useCallback(async () => {
    if (!blockName.trim()) {
      setError('Block name is required');
      return;
    }
    if (!image || !corners) return;

    setSaving(true);
    setError(null);

    try {
      const croppedCanvas = applyCrop(image, corners);
      const blob = await new Promise<Blob>((resolve, reject) => {
        croppedCanvas.toBlob((b) => (b ? resolve(b) : reject()), 'image/png');
      });

      const croppedUrl = await uploadCroppedToS3(blob, blockName.trim());

      // Create the block via API
      const svgData = [
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">',
        `<image href="${croppedUrl}" width="100" height="100" preserveAspectRatio="xMidYMid meet"/>`,
        '</svg>',
      ].join('');

      const res = await fetch('/api/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: blockName.trim(),
          category: category.trim() || 'Custom',
          svgData,
          fabricJsData: { type: 'photo-block', imageUrl: croppedUrl },
          tags: [],
        }),
      });

      if (!res.ok) {
        const respData = await res.json();
        setError(respData.error ?? 'Failed to save block');
        setSaving(false);
        return;
      }

      const respData = await res.json();
      onSaved(respData.data?.id as string);
    } catch {
      setError('Failed to save block');
    } finally {
      setSaving(false);
    }
  }, [blockName, category, image, corners, onSaved]);

  const handleClose = useCallback(() => {
    if (displayUrl !== imageUrl) URL.revokeObjectURL(displayUrl);
    onClose();
  }, [displayUrl, imageUrl, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={handleClose}
        onKeyDown={(e) => e.key === 'Escape' && handleClose()}
        role="button"
        tabIndex={0}
        aria-label="Close crop dialog"
      />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-2xl rounded-lg bg-[var(--color-surface)] shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]/20">
          <h2 className="text-[16px] leading-[24px] font-semibold text-[var(--color-text)]">
            Crop & Straighten
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition-colors duration-150"
            aria-label="Close"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="5" y1="5" x2="15" y2="15" />
              <line x1="15" y1="5" x2="5" y2="15" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-4" role="tablist">
            {(['straighten', 'crop'] as CropStep[]).map((s, index) => (
              <div key={s} role="tab" aria-selected={step === s}>
                <div
                  className={`transition-colors duration-150 ${
                    step === s
                      ? 'w-6 h-2 bg-[var(--color-primary)] rounded-full'
                      : index < (['straighten', 'crop'] as CropStep[]).indexOf(step)
                        ? 'w-2 h-2 bg-[var(--color-primary)]/50 rounded-full'
                        : 'w-2 h-2 bg-[var(--color-border)]/40 rounded-full'
                  }`}
                />
              </div>
            ))}
          </div>

          {/* Prep mode toggle */}
          {step === 'straighten' && (
            <div
              className="flex items-center gap-1 bg-[var(--color-bg)] rounded-full p-1 mb-4"
              role="group"
            >
              <button
                type="button"
                onClick={() => setPrepMode('straighten')}
                aria-pressed={prepMode === 'straighten'}
                className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                  prepMode === 'straighten'
                    ? 'bg-[var(--color-bg)] text-[var(--color-text)] shadow'
                    : 'text-[var(--color-text-dim)] hover:text-[var(--color-text)]'
                }`}
              >
                Straighten
              </button>
              <button
                type="button"
                onClick={() => setPrepMode('perspective')}
                aria-pressed={prepMode === 'perspective'}
                className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                  prepMode === 'perspective'
                    ? 'bg-[var(--color-bg)] text-[var(--color-text)] shadow'
                    : 'text-[var(--color-text-dim)] hover:text-[var(--color-text)]'
                }`}
              >
                Perspective
              </button>
            </div>
          )}

          {/* Straighten controls */}
          {step === 'straighten' && prepMode === 'straighten' && (
            <div className="space-y-3">
              <div className="flex justify-center items-center rounded-lg border border-[var(--color-border)]/20 bg-[var(--color-bg)] p-4 overflow-hidden h-64">
                <img
                  src={displayUrl}
                  alt="Preview"
                  className="max-h-full max-w-full object-contain transition-transform duration-150"
                  style={{
                    transform: [
                      `rotate(${rotation}deg)`,
                      flipH ? 'scaleX(-1)' : '',
                      flipV ? 'scaleY(-1)' : '',
                    ]
                      .filter(Boolean)
                      .join(' '),
                  }}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[14px] leading-[20px] font-medium text-[var(--color-text)]/60">
                    Rotation
                  </span>
                  <span className="text-[14px] leading-[20px] font-mono text-[var(--color-text)]/50">
                    {rotation}°
                  </span>
                </div>
                <input
                  type="range"
                  min={-45}
                  max={45}
                  step={0.5}
                  value={rotation}
                  onChange={(e) => setRotation(parseFloat(e.target.value))}
                  className="w-full accent-[var(--color-primary)]"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRotation((r) => r - 90)}
                  className="flex-1 bg-[var(--color-bg)] text-[var(--color-text)] rounded-full py-2 text-xs font-medium hover:bg-[var(--color-bg)]/80 transition-colors"
                >
                  -90°
                </button>
                <button
                  type="button"
                  onClick={() => setRotation((r) => r + 90)}
                  className="flex-1 bg-[var(--color-bg)] text-[var(--color-text)] rounded-full py-2 text-xs font-medium hover:bg-[var(--color-bg)]/80 transition-colors"
                >
                  +90°
                </button>
                <button
                  type="button"
                  onClick={() => setFlipH((v) => !v)}
                  className={`flex-1 rounded-full py-2 text-xs font-medium transition-colors ${flipH ? 'bg-[var(--color-primary)]/12 text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/30' : 'bg-[var(--color-bg)] text-[var(--color-text)] hover:bg-[var(--color-bg)]/80'}`}
                >
                  Flip H
                </button>
                <button
                  type="button"
                  onClick={() => setFlipV((v) => !v)}
                  className={`flex-1 rounded-full py-2 text-xs font-medium transition-colors ${flipV ? 'bg-[var(--color-primary)]/12 text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/30' : 'bg-[var(--color-bg)] text-[var(--color-text)] hover:bg-[var(--color-bg)]/80'}`}
                >
                  Flip V
                </button>
              </div>
            </div>
          )}

          {/* Perspective controls */}
          {step === 'straighten' && prepMode === 'perspective' && (
            <div className="space-y-3">
              <p className="text-[14px] leading-[20px] text-[var(--color-text-dim)]">
                Drag corners to align with the edges of your block.
              </p>
              <div
                ref={containerRef}
                className="relative h-80 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]"
              >
                <canvas
                  ref={canvasRef}
                  className="cursor-crosshair"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                />
              </div>
              {perspectiveCorners && (
                <button
                  type="button"
                  onClick={() => {
                    if (!image) return;
                    const w = image.naturalWidth;
                    const h = image.naturalHeight;
                    const margin = Math.min(w, h) * 0.02;
                    setPerspectiveCorners([
                      { x: margin, y: margin },
                      { x: w - margin, y: margin },
                      { x: w - margin, y: h - margin },
                      { x: margin, y: h - margin },
                    ]);
                  }}
                  className="px-3 py-1.5 text-[14px] leading-[20px] font-medium text-[var(--color-text-dim)] hover:text-[var(--color-text)] bg-[var(--color-bg)] rounded-full transition-colors"
                >
                  Reset Corners
                </button>
              )}
            </div>
          )}

          {/* Crop controls */}
          {step === 'crop' && (
            <div className="space-y-3">
              <p className="text-[14px] leading-[20px] text-[var(--color-text-dim)]">
                Drag corners to crop your block.
              </p>
              <div
                ref={containerRef}
                className="relative h-80 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]"
              >
                <canvas
                  ref={canvasRef}
                  className="cursor-crosshair"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                />
              </div>
              {/* Block name */}
              <div className="space-y-1">
                <label className="text-[14px] leading-[20px] font-medium text-[var(--color-text)]">
                  Block Name
                </label>
                <input
                  type="text"
                  value={blockName}
                  onChange={(e) => setBlockName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-[14px] leading-[20px] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
                  placeholder="Enter block name"
                />
              </div>
            </div>
          )}

          {error && (
            <p className="mt-3 text-[14px] leading-[20px] text-[var(--color-primary)]">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--color-border)]/20">
          {step === 'straighten' ? (
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-full text-[14px] leading-[20px] text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition-colors duration-150"
            >
              Cancel
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStep('straighten')}
              className="px-4 py-2 rounded-full text-[14px] leading-[20px] text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition-colors duration-150"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={step === 'crop' ? handleSave : handleContinue}
            disabled={saving || applying}
            className="px-6 py-2 rounded-full text-sm font-medium bg-[var(--color-primary)] text-[var(--color-text)] hover:bg-[var(--color-primary)]/90 transition-colors duration-150 disabled:opacity-50"
          >
            {saving
              ? 'Saving...'
              : applying
                ? 'Applying...'
                : step === 'crop'
                  ? 'Save Block'
                  : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
