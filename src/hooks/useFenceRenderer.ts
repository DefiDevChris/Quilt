'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useLayoutStore } from '@/stores/layoutStore';
import { useProjectStore } from '@/stores/projectStore';
import { getPixelsPerUnit } from '@/lib/canvas-utils';
import { computeFenceAreas } from '@/lib/fence-engine';
import type { LayoutTemplate, LayoutAreaRole } from '@/types/layout';
import type { FenceArea } from '@/types/fence';

/** Property names used to tag Fabric.js objects created by this renderer. */
const FENCE_MARKER = '_fenceElement';
const FENCE_AREA_ID_PROP = '_fenceAreaId';
const FENCE_ROLE_PROP = '_fenceRole';

type FabricCanvas = {
  getObjects: () => FabricObject[];
  add: (...objects: FabricObject[]) => void;
  remove: (...objects: FabricObject[]) => void;
  sendObjectToBack: (obj: FabricObject) => void;
  requestRenderAll: () => void;
  bringObjectToFront: (obj: FabricObject) => void;
};

type FabricObject = {
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  set: (props: Record<string, unknown>) => void;
  setCoords: () => void;
  [key: string]: unknown;
};

/** Fill colors by fence role — normal (applied) mode. */
const ROLE_FILLS: Record<LayoutAreaRole, string> = {
  'block-cell': 'rgba(255, 255, 255, 0.6)',
  sashing: '#e8dbcf',
  cornerstone: '#e5d5c5',
  border: '#d5c8b8',
  binding: '#8a7c6f',
  edging: '#6b5d50',
};

/** Fill colors by fence role — preview mode (transparent). */
const PREVIEW_FILLS: Record<LayoutAreaRole, string> = {
  'block-cell': 'rgba(249, 160, 107, 0.15)',
  sashing: 'rgba(138, 124, 111, 0.15)',
  cornerstone: 'rgba(138, 124, 111, 0.12)',
  border: 'rgba(249, 160, 107, 0.15)',
  binding: 'rgba(249, 160, 107, 0.10)',
  edging: 'rgba(0, 0, 0, 0.08)',
};

/** Stroke colors by fence role. */
const ROLE_STROKES: Record<LayoutAreaRole, string> = {
  'block-cell': '#b8a698',
  sashing: '#b8a698',
  cornerstone: '#a89888',
  border: '#b8a698',
  binding: '#6b5d50',
  edging: '#4a3f35',
};

/** Stroke colors for preview mode — dashed, lighter. */
const PREVIEW_STROKES: Record<LayoutAreaRole, string> = {
  'block-cell': 'rgba(249, 160, 107, 0.4)',
  sashing: 'rgba(138, 124, 111, 0.4)',
  cornerstone: 'rgba(138, 124, 111, 0.35)',
  border: 'rgba(249, 160, 107, 0.4)',
  binding: 'rgba(249, 160, 107, 0.3)',
  edging: 'rgba(0, 0, 0, 0.2)',
};

/**
 * Build a LayoutTemplate from the current layoutStore state.
 */
function storeToTemplate(): LayoutTemplate | null {
  const s = useLayoutStore.getState();

  if (s.layoutType === 'none' || s.layoutType === 'free-form') return null;

  const categoryMap: Record<string, LayoutTemplate['category']> = {
    grid: 'straight',
    sashing: 'sashing',
    'on-point': 'on-point',
    strippy: 'strippy',
    medallion: 'medallion',
  };

  const category = categoryMap[s.layoutType];
  if (!category) return null;

  return {
    id: s.selectedPresetId ?? 'custom',
    name: 'Custom Layout',
    category,
    gridRows: s.rows,
    gridCols: s.cols,
    defaultBlockSize: s.blockSize,
    sashingWidth: category === 'sashing' || category === 'strippy' ? s.sashing.width : 0,
    hasCornerstones: s.hasCornerstones,
    borders: s.borders.map((b, i) => ({ width: b.width, position: i })),
    bindingWidth: s.bindingWidth,
    thumbnailSvg: '',
  };
}

/**
 * Hook that reads the active layout from layoutStore, computes fence areas
 * via the fence engine, and draws selectable Fabric.js rectangles on the
 * canvas for each area.
 *
 * Areas are colored by role and are selectable so users can click to
 * assign blocks or fabrics. Acts as a **fence**: blocks can only drop into
 * block-cell areas, fabrics can only drop into structural areas.
 */
export function useFenceRenderer() {
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);
  const unitSystem = useCanvasStore((s) => s.unitSystem);
  const prevKeyRef = useRef('');
  const areasRef = useRef<FenceArea[]>([]);

  const getFenceAreas = useCallback(() => areasRef.current, []);

  useEffect(() => {
    if (!fabricCanvas) return;

    let disposed = false;
    let rafId: number | null = null;

    const applyFence = async () => {
      if (disposed) return;

      const template = storeToTemplate();
      const project = useProjectStore.getState();
      const quiltWidth = project.canvasWidth;
      const quiltHeight = project.canvasHeight;

      // Cache key — reflows when template or quilt dimensions change
      const key = template
        ? `${JSON.stringify(template)}|${quiltWidth}x${quiltHeight}|${unitSystem}`
        : `none|${quiltWidth}x${quiltHeight}|${unitSystem}`;
      if (key === prevKeyRef.current) return;
      prevKeyRef.current = key;

      const fabric = await import('fabric');
      const canvas = fabricCanvas as unknown as FabricCanvas;

      // Remove old fence objects, preserving user-applied fills by area ID
      const oldObjects = canvas
        .getObjects()
        .filter((obj) => !!(obj as Record<string, unknown>)[FENCE_MARKER]);

      const preservedFills: Record<string, unknown> = {};
      const preservedStrokes: Record<string, unknown> = {};

      if (oldObjects.length > 0) {
        for (const obj of oldObjects) {
          const r = obj as unknown as Record<string, unknown>;
          const areaId = r[FENCE_AREA_ID_PROP] as string | undefined;
          if (areaId) {
            preservedFills[areaId] = r.fill as string | undefined;
            preservedStrokes[areaId] = r.stroke as string | undefined;
          }
        }
        // Only remove fence objects, never user blocks
        canvas.remove(...oldObjects);
      }

      if (!template) {
        areasRef.current = [];
        canvas.requestRenderAll();
        return;
      }

      const isPreview = useLayoutStore.getState().previewMode;
      const pxPerUnit = getPixelsPerUnit(unitSystem);
      const areas = computeFenceAreas(template, quiltWidth, quiltHeight, pxPerUnit);
      areasRef.current = areas;

      // Render each fence area as a Fabric.js Rect
      for (const area of areas) {
        const fillMap = isPreview ? PREVIEW_FILLS : ROLE_FILLS;
        const strokeMap = isPreview ? PREVIEW_STROKES : ROLE_STROKES;

        const fill =
          !isPreview && preservedFills[area.id] !== undefined
            ? preservedFills[area.id]
            : fillMap[area.role];
        const stroke =
          !isPreview && preservedStrokes[area.id] !== undefined
            ? preservedStrokes[area.id]
            : strokeMap[area.role];

        const rect = new fabric.Rect({
          left: area.x,
          top: area.y,
          width: area.width,
          height: area.height,
          fill: fill as string | undefined,
          stroke: stroke as string | undefined,
          strokeWidth: area.role === 'binding' ? 1.5 : 0.5,
          strokeDashArray: isPreview ? [4, 3] : undefined,
          angle: area.rotation ?? 0,
          selectable: !isPreview,
          evented: !isPreview,
          hasControls: false,
          hasBorders: true,
          lockMovementX: true,
          lockMovementY: true,
          lockRotation: true,
          lockScalingX: true,
          lockScalingY: true,
          hoverCursor: isPreview ? 'default' : 'pointer',
          objectCaching: false,
          perPixelTargeting: false,
        });

        const r = rect as unknown as Record<string, unknown>;
        r[FENCE_MARKER] = true;
        r[FENCE_AREA_ID_PROP] = area.id;
        r[FENCE_ROLE_PROP] = area.role;

        canvas.add(rect as unknown as FabricObject);
        // Always keep fence areas in back, behind user blocks
        canvas.sendObjectToBack(rect as unknown as FabricObject);

        // Render label text inside fence area (if large enough)
        if (area.label && area.width > 20 && area.height > 12) {
          const labelFontSize = Math.max(7, Math.min(11, Math.min(area.width, area.height) * 0.15));
          const textObj = new fabric.FabricText(area.label, {
            left: area.x + area.width / 2,
            top: area.y + area.height / 2,
            originX: 'center',
            originY: 'center',
            fontSize: labelFontSize,
            fill: isPreview ? 'rgba(74, 63, 53, 0.25)' : 'rgba(74, 63, 53, 0.12)',
            fontFamily: 'var(--font-sans)',
            selectable: false,
            evented: false,
          });
          const lr = textObj as unknown as Record<string, unknown>;
          lr[FENCE_MARKER] = true;
          lr[FENCE_AREA_ID_PROP] = `${area.id}-label`;
          lr[FENCE_ROLE_PROP] = area.role;
          canvas.add(textObj as unknown as FabricObject);
        }
      }

      // Ensure all user blocks stay on top of fence areas
      const allObjects = canvas.getObjects();
      for (const obj of allObjects) {
        const r = obj as unknown as Record<string, unknown>;
        if (r['_inFenceCellId']) {
          canvas.bringObjectToFront(obj as unknown as FabricObject);
        }
      }

      canvas.requestRenderAll();
      if (!isPreview) {
        useProjectStore.getState().setDirty(true);
      }
    };

    /**
     * Debounced fence update via requestAnimationFrame.
     * Rapid state changes (slider ticks) coalesce into a single render,
     * preventing flicker during continuous adjustments.
     */
    const scheduleFenceUpdate = () => {
      if (disposed) return;
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        rafId = null;
        applyFence();
      });
    };

    // Initial render — immediate, no debounce
    applyFence();

    // Subsequent changes — debounced via rAF
    const unsubLayout = useLayoutStore.subscribe(scheduleFenceUpdate);
    const unsubProject = useProjectStore.subscribe(scheduleFenceUpdate);

    return () => {
      disposed = true;
      if (rafId !== null) cancelAnimationFrame(rafId);
      unsubLayout();
      unsubProject();
    };
  }, [fabricCanvas, unitSystem]);

  return { getFenceAreas };
}

/**
 * Get the fence area ID and role from a selected Fabric.js object,
 * if it was created by the fence renderer.
 * Internal utility — not exported for external use.
 */
function getFenceAreaFromObject(
  obj: Record<string, unknown>
): { areaId: string; role: LayoutAreaRole } | null {
  if (!obj[FENCE_MARKER]) return null;
  const areaId = obj[FENCE_AREA_ID_PROP] as string | undefined;
  const role = obj[FENCE_ROLE_PROP] as LayoutAreaRole | undefined;
  if (!areaId || !role) return null;
  return { areaId, role };
}
