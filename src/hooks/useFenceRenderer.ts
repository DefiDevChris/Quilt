'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useCanvasContext } from '@/contexts/CanvasContext';
import { useLayoutStore } from '@/stores/layoutStore';
import { useProjectStore } from '@/stores/projectStore';
import { computeCanvasGeometry } from '@/lib/canvas-utils';
import { computeFenceAreas } from '@/lib/fence-engine';
import { FENCE, CANVAS } from '@/lib/design-system';
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
const ROLE_FILLS = FENCE.normal.fills;

/** Fill colors by fence role — preview mode (transparent). */
const PREVIEW_FILLS = FENCE.preview.fills;

/** Stroke colors by fence role. */
const ROLE_STROKES = FENCE.normal.strokes;

/** Stroke colors for preview mode — dashed, lighter. */
const PREVIEW_STROKES = FENCE.preview.strokes;

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
  const { getCanvas } = useCanvasContext();
  const fabricCanvas = getCanvas();
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
      // Use unified geometry so fence coordinates match the grid canvas exactly
      const geo = computeCanvasGeometry(quiltWidth, quiltHeight, unitSystem, 1, 0, 0);
      const areas = computeFenceAreas(template, quiltWidth, quiltHeight, geo.pxPerUnit);

      // Orphan detection: find user blocks assigned to cell IDs that no
      // longer exist in the new area set and free them for manual placement.
      const newAreaIds = new Set(areas.map((a) => a.id));
      const allCanvasObjects = canvas.getObjects();
      for (const obj of allCanvasObjects) {
        const r = obj as unknown as Record<string, unknown>;
        const assignedCellId = r['_inFenceCellId'] as string | undefined;
        if (assignedCellId && !newAreaIds.has(assignedCellId)) {
          // Free the orphaned block: remove cell assignment, unlock movement
          delete r['_inFenceCellId'];
          obj.set({
            lockMovementX: false,
            lockMovementY: false,
            lockScalingX: false,
            lockScalingY: false,
            lockRotation: false,
          } as Record<string, unknown>);
          obj.setCoords();
        }
      }

      areasRef.current = areas;

      // Render each fence area as a Fabric.js shape (Rect or Polygon)
      for (const area of areas) {
        const fillMap = isPreview ? PREVIEW_FILLS : ROLE_FILLS;
        const strokeMap = isPreview ? PREVIEW_STROKES : ROLE_STROKES;

        // Safe role lookup — fall back to block-cell colors for new roles
        // not yet in the color map (e.g. setting-triangle added before brand config update)
        const safeRole = (area.role in (fillMap as Record<string, unknown>))
          ? area.role
          : 'block-cell';
        const fill =
          !isPreview && preservedFills[area.id] !== undefined
            ? preservedFills[area.id]
            : (fillMap as Record<string, string>)[safeRole];
        const stroke =
          !isPreview && preservedStrokes[area.id] !== undefined
            ? preservedStrokes[area.id]
            : (strokeMap as Record<string, string>)[safeRole];

        const sharedProps = {
          fill: fill as string | undefined,
          stroke: stroke as string | undefined,
          strokeWidth: area.role === 'binding' ? 1.5 : 0.5,
          strokeDashArray: isPreview ? [4, 3] : undefined,
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
        };

        let shape: FabricObject;

        if (area.points && area.points.length >= 3) {
          // Render polygon areas (setting triangles) as Fabric.js Polygon
          shape = new fabric.Polygon(area.points, {
            ...sharedProps,
          }) as unknown as FabricObject;
        } else {
          // Render rectangular areas as Fabric.js Rect
          shape = new fabric.Rect({
            left: area.x,
            top: area.y,
            width: area.width,
            height: area.height,
            angle: area.rotation ?? 0,
            ...sharedProps,
          }) as unknown as FabricObject;
        }

        const r = shape as unknown as Record<string, unknown>;
        r[FENCE_MARKER] = true;
        r[FENCE_AREA_ID_PROP] = area.id;
        r[FENCE_ROLE_PROP] = area.role;

        canvas.add(shape);

        // Render label text inside fence area (if large enough)
        if (area.label && area.width > 20 && area.height > 12) {
          const labelFontSize = Math.max(7, Math.min(11, Math.min(area.width, area.height) * 0.15));

          // For polygon areas (setting triangles), compute the centroid as the
          // average of all vertices so the label sits inside the shape rather
          // than at the bounding-box center (which can land on the hypotenuse).
          let labelX: number;
          let labelY: number;
          if (area.points && area.points.length >= 3) {
            labelX = area.points.reduce((sum, p) => sum + p.x, 0) / area.points.length;
            labelY = area.points.reduce((sum, p) => sum + p.y, 0) / area.points.length;
          } else {
            labelX = area.x + area.width / 2;
            labelY = area.y + area.height / 2;
          }

          const textObj = new fabric.FabricText(area.label, {
            left: labelX,
            top: labelY,
            originX: 'center',
            originY: 'center',
            fontSize: labelFontSize,
            fill: isPreview ? CANVAS.fenceLabelBg : CANVAS.fenceLabelBgLight,
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

      // Single-pass z-layer sort: fence objects at the back, user blocks on top.
      // Replaces the O(n*m) per-object sendToBack/bringToFront loop.
      const allObjects = canvas.getObjects();
      allObjects.sort((a, b) => {
        const aR = a as unknown as Record<string, unknown>;
        const bR = b as unknown as Record<string, unknown>;
        const aIsFence = aR[FENCE_MARKER] ? 1 : 0;
        const bIsFence = bR[FENCE_MARKER] ? 1 : 0;
        // Fence objects sort before (lower index = further back) non-fence objects
        return aIsFence - bIsFence;
      });

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
