import { useState, useRef, useEffect, useCallback } from 'react';
import { usePhotoDesignStore } from '@/stores/photoDesignStore';
import type { Point } from '@/types/photo-to-design';
import { pixelDistance } from '@/lib/photo-to-design/image-utils';
import type { PhotoDesignClient } from '@/lib/photo-to-design/client';
import { defaultProcessParams } from '@/lib/photo-to-design/sliders';

const MIN_PIXEL_DISTANCE = 100;

interface CalibrateScreenProps {
  client: PhotoDesignClient | null;
}

export function CalibrateScreen({ client }: CalibrateScreenProps) {
  const correctedImageUrl = usePhotoDesignStore((s) => s.correctedImageUrl);
  const calibrationPoints = usePhotoDesignStore((s) => s.calibrationPoints);
  const calibrationDistance = usePhotoDesignStore((s) => s.calibrationDistance);
  const calibrationUnit = usePhotoDesignStore((s) => s.calibrationUnit);
  const pixelsPerUnit = usePhotoDesignStore((s) => s.pixelsPerUnit);
  const setCalibration = usePhotoDesignStore((s) => s.setCalibration);
  const setStage = usePhotoDesignStore((s) => s.setStage);
  const setError = usePhotoDesignStore((s) => s.setError);

  const [markerA, setMarkerA] = useState<Point | null>(null);
  const [markerB, setMarkerB] = useState<Point | null>(null);
  const [enteredDistance, setEnteredDistance] = useState<string>(
    calibrationDistance > 0 ? String(calibrationDistance) : ''
  );
  const [unit, setUnit] = useState<'in' | 'cm'>(calibrationUnit);
  const [dragging, setDragging] = useState<'A' | 'B' | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imageRect, setImageRect] = useState<DOMRect | null>(null);

  // Update image rect on resize
  useEffect(() => {
    const updateRect = () => {
      if (imgRef.current) {
        setImageRect(imgRef.current.getBoundingClientRect());
      }
    };
    updateRect();
    window.addEventListener('resize', updateRect);
    return () => window.removeEventListener('resize', updateRect);
  }, []);

  // Restore markers from store
  useEffect(() => {
    if (calibrationPoints) {
      setMarkerA(calibrationPoints[0]);
      setMarkerB(calibrationPoints[1]);
    }
  }, [calibrationPoints]);

  // Global pointer handlers for drag
  useEffect(() => {
    if (dragging === null) return;

    const handleMove = (e: PointerEvent) => {
      if (!imageRect) return;
      const x = e.clientX - imageRect.left;
      const y = e.clientY - imageRect.top;
      const clampedX = Math.max(0, Math.min(imageRect.width, x));
      const clampedY = Math.max(0, Math.min(imageRect.height, y));
      const point: Point = { x: clampedX, y: clampedY };
      if (dragging === 'A') {
        setMarkerA(point);
      } else {
        setMarkerB(point);
      }
    };

    const handleUp = () => {
      setDragging(null);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [dragging, imageRect]);

  const handleImageClick = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!imageRect) return;
      // Don't place markers if clicking on a marker
      if ((e.target as HTMLElement).closest('[data-marker]')) return;

      const x = e.clientX - imageRect.left;
      const y = e.clientY - imageRect.top;
      const clampedX = Math.max(0, Math.min(imageRect.width, x));
      const clampedY = Math.max(0, Math.min(imageRect.height, y));
      const point: Point = { x: clampedX, y: clampedY };

      if (!markerA) {
        setMarkerA(point);
      } else if (!markerB) {
        setMarkerB(point);
      }
    },
    [imageRect, markerA, markerB]
  );

  const handleMarkerPointerDown = useCallback((e: React.PointerEvent, marker: 'A' | 'B') => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragging(marker);
  }, []);

  const handleDistanceChange = (value: string) => {
    setEnteredDistance(value);
  };

  const handleUnitToggle = () => {
    setUnit((prev) => (prev === 'in' ? 'cm' : 'in'));
  };

  // Display-space pixel distance between the two markers.
  const computedPixelDistance = markerA && markerB ? pixelDistance(markerA, markerB) : 0;
  const numericDistance = parseFloat(enteredDistance) || 0;

  // The worker-side pipeline runs on the corrected image at its natural
  // resolution, so we need pixelsPerUnit in that coordinate space — convert
  // display-pixel distance to image-pixel distance via the image's natural
  // width / displayed width ratio.
  const naturalWidth = imgRef.current?.naturalWidth ?? 0;
  const displayWidth = imageRect?.width ?? 0;
  const imageScale = naturalWidth > 0 && displayWidth > 0 ? naturalWidth / displayWidth : 1;

  const imagePixelDistance = computedPixelDistance * imageScale;
  const computedPixelsPerUnit =
    numericDistance > 0 && imagePixelDistance > 0 ? imagePixelDistance / numericDistance : null;

  const canAnalyze =
    markerA !== null &&
    markerB !== null &&
    computedPixelDistance >= MIN_PIXEL_DISTANCE &&
    numericDistance > 0;

  const handleAnalyze = async () => {
    if (!canAnalyze || computedPixelsPerUnit === null) return;

    setIsAnalyzing(true);
    try {
      // Commit image-space markers to the store so downstream work uses the
      // same coordinate frame as the worker.
      const imageMarkerA = { x: markerA!.x * imageScale, y: markerA!.y * imageScale };
      const imageMarkerB = { x: markerB!.x * imageScale, y: markerB!.y * imageScale };
      setCalibration([imageMarkerA, imageMarkerB], numericDistance, unit, computedPixelsPerUnit);

      // Advance to review
      setStage('review');

      // Immediately kick off full process with default params + calibrated scale
      if (client) {
        const params = defaultProcessParams();
        params.pixelsPerUnit = computedPixelsPerUnit;
        params.unit = unit;
        client.requestFull(params);
      }
    } catch (err) {
      setError({
        stage: 'calibrate',
        message: err instanceof Error ? err.message : 'Failed to start analysis.',
        recoverable: true,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!correctedImageUrl) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-[18px] text-[#4a4a4a]">No corrected image available.</p>
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-col">
      {/* Header */}
      <div className="px-4 py-3">
        <h2 className="text-[24px] leading-[32px] font-semibold text-[#1a1a1a]">Set Scale</h2>
        <p className="text-[16px] leading-[24px] text-[#4a4a4a]">
          Tap two points on the quilt and enter the distance between them.
        </p>
      </div>

      {/* Image with crosshair markers */}
      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden px-4"
        onPointerDown={handleImageClick}
      >
        <img
          ref={imgRef}
          src={correctedImageUrl}
          alt="Corrected quilt"
          className="max-h-full max-w-full object-contain"
          onLoad={() => {
            if (imgRef.current) {
              setImageRect(imgRef.current.getBoundingClientRect());
            }
          }}
        />

        {/* Marker A */}
        {markerA && imageRect && (
          <CrosshairMarker
            point={markerA}
            label="A"
            color="bg-[#ff8d49]"
            isDragging={dragging === 'A'}
            onPointerDown={(e) => handleMarkerPointerDown(e, 'A')}
          />
        )}

        {/* Marker B */}
        {markerB && imageRect && (
          <CrosshairMarker
            point={markerB}
            label="B"
            color="bg-[#1a1a1a]"
            isDragging={dragging === 'B'}
            onPointerDown={(e) => handleMarkerPointerDown(e, 'B')}
          />
        )}
      </div>

      {/* Controls bar */}
      <div className="border-t border-[#d4d4d4] bg-[#ffffff] px-4 py-4">
        <div className="mx-auto flex max-w-2xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Distance input + unit toggle */}
          <div className="flex items-center gap-3">
            <label className="text-[14px] leading-[20px] text-[#4a4a4a]">Distance:</label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={enteredDistance}
              onChange={(e) => handleDistanceChange(e.target.value)}
              className="w-24 rounded-full border border-[#d4d4d4] px-4 py-2 text-[16px] text-[#1a1a1a] focus:outline-2 focus:outline-[#ff8d49]"
              placeholder="0.0"
            />
            <button
              type="button"
              onClick={handleUnitToggle}
              className="rounded-full border-2 border-[#ff8d49] px-4 py-2 text-[14px] font-medium text-[#ff8d49] transition-colors duration-150 hover:bg-[#ff8d49]/10"
            >
              {unit === 'in' ? 'inches' : 'cm'}
            </button>
          </div>

          {/* Live readout */}
          <div className="text-[14px] leading-[20px] text-[#4a4a4a]">
            {computedPixelDistance > 0 ? (
              <>
                <span className="font-medium text-[#1a1a1a]">
                  {computedPixelDistance.toFixed(0)} px
                </span>{' '}
                = {enteredDistance || '0'} {unit}
                {computedPixelsPerUnit !== null && (
                  <span className="ml-2">
                    (1 {unit} = {computedPixelsPerUnit.toFixed(1)} px)
                  </span>
                )}
              </>
            ) : (
              'Place two markers on the image.'
            )}
          </div>

          {/* Pixel distance warning */}
          {markerA && markerB && computedPixelDistance < MIN_PIXEL_DISTANCE && (
            <div className="text-[12px] text-[#ed4956]">
              Markers too close — need at least {MIN_PIXEL_DISTANCE}px apart for accuracy.
            </div>
          )}

          {/* Analyze button */}
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={!canAnalyze || isAnalyzing}
            className={`rounded-full px-8 py-3 text-[16px] font-medium shadow-[0_1px_2px_rgba(45,42,38,0.08)] transition-colors duration-150 ${
              canAnalyze && !isAnalyzing
                ? 'bg-[#ff8d49] text-[#1a1a1a] hover:bg-[#e67d3f]'
                : 'cursor-not-allowed bg-[#d4d4d4] text-[#4a4a4a]'
            }`}
          >
            {isAnalyzing ? 'Starting...' : 'Analyze'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── CrosshairMarker Component ──────────────────────────────────────────────

interface CrosshairMarkerProps {
  point: Point;
  label: string;
  color: string;
  isDragging: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
}

function CrosshairMarker({ point, label, color, isDragging, onPointerDown }: CrosshairMarkerProps) {
  const size = 44;
  const half = size / 2;

  return (
    <div
      data-marker
      className="pointer-events-auto absolute cursor-crosshair"
      style={{
        top: point.y - half,
        left: point.x - half,
        width: size,
        height: size,
      }}
      onPointerDown={onPointerDown}
    >
      {/* Crosshair lines */}
      <div className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 bg-[#1a1a1a]" />
      <div className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 bg-[#1a1a1a]" />

      {/* Center circle */}
      <div
        className={`absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#ffffff] ${color} ${
          isDragging ? 'opacity-80' : ''
        }`}
      />

      {/* Label */}
      <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#ffffff] text-[10px] font-bold text-[#1a1a1a] shadow-[0_1px_2px_rgba(26,26,26,0.08)]">
        {label}
      </div>
    </div>
  );
}
