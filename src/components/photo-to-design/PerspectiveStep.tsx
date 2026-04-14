'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePhotoDesignStore } from '@/stores/photoDesignStore';
import {
  computeHomography,
  invertMatrix3x3,
  warpImageData,
} from '@/lib/photo-to-design/perspective';
import type { Point } from '@/lib/photo-to-design/types';

const HANDLE_RADIUS = 14;
const LABELS = ['TL', 'TR', 'BR', 'BL'];
const LABEL_FULL = ['Top-Left', 'Top-Right', 'Bottom-Right', 'Bottom-Left'];

/**
 * Perspective Correction — photo on left, compact controls panel on the right.
 */
export function PerspectiveStep() {
  const sourceImageUrl = usePhotoDesignStore((s) => s.sourceImageUrl);
  const sourceImageData = usePhotoDesignStore((s) => s.sourceImageData);
  const setCorrectedImageData = usePhotoDesignStore((s) => s.setCorrectedImageData);
  const setStep = usePhotoDesignStore((s) => s.setStep);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);
  const [corners, setCorners] = useState<[Point, Point, Point, Point] | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!sourceImageUrl) return;
    const img = new Image();
    img.onload = () => {
      setImgElement(img);
      const maxH = typeof window !== 'undefined' ? window.innerHeight - 140 : 700;
      const maxW = typeof window !== 'undefined' ? window.innerWidth - 320 : 900;
      const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1);
      const w = Math.round(img.naturalWidth * scale);
      const h = Math.round(img.naturalHeight * scale);
      setCanvasSize({ width: w, height: h });

      const m = 0.1;
      setCorners([
        { x: w * m, y: h * m },
        { x: w * (1 - m), y: h * m },
        { x: w * (1 - m), y: h * (1 - m) },
        { x: w * m, y: h * (1 - m) },
      ]);
    };
    img.src = sourceImageUrl;
  }, [sourceImageUrl]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !imgElement || !corners) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#ff8d49';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(corners[0].x, corners[0].y);
    for (let i = 1; i < 4; i++) ctx.lineTo(corners[i].x, corners[i].y);
    ctx.closePath();
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 141, 73, 0.08)';
    ctx.fill();

    for (let i = 0; i < 4; i++) {
      const c = corners[i];
      ctx.beginPath();
      ctx.arc(c.x, c.y, HANDLE_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = dragging === i ? '#ff8d49' : '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#ff8d49';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#1a1a1a';
      ctx.font = 'bold 9px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(LABELS[i], c.x, c.y);
    }
  }, [imgElement, corners, dragging, canvasSize]);

  const getMousePos = useCallback((e: React.MouseEvent): Point => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!corners) return;
      const pos = getMousePos(e);
      for (let i = 0; i < 4; i++) {
        const dx = pos.x - corners[i].x;
        const dy = pos.y - corners[i].y;
        if (dx * dx + dy * dy < HANDLE_RADIUS * HANDLE_RADIUS * 4) {
          setDragging(i);
          return;
        }
      }
    },
    [corners, getMousePos]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (dragging === null || !corners) return;
      const pos = getMousePos(e);
      const clamped = {
        x: Math.max(0, Math.min(canvasSize.width, pos.x)),
        y: Math.max(0, Math.min(canvasSize.height, pos.y)),
      };
      const updated = [...corners] as [Point, Point, Point, Point];
      updated[dragging] = clamped;
      setCorners(updated);
    },
    [dragging, corners, getMousePos, canvasSize]
  );

  const handleMouseUp = useCallback(() => setDragging(null), []);

  const handleApply = useCallback(() => {
    if (!corners || !sourceImageData) return;
    const srcW = sourceImageData.width;
    const srcH = sourceImageData.height;
    const scaleX = srcW / canvasSize.width;
    const scaleY = srcH / canvasSize.height;
    const scaledCorners = corners.map((c) => ({ x: c.x * scaleX, y: c.y * scaleY })) as [
      Point,
      Point,
      Point,
      Point,
    ];

    const topW = Math.sqrt(
      (scaledCorners[1].x - scaledCorners[0].x) ** 2 +
        (scaledCorners[1].y - scaledCorners[0].y) ** 2
    );
    const botW = Math.sqrt(
      (scaledCorners[2].x - scaledCorners[3].x) ** 2 +
        (scaledCorners[2].y - scaledCorners[3].y) ** 2
    );
    const leftH = Math.sqrt(
      (scaledCorners[3].x - scaledCorners[0].x) ** 2 +
        (scaledCorners[3].y - scaledCorners[0].y) ** 2
    );
    const rightH = Math.sqrt(
      (scaledCorners[2].x - scaledCorners[1].x) ** 2 +
        (scaledCorners[2].y - scaledCorners[1].y) ** 2
    );

    const outW = Math.round(Math.max(topW, botW));
    const outH = Math.round(Math.max(leftH, rightH));

    const H = computeHomography(scaledCorners, { x: 0, y: 0, width: outW, height: outH });
    const invH = invertMatrix3x3(H);
    const warped = warpImageData(sourceImageData.data, srcW, srcH, invH, outW, outH);

    const pixelData = new Uint8ClampedArray(outW * outH * 4);
    pixelData.set(warped);
    setCorrectedImageData(new ImageData(pixelData, outW, outH));
    setStep('grid');
  }, [corners, sourceImageData, canvasSize, setCorrectedImageData, setStep]);

  const handleSkip = useCallback(() => {
    if (sourceImageData) setCorrectedImageData(sourceImageData);
    setStep('grid');
  }, [sourceImageData, setCorrectedImageData, setStep]);

  const handleBack = useCallback(() => setStep('upload'), [setStep]);

  return (
    <div className="flex items-start justify-center gap-3 p-4 h-full overflow-hidden">
      {/* Photo */}
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className="block cursor-crosshair border border-[var(--color-border)] rounded-lg overflow-hidden shadow-[0_1px_2px_rgba(26,26,26,0.08)] flex-shrink-0"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />

      {/* Controls panel — directly adjacent */}
      <div className="w-[200px] flex-shrink-0 flex flex-col bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)]/30 shadow-[0_1px_2px_rgba(26,26,26,0.08)] overflow-hidden">
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
          <h3 className="text-[11px] font-semibold text-[var(--color-text)] uppercase tracking-[0.06em]">
            Perspective
          </h3>
          <p className="text-[11px] leading-[16px] text-[var(--color-text-dim)]">
            Drag the four corner handles to the edges of the quilt.
          </p>

          <div className="flex flex-col gap-1.5">
            {LABEL_FULL.map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div
                  className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                    dragging === i
                      ? 'bg-[var(--color-primary)] border-[var(--color-primary)]'
                      : 'bg-white border-[var(--color-primary)]'
                  }`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${dragging === i ? 'bg-white' : 'bg-[var(--color-primary)]'}`}
                  />
                </div>
                <span className="text-[11px] text-[var(--color-text-dim)]">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom actions */}
        <div className="p-3 border-t border-[var(--color-border)]/20 flex flex-col gap-2">
          <button
            onClick={handleApply}
            className="w-full px-3 py-2 rounded-full bg-[var(--color-primary)] text-[var(--color-text)] text-[13px] font-medium hover:bg-[#e67d3f] transition-colors"
          >
            Next
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleBack}
              className="flex-1 px-3 py-1.5 rounded-full border-2 border-[var(--color-primary)] text-[var(--color-primary)] text-[12px] font-medium hover:bg-[var(--color-primary)]/10 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleSkip}
              className="flex-1 px-3 py-1.5 rounded-full border border-[var(--color-border)] text-[12px] font-medium text-[var(--color-text-dim)] hover:bg-[var(--color-border)]/10 transition-colors"
            >
              Skip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
