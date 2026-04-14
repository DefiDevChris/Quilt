'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useCanvasContext } from '@/contexts/CanvasContext';
import { useDesignerStore } from '@/stores/designerStore';
import { getPixelsPerUnit } from '@/lib/canvas-utils';
import { computeDesignerFenceAreas } from '@/lib/designer-fence-engine';
import { FENCE, CANVAS } from '@/lib/design-system';
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

/** Fill colors by fence role for the designer. */
const ROLE_FILLS: Record<string, string> = {
  'block-cell': FENCE.normal.fills['block-cell'],
  sashing: FENCE.normal.fills.sashing,
  border: FENCE.normal.fills.border,
};

/** Stroke colors by fence role for the designer. */
const ROLE_STROKES: Record<string, string> = {
  'block-cell': FENCE.normal.strokes['block-cell'],
  sashing: FENCE.normal.strokes.sashing,
  border: FENCE.normal.strokes.border,
};

/**
 * Hook that reads the grid config from designerStore, computes fence areas
 * via the designer-fence-engine, and draws selectable Fabric.js rectangles
 * on the canvas for each area.
 *
 * Areas are colored by role and are selectable so users can click to
 * assign blocks or fabrics. Acts as a **fence**: blocks can only drop into
 * block-cell areas, fabrics can only drop into structural areas.
 *
 * Simplified from useFenceRenderer — no layoutStore, no preview mode,
 * no complex layout types. Only grid + sashing + borders.
 */
export function useDesignerFenceRenderer() {
  const { getCanvas } = useCanvasContext();
  const fabricCanvas = getCanvas();
  const prevKeyRef = useRef('');
  const areasRef = useRef<FenceArea[]>([]);
  const prevRelevantRef = useRef('');

  const getFenceAreas = useCallback(() => areasRef.current, []);

  useEffect(() => {
    if (!fabricCanvas) return;

    let disposed = false;
    let rafId: number | null = null;

    const applyFence = async () => {
      if (disposed) return;

      const state = useDesignerStore.getState();
      const { rows, cols, blockSize, sashingWidth, borders } = state;

      // Use project dimensions from projectStore, unitSystem from canvasStore
      const { canvasWidth, canvasHeight } = (
        await import('@/stores/projectStore')
      ).useProjectStore.getState();
      const { unitSystem } = (await import('@/stores/canvasStore')).useCanvasStore.getState();
      const quiltWidthIn = canvasWidth;
      const quiltHeightIn = canvasHeight;
      const pxPerUnit = getPixelsPerUnit(unitSystem);

      // Cache key — reflows when config changes
      const key = `${rows}x${cols}|${blockSize}|${sashingWidth}|${JSON.stringify(borders)}|${quiltWidthIn}x${quiltHeightIn}`;
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
        canvas.remove(...oldObjects);
      }

      // Compute fence areas from designer config
      const borderConfigs = borders.map((b) => ({
        width: b.width,
        fabricId: b.fabricId,
        fabricUrl: b.fabricUrl,
      }));

      const areas = computeDesignerFenceAreas(
        rows,
        cols,
        blockSize,
        sashingWidth,
        borderConfigs,
        quiltWidthIn,
        quiltHeightIn,
        pxPerUnit
      );
      areasRef.current = areas;

      // Render each fence area as a Fabric.js Rect
      for (const area of areas) {
        const fill =
          preservedFills[area.id] !== undefined
            ? (preservedFills[area.id] as string)
            : (ROLE_FILLS[area.role] ?? 'transparent');
        const stroke =
          preservedStrokes[area.id] !== undefined
            ? (preservedStrokes[area.id] as string)
            : (ROLE_STROKES[area.role] ?? CANVAS.gridLine);

        const rect = new fabric.Rect({
          left: area.x,
          top: area.y,
          width: area.width,
          height: area.height,
          fill,
          stroke,
          strokeWidth: 0.5,
          selectable: true,
          evented: true,
          hasControls: false,
          hasBorders: true,
          lockMovementX: true,
          lockMovementY: true,
          lockRotation: true,
          lockScalingX: true,
          lockScalingY: true,
          hoverCursor: 'pointer',
          objectCaching: false,
          perPixelTargeting: false,
        });

        const r = rect as unknown as Record<string, unknown>;
        r[FENCE_MARKER] = true;
        r[FENCE_AREA_ID_PROP] = area.id;
        r[FENCE_ROLE_PROP] = area.role;

        canvas.add(rect as unknown as FabricObject);
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
            fill: CANVAS.fenceLabelBg,
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
    };

    /**
     * Debounced fence update via requestAnimationFrame.
     * Rapid state changes (slider ticks) coalesce into a single render.
     */
    const scheduleFenceUpdate = () => {
      if (disposed) return;
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        rafId = null;
        applyFence();
      });
    };

    // Initial render — immediate
    applyFence();

    // Initialize the ref with current state
    const initState = useDesignerStore.getState();
    prevRelevantRef.current = JSON.stringify({
      rows: initState.rows,
      cols: initState.cols,
      blockSize: initState.blockSize,
      sashingWidth: initState.sashingWidth,
      borders: initState.borders,
    });

    // Subscribe to designerStore changes — only re-schedule when relevant fields change
    const unsubDesigner = useDesignerStore.subscribe(() => {
      const state = useDesignerStore.getState();
      const currentRelevant = JSON.stringify({
        rows: state.rows,
        cols: state.cols,
        blockSize: state.blockSize,
        sashingWidth: state.sashingWidth,
        borders: state.borders,
      });
      if (currentRelevant !== prevRelevantRef.current) {
        prevRelevantRef.current = currentRelevant;
        scheduleFenceUpdate();
      }
    });

    return () => {
      disposed = true;
      if (rafId !== null) cancelAnimationFrame(rafId);
      unsubDesigner();
    };
  }, [fabricCanvas]);

  return { getFenceAreas };
}
