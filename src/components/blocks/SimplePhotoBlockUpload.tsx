'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
interface Point2D {
  x: number;
  y: number;
}

import { COLORS, CANVAS } from '@/lib/design-system';

interface SimplePhotoBlockUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (blockId?: string) => void;
  /** Pre-loaded image URL (from mobile uploads). Skips the upload step. */
  preloadedImageUrl?: string;
}

const HANDLE_RADIUS = 8;
const HIT_RADIUS = 16;
const MAX_FILE_SIZE = 20 * 1024 * 1024;

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

async function uploadToS3(blob: Blob, filename: string): Promise<string> {
  const presignRes = await fetch('/api/upload/presigned-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename,
      contentType: 'image/png',
      purpose: 'block',
    }),
  });

  if (!presignRes.ok) throw new Error('Failed to get upload URL');
  const { data } = await presignRes.json();

  const uploadRes = await fetch(data.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'image/png' },
    body: blob,
  });

  if (!uploadRes.ok) throw new Error('Upload to S3 failed');
  return data.publicUrl as string;
}

type Step = 'upload' | 'imagePrep' | 'crop';

export function SimplePhotoBlockUpload({
  isOpen,
  onClose,
  onSaved,
  preloadedImageUrl,
}: SimplePhotoBlockUploadProps) {
  const [step, setStep] = useState<Step>(preloadedImageUrl ? 'imagePrep' : 'upload');
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState('');
  const [preparedImage, setPreparedImage] = useState<HTMLImageElement | null>(null);
  const [corners, setCorners] = useState<[Point2D, Point2D, Point2D, Point2D] | null>(null);
  const [blockName, setBlockName] = useState('');
  const [category, setCategory] = useState('Custom');
  const [tags, setTags] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<Point2D>({ x: 0, y: 0 });

  const [prepMode, setPrepMode] = useState<'straighten' | 'perspective'>('straighten');
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [perspectiveCorners, setPerspectiveCorners] = useState<
    [Point2D, Point2D, Point2D, Point2D] | null
  >(null);
  const [applying, setApplying] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeImage = step === 'crop' ? preparedImage : originalImage;

  // Load preloaded image URL (from mobile uploads)
  useEffect(() => {
    if (!preloadedImageUrl || originalImage) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setOriginalImage(img);
      setOriginalImageUrl(preloadedImageUrl);
    };
    img.onerror = () => setError('Failed to load image from URL');
    img.src = preloadedImageUrl;
  }, [preloadedImageUrl, originalImage]);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.match(/^image\/(png|jpeg|jpg|webp)$/)) {
      setError('Please upload a PNG, JPEG, or WebP image');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('Image must be under 20 MB');
      return;
    }
    setError('');
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setOriginalImage(img);
      setOriginalImageUrl(url);
      setStep('imagePrep');
    };
    img.onerror = () => setError('Failed to load image');
    img.src = url;
  }, []);

  const handlePrepContinue = useCallback(async () => {
    if (!originalImage) return;

    if (prepMode === 'straighten') {
      const hasTransform = rotation !== 0 || flipH || flipV;
      if (!hasTransform) {
        setPreparedImage(originalImage);
        setStep('crop');
        return;
      }
      setApplying(true);
      setError('');
      try {
        const { img } = await applyTransform(originalImage, rotation, flipH, flipV);
        setPreparedImage(img);
        setRotation(0);
        setFlipH(false);
        setFlipV(false);
        setStep('crop');
      } catch {
        setError('Failed to apply adjustments. Please try again.');
      } finally {
        setApplying(false);
      }
    } else {
      if (!perspectiveCorners) {
        setPreparedImage(originalImage);
        setStep('crop');
        return;
      }
      setApplying(true);
      setError('');
      try {
        const canvas = applyPerspectiveCorrection(originalImage, perspectiveCorners);
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((b) => (b ? resolve(b) : reject()), 'image/png');
        });
        const url = URL.createObjectURL(blob);
        const newImg = new Image();
        newImg.onload = () => {
          setPreparedImage(newImg);
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
        setError('Failed to apply perspective correction.');
        setApplying(false);
      }
    }
  }, [originalImage, prepMode, rotation, flipH, flipV, perspectiveCorners]);

  // Fit image to container
  useEffect(() => {
    if (!activeImage || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const fitScale = Math.min(
      rect.width / activeImage.naturalWidth,
      rect.height / activeImage.naturalHeight,
      1
    );
    setScale(fitScale);
    setOffset({
      x: (rect.width - activeImage.naturalWidth * fitScale) / 2,
      y: (rect.height - activeImage.naturalHeight * fitScale) / 2,
    });
  }, [activeImage]);

  // Initialize perspective corners
  useEffect(() => {
    if (!originalImage || perspectiveCorners) return;
    const w = originalImage.naturalWidth;
    const h = originalImage.naturalHeight;
    const margin = Math.min(w, h) * 0.02;
    setPerspectiveCorners([
      { x: margin, y: margin },
      { x: w - margin, y: margin },
      { x: w - margin, y: h - margin },
      { x: margin, y: h - margin },
    ]);
  }, [originalImage, perspectiveCorners]);

  // Initialize crop corners
  useEffect(() => {
    if (!preparedImage || corners) return;
    const w = preparedImage.naturalWidth;
    const h = preparedImage.naturalHeight;
    const margin = Math.min(w, h) * 0.02;
    setCorners([
      { x: margin, y: margin },
      { x: w - margin, y: margin },
      { x: w - margin, y: h - margin },
      { x: margin, y: h - margin },
    ]);
  }, [preparedImage, corners]);

  // Draw perspective canvas
  useEffect(() => {
    if (
      step !== 'imagePrep' ||
      prepMode !== 'perspective' ||
      !canvasRef.current ||
      !originalImage ||
      !containerRef.current
    )
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
    if (perspectiveCorners) drawCropOverlay(ctx, perspectiveCorners, scale, offset);
  }, [step, prepMode, originalImage, perspectiveCorners, scale, offset]);

  // Draw crop canvas
  useEffect(() => {
    if (
      step !== 'crop' ||
      !canvasRef.current ||
      !preparedImage ||
      !containerRef.current ||
      !corners
    )
      return;
    const canvas = canvasRef.current;
    const rect = containerRef.current.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);
    ctx.drawImage(preparedImage, 0, 0);
    ctx.restore();
    drawCropOverlay(ctx, corners, scale, offset);
  }, [step, preparedImage, corners, scale, offset]);

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
      const activeCorners =
        step === 'imagePrep' && prepMode === 'perspective' ? perspectiveCorners : corners;
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

      if (
        step === 'imagePrep' &&
        prepMode === 'perspective' &&
        perspectiveCorners &&
        originalImage
      ) {
        const clampedX = Math.max(0, Math.min(originalImage.naturalWidth, pt.x));
        const clampedY = Math.max(0, Math.min(originalImage.naturalHeight, pt.y));
        const updated: [Point2D, Point2D, Point2D, Point2D] = [...perspectiveCorners];
        updated[dragIndex] = { x: clampedX, y: clampedY };
        setPerspectiveCorners(updated);
      } else if (step === 'crop' && corners && preparedImage) {
        const clampedX = Math.max(0, Math.min(preparedImage.naturalWidth, pt.x));
        const clampedY = Math.max(0, Math.min(preparedImage.naturalHeight, pt.y));
        const updated: [Point2D, Point2D, Point2D, Point2D] = [...corners];
        updated[dragIndex] = { x: clampedX, y: clampedY };
        setCorners(updated);
      }
    },
    [
      dragIndex,
      step,
      prepMode,
      perspectiveCorners,
      corners,
      originalImage,
      preparedImage,
      getCanvasPoint,
    ]
  );

  const handleMouseUp = useCallback(() => setDragIndex(null), []);

  const handleSave = useCallback(async () => {
    if (!blockName.trim()) {
      setError('Block name is required');
      return;
    }
    if (!preparedImage || !corners) return;

    setSaving(true);
    setError('');

    try {
      const croppedCanvas = applyCrop(preparedImage, corners);
      const blob = await new Promise<Blob>((resolve, reject) => {
        croppedCanvas.toBlob((b) => (b ? resolve(b) : reject()), 'image/png');
      });

      const imageUrl = await uploadToS3(blob, `${blockName.trim()}.png`);

      const svgData = [
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">',
        `<image href="${imageUrl}" width="100" height="100" preserveAspectRatio="xMidYMid meet"/>`,
        '</svg>',
      ].join('');

      const res = await fetch('/api/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: blockName.trim(),
          category: category.trim() || 'Custom',
          svgData,
          fabricJsData: { type: 'photo-block', imageUrl },
          tags: tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });

      if (!res.ok) {
        const respData = await res.json();
        setError(respData.error ?? 'Failed to save block');
        return;
      }

      const respData = await res.json();
      onSaved(respData.data?.id);
      onClose();
    } catch {
      setError('Failed to save block');
    } finally {
      setSaving(false);
    }
  }, [blockName, category, tags, preparedImage, corners, onSaved, onClose]);

  if (!isOpen) return null;

  return (
    <div className="space-y-4">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2">
        {(['upload', 'imagePrep', 'crop'] as Step[]).map((s, index) => (
          <div key={s}>
            <div
              className={`rounded-full transition-colors duration-150 ${
                step === s
                  ? 'w-6 h-2 bg-primary'
                  : index < (['upload', 'imagePrep', 'crop'] as Step[]).indexOf(step)
                    ? 'w-2 h-2 bg-primary/50'
                    : 'w-2 h-2 bg-[var(--color-border)]/40'
              }`}
            />
          </div>
        ))}
      </div>

      {step === 'upload' && (
        <div className="space-y-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex h-64 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-[var(--color-border)] bg-[var(--color-bg)] hover:bg-[var(--color-bg)]"
          >
            <p className="text-[14px] leading-[20px] text-[var(--color-text-dim)]">
              Click to upload or drag and drop
            </p>
            <p className="mt-1 text-[14px] leading-[20px] text-[var(--color-text-dim)]">
              PNG, JPEG, or WebP (max 20MB)
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            className="hidden"
          />
        </div>
      )}

      {step === 'imagePrep' && (
        <div className="space-y-4">
          <div className="flex items-center gap-1 bg-[var(--color-bg)] rounded-full p-1">
            <button
              type="button"
              onClick={() => setPrepMode('straighten')}
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
              className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                prepMode === 'perspective'
                  ? 'bg-[var(--color-bg)] text-[var(--color-text)] shadow'
                  : 'text-[var(--color-text-dim)] hover:text-[var(--color-text)]'
              }`}
            >
              Perspective
            </button>
          </div>

          {prepMode === 'straighten' ? (
            <>
              <div className="flex justify-center items-center rounded-lg border border-[var(--color-border)]/20 bg-[var(--color-bg)] p-4 overflow-hidden h-80">
                {originalImageUrl && (
                  <img
                    src={originalImageUrl}
                    alt="Preview"
                    className="max-h-full max-w-full object-contain transition-colors duration-150"
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
                )}
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[14px] leading-[20px] font-medium text-[var(--color-text)]/60">
                      Straighten
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
                    className="w-full accent-primary"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setRotation((r) => r - 90)}
                    className="flex-1 bg-[var(--color-bg)] text-[var(--color-text)] rounded-full py-2 text-xs font-medium hover:bg-[var(--color-bg)]"
                  >
                    -90°
                  </button>
                  <button
                    type="button"
                    onClick={() => setRotation((r) => r + 90)}
                    className="flex-1 bg-[var(--color-bg)] text-[var(--color-text)] rounded-full py-2 text-xs font-medium hover:bg-[var(--color-bg)]"
                  >
                    +90°
                  </button>
                  <button
                    type="button"
                    onClick={() => setFlipH((v) => !v)}
                    className={`flex-1 rounded-full py-2 text-xs font-medium transition-colors ${flipH ? 'bg-primary/12 text-primary ring-1 ring-primary/30' : 'bg-[var(--color-bg)] text-[var(--color-text)] hover:bg-[var(--color-bg)]'}`}
                  >
                    Flip H
                  </button>
                  <button
                    type="button"
                    onClick={() => setFlipV((v) => !v)}
                    className={`flex-1 rounded-full py-2 text-xs font-medium transition-colors ${flipV ? 'bg-primary/12 text-primary ring-1 ring-primary/30' : 'bg-[var(--color-bg)] text-[var(--color-text)] hover:bg-[var(--color-bg)]'}`}
                  >
                    Flip V
                  </button>
                  {(rotation !== 0 || flipH || flipV) && (
                    <button
                      type="button"
                      onClick={() => {
                        setRotation(0);
                        setFlipH(false);
                        setFlipV(false);
                      }}
                      className="px-3 rounded-full py-2 text-xs font-medium text-[var(--color-text)]/50 hover:text-[var(--color-text)] bg-[var(--color-bg)] hover:bg-[var(--color-bg)]"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              <p className="text-[14px] leading-[20px] text-[var(--color-text-dim)]">
                Drag corners to align with the edges of your block.
              </p>
              <div
                ref={containerRef}
                className="relative h-96 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]"
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
                  }}
                  className="self-start px-3 py-1.5 text-[14px] leading-[20px] font-medium text-[var(--color-text)]/50 hover:text-[var(--color-text)] bg-[var(--color-bg)] rounded-full hover:bg-[var(--color-bg)]"
                >
                  Reset Corners
                </button>
              )}
            </>
          )}

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setStep('upload')}
              className="px-4 py-2 text-[14px] leading-[20px] text-[var(--color-text-dim)] hover:text-[var(--color-text)]"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handlePrepContinue}
              disabled={applying}
              className="px-6 py-2 text-sm font-medium text-white bg-primary rounded-full hover:opacity-90 disabled:opacity-50"
            >
              {applying ? 'Applying...' : 'Continue'}
            </button>
          </div>
        </div>
      )}

      {step === 'crop' && (
        <div className="space-y-3">
          <p className="text-[14px] leading-[20px] text-[var(--color-text-dim)]">
            Adjust the crop area to frame your block perfectly.
          </p>
          <div
            ref={containerRef}
            className="relative h-96 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]"
          >
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="cursor-crosshair"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="photo-block-name"
                className="mb-1 block text-[14px] leading-[20px] font-medium text-[var(--color-text-dim)]"
              >
                Block Name *
              </label>
              <input
                id="photo-block-name"
                type="text"
                value={blockName}
                onChange={(e) => setBlockName(e.target.value)}
                placeholder="My Block"
                maxLength={255}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-2.5 py-1.5 text-[14px] leading-[20px] focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="photo-block-category"
                className="mb-1 block text-[14px] leading-[20px] font-medium text-[var(--color-text-dim)]"
              >
                Category
              </label>
              <input
                id="photo-block-category"
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Custom"
                maxLength={100}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-2.5 py-1.5 text-[14px] leading-[20px] focus:border-primary focus:outline-none"
              />
            </div>
            <div className="col-span-2">
              <label
                htmlFor="photo-block-tags"
                className="mb-1 block text-[14px] leading-[20px] font-medium text-[var(--color-text-dim)]"
              >
                Tags
              </label>
              <input
                id="photo-block-tags"
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="modern, geometric"
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-2.5 py-1.5 text-[14px] leading-[20px] focus:border-primary focus:outline-none"
              />
            </div>
          </div>
          {error && <p className="text-sm text-error">{error}</p>}
          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => {
                setCorners(null);
                setStep('imagePrep');
              }}
              className="px-4 py-2 text-[14px] leading-[20px] text-[var(--color-text-dim)] hover:text-[var(--color-text)]"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 text-sm font-medium text-white bg-primary rounded-full hover:opacity-90 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Block'}
            </button>
          </div>
        </div>
      )}

      {error && step === 'upload' && <p className="text-sm text-error">{error}</p>}
    </div>
  );
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
  ctx.strokeStyle = CANVAS.pencilPreview;
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
  ctx.fillStyle = CANVAS.pencilPreview + '10';
  ctx.fill();

  for (let i = 0; i < 4; i++) {
    const pt = corners[i];
    const sx = pt.x * scale + offset.x;
    const sy = pt.y * scale + offset.y;
    ctx.beginPath();
    ctx.arc(sx, sy, HANDLE_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = CANVAS.pencilPreview;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = COLORS.surface;
    ctx.stroke();
  }
  ctx.restore();
}
