'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { COLORS, COLORS_HOVER, SHADOW, MOTION } from '@/lib/design-system';
import type { Point2D, QuadCorners } from '@/lib/photo-layout-types';
import { detectQuiltQuad } from '@/lib/quad-detect';

interface CalibrationStepProps {
  /** Source photo the user is calibrating against. */
  image: HTMLImageElement;
  /** Source photo object URL (for the <img> layer). */
  imageUrl: string;
  /** Existing pinned corners, if the user is returning to this step. */
  initialCorners: QuadCorners | null;
  /** Existing block size if the user already set one. */
  initialWidthInches: number;
  initialHeightInches: number;
  /** Fired when the user presses Continue. */
  onContinue: (corners: QuadCorners, widthInches: number, heightInches: number) => void;
  /** Fired when the user wants to go back to the upload step. */
  onBack: () => void;
}

type CornerIndex = 0 | 1 | 2 | 3;
const CORNER_LABELS: Record<CornerIndex, string> = {
  0: 'Top-Left',
  1: 'Top-Right',
  2: 'Bottom-Right',
  3: 'Bottom-Left',
};
const HIT_RADIUS_PX = 24;

/**
 * Build the default 15% inset corner layout — fallback when auto-detect
 * fails and the user has no prior corners.
 */
function defaultInsetCorners(naturalWidth: number, naturalHeight: number): QuadCorners {
  const insetX = naturalWidth * 0.15;
  const insetY = naturalHeight * 0.15;
  return [
    { x: insetX, y: insetY },
    { x: naturalWidth - insetX, y: insetY },
    { x: naturalWidth - insetX, y: naturalHeight - insetY },
    { x: insetX, y: naturalHeight - insetY },
  ];
}

/**
 * Rasterize an HTMLImageElement into ImageData via an offscreen canvas.
 * The resulting pixels are handed to `detectQuiltQuad` for automatic
 * four-corner seeding on the calibration step. Returns `null` when the
 * canvas context is unavailable or the image hasn't decoded yet.
 */
function imageElementToImageData(image: HTMLImageElement): ImageData | null {
  if (typeof document === 'undefined') return null;
  if (image.naturalWidth === 0 || image.naturalHeight === 0) return null;
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return null;
  ctx.drawImage(image, 0, 0);
  try {
    return ctx.getImageData(0, 0, image.naturalWidth, image.naturalHeight);
  } catch {
    // Cross-origin taint or similar — silently fall back.
    return null;
  } finally {
    canvas.width = 0;
    canvas.height = 0;
  }
}

/**
 * Convert a clientX/clientY pair into the photo's naturalWidth/naturalHeight
 * coordinate space. We treat the rendered <img> like an `object-contain` box
 * and account for letterboxing on both axes.
 */
function clientToImageSpace(
  clientX: number,
  clientY: number,
  containerRect: DOMRect,
  naturalWidth: number,
  naturalHeight: number
): Point2D {
  const scale = Math.min(containerRect.width / naturalWidth, containerRect.height / naturalHeight);
  const renderedW = naturalWidth * scale;
  const renderedH = naturalHeight * scale;
  const offsetX = (containerRect.width - renderedW) / 2;
  const offsetY = (containerRect.height - renderedH) / 2;

  const x = (clientX - containerRect.left - offsetX) / scale;
  const y = (clientY - containerRect.top - offsetY) / scale;
  return {
    x: Math.max(0, Math.min(naturalWidth, x)),
    y: Math.max(0, Math.min(naturalHeight, y)),
  };
}

/** Inverse of {@link clientToImageSpace} — image px → DOM px inside the container. */
function imageToDomSpace(
  pt: Point2D,
  containerRect: DOMRect | null,
  naturalWidth: number,
  naturalHeight: number
): Point2D {
  if (!containerRect) return { x: 0, y: 0 };
  const scale = Math.min(containerRect.width / naturalWidth, containerRect.height / naturalHeight);
  const renderedW = naturalWidth * scale;
  const renderedH = naturalHeight * scale;
  const offsetX = (containerRect.width - renderedW) / 2;
  const offsetY = (containerRect.height - renderedH) / 2;
  return {
    x: offsetX + pt.x * scale,
    y: offsetY + pt.y * scale,
  };
}

/**
 * Step 1 of the perspective-first pipeline: the user pins four draggable
 * corners onto the outer edges of a single quilt block and enters its
 * real-world size. The pinned quadrilateral becomes the input to
 * `warpSourceImage()` in the next step.
 *
 * Interaction notes:
 * - Uses pointer events so mouse, pen, and touch all share the same path.
 * - Initial positions are a 15% inset from the image edges — users can
 *   quickly fine-tune instead of starting from zero.
 * - Corners are tagged TL/TR/BR/BL and color-coded so users can see which
 *   goes where. Clockwise sorting is deferred to the warp step.
 */
export function CalibrationStep(props: CalibrationStepProps) {
  const {
    image,
    imageUrl,
    initialCorners,
    initialWidthInches,
    initialHeightInches,
    onContinue,
    onBack,
  } = props;

  const containerRef = useRef<HTMLDivElement>(null);

  const [corners, setCorners] = useState<QuadCorners>(() => {
    if (initialCorners) return initialCorners;
    return defaultInsetCorners(image.naturalWidth, image.naturalHeight);
  });

  const [widthInches, setWidthInches] = useState<number>(initialWidthInches);
  const [heightInches, setHeightInches] = useState<number>(initialHeightInches);
  const [dragging, setDragging] = useState<CornerIndex | null>(null);

  // Auto-detect state — runs once per image, uses `quad-detect.ts`. When
  // the confidence is meaningful we prefill the corners; otherwise the
  // user starts from the 15% inset default.
  const [autoDetectState, setAutoDetectState] = useState<'pending' | 'done' | 'failed'>('pending');
  const [autoConfidence, setAutoConfidence] = useState(0);

  useEffect(() => {
    if (initialCorners) {
      setAutoDetectState('done');
      return;
    }
    let cancelled = false;
    // Defer to a microtask so the initial render can commit before we
    // start the (synchronous but heavy) Canny + Hough pipeline.
    queueMicrotask(() => {
      if (cancelled) return;
      const imgData = imageElementToImageData(image);
      if (!imgData) {
        setAutoDetectState('failed');
        return;
      }
      const result = detectQuiltQuad(imgData);
      if (cancelled) return;
      if (result && result.confidence > 0.3) {
        setCorners(result.corners);
        setAutoConfidence(result.confidence);
        setAutoDetectState('done');
      } else {
        setAutoDetectState('failed');
      }
    });
    return () => {
      cancelled = true;
    };
  }, [image, initialCorners]);

  const handleResetCorners = useCallback(() => {
    setCorners(defaultInsetCorners(image.naturalWidth, image.naturalHeight));
  }, [image.naturalWidth, image.naturalHeight]);

  // Track container size so the SVG overlay re-layouts on resize. Kept as
  // state so the JSX below re-runs `imageToDomSpace` after mount + resize.
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const update = () => setContainerRect(el.getBoundingClientRect());
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('scroll', update, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener('scroll', update);
    };
  }, [image]);

  const domCorners = useMemo(() => {
    return corners.map((c) =>
      imageToDomSpace(c, containerRect, image.naturalWidth, image.naturalHeight)
    );
  }, [corners, containerRect, image.naturalWidth, image.naturalHeight]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      // Hit-test in DOM space — that's where the user's finger actually is.
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      let bestIdx: CornerIndex | null = null;
      let bestDist = HIT_RADIUS_PX * HIT_RADIUS_PX;
      for (let i = 0; i < 4; i++) {
        const d = domCorners[i];
        const dx = d.x - px;
        const dy = d.y - py;
        const dist = dx * dx + dy * dy;
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = i as CornerIndex;
        }
      }

      if (bestIdx === null) return;
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      setDragging(bestIdx);
    },
    [domCorners]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (dragging === null) return;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const pt = clientToImageSpace(
        e.clientX,
        e.clientY,
        rect,
        image.naturalWidth,
        image.naturalHeight
      );
      setCorners((prev) => {
        const next = [...prev] as unknown as [Point2D, Point2D, Point2D, Point2D];
        next[dragging] = pt;
        return next as QuadCorners;
      });
    },
    [dragging, image.naturalWidth, image.naturalHeight]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (dragging === null) return;
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      setDragging(null);
    },
    [dragging]
  );

  const handleContinue = useCallback(() => {
    if (widthInches <= 0 || heightInches <= 0) return;
    onContinue(corners, widthInches, heightInches);
  }, [corners, widthInches, heightInches, onContinue]);

  const polygonPoints = domCorners.map((p) => `${p.x},${p.y}`).join(' ');
  const canvasAspect = `${image.naturalWidth} / ${image.naturalHeight}`;

  const showLowConfidenceBanner =
    autoDetectState === 'done' && autoConfidence > 0 && autoConfidence < 0.6;
  const showFailedBanner = autoDetectState === 'failed';

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-headline-sm font-semibold text-[var(--color-text)]">
          Pin one quilt block
        </h3>
        <p className="text-body-sm text-[var(--color-text-dim)] mt-1">
          Drag the four corner handles to the outer corners of a single block, then tell us its
          real-world size. Any block will do — we&apos;ll flatten the photo and lay down the grid
          around it.
        </p>
      </div>

      {showLowConfidenceBanner && (
        <div
          className="px-4 py-2.5 rounded-lg border"
          style={{
            backgroundColor: `${COLORS.secondary}4d`,
            borderColor: `${COLORS.primary}4d`,
          }}
        >
          <p className="text-body-sm text-[var(--color-text)]">
            We&apos;ve guessed the corners — double-check before continuing.
          </p>
        </div>
      )}
      {showFailedBanner && (
        <div className="px-4 py-2.5 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)]">
          <p className="text-body-sm text-[var(--color-text-dim)]">
            Auto-detect couldn&apos;t find the quilt edges — drag each corner onto one block
            yourself.
          </p>
        </div>
      )}

      {/* Calibration surface */}
      <div
        ref={containerRef}
        className="relative bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg overflow-hidden select-none touch-none"
        style={{
          width: '100%',
          maxHeight: '60vh',
          aspectRatio: canvasAspect,
        }}
      >
        <img
          src={imageUrl}
          alt="Quilt to calibrate"
          draggable={false}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        />
        <svg
          className="absolute inset-0 w-full h-full"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{ touchAction: 'none' }}
          aria-label="Calibration overlay"
        >
          {/* Dimmed area outside the quadrilateral — helps the user see what
              gets flattened. Uses an even-odd mask: outer rect minus the
              quadrilateral. */}
          <defs>
            <mask id="calibration-cutout">
              <rect width="100%" height="100%" fill="white" />
              <polygon points={polygonPoints} fill="black" />
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(45, 42, 38, 0.55)"
            mask="url(#calibration-cutout)"
            pointerEvents="none"
          />

          {/* Edges between corners */}
          <polygon
            points={polygonPoints}
            fill="transparent"
            stroke={COLORS.primary}
            strokeWidth="2"
            strokeLinejoin="round"
            pointerEvents="none"
          />

          {/* Corner nodes — bigger touch target than visible handle */}
          {domCorners.map((d, i) => (
            <g key={i}>
              <circle cx={d.x} cy={d.y} r={HIT_RADIUS_PX} fill="transparent" pointerEvents="none" />
              <circle
                cx={d.x}
                cy={d.y}
                r={10}
                fill={dragging === i ? COLORS.primary : 'white'}
                stroke={COLORS.primary}
                strokeWidth={3}
                pointerEvents="none"
              />
              <text
                x={d.x}
                y={d.y - 18}
                textAnchor="middle"
                fontSize="11"
                fontWeight={600}
                fill={COLORS.text}
                stroke="white"
                strokeWidth={3}
                paintOrder="stroke"
                pointerEvents="none"
              >
                {CORNER_LABELS[i as CornerIndex]}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Size inputs */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="calibration-width"
            className="block text-label-sm text-[var(--color-text)] mb-1"
          >
            Block width (inches)
          </label>
          <input
            id="calibration-width"
            type="number"
            min={1}
            max={60}
            step={0.25}
            value={widthInches}
            onChange={(e) => setWidthInches(Number(e.target.value) || 0)}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-body-md text-[var(--color-text)]"
          />
        </div>
        <div>
          <label
            htmlFor="calibration-height"
            className="block text-label-sm text-[var(--color-text)] mb-1"
          >
            Block height (inches)
          </label>
          <input
            id="calibration-height"
            type="number"
            min={1}
            max={60}
            step={0.25}
            value={heightInches}
            onChange={(e) => setHeightInches(Number(e.target.value) || 0)}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-body-md text-[var(--color-text)]"
          />
        </div>
      </div>

      {/* Common presets */}
      <div className="flex flex-wrap gap-2">
        {[6, 8, 10, 12, 14, 16].map((size) => (
          <button
            key={size}
            type="button"
            onClick={() => {
              setWidthInches(size);
              setHeightInches(size);
            }}
            className={`rounded-full border px-3 py-1.5 text-label-sm transition-colors duration-${MOTION.transitionDuration}`}
            style={{
              transitionDuration: `${MOTION.transitionDuration}ms`,
              transitionTimingFunction: MOTION.transitionEasing,
              ...(widthInches === size && heightInches === size
                ? {
                    borderColor: COLORS.primary,
                    backgroundColor: `${COLORS.primary}1a`,
                    color: COLORS.primary,
                  }
                : {
                    borderColor: COLORS.border,
                    color: COLORS.textDim,
                  }),
            }}
            onMouseEnter={(e) => {
              if (!(widthInches === size && heightInches === size)) {
                e.currentTarget.style.backgroundColor = COLORS.border;
              }
            }}
            onMouseLeave={(e) => {
              if (!(widthInches === size && heightInches === size)) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            {size}&quot; × {size}&quot;
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2 rounded-full text-label-sm font-medium border border-[var(--color-border)] text-[var(--color-text-dim)] hover:bg-[var(--color-border)] transition-colors duration-150"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleResetCorners}
          className="px-5 py-2 rounded-full text-label-sm font-medium border border-[var(--color-border)] text-[var(--color-text-dim)] hover:bg-[var(--color-border)] transition-colors duration-150"
        >
          Reset corners
        </button>
        <button
          type="button"
          onClick={handleContinue}
          disabled={widthInches <= 0 || heightInches <= 0}
          className="flex-1 px-6 py-3 rounded-full text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: COLORS.primary,
            color: COLORS.text,
            transitionDuration: `${MOTION.transitionDuration}ms`,
            transitionTimingFunction: MOTION.transitionEasing,
            transitionProperty: 'background-color',
            boxShadow: SHADOW.brand,
          }}
          onMouseEnter={(e) => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.backgroundColor = COLORS_HOVER.primary;
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.primary;
          }}
        >
          Flatten block
        </button>
      </div>
    </div>
  );
}
