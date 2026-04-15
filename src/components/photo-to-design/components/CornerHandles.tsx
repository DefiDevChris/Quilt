import { useRef, useState, useCallback, useEffect } from 'react';
import type { Point } from '@/types/photo-to-design';

const HANDLE_SIZE = 44; // CSS px — touch-friendly
const HANDLE_RADIUS = HANDLE_SIZE / 2;

interface CornerHandlesProps {
  corners: [Point, Point, Point, Point];
  onChange: (corners: [Point, Point, Point, Point]) => void;
  imageRect: DOMRect;
  /** Convert image-pixel coords to screen coords */
  imageToScreen: (p: Point) => Point;
  /** Convert screen coords to image-pixel coords */
  screenToImage: (p: Point) => Point;
}

type CornerIndex = 0 | 1 | 2 | 3; // TL, TR, BR, BL

export function CornerHandles({ corners, onChange, imageRect, imageToScreen, screenToImage }: CornerHandlesProps) {
  const [dragging, setDragging] = useState<CornerIndex | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const labels = ['TL', 'TR', 'BR', 'BL'];

  // Convert corner positions from image-pixel to screen coords for rendering
  const screenPositions = corners.map((c) => imageToScreen(c));

  // Global pointer handlers for drag
  useEffect(() => {
    if (dragging === null) return;

    const handleMove = (e: PointerEvent) => {
      const x = e.clientX - imageRect.left;
      const y = e.clientY - imageRect.top;
      const clampedX = Math.max(0, Math.min(imageRect.width, x));
      const clampedY = Math.max(0, Math.min(imageRect.height, y));
      const imagePoint = screenToImage({ x: clampedX, y: clampedY });

      const newCorners = [...corners] as [Point, Point, Point, Point];
      newCorners[dragging] = imagePoint;
      onChange(newCorners);
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
  }, [dragging, corners, onChange, imageRect, screenToImage]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, index: CornerIndex) => {
      e.preventDefault();
      e.stopPropagation();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      setDragging(index);
    },
    [],
  );

  return (
    <div ref={containerRef} className="pointer-events-none absolute inset-0">
      {screenPositions.map((pos, index) => (
        <div
          key={index}
          className="pointer-events-auto absolute"
          style={{
            top: pos.y - HANDLE_RADIUS,
            left: pos.x - HANDLE_RADIUS,
            width: HANDLE_SIZE,
            height: HANDLE_SIZE,
          }}
        >
          <div
            onPointerDown={(e) => handlePointerDown(e, index as CornerIndex)}
            className={`flex h-full w-full cursor-grab items-center justify-center rounded-full border-2 transition-colors duration-150 ${
              dragging === index
                ? 'cursor-grabbing border-[#ff8d49] bg-[#ff8d49]/20'
                : 'border-[#1a1a1a] bg-[#ffffff] hover:border-[#ff8d49]'
            }`}
            style={{ minWidth: HANDLE_SIZE, minHeight: HANDLE_SIZE }}
            role="button"
            aria-label={`Corner handle ${labels[index]}`}
            tabIndex={0}
          >
            <span className="text-[12px] font-medium text-[#1a1a1a] select-none">
              {labels[index]}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
