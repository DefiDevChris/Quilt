'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { loadOpenCv } from '@/lib/opencv-loader';
import { autoDetectQuiltBoundary, sortCornersClockwise } from '@/lib/perspective-utils';
import type { Point2D } from '@/lib/photo-pattern-types';
import { PHOTO_PATTERN_OVERLAY_COLOR } from '@/lib/constants';

interface PhotoBlockUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const HANDLE_RADIUS = 8;
const HIT_RADIUS = 16;
const MAX_FILE_SIZE = 20 * 1024 * 1024;

function rotateImage90(image: HTMLImageElement, clockwise: boolean): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalHeight;
    canvas.height = image.naturalWidth;
    const ctx = canvas.getContext('2d');
    if (!ctx) return reject(new Error('Canvas context failed'));

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
      if (!blob) return reject(new Error('Blob creation failed'));
      const url = URL.createObjectURL(blob);
      const newImg = new Image();
      newImg.onload = () => resolve(newImg);
      newImg.onerror = () => reject(new Error('Image load failed'));
      newImg.src = url;
    }, 'image/png');
  });
}

function applyPerspectiveCorrection(
  cv: typeof import('@techstark/opencv-js'),
  image: HTMLImageElement,
  corners: [Point2D, Point2D, Point2D, Point2D]
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(image, 0, 0);

  const src = cv.imread(canvas);
  const srcCorners = cv.matFromArray(4, 1, cv.CV_32FC2, [
    corners[0].x, corners[0].y,
    corners[1].x, corners[1].y,
    corners[2].x, corners[2].y,
    corners[3].x, corners[3].y,
  ]);

  const width = Math.max(
    Math.hypot(corners[1].x - corners[0].x, corners[1].y - corners[0].y),
    Math.hypot(corners[2].x - corners[3].x, corners[2].y - corners[3].y)
  );
  const height = Math.max(
    Math.hypot(corners[3].x - corners[0].x, corners[3].y - corners[0].y),
    Math.hypot(corners[2].x - corners[1].x, corners[2].y - corners[1].y)
  );

  const dstCorners = cv.matFromArray(4, 1, cv.CV_32FC2, [
    0, 0,
    width, 0,
    width, height,
    0, height,
  ]);

  const M = cv.getPerspectiveTransform(srcCorners, dstCorners);
  const dst = new cv.Mat();
  cv.warpPerspective(src, dst, M, new cv.Size(width, height));

  const outCanvas = document.createElement('canvas');
  cv.imshow(outCanvas, dst);

  src.delete();
  dst.delete();
  M.delete();
  srcCorners.delete();
  dstCorners.delete();

  return outCanvas;
}

export function PhotoBlockUpload({ isOpen, onClose, onSaved }: PhotoBlockUploadProps) {
  const [step, setStep] = useState<'upload' | 'crop'>('upload');
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [corners, setCorners] = useState<[Point2D, Point2D, Point2D, Point2D] | null>(null);
  const [blockName, setBlockName] = useState('');
  const [category, setCategory] = useState('Custom');
  const [tags, setTags] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<Point2D>({ x: 0, y: 0 });
  const [autoLoading, setAutoLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
      setImage(img);
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const margin = Math.min(w, h) * 0.02;
      setCorners([
        { x: margin, y: margin },
        { x: w - margin, y: margin },
        { x: w - margin, y: h - margin },
        { x: margin, y: h - margin },
      ]);
      setStep('crop');
    };
    img.onerror = () => setError('Failed to load image');
    img.src = url;
  }, []);

  const handleRotate = useCallback(async (clockwise: boolean) => {
    if (!image) return;
    try {
      const rotated = await rotateImage90(image, clockwise);
      setImage(rotated);
      const w = rotated.naturalWidth;
      const h = rotated.naturalHeight;
      const margin = Math.min(w, h) * 0.02;
      setCorners([
        { x: margin, y: margin },
        { x: w - margin, y: margin },
        { x: w - margin, y: h - margin },
        { x: margin, y: h - margin },
      ]);
    } catch {
      setError('Failed to rotate image');
    }
  }, [image]);

  const handleAutoCorrect = useCallback(async () => {
    if (!image) return;
    setAutoLoading(true);
    setError('');

    try {
      const cv = await loadOpenCv();
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(image, 0, 0);

      const imageMat = cv.imread(canvas);
      const detected = autoDetectQuiltBoundary(cv, imageMat);
      imageMat.delete();

      if (detected) {
        setCorners(sortCornersClockwise(detected));
      } else {
        setError('Could not auto-detect block edges');
      }
    } catch {
      setError('Auto-detect failed');
    } finally {
      setAutoLoading(false);
    }
  }, [image]);

  useEffect(() => {
    if (!image || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const fitScale = Math.min(rect.width / image.naturalWidth, rect.height / image.naturalHeight, 1);
    setScale(fitScale);
    setOffset({
      x: (rect.width - image.naturalWidth * fitScale) / 2,
      y: (rect.height - image.naturalHeight * fitScale) / 2,
    });
  }, [image]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image || !containerRef.current || !corners) return;

    const rect = containerRef.current.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);
    ctx.drawImage(image, 0, 0);
    ctx.restore();

    ctx.save();
    ctx.setLineDash([6, 4]);
    ctx.lineWidth = 2;
    ctx.strokeStyle = PHOTO_PATTERN_OVERLAY_COLOR;
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
    ctx.fillStyle = `${PHOTO_PATTERN_OVERLAY_COLOR}15`;
    ctx.fill();

    for (let i = 0; i < 4; i++) {
      const pt = corners[i];
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
  }, [image, corners, scale, offset]);

  const getCanvasPoint = useCallback((e: React.MouseEvent): Point2D => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - offset.x) / scale,
      y: (e.clientY - rect.top - offset.y) / scale,
    };
  }, [scale, offset]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!corners) return;
    const pt = getCanvasPoint(e);
    const hitRadius = HIT_RADIUS / scale;
    for (let i = 0; i < 4; i++) {
      const corner = corners[i];
      const dx = pt.x - corner.x;
      const dy = pt.y - corner.y;
      if (dx * dx + dy * dy <= hitRadius * hitRadius) {
        setDragIndex(i);
        return;
      }
    }
  }, [corners, getCanvasPoint, scale]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragIndex === null || !corners || !image) return;
    const pt = getCanvasPoint(e);
    const clampedX = Math.max(0, Math.min(image.naturalWidth, pt.x));
    const clampedY = Math.max(0, Math.min(image.naturalHeight, pt.y));
    const updated: [Point2D, Point2D, Point2D, Point2D] = [...corners];
    updated[dragIndex] = { x: clampedX, y: clampedY };
    setCorners(updated);
  }, [dragIndex, corners, image, getCanvasPoint]);

  const handleMouseUp = useCallback(() => setDragIndex(null), []);

  const handleSave = useCallback(async () => {
    if (!blockName.trim()) {
      setError('Block name is required');
      return;
    }
    if (!image || !corners) return;

    setSaving(true);
    setError('');

    try {
      const cv = await loadOpenCv();
      const correctedCanvas = applyPerspectiveCorrection(cv, image, corners);

      const svgData = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#f0f0f0"/></svg>`;

      const blob = await new Promise<Blob>((resolve, reject) => {
        correctedCanvas.toBlob((b) => b ? resolve(b) : reject(), 'image/png');
      });

      const formData = new FormData();
      formData.append('file', blob, 'block.png');
      formData.append('type', 'block-photo');

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) throw new Error('Upload failed');
      const { url: imageUrl } = await uploadRes.json();

      const res = await fetch('/api/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: blockName.trim(),
          category: category.trim() || 'Custom',
          svgData,
          fabricJsData: { type: 'photo-block', imageUrl },
          tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
          photoUrl: imageUrl,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Failed to save block');
        return;
      }

      onSaved();
      onClose();
    } catch {
      setError('Failed to save block');
    } finally {
      setSaving(false);
    }
  }, [blockName, category, tags, image, corners, onSaved, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[700px] rounded-xl bg-surface p-5 shadow-elevation-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-on-surface">Upload Block Photo</h2>
          <button type="button" onClick={onClose} className="text-secondary hover:text-on-surface">
            ✕
          </button>
        </div>

        {step === 'upload' && (
          <div className="space-y-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex h-64 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-outline-variant bg-background hover:bg-surface-container-low"
            >
              <p className="text-sm text-secondary">Click to upload or drag and drop</p>
              <p className="mt-1 text-xs text-secondary">PNG, JPEG, or WebP (max 20MB)</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              className="hidden"
            />
            {error && <p className="text-sm text-error">{error}</p>}
          </div>
        )}

        {step === 'crop' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleRotate(false)}
                className="rounded-md bg-background px-3 py-1.5 text-xs font-medium text-secondary hover:text-on-surface"
              >
                ↺ Rotate Left
              </button>
              <button
                type="button"
                onClick={() => handleRotate(true)}
                className="rounded-md bg-background px-3 py-1.5 text-xs font-medium text-secondary hover:text-on-surface"
              >
                ↻ Rotate Right
              </button>
              <button
                type="button"
                onClick={handleAutoCorrect}
                disabled={autoLoading}
                className="rounded-md bg-background px-3 py-1.5 text-xs font-medium text-secondary hover:text-on-surface disabled:opacity-50"
              >
                {autoLoading ? 'Detecting...' : '✨ Auto-Detect'}
              </button>
            </div>

            <div ref={containerRef} className="relative h-96 rounded border border-outline-variant bg-white">
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
                <label className="mb-1 block text-xs font-medium text-secondary">Block Name *</label>
                <input
                  type="text"
                  value={blockName}
                  onChange={(e) => setBlockName(e.target.value)}
                  placeholder="My Block"
                  maxLength={255}
                  className="w-full rounded-sm border border-outline-variant bg-white px-2.5 py-1.5 text-sm focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-secondary">Category</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Custom"
                  maxLength={100}
                  className="w-full rounded-sm border border-outline-variant bg-white px-2.5 py-1.5 text-sm focus:border-primary focus:outline-none"
                />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-secondary">Tags</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="modern, geometric"
                  className="w-full rounded-sm border border-outline-variant bg-white px-2.5 py-1.5 text-sm focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            {error && <p className="text-sm text-error">{error}</p>}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md px-4 py-2 text-sm text-secondary hover:bg-background"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Block'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
