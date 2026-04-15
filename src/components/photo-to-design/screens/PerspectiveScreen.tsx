import { useState, useRef, useEffect, useCallback } from 'react';
import { usePhotoDesignStore } from '@/stores/photoDesignStore';
import type { Point } from '@/types/photo-to-design';
import { CornerHandles } from '../components/CornerHandles';
import { imageDataToObjectUrl } from '@/lib/photo-to-design/image-utils';
import type { PhotoDesignClient } from '@/lib/photo-to-design/client';

const CORNER_INSET_PERCENT = 0.1;

interface PerspectiveScreenProps {
  client: PhotoDesignClient | null;
}

export function PerspectiveScreen({ client }: PerspectiveScreenProps) {
  const sourceObjectUrl = usePhotoDesignStore((s) => s.sourceObjectUrl);
  const downscaledObjectUrl = usePhotoDesignStore((s) => s.downscaledObjectUrl);
  const sourceDimensions = usePhotoDesignStore((s) => s.sourceDimensions);
  const corners = usePhotoDesignStore((s) => s.corners);
  const setCorners = usePhotoDesignStore((s) => s.setCorners);
  const setCorrectedImageUrl = usePhotoDesignStore((s) => s.setCorrectedImageUrl);
  const setStage = usePhotoDesignStore((s) => s.setStage);
  const setError = usePhotoDesignStore((s) => s.setError);

  const [isWarping, setIsWarping] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [imageRect, setImageRect] = useState<DOMRect | null>(null);
  const [displaySize, setDisplaySize] = useState<{ width: number; height: number } | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Use downscaled URL for display and CV operations
  const displayUrl = downscaledObjectUrl || sourceObjectUrl;

  // Initialize corners on mount: auto-detect or fallback
  useEffect(() => {
    if (!displayUrl || !sourceDimensions || corners) return;

    const initCorners = async () => {
      if (!client) {
        setFallbackCorners();
        return;
      }

      setIsDetecting(true);
      try {
        const imageData = await loadImageData(displayUrl);
        const detected = await client.call<Point[] | null>('autoDetectCorners', { imageData });

        if (detected && detected.length === 4) {
          setCorners(detected as [Point, Point, Point, Point]);
        } else {
          setFallbackCorners();
        }
      } catch {
        setFallbackCorners();
      } finally {
        setIsDetecting(false);
      }
    };

    initCorners();
  }, [displayUrl, sourceDimensions, corners, client, setCorners]);

  // Update image rect and display size on load and resize
  useEffect(() => {
    const updateRect = () => {
      if (imgRef.current) {
        const rect = imgRef.current.getBoundingClientRect();
        setImageRect(rect);
        setDisplaySize({ width: rect.width, height: rect.height });
      }
    };
    updateRect();
    window.addEventListener('resize', updateRect);
    return () => window.removeEventListener('resize', updateRect);
  }, []);

  const setFallbackCorners = useCallback(() => {
    if (!sourceDimensions) return;
    const { width, height } = sourceDimensions;
    const insetX = width * CORNER_INSET_PERCENT;
    const insetY = height * CORNER_INSET_PERCENT;

    setCorners([
      { x: insetX, y: insetY },
      { x: width - insetX, y: insetY },
      { x: width - insetX, y: height - insetY },
      { x: insetX, y: height - insetY },
    ]);
  }, [sourceDimensions, setCorners]);

  // Coordinate transforms: image pixels <-> screen pixels
  const imageToScreen = useCallback(
    (p: Point): Point => {
      if (!sourceDimensions || !displaySize) return p;
      const scaleX = displaySize.width / sourceDimensions.width;
      const scaleY = displaySize.height / sourceDimensions.height;
      return { x: p.x * scaleX, y: p.y * scaleY };
    },
    [sourceDimensions, displaySize]
  );

  const screenToImage = useCallback(
    (p: Point): Point => {
      if (!sourceDimensions || !displaySize) return p;
      const scaleX = sourceDimensions.width / displaySize.width;
      const scaleY = sourceDimensions.height / displaySize.height;
      return { x: p.x * scaleX, y: p.y * scaleY };
    },
    [sourceDimensions, displaySize]
  );

  const handleCornersChange = useCallback(
    (newCorners: [Point, Point, Point, Point]) => {
      setCorners(newCorners);
    },
    [setCorners]
  );

  const handleContinue = async () => {
    if (!client || !corners || !displayUrl || !sourceDimensions) return;

    setIsWarping(true);
    try {
      const imageData = await loadImageData(displayUrl);

      const result = await client.call<{ imageData: ImageData }>('warpPerspective', {
        corners,
        imageData,
      });

      // The corrected ImageData must be persisted inside the worker so the
      // review pipeline can run `process` against it. The warpPerspective
      // response transferred the buffer to the main thread, so re-send it to
      // the worker via loadImage (Transferable again).
      const forWorker = new ImageData(
        new Uint8ClampedArray(result.imageData.data),
        result.imageData.width,
        result.imageData.height
      );
      await client.call('loadImage', { imageData: forWorker }, [forWorker.data.buffer]);

      const url = await imageDataToObjectUrl(result.imageData);
      setCorrectedImageUrl(url);
      setStage('calibrate');
    } catch (err) {
      setError({
        stage: 'perspective',
        message: err instanceof Error ? err.message : 'Failed to warp perspective.',
        recoverable: true,
      });
    } finally {
      setIsWarping(false);
    }
  };

  if (!displayUrl) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-[18px] text-[#4a4a4a]">No image uploaded.</p>
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-col">
      {/* Header */}
      <div className="px-4 py-3">
        <h2 className="text-[24px] leading-[32px] font-semibold text-[#1a1a1a]">Adjust Corners</h2>
        <p className="text-[16px] leading-[24px] text-[#4a4a4a]">
          Drag the four corners to match the edges of your quilt.
        </p>
      </div>

      {/* Image with corner handles */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4">
        <img
          ref={imgRef}
          src={displayUrl}
          alt="Uploaded quilt"
          className="max-h-full max-w-full object-contain"
          onLoad={() => {
            if (imgRef.current) {
              const rect = imgRef.current.getBoundingClientRect();
              setImageRect(rect);
              setDisplaySize({ width: rect.width, height: rect.height });
            }
          }}
        />

        {/* Corner handles overlay */}
        {corners && imageRect && displaySize && (
          <CornerHandles
            corners={corners}
            onChange={handleCornersChange}
            imageRect={imageRect}
            imageToScreen={imageToScreen}
            screenToImage={screenToImage}
          />
        )}

        {/* Detection overlay */}
        {isDetecting && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#faf9f7]/80">
            <div className="animate-pulse rounded-lg border border-[#d4d4d4] bg-[#ffffff] px-6 py-4">
              <p className="text-[16px] text-[#4a4a4a]">Detecting quilt edges...</p>
            </div>
          </div>
        )}
      </div>

      {/* Continue button */}
      <div className="flex justify-center px-4 py-4">
        <button
          type="button"
          onClick={handleContinue}
          disabled={!corners || isWarping || isDetecting}
          className={`rounded-full px-8 py-3 text-[16px] font-medium shadow-[0_1px_2px_rgba(45,42,38,0.08)] transition-colors duration-150 ${
            corners && !isWarping && !isDetecting
              ? 'bg-[#ff8d49] text-[#1a1a1a] hover:bg-[#e67d3f]'
              : 'cursor-not-allowed bg-[#d4d4d4] text-[#4a4a4a]'
          }`}
        >
          {isWarping ? 'Straightening...' : 'Continue'}
        </button>
      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

async function loadImageData(url: string): Promise<ImageData> {
  const img = new Image();
  img.src = url;
  await new Promise<void>((resolve) => {
    img.onload = () => resolve();
  });

  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }
  ctx.drawImage(img, 0, 0);
  return ctx.getImageData(0, 0, img.naturalWidth, img.naturalHeight);
}
