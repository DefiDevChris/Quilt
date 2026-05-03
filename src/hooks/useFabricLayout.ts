'use client';

import { useCallback, useRef } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';
import { useLayoutStore } from '@/stores/layoutStore';

import { saveRecentFabric } from '@/lib/recent-fabrics';
import { loadImage } from '@/lib/image-processing';
import { showDropHighlight, clearDropHighlight } from '@/lib/drop-highlight';
import { findFenceAreaAtPoint } from '@/lib/fence-engine';
import { getComputedLayoutAreas } from '@/lib/layout-areas';
import { CANVAS } from '@/lib/design-system';

const FABRIC_HIGHLIGHT_COLOR = CANVAS.fabricHighlight;
const ALLOWED_FABRIC_ROLES = [
  'sashing',
  'cornerstone',
  'border',
  'binding',
  'setting-triangle',
] as const;


/**
 * Hook for drag-from-library-to-shape fabric application.
 * Fence-enforced: fabrics can ONLY drop into sashing/cornerstone/border/binding/edging areas.
 */
export function useFabricDrop() {
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);
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

        const active = canvas.getActiveObject();
        if (active) {
          try {
            const img = await loadImage(imageUrl);
            const pattern = new fabric.Pattern({ source: img, repeat: 'repeat' });
            active.set('fill', pattern);
            canvas.renderAll();
            const json = JSON.stringify(canvas.toJSON());
            useCanvasStore.getState().pushUndoState(json);
          } catch {
            // Pattern application failed — silently continue
          }
        }

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
    [fabricCanvas, clearHighlight]
  );

  return { handleFabricDragStart, handleFabricDragOver, handleFabricDrop };
}
