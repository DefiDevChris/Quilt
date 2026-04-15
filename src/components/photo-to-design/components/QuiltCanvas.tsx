'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { usePhotoDesignStore } from '@/stores/photoDesignStore';
import type { Patch, Point } from '@/types/photo-to-design';

/**
 * Two-canvas quilt viewer for the Review screen.
 *
 * - Bottom canvas paints the perspective-corrected photo (redrawn on
 *   pan/zoom).
 * - Top canvas paints patch outlines + fills (redrawn on every slider tick
 *   or view-mode toggle).
 *
 * Pan is click-drag; zoom is mouse wheel / pinch. Both canvases share a
 * single (tx, ty, scale) transform via `ctx.setTransform`.
 */

type Transform = { tx: number; ty: number; scale: number };

interface QuiltCanvasProps {
  /** Called when the user clicks a patch in 'select' tool mode. */
  onPatchClick?: (patchId: number, imagePoint: Point) => void;
  /** Called when the user clicks an empty area of the canvas. */
  onCanvasClick?: (imagePoint: Point) => void;
  /** Called during a Draw Seam drag. Coordinates are in image-pixel space. */
  onDrawSeamLine?: (start: Point, end: Point) => void;
  /** Called on hover — patchId may be null. */
  onPatchHover?: (patchId: number | null, imagePoint: Point | null) => void;
}

export function QuiltCanvas({
  onPatchClick,
  onCanvasClick,
  onDrawSeamLine,
  onPatchHover,
}: QuiltCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const photoCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  const correctedImageUrl = usePhotoDesignStore((s) => s.correctedImageUrl);
  const viewMode = usePhotoDesignStore((s) => s.viewMode);
  const previewOutlines = usePhotoDesignStore((s) => s.previewOutlines);
  const previewColors = usePhotoDesignStore((s) => s.previewColors);
  const patches = usePhotoDesignStore((s) => s.patches);
  const selectedPatchId = usePhotoDesignStore((s) => s.selectedPatchId);
  const hoveredPatchId = usePhotoDesignStore((s) => s.hoveredPatchId);
  const activeTool = usePhotoDesignStore((s) => s.activeTool);

  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [imageSize, setImageSize] = useState({ w: 0, h: 0 });
  const [transform, setTransform] = useState<Transform>({ tx: 0, ty: 0, scale: 1 });
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });

  // Drag state for panning + draw-seam
  const dragStateRef = useRef<null | {
    mode: 'pan' | 'draw';
    startClient: Point;
    startTransform?: Transform;
    startImage?: Point;
    currentImage?: Point;
  }>(null);
  const [drawPreview, setDrawPreview] = useState<[Point, Point] | null>(null);

  // Active touch pointers for two-finger pinch-zoom. When size >= 2 the
  // gesture controls the transform matrix directly and pan/draw is suspended.
  const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStateRef = useRef<null | {
    startDist: number;
    startScale: number;
    startTx: number;
    startTy: number;
    centerClient: Point;
  }>(null);

  // Load image.
  useEffect(() => {
    if (!correctedImageUrl) return;
    const image = new Image();
    image.onload = () => {
      setImg(image);
      setImageSize({ w: image.naturalWidth, h: image.naturalHeight });
    };
    image.src = correctedImageUrl;
    return () => {
      image.onload = null;
    };
  }, [correctedImageUrl]);

  // Observe container size for responsive canvas.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setContainerSize({ w: r.width, h: r.height });
    });
    ro.observe(el);
    const r = el.getBoundingClientRect();
    setContainerSize({ w: r.width, h: r.height });
    return () => ro.disconnect();
  }, []);

  // Fit image to container on first load.
  useEffect(() => {
    if (imageSize.w === 0 || containerSize.w === 0) return;
    const scale = Math.min(containerSize.w / imageSize.w, containerSize.h / imageSize.h);
    const tx = (containerSize.w - imageSize.w * scale) / 2;
    const ty = (containerSize.h - imageSize.h * scale) / 2;
    setTransform({ tx, ty, scale });
  }, [imageSize.w, imageSize.h, containerSize.w, containerSize.h]);

  // DPR + canvas sizing.
  useEffect(() => {
    const dpr = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1;
    for (const ref of [photoCanvasRef, overlayCanvasRef]) {
      const c = ref.current;
      if (!c) continue;
      c.width = Math.round(containerSize.w * dpr);
      c.height = Math.round(containerSize.h * dpr);
      c.style.width = `${containerSize.w}px`;
      c.style.height = `${containerSize.h}px`;
    }
  }, [containerSize.w, containerSize.h]);

  // Redraw the photo canvas whenever image, transform, or size changes.
  useEffect(() => {
    const c = photoCanvasRef.current;
    if (!c || !img) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, c.width, c.height);
    if (viewMode === 'outlinesOnly') return;
    ctx.setTransform(
      transform.scale * dpr,
      0,
      0,
      transform.scale * dpr,
      transform.tx * dpr,
      transform.ty * dpr
    );
    ctx.globalAlpha = viewMode === 'colorFill' ? 0.15 : 1.0;
    ctx.drawImage(img, 0, 0);
    ctx.globalAlpha = 1;
  }, [img, transform, containerSize, viewMode]);

  // Redraw overlay canvas on patches/preview/viewMode/transform changes.
  useEffect(() => {
    const c = overlayCanvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, c.width, c.height);

    if (viewMode === 'photoOnly') return;

    ctx.setTransform(
      transform.scale * dpr,
      0,
      0,
      transform.scale * dpr,
      transform.tx * dpr,
      transform.ty * dpr
    );
    ctx.lineWidth = 1 / transform.scale;

    const fillAlpha = viewMode === 'colorFill' ? 0.85 : viewMode === 'photo+outlines' ? 0.2 : 0;
    const strokeVisible = viewMode !== 'colorFill' || true; // always visible; black or dark

    if (patches && patches.length > 0) {
      // Full render: per-patch polygons at original-image resolution.
      renderFullPatches(
        ctx,
        patches,
        fillAlpha,
        strokeVisible,
        selectedPatchId,
        hoveredPatchId,
        transform.scale
      );
    } else if (previewOutlines && previewColors) {
      renderPreviewOutlines(ctx, previewOutlines, previewColors, fillAlpha, strokeVisible);
    }

    // Draw-seam preview overlay (gold) during an active drag.
    if (drawPreview) {
      ctx.strokeStyle = '#ff8d49';
      ctx.lineWidth = 3 / transform.scale;
      ctx.beginPath();
      ctx.moveTo(drawPreview[0].x, drawPreview[0].y);
      ctx.lineTo(drawPreview[1].x, drawPreview[1].y);
      ctx.stroke();
    }
  }, [
    patches,
    previewOutlines,
    previewColors,
    viewMode,
    transform,
    containerSize,
    selectedPatchId,
    hoveredPatchId,
    drawPreview,
  ]);

  // ── Pointer handling ─────────────────────────────────────────────────

  const toImagePoint = useCallback(
    (clientX: number, clientY: number): Point => {
      const el = containerRef.current;
      if (!el) return { x: 0, y: 0 };
      const r = el.getBoundingClientRect();
      const localX = clientX - r.left;
      const localY = clientY - r.top;
      return {
        x: (localX - transform.tx) / transform.scale,
        y: (localY - transform.ty) / transform.scale,
      };
    },
    [transform]
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!containerRef.current) return;

      // Track every touch pointer so two-finger pinch gestures work.
      if (e.pointerType === 'touch') {
        activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (activePointersRef.current.size === 2) {
          const pts = [...activePointersRef.current.values()];
          const dx = pts[1].x - pts[0].x;
          const dy = pts[1].y - pts[0].y;
          pinchStateRef.current = {
            startDist: Math.hypot(dx, dy),
            startScale: transform.scale,
            startTx: transform.tx,
            startTy: transform.ty,
            centerClient: {
              x: (pts[0].x + pts[1].x) / 2,
              y: (pts[0].y + pts[1].y) / 2,
            },
          };
          // Cancel any pan/draw that was about to start.
          dragStateRef.current = null;
          setDrawPreview(null);
          return;
        }
      }

      containerRef.current.setPointerCapture(e.pointerId);
      const imagePt = toImagePoint(e.clientX, e.clientY);
      if (activeTool === 'drawSeam') {
        dragStateRef.current = {
          mode: 'draw',
          startClient: { x: e.clientX, y: e.clientY },
          startImage: imagePt,
          currentImage: imagePt,
        };
        setDrawPreview([imagePt, imagePt]);
      } else {
        dragStateRef.current = {
          mode: 'pan',
          startClient: { x: e.clientX, y: e.clientY },
          startTransform: transform,
        };
      }
    },
    [activeTool, transform, toImagePoint]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      // Two-finger pinch takes precedence.
      if (e.pointerType === 'touch' && activePointersRef.current.has(e.pointerId)) {
        activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        const pinch = pinchStateRef.current;
        if (pinch && activePointersRef.current.size >= 2) {
          const pts = [...activePointersRef.current.values()];
          const dx = pts[1].x - pts[0].x;
          const dy = pts[1].y - pts[0].y;
          const dist = Math.hypot(dx, dy);
          if (pinch.startDist > 0 && containerRef.current) {
            const newScale = Math.max(
              0.05,
              Math.min(20, (pinch.startScale * dist) / pinch.startDist)
            );
            const r = containerRef.current.getBoundingClientRect();
            const localX = pinch.centerClient.x - r.left;
            const localY = pinch.centerClient.y - r.top;
            // Keep the gesture center fixed in image space while scale changes.
            const imageX = (localX - pinch.startTx) / pinch.startScale;
            const imageY = (localY - pinch.startTy) / pinch.startScale;
            setTransform({
              scale: newScale,
              tx: localX - imageX * newScale,
              ty: localY - imageY * newScale,
            });
          }
          return;
        }
      }

      const state = dragStateRef.current;
      if (state && state.mode === 'pan' && state.startTransform) {
        const dx = e.clientX - state.startClient.x;
        const dy = e.clientY - state.startClient.y;
        setTransform({
          tx: state.startTransform.tx + dx,
          ty: state.startTransform.ty + dy,
          scale: state.startTransform.scale,
        });
        return;
      }
      if (state && state.mode === 'draw' && state.startImage) {
        const pt = toImagePoint(e.clientX, e.clientY);
        state.currentImage = pt;
        setDrawPreview([state.startImage, pt]);
        return;
      }
      // Hover — only cheap when no drag.
      if (!state && onPatchHover) {
        const pt = toImagePoint(e.clientX, e.clientY);
        const hitId = hitTestPatch(patches, pt);
        onPatchHover(hitId, pt);
      }
    },
    [toImagePoint, patches, onPatchHover]
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      // Clear pinch bookkeeping on touch end.
      if (e.pointerType === 'touch') {
        activePointersRef.current.delete(e.pointerId);
        if (activePointersRef.current.size < 2) {
          pinchStateRef.current = null;
        }
      }

      const state = dragStateRef.current;
      dragStateRef.current = null;
      if (!state) return;
      if (state.mode === 'pan' && state.startTransform) {
        const dx = e.clientX - state.startClient.x;
        const dy = e.clientY - state.startClient.y;
        if (Math.hypot(dx, dy) < 4) {
          // Click — hit-test
          const pt = toImagePoint(e.clientX, e.clientY);
          const hitId = hitTestPatch(patches, pt);
          if (hitId !== null) onPatchClick?.(hitId, pt);
          else onCanvasClick?.(pt);
        }
        return;
      }
      if (state.mode === 'draw' && state.startImage && state.currentImage) {
        const dist = Math.hypot(
          state.currentImage.x - state.startImage.x,
          state.currentImage.y - state.startImage.y
        );
        if (dist > 4) {
          onDrawSeamLine?.(state.startImage, state.currentImage);
        }
        setDrawPreview(null);
      }
    },
    [toImagePoint, patches, onPatchClick, onCanvasClick, onDrawSeamLine]
  );

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const el = containerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const localX = e.clientX - r.left;
    const localY = e.clientY - r.top;
    const delta = -e.deltaY * 0.0015;
    const factor = Math.exp(delta);
    setTransform((t) => {
      const newScale = Math.max(0.05, Math.min(20, t.scale * factor));
      const scaleRatio = newScale / t.scale;
      return {
        scale: newScale,
        tx: localX - (localX - t.tx) * scaleRatio,
        ty: localY - (localY - t.ty) * scaleRatio,
      };
    });
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full touch-none overflow-hidden bg-[#faf9f7]"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onWheel={onWheel}
      style={{
        cursor:
          activeTool === 'drawSeam'
            ? 'crosshair'
            : activeTool === 'eraseSeam' || activeTool === 'floodFill'
              ? 'crosshair'
              : 'default',
      }}
    >
      <canvas ref={photoCanvasRef} className="absolute left-0 top-0" aria-hidden="true" />
      <canvas
        ref={overlayCanvasRef}
        className="absolute left-0 top-0"
        aria-label="Patch overlays"
      />
    </div>
  );
}

// ── Render helpers ─────────────────────────────────────────────────────────

function renderPreviewOutlines(
  ctx: CanvasRenderingContext2D,
  outlines: Float32Array,
  colors: string[],
  fillAlpha: number,
  strokeVisible: boolean
) {
  let start = true;
  let patchIdx = 0;
  let firstIdx = 0;
  for (let i = 0; i < outlines.length; i += 2) {
    const x = outlines[i];
    const y = outlines[i + 1];
    if (Number.isNaN(x)) {
      ctx.closePath();
      const color = colors[patchIdx] ?? '#888';
      if (fillAlpha > 0) {
        ctx.globalAlpha = fillAlpha;
        ctx.fillStyle = color;
        ctx.fill();
      }
      if (strokeVisible) {
        ctx.globalAlpha = 1;
        ctx.strokeStyle = '#1a1a1a';
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      patchIdx++;
      start = true;
      firstIdx = i + 2;
      continue;
    }
    if (start) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      start = false;
    } else {
      ctx.lineTo(x, y);
    }
  }
  // Handle a final unclosed polygon (if missing NaN terminator).
  if (!start && firstIdx < outlines.length) {
    ctx.closePath();
    if (strokeVisible) {
      ctx.strokeStyle = '#1a1a1a';
      ctx.stroke();
    }
  }
}

function renderFullPatches(
  ctx: CanvasRenderingContext2D,
  patches: Patch[],
  fillAlpha: number,
  strokeVisible: boolean,
  selectedId: number | null,
  hoveredId: number | null,
  scale: number
) {
  for (const p of patches) {
    const poly = p.pixelPolygon;
    if (!poly || poly.length === 0) continue;
    ctx.beginPath();
    ctx.moveTo(poly[0].x, poly[0].y);
    for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y);
    ctx.closePath();
    if (fillAlpha > 0) {
      ctx.globalAlpha = fillAlpha;
      ctx.fillStyle = p.dominantColor || '#888';
      ctx.fill();
    }
    if (strokeVisible) {
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 1 / scale;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    if (p.id === selectedId) {
      ctx.strokeStyle = '#ff8d49';
      ctx.lineWidth = 3 / scale;
      ctx.stroke();
    } else if (p.id === hoveredId) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3 / scale;
      ctx.stroke();
    }
  }
  ctx.lineWidth = 1;
}

// ── Hit-testing via winding-number point-in-polygon ────────────────────────

function hitTestPatch(patches: Patch[] | null, point: Point): number | null {
  if (!patches) return null;
  for (const p of patches) {
    const poly = p.pixelPolygon;
    if (!poly || poly.length < 3) continue;
    if (pointInPolygon(point, poly)) return p.id;
  }
  return null;
}

function pointInPolygon(pt: Point, poly: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x;
    const yi = poly[i].y;
    const xj = poly[j].x;
    const yj = poly[j].y;
    const intersect =
      yi > pt.y !== yj > pt.y && pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}
