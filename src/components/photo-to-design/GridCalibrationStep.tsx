'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePhotoDesignStore } from '@/stores/photoDesignStore';
import type { GridSpec } from '@/lib/photo-to-design/types';

const GRID_COLORS = [
  { label: 'Yellow', value: '#FFFF00' },
  { label: 'Lime', value: '#00FF00' },
  { label: 'Cyan', value: '#00FFFF' },
  { label: 'Magenta', value: '#FF00FF' },
];

/**
 * Grid Calibration Step — photo on left, controls panel directly adjacent on the right.
 */
export function GridCalibrationStep() {
  const correctedImageData = usePhotoDesignStore((s) => s.correctedImageData);
  const setGridSpec = usePhotoDesignStore((s) => s.setGridSpec);
  const setStep = usePhotoDesignStore((s) => s.setStep);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Grid state
  const [cellCount, setCellCount] = useState(8);
  const [gridColor, setGridColor] = useState('#FFFF00');

  // Transform state
  const [rotation, setRotation] = useState(0);
  const [skewX, setSkewX] = useState(0);
  const [skewY, setSkewY] = useState(0);

  // Computed grid spec
  const [gridSpec, setLocalGridSpec] = useState<GridSpec | null>(null);

  // Transformed image data
  const [transformedData, setTransformedData] = useState<ImageData | null>(null);

  const imgWidth = correctedImageData?.width ?? 510;
  const imgHeight = correctedImageData?.height ?? 510;

  // Apply transforms
  useEffect(() => {
    if (!correctedImageData) return;

    const angleRad = (rotation * Math.PI) / 180;
    const absCos = Math.abs(Math.cos(angleRad));
    const absSin = Math.abs(Math.sin(angleRad));
    const newWidth = Math.ceil(imgWidth * absCos + imgHeight * absSin);
    const newHeight = Math.ceil(imgWidth * absSin + imgHeight * absCos);

    const canvas = document.createElement('canvas');
    canvas.width = newWidth;
    canvas.height = newHeight;
    const ctx = canvas.getContext('2d')!;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = imgWidth;
    tempCanvas.height = imgHeight;
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.putImageData(correctedImageData, 0, 0);

    ctx.save();
    ctx.translate(newWidth / 2, newHeight / 2);
    ctx.rotate(angleRad);
    ctx.transform(1, Math.tan((skewY * Math.PI) / 180), Math.tan((skewX * Math.PI) / 180), 1, 0, 0);
    ctx.drawImage(tempCanvas, -imgWidth / 2, -imgHeight / 2);
    ctx.restore();

    setTransformedData(ctx.getImageData(0, 0, newWidth, newHeight));
  }, [correctedImageData, rotation, skewX, skewY, imgWidth, imgHeight]);

  // Calculate grid spec
  useEffect(() => {
    if (!transformedData) return;

    const tw = transformedData.width;
    const th = transformedData.height;
    const shortestDim = Math.min(tw, th);
    const cellSize = shortestDim / cellCount;
    const cols = Math.round(tw / cellSize);
    const rows = Math.round(th / cellSize);

    setLocalGridSpec({
      cellSize,
      offsetX: 0,
      offsetY: 0,
      cols: Math.max(1, cols),
      rows: Math.max(1, rows),
    });
  }, [cellCount, transformedData]);

  // Draw transformed image with grid overlay
  useEffect(() => {
    if (!transformedData || !canvasRef.current || !gridSpec) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const tw = transformedData.width;
    const th = transformedData.height;
    canvas.width = tw;
    canvas.height = th;
    ctx.putImageData(transformedData, 0, 0);

    const { cellSize, cols, rows } = gridSpec;
    const r = parseInt(gridColor.slice(1, 3), 16);
    const g = parseInt(gridColor.slice(3, 5), 16);
    const b = parseInt(gridColor.slice(5, 7), 16);
    ctx.strokeStyle = `rgba(${r},${g},${b},0.8)`;
    ctx.lineWidth = 1.5;

    for (let col = 0; col <= cols; col++) {
      const x = col * cellSize;
      if (x < 0 || x > tw) continue;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, th);
      ctx.stroke();
    }
    for (let row = 0; row <= rows; row++) {
      const y = row * cellSize;
      if (y < 0 || y > th) continue;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(tw, y);
      ctx.stroke();
    }
  }, [transformedData, gridSpec, gridColor]);

  const handleScan = useCallback(() => {
    if (gridSpec && transformedData) {
      setGridSpec(gridSpec);
      usePhotoDesignStore.getState().setCorrectedImageData(transformedData);
      setStep('review');
    }
  }, [gridSpec, transformedData, setGridSpec, setStep]);

  const handleBack = useCallback(() => setStep('perspective'), [setStep]);
  const handleReset = useCallback(() => {
    setRotation(0);
    setSkewX(0);
    setSkewY(0);
  }, []);
  const quickRotate = useCallback((d: number) => setRotation((p) => p + d), []);

  // Layout calculation
  const maxH = typeof window !== 'undefined' ? window.innerHeight - 140 : 700;
  const tw = transformedData?.width ?? imgWidth;
  const th = transformedData?.height ?? imgHeight;
  const photoScale = maxH / th;
  const photoW = Math.round(tw * photoScale);
  const photoH = maxH;
  const cellSizePx = gridSpec ? Math.round(gridSpec.cellSize) : 0;

  return (
    <div className="flex items-start justify-center gap-3 p-4 h-full overflow-hidden">
      {/* Photo */}
      <div
        className="relative border border-[var(--color-border)] rounded-lg overflow-hidden shadow-[0_1px_2px_rgba(26,26,26,0.08)] flex-shrink-0"
        style={{ width: photoW, height: photoH }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0"
          style={{ width: photoW, height: photoH }}
        />
        {gridSpec && (
          <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[11px] px-2.5 py-1 rounded-full">
            {gridSpec.cols} × {gridSpec.rows} · {cellSizePx}px
          </div>
        )}
      </div>

      {/* Controls panel — directly adjacent to photo */}
      <div className="w-[240px] flex-shrink-0 flex flex-col bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)]/30 shadow-[0_1px_2px_rgba(26,26,26,0.08)] overflow-hidden">
        {/* Controls scrollable area */}
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
          {/* Grid section */}
          <div className="flex flex-col gap-2.5">
            <h3 className="text-[11px] font-semibold text-[var(--color-text)] uppercase tracking-[0.06em]">
              Grid
            </h3>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between">
                <label className="text-[12px] text-[var(--color-text-dim)]">Cells</label>
                <span className="text-[12px] text-[var(--color-text)] font-medium">
                  {cellCount}
                </span>
              </div>
              <input
                type="range"
                min={3}
                max={80}
                step={1}
                value={cellCount}
                onChange={(e) => setCellCount(Number(e.target.value))}
                className="w-full accent-[var(--color-primary)] h-1"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[12px] text-[var(--color-text-dim)]">Color</span>
              {GRID_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setGridColor(c.value)}
                  className={`w-6 h-6 rounded-full border-2 transition-all duration-150 ${
                    gridColor === c.value
                      ? 'border-[var(--color-primary)] scale-110'
                      : 'border-transparent hover:border-[var(--color-border)]'
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          <div className="h-px bg-[var(--color-border)]/30" />

          {/* Transform section */}
          <div className="flex flex-col gap-2.5">
            <h3 className="text-[11px] font-semibold text-[var(--color-text)] uppercase tracking-[0.06em]">
              Transform
            </h3>

            {/* Quick rotate buttons */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] text-[var(--color-text-dim)]">Rotate</label>
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => quickRotate(-90)}
                  className="flex-1 min-w-[42px] px-1.5 py-1 rounded-full border border-[var(--color-border)] text-[10px] text-[var(--color-text-dim)] hover:bg-[var(--color-border)]/10 transition-colors"
                >
                  ↺ 90
                </button>
                <button
                  onClick={() => quickRotate(-0.5)}
                  className="flex-1 min-w-[42px] px-1.5 py-1 rounded-full border border-[var(--color-border)] text-[10px] text-[var(--color-text-dim)] hover:bg-[var(--color-border)]/10 transition-colors"
                >
                  ↺ 0.5
                </button>
                <button
                  onClick={() => quickRotate(-0.05)}
                  className="flex-1 min-w-[42px] px-1.5 py-1 rounded-full border border-[var(--color-border)] text-[10px] text-[var(--color-text-dim)] hover:bg-[var(--color-border)]/10 transition-colors"
                >
                  ↺ 0.05
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => quickRotate(0.05)}
                  className="flex-1 min-w-[42px] px-1.5 py-1 rounded-full border border-[var(--color-border)] text-[10px] text-[var(--color-text-dim)] hover:bg-[var(--color-border)]/10 transition-colors"
                >
                  ↻ 0.05
                </button>
                <button
                  onClick={() => quickRotate(0.5)}
                  className="flex-1 min-w-[42px] px-1.5 py-1 rounded-full border border-[var(--color-border)] text-[10px] text-[var(--color-text-dim)] hover:bg-[var(--color-border)]/10 transition-colors"
                >
                  ↻ 0.5
                </button>
                <button
                  onClick={() => quickRotate(90)}
                  className="flex-1 min-w-[42px] px-1.5 py-1 rounded-full border border-[var(--color-border)] text-[10px] text-[var(--color-text-dim)] hover:bg-[var(--color-border)]/10 transition-colors"
                >
                  ↻ 90
                </button>
              </div>
            </div>

            {/* Fine rotation */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between">
                <label className="text-[12px] text-[var(--color-text-dim)]">Fine</label>
                <span className="text-[12px] text-[var(--color-text)] font-medium">
                  {rotation.toFixed(2)}°
                </span>
              </div>
              <input
                type="range"
                min={-45}
                max={45}
                step={0.05}
                value={rotation}
                onChange={(e) => setRotation(Number(e.target.value))}
                className="w-full accent-[var(--color-primary)] h-1"
              />
            </div>

            {/* Skew X */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between">
                <label className="text-[12px] text-[var(--color-text-dim)]">H Skew</label>
                <span className="text-[12px] text-[var(--color-text)] font-medium">
                  {skewX.toFixed(2)}°
                </span>
              </div>
              <input
                type="range"
                min={-10}
                max={10}
                step={0.05}
                value={skewX}
                onChange={(e) => setSkewX(Number(e.target.value))}
                className="w-full accent-[var(--color-primary)] h-1"
              />
            </div>

            {/* Skew Y */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between">
                <label className="text-[12px] text-[var(--color-text-dim)]">V Skew</label>
                <span className="text-[12px] text-[var(--color-text)] font-medium">
                  {skewY.toFixed(2)}°
                </span>
              </div>
              <input
                type="range"
                min={-10}
                max={10}
                step={0.05}
                value={skewY}
                onChange={(e) => setSkewY(Number(e.target.value))}
                className="w-full accent-[var(--color-primary)] h-1"
              />
            </div>

            <button
              onClick={handleReset}
              className="mt-1 px-3 py-1.5 rounded-full border border-[var(--color-border)] text-[11px] text-[var(--color-text-dim)] hover:bg-[var(--color-border)]/10 transition-colors self-start"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Bottom actions */}
        <div className="p-3 border-t border-[var(--color-border)]/20 flex gap-2">
          <button
            onClick={handleBack}
            className="flex-1 px-3 py-2 rounded-full border-2 border-[var(--color-primary)] text-[var(--color-primary)] text-[13px] font-medium hover:bg-[var(--color-primary)]/10 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleScan}
            className="flex-1 px-3 py-2 rounded-full bg-[var(--color-primary)] text-[var(--color-text)] text-[13px] font-medium hover:bg-[#e67d3f] transition-colors"
          >
            Scan
          </button>
        </div>
      </div>
    </div>
  );
}
