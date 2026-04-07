'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useLayoutStore } from '@/stores/layoutStore';
import { useProjectStore } from '@/stores/projectStore';
import { getPixelsPerUnit } from '@/lib/canvas-utils';
import { fitLayoutToQuilt } from '@/lib/layout-renderer';
import type { LayoutTemplate, LayoutArea, LayoutAreaRole } from '@/types/layout';

/** Property name used to tag Fabric.js objects created by this renderer. */
const RENDERER_MARKER = '_layoutRendererElement';
const AREA_ID_PROP = '_layoutAreaId';
const AREA_ROLE_PROP = '_layoutAreaRole';

type FabricCanvas = {
  getObjects: () => FabricObject[];
  add: (...objects: FabricObject[]) => void;
  remove: (...objects: FabricObject[]) => void;
  sendObjectToBack: (obj: FabricObject) => void;
  requestRenderAll: () => void;
  toJSON: () => Record<string, unknown>;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  off: (event: string, handler: (...args: unknown[]) => void) => void;
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

/** Fill colors by area role. */
const ROLE_FILLS: Record<LayoutAreaRole, string> = {
  'block-cell': 'rgba(255, 255, 255, 0.6)',
  sashing: '#E8E2D8',
  cornerstone: '#D5CFC5',
  border: '#C8D8E8',
  binding: '#505050',
  edging: '#3D3D3D',
};

/** Stroke colors by area role. */
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
 * Hook that reads the active layout from layoutStore, computes layout areas
 * via the layout renderer engine, and draws selectable Fabric.js rectangles
 * on the canvas for each area.
 *
 * Areas are colored by role and are selectable so users can click to
 * assign blocks or fabrics.
 */
export function useLayoutRenderer() {
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);
  const unitSystem = useCanvasStore((s) => s.unitSystem);
  const prevKeyRef = useRef('');
  const areasRef = useRef<LayoutArea[]>([]);

  const getAreas = useCallback(() => areasRef.current, []);

  useEffect(() => {
    if (!fabricCanvas) return;

    let disposed = false;

    const applyLayout = async () => {
      if (disposed) return;

      const template = storeToTemplate();
      const project = useProjectStore.getState();
      const quiltWidth = project.canvasWidth;
      const quiltHeight = project.canvasHeight;

      // Cache key includes quilt dimensions so the layout reflows when the
      // quilt is resized — but does NOT trigger on unrelated project changes.
      const key = template
        ? `${JSON.stringify(template)}|${quiltWidth}x${quiltHeight}|${unitSystem}`
        : `none|${quiltWidth}x${quiltHeight}|${unitSystem}`;
      if (key === prevKeyRef.current) return;
      prevKeyRef.current = key;

      const fabric = await import('fabric');
      const canvas = fabricCanvas as unknown as FabricCanvas;

      // Remove old renderer objects, preserving any user-applied fabric/color
      // assignments by area ID so a rerender doesn't blow them away.
      const oldObjects = canvas
        .getObjects()
        .filter((obj) => !!(obj as Record<string, unknown>)[RENDERER_MARKER]);

      const preservedFills: Record<string, unknown> = {};
      const preservedStrokes: Record<string, unknown> = {};

      if (oldObjects.length > 0) {
        for (const obj of oldObjects) {
          const r = obj as unknown as Record<string, unknown>;
          const areaId = r[AREA_ID_PROP] as string | undefined;
          if (areaId) {
            preservedFills[areaId] = r.fill as string | undefined;
            preservedStrokes[areaId] = r.stroke as string | undefined;
          }
        }
        canvas.remove(...oldObjects);
      }

      if (!template) {
        areasRef.current = [];
        canvas.requestRenderAll();
        return;
      }

      const pxPerUnit = getPixelsPerUnit(unitSystem);
      const areas = fitLayoutToQuilt(template, quiltWidth, quiltHeight, pxPerUnit);
      areasRef.current = areas;

      // Render each area as a Fabric.js Rect
      for (const area of areas) {
        const fill =
          preservedFills[area.id] !== undefined ? preservedFills[area.id] : ROLE_FILLS[area.role];
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
        });

        const r = rect as unknown as Record<string, unknown>;
        r[RENDERER_MARKER] = true;
        r[AREA_ID_PROP] = area.id;
        r[AREA_ROLE_PROP] = area.role;

        canvas.add(rect as unknown as FabricObject);
        canvas.sendObjectToBack(rect as unknown as FabricObject);
      }

      canvas.requestRenderAll();
      useProjectStore.getState().setDirty(true);
    };

    applyLayout();

    const unsubLayout = useLayoutStore.subscribe(() => {
      applyLayout();
    });
    // Subscribe to project store so layout reflows when quilt dimensions change
    const unsubProject = useProjectStore.subscribe(() => {
      applyLayout();
    });

    return () => {
      disposed = true;
      unsubLayout();
      unsubProject();
    };
  }, [fabricCanvas, unitSystem]);

  return { getAreas };
}

/**
 * Get the area ID and role from a selected Fabric.js object,
 * if it was created by the layout renderer.
 */
export function getLayoutAreaFromObject(
  obj: Record<string, unknown>
): { areaId: string; role: LayoutAreaRole } | null {
  if (!obj[RENDERER_MARKER]) return null;
  const areaId = obj[AREA_ID_PROP] as string | undefined;
  const role = obj[AREA_ROLE_PROP] as LayoutAreaRole | undefined;
  if (!areaId || !role) return null;
  return { areaId, role };
}
