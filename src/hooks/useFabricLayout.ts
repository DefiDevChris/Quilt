'use client';

import { useCallback, useRef } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useCanvasContext } from '@/contexts/CanvasContext';
import { useProjectStore } from '@/stores/projectStore';
import { useLayoutStore } from '@/stores/layoutStore';

import { saveRecentFabric } from '@/lib/recent-fabrics';
import { loadImage } from '@/lib/image-processing';
import { showDropHighlight, clearDropHighlight } from '@/lib/drop-highlight';
import { computeFenceAreas, findFenceAreaAtPoint, layoutSourceToTemplate } from '@/lib/fence-engine';
import { getPixelsPerUnit } from '@/lib/canvas-utils';
import { CANVAS } from '@/lib/design-system';

const FABRIC_HIGHLIGHT_COLOR = CANVAS.fabricHighlight;
const ALLOWED_FABRIC_ROLES = [
  'sashing',
  'cornerstone',
  'border',
  'binding',
  'edging',
  'setting-triangle',
] as const;

function getComputedLayoutAreas() {
  const layoutState = useLayoutStore.getState();
  const projectState = useProjectStore.getState();
  const { unitSystem } = useCanvasStore.getState();
  const template = layoutSourceToTemplate({
    layoutType: layoutState.layoutType,
    selectedPresetId: layoutState.selectedPresetId,
    rows: layoutState.rows,
    cols: layoutState.cols,
    blockSize: layoutState.blockSize,
    sashing: layoutState.sashing,
    borders: layoutState.borders,
    hasCornerstones: layoutState.hasCornerstones,
    bindingWidth: layoutState.bindingWidth,
  });

  if (!template) {
    return [];
  }

  return computeFenceAreas(
    template,
    projectState.canvasWidth,
    projectState.canvasHeight,
    getPixelsPerUnit(unitSystem)
  );
}

/**
 * Hook to apply fabric images as Fabric.js pattern fills to canvas objects.
 */
export function useFabricLayout() {
  const { getCanvas } = useCanvasContext();
  const fabricCanvas = getCanvas();

  const applyFabricToObject = useCallback(
    async (objectId: string | null, imageUrl: string) => {
      if (!fabricCanvas) return;

      const fabric = await import('fabric');
      const canvas = fabricCanvas as InstanceType<typeof fabric.Canvas>;

      let target: InstanceType<typeof fabric.FabricObject> | null = null;
      if (objectId) {
        target =
          canvas.getObjects().find((obj) => {
            const objData = obj as unknown as { id?: string };
            return objData.id === objectId;
          }) ?? null;
      }
      if (!target) {
        const active = canvas.getActiveObject();
        if (active) target = active;
      }
      if (!target) return;

      try {
        const img = await loadImage(imageUrl);
        const pattern = new fabric.Pattern({ source: img, repeat: 'repeat' });

        target.set('fill', pattern);
        canvas.renderAll();

        const json = JSON.stringify(canvas.toJSON());
        useCanvasStore.getState().pushUndoState(json);
      } catch {
        // Pattern application failed — silently continue
      }
    },
    [fabricCanvas]
  );

  const updatePatternTransform = useCallback(
    async (scaleX: number, scaleY: number, rotation: number, offsetX: number, offsetY: number) => {
      if (!fabricCanvas) return;

      const fabric = await import('fabric');
      const canvas = fabricCanvas as InstanceType<typeof fabric.Canvas>;
      const active = canvas.getActiveObject();
      if (!active) return;

      const fill = active.get('fill');
      if (!fill || typeof fill === 'string') return;

      const rad = (rotation * Math.PI) / 180;
      const cos = Math.cos(rad) * scaleX;
      const sin = Math.sin(rad) * scaleY;
      const patternTransform: [number, number, number, number, number, number] = [
        cos,
        sin,
        -sin,
        cos,
        offsetX,
        offsetY,
      ];

      (fill as InstanceType<typeof fabric.Pattern>).patternTransform = patternTransform;
      active.dirty = true;
      canvas.renderAll();
    },
    [fabricCanvas]
  );

  const getPatternInfo = useCallback(async () => {
    if (!fabricCanvas) return null;

    const fabric = await import('fabric');
    const canvas = fabricCanvas as InstanceType<typeof fabric.Canvas>;
    const active = canvas.getActiveObject();
    if (!active) return null;

    const fill = active.get('fill');
    if (!fill || typeof fill === 'string') return null;

    const pattern = fill as InstanceType<typeof fabric.Pattern>;
    const transform = pattern.patternTransform ?? [1, 0, 0, 1, 0, 0];

    const a = transform[0];
    const b = transform[1];
    const extractedRotation = Math.atan2(b, a) * (180 / Math.PI);
    const extractedScaleX = Math.sqrt(a * a + b * b);
    const c = transform[2];
    const d = transform[3];
    const extractedScaleY = Math.sqrt(c * c + d * d);
    const offsetXVal = transform[4];
    const offsetYVal = transform[5];

    return {
      scaleX: extractedScaleX,
      scaleY: extractedScaleY,
      rotation: extractedRotation,
      offsetX: offsetXVal,
      offsetY: offsetYVal,
      hasLayout: true,
    };
  }, [fabricCanvas]);

  return { applyFabricToObject, updatePatternTransform, getPatternInfo };
}

/**
 * Hook for drag-from-library-to-shape fabric application.
 * Fence-enforced: fabrics can ONLY drop into sashing/cornerstone/border/binding/edging areas.
 */
export function useFabricDrop() {
  const { getCanvas } = useCanvasContext();
  const fabricCanvas = getCanvas();
  const { applyFabricToObject } = useFabricLayout();
  const highlightRectRef = useRef<import('fabric').FabricObject | null>(null);

  const handleFabricDragStart = useCallback((e: React.DragEvent, fabricId: string) => {
    e.dataTransfer.setData('application/quiltcorgi-fabric-id', fabricId);
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  const clearHighlight = useCallback(() => {
    clearDropHighlight(fabricCanvas, highlightRectRef.current);
    highlightRectRef.current = null;
  }, [fabricCanvas]);

  const showFabricHighlight = useCallback(
    async (target: unknown) => {
      if (!fabricCanvas || !target) return;
      clearHighlight();
      highlightRectRef.current = await showDropHighlight(
        fabricCanvas,
        target,
        FABRIC_HIGHLIGHT_COLOR
      );
    },
    [fabricCanvas, clearHighlight]
  );

  const handleFabricDragOver = useCallback(
    async (e: React.DragEvent) => {
      const hasFabricData = e.dataTransfer.types.includes('application/quiltcorgi-fabric-id');
      if (!hasFabricData) return;
      e.preventDefault();

      if (fabricCanvas) {
        const canvas = fabricCanvas as InstanceType<typeof import('fabric').Canvas>;
        const pointer = canvas.getScenePoint(e.nativeEvent as unknown as MouseEvent);
        const targetArea = findFenceAreaAtPoint(
          getComputedLayoutAreas(),
          pointer.x,
          pointer.y,
          [...ALLOWED_FABRIC_ROLES]
        );

        if (targetArea) {
          e.dataTransfer.dropEffect = 'copy';
          await showFabricHighlight(targetArea);
          return;
        }

        const foundTarget = canvas.findTarget(e.nativeEvent);
        if ((foundTarget as Record<string, unknown> | null)?.__isBlockGroup) {
          e.dataTransfer.dropEffect = 'copy';
          await showFabricHighlight(foundTarget);
          return;
        }
      }

      e.dataTransfer.dropEffect = 'none';
      clearHighlight();
    },
    [fabricCanvas, showFabricHighlight, clearHighlight]
  );

  const handleFabricDrop = useCallback(
    async (e: React.DragEvent) => {
      const fabricId = e.dataTransfer.getData('application/quiltcorgi-fabric-id');
      const imageUrl = e.dataTransfer.getData('application/quiltcorgi-fabric-url');
      const fabricName = e.dataTransfer.getData('application/quiltcorgi-fabric-name');
      if (!fabricId || !imageUrl || !fabricCanvas) return;
      e.preventDefault();

      const fabric = await import('fabric');
      const canvas = fabricCanvas as InstanceType<typeof fabric.Canvas>;
      const pointer = canvas.getScenePoint(e.nativeEvent as unknown as MouseEvent);
      const targetArea = findFenceAreaAtPoint(
        getComputedLayoutAreas(),
        pointer.x,
        pointer.y,
        [...ALLOWED_FABRIC_ROLES]
      );
      const foundTarget = canvas.findTarget(e.nativeEvent);
      const areaObj = (foundTarget as Record<string, unknown>) ?? {};

      if (targetArea) {
        const fenceObject = canvas.getObjects().find((obj) => {
          const meta = obj as unknown as Record<string, unknown>;
          return meta._fenceElement && meta._fenceAreaId === targetArea.id;
        });

        if (!fenceObject) {
          clearHighlight();
          return;
        }

        canvas.setActiveObject(fenceObject as unknown as InstanceType<typeof fabric.FabricObject>);
        await applyFabricToObject(null, imageUrl);
        (fenceObject as unknown as Record<string, unknown>).fabricId = fabricId;
        saveRecentFabric({ id: fabricId, name: fabricName || fabricId, imageUrl });
        useProjectStore.getState().setHasContent(true);
        clearHighlight();
        return;
      }

      if (areaObj.__isBlockGroup) {
        const group = foundTarget as unknown as InstanceType<typeof fabric.Group>;
        const scenePoint = canvas.getScenePoint(e.nativeEvent);

        // Find which patch child is under the pointer.
        // Transform scene pointer into the group's local coordinate space
        // using the inverse of the group's full transform matrix.
        const groupMatrix = group.calcTransformMatrix();
        const invMatrix = fabric.util.invertTransform(groupMatrix);
        const localPoint = new fabric.Point(scenePoint.x, scenePoint.y).transform(invMatrix);

        const children = group.getObjects();
        let hitPatch: InstanceType<typeof fabric.FabricObject> | null = null;
        for (let i = children.length - 1; i >= 0; i--) {
          const child = children[i];
          const childMeta = child as unknown as Record<string, unknown>;
          if (childMeta.__pieceRole !== 'patch') continue;
          if (child.containsPoint(localPoint)) {
            hitPatch = child;
            break;
          }
        }

        if (!hitPatch) {
          clearHighlight();
          return;
        }

        // Push undo state before mutation
        const currentJson = JSON.stringify(canvas.toJSON());
        useCanvasStore.getState().pushUndoState(currentJson);

        // Apply the fabric pattern to the individual patch (own Pattern instance)
        try {
          const img = await loadImage(imageUrl);
          const pattern = new fabric.Pattern({ source: img, repeat: 'repeat' });
          hitPatch.set('fill', pattern);
          // Track which library fabric is on this patch (survives serialization)
          (hitPatch as unknown as Record<string, unknown>).fabricId = fabricId;
          canvas.renderAll();
          useProjectStore.getState().setDirty(true);
        } catch {
          // Pattern application failed
        }

        saveRecentFabric({ id: fabricId, name: fabricName || fabricId, imageUrl });
        useProjectStore.getState().setHasContent(true);
        clearHighlight();
        return;
      }

      // Not a valid target
      clearHighlight();
    },
    [fabricCanvas, applyFabricToObject, clearHighlight]
  );

  return { handleFabricDragStart, handleFabricDragOver, handleFabricDrop };
}
