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

/** Fill colors by fence role. */
const ROLE_FILLS: Record<LayoutAreaRole, string> = {
  'block-cell': 'rgba(255, 255, 255, 0.6)',
  sashing: '#E8E2D8',
  cornerstone: '#D5CFC5',
  border: '#C8D8E8',
  binding: '#505050',
  edging: '#3D3D3D',
};

/** Stroke colors by fence role. */
const ROLE_STROKES: Record<LayoutAreaRole, string> = {
  'block-cell': '#8B8B8B',
  sashing: '#B0A898',
  cornerstone: '#A09888',
  border: '#A0B0C0',
  binding: '#383838',
  edging: '#2A2A2A',
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
    sashingWidth: category === 'sashing' ? s.sashing.width : 0,
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

      const pxPerUnit = getPixelsPerUnit(unitSystem);
      const areas = computeFenceAreas(template, quiltWidth, quiltHeight, pxPerUnit);
      areasRef.current = areas;

      // Render each fence area as a Fabric.js Rect
      for (const area of areas) {
        const fill =
          preservedFills[area.id] !== undefined
            ? preservedFills[area.id]
            : ROLE_FILLS[area.role];
        const stroke =
          preservedStrokes[area.id] !== undefined
            ? preservedStrokes[area.id]
            : ROLE_STROKES[area.role];

        const rect = new fabric.Rect({
          left: area.x,
          top: area.y,
          width: area.width,
          height: area.height,
          fill: fill as string | undefined,
          stroke: stroke as string | undefined,
          strokeWidth: area.role === 'binding' ? 1.5 : 0.5,
          angle: area.rotation ?? 0,
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
        // Always keep fence areas in back, behind user blocks
        canvas.sendObjectToBack(rect as unknown as FabricObject);
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
      useProjectStore.getState().setDirty(true);
    };

    applyFence();

    const unsubLayout = useLayoutStore.subscribe(() => {
      applyFence();
    });
    const unsubProject = useProjectStore.subscribe(() => {
      applyFence();
    });

    return () => {
      disposed = true;
      unsubLayout();
      unsubProject();
    };
  }, [fabricCanvas, unitSystem]);

  return { getFenceAreas };
}

/**
 * Get the fence area ID and role from a selected Fabric.js object,
 * if it was created by the fence renderer.
 */
export function getFenceAreaFromObject(
  obj: Record<string, unknown>
): { areaId: string; role: LayoutAreaRole } | null {
  if (!obj[FENCE_MARKER]) return null;
  const areaId = obj[FENCE_AREA_ID_PROP] as string | undefined;
  const role = obj[FENCE_ROLE_PROP] as LayoutAreaRole | undefined;
  if (!areaId || !role) return null;
  return { areaId, role };
}
