'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useCanvasContext } from '@/contexts/CanvasContext';
import { useDesignerStore } from '@/stores/designerStore';

/** Tag for realistic render artifacts so we can clean them up. */
const REALISTIC_MARKER = '_realisticRender';
const STITCH_LINE_TAG = '_stitchLine';
const SHADOW_TAG = '_shadowGroup';

/** FPS threshold below which realistic mode is auto-disabled. */
const FPS_THRESHOLD = 30;
/** How often to check FPS (ms). */
const FPS_CHECK_INTERVAL = 2000;

type FabricCanvas = {
  getObjects: () => FabricObject[];
  add: (...objects: FabricObject[]) => void;
  remove: (...objects: FabricObject[]) => void;
  requestRenderAll: () => void;
  getZoom: () => number;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  off: (event: string, handler: (...args: unknown[]) => void) => void;
};

type FabricObject = {
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  stroke?: string;
  strokeWidth?: number;
  shadow?: unknown;
  set: (props: Record<string, unknown>) => void;
  setCoords: () => void;
  dirty?: boolean;
  [key: string]: unknown;
};

/**
 * Hook that adds realistic rendering effects to the Fabric.js canvas:
 * - Drop shadows on block cell borders (fabric.Shadow)
 * - Stitch lines along sashing edges (fabric.Line with strokeDashArray)
 * - Randomized pattern offsets (1-2px) per patch
 *
 * Auto-disables if FPS drops below threshold.
 * All effects are tagged for clean removal when realistic mode is disabled.
 */
export function useRealisticRender() {
  const { getCanvas } = useCanvasContext();
  const fabricCanvas = getCanvas();
  const realisticMode = useDesignerStore((s) => s.realisticMode);
  const fpsDroppedRef = useRef(false);
  const fpsMonitorRef = useRef<number | null>(null);
  const frameCountRef = useRef(0);
  const lastFpsCheckRef = useRef(0);
  const stitchLinesRef = useRef<FabricObject[]>([]);
  const shadowGroupsRef = useRef<FabricObject[]>([]);

  /** Clean up all realistic render artifacts. */
  const cleanupRealistic = useCallback(() => {
    const canvas = fabricCanvas as unknown as FabricCanvas | null;
    if (!canvas) return;

    const objects = canvas.getObjects();
    const toRemove: FabricObject[] = [];

    for (const obj of objects) {
      const r = obj as unknown as Record<string, unknown>;
      if (r[REALISTIC_MARKER]) {
        toRemove.push(obj);
      }
    }

    if (toRemove.length > 0) {
      canvas.remove(...toRemove);
    }

    // Remove shadows from fence objects
    for (const obj of objects) {
      const r = obj as unknown as Record<string, unknown>;
      if (r[SHADOW_TAG]) {
        obj.set({ shadow: undefined });
        r[SHADOW_TAG] = undefined;
      }
    }

    stitchLinesRef.current = [];
    shadowGroupsRef.current = [];
    canvas.requestRenderAll();
  }, [fabricCanvas]);

  /** Apply realistic rendering effects. */
  const applyRealisticRender = useCallback(async () => {
    const canvas = fabricCanvas as unknown as FabricCanvas | null;
    if (!canvas) return;

    // Clean up existing realistic artifacts before re-applying
    cleanupRealistic();

    const fabric = await import('fabric');
    const objects = canvas.getObjects();

    // ── 1. Drop shadows on block cells ──
    for (const obj of objects) {
      const r = obj as unknown as Record<string, unknown>;
      if (r['_fenceElement'] && r['_fenceRole'] === 'block-cell') {
        // Add shadow if not already applied
        if (!r[SHADOW_TAG]) {
          const shadow = new fabric.Shadow({
            color: 'rgba(0, 0, 0, 0.15)',
            blur: 4,
            offsetX: 1,
            offsetY: 1,
          });
          obj.set({ shadow });
          r[SHADOW_TAG] = true;
        }
      }

      // ── 2. Stitch lines along sashing edges ──
      if (r['_fenceElement'] && r['_fenceRole'] === 'sashing') {
        const left = obj.left ?? 0;
        const top = obj.top ?? 0;
        const width = (obj.width ?? 0) * (Number(obj.scaleX) ?? 1);
        const height = (obj.height ?? 0) * (Number(obj.scaleY) ?? 1);

        // Only add stitch lines if this sashing hasn't been processed yet
        if (!r['_hasStitchLines']) {
          // Top edge stitch line
          const topStitch = new fabric.Line([left, top + 1, left + width, top + 1], {
            stroke: '#8B7355',
            strokeWidth: 0.8,
            strokeDashArray: [4, 3],
            selectable: false,
            evented: false,
            objectCaching: false,
          });
          const ts = topStitch as unknown as Record<string, unknown>;
          ts[REALISTIC_MARKER] = true;
          ts[STITCH_LINE_TAG] = true;
          canvas.add(topStitch as unknown as FabricObject);
          stitchLinesRef.current.push(topStitch as unknown as FabricObject);

          // Bottom edge stitch line
          const bottomStitch = new fabric.Line(
            [left, top + height - 1, left + width, top + height - 1],
            {
              stroke: '#8B7355',
              strokeWidth: 0.8,
              strokeDashArray: [4, 3],
              selectable: false,
              evented: false,
              objectCaching: false,
            }
          );
          const bs = bottomStitch as unknown as Record<string, unknown>;
          bs[REALISTIC_MARKER] = true;
          bs[STITCH_LINE_TAG] = true;
          canvas.add(bottomStitch as unknown as FabricObject);
          stitchLinesRef.current.push(bottomStitch as unknown as FabricObject);

          r['_hasStitchLines'] = true;
        }
      }

      // ── 3. Randomize pattern offsets for block cells ──
      if (r['_fenceElement'] && r['_fenceRole'] === 'block-cell') {
        const fill = obj as unknown as { fill?: { patternTransform?: number[] } };
        if (fill.fill && typeof fill.fill === 'object' && 'patternTransform' in fill.fill) {
          const pattern = fill.fill as { patternTransform?: number[] };
          const transform = pattern.patternTransform ?? [1, 0, 0, 1, 0, 0];
          // Only randomize if not already randomized (check for marker)
          if (!r['_patternJittered']) {
            const jitterX = Math.random() * 1 + 0.5; // 0.5 - 1.5px
            const jitterY = Math.random() * 1 + 0.5;
            transform[4] = jitterX;
            transform[5] = jitterY;
            pattern.patternTransform = transform;
            obj.dirty = true;
            r['_patternJittered'] = true;
          }
        }
      }
    }

    canvas.requestRenderAll();
  }, [fabricCanvas]);

  /** FPS monitor — auto-disables realistic mode if performance drops. */
  const startFpsMonitor = useCallback(() => {
    const canvas = fabricCanvas as unknown as FabricCanvas | null;
    if (!canvas) return;

    const disposedRef = { current: false };
    let animFrameId: number | null = null;
    let lastTime = performance.now();
    frameCountRef.current = 0;
    lastFpsCheckRef.current = lastTime;

    const countFrame = () => {
      if (disposedRef.current) return;
      frameCountRef.current++;
      const now = performance.now();

      if (now - lastFpsCheckRef.current >= FPS_CHECK_INTERVAL) {
        const elapsed = now - lastFpsCheckRef.current;
        const fps = (frameCountRef.current * 1000) / elapsed;

        if (fps < FPS_THRESHOLD && !fpsDroppedRef.current) {
          fpsDroppedRef.current = true;
          // Auto-disable realistic mode
          useDesignerStore.getState().setRealisticMode(false);
        }

        frameCountRef.current = 0;
        lastFpsCheckRef.current = now;
      }

      lastTime = now;
      animFrameId = requestAnimationFrame(countFrame);
    };

    animFrameId = requestAnimationFrame(countFrame);
    fpsMonitorRef.current = animFrameId;

    return () => {
      disposedRef.current = true;
      if (animFrameId !== null) {
        cancelAnimationFrame(animFrameId);
      }
    };
  }, [fabricCanvas]);

  useEffect(() => {
    if (!fabricCanvas) return;

    let disposed = false;
    let cleanupFps: (() => void) | undefined;

    if (realisticMode && !fpsDroppedRef.current) {
      applyRealisticRender();
      cleanupFps = startFpsMonitor();
    } else if (!realisticMode) {
      cleanupRealistic();
      // Reset FPS dropped state so it can be re-enabled
      fpsDroppedRef.current = false;
      if (fpsMonitorRef.current !== null) {
        cancelAnimationFrame(fpsMonitorRef.current);
        fpsMonitorRef.current = null;
      }
    }

    return () => {
      disposed = true;
      cleanupFps?.();
      if (fpsMonitorRef.current !== null) {
        cancelAnimationFrame(fpsMonitorRef.current);
        fpsMonitorRef.current = null;
      }
    };
  }, [fabricCanvas, realisticMode, applyRealisticRender, cleanupRealistic, startFpsMonitor]);
}
