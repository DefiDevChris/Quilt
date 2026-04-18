'use client';

import { useCallback, useRef } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useCanvasContext } from '@/contexts/CanvasContext';
import { useProjectStore } from '@/stores/projectStore';
import type { Canvas as FabricCanvas } from 'fabric';
import { snapToGridCorner } from '@/lib/snap-utils';
import { getPixelsPerUnit } from '@/lib/canvas-utils';

/**
 * Hook for handling fabric drops onto the Fabric.js canvas.
 *
 * Layout/Template mode: fabric drops onto blocks/patches or borders/sashing only.
 * Free-form mode: fabric drops onto any shape/block, or creates new rectangle on empty canvas.
 */
export function useFabricDrop() {
  const { getCanvas } = useCanvasContext();
  const fabricCanvas = getCanvas();
  const pushUndoState = useCanvasStore((s) => s.pushUndoState);
  const setActiveTool = useCanvasStore((s) => s.setActiveTool);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const { mode } = useProjectStore.getState();

      if (mode === 'layout' || mode === 'template') {
        // Layout/Template: check if dropping over valid target
        const fabricId = e.dataTransfer.getData('application/quiltcorgi-fabric-id');
        if (fabricId && isValidFabricDropTarget(e, fabricCanvas)) {
          e.dataTransfer.dropEffect = 'copy';
        } else {
          e.dataTransfer.dropEffect = 'none';
        }
      } else if (mode === 'free-form') {
        // Free-form: always allow fabric drops
        e.dataTransfer.dropEffect = 'copy';
      }
    },
    [fabricCanvas]
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();

      if (!fabricCanvas) return;
      const canvas = fabricCanvas as FabricCanvas | null;
      if (!canvas) return;

      const fabricId = e.dataTransfer.getData('application/quiltcorgi-fabric-id');
      if (!fabricId) return;

      try {
        // Fetch fabric data
        const res = await fetch(`/api/fabrics/${fabricId}`);
        const json = await res.json();
        if (!res.ok || !json.data) return;

        const fabricData = json.data;
        const { mode } = useProjectStore.getState();
        const { gridSettings, zoom } = useCanvasStore.getState();

        const currentJson = JSON.stringify(canvas.toJSON());
        const undoSaved = pushUndoState(currentJson);

        if (mode === 'layout' || mode === 'template') {
          // Layout/Template: apply to block/patch or border/sashing
          const pointer = canvas.getScenePoint(e.nativeEvent as unknown as MouseEvent);
          const targetObject = canvas.findTarget(e.nativeEvent as unknown as MouseEvent) as any;

          if (targetObject) {
            // Apply fabric to the target object
            applyFabricToObject(targetObject, fabricData);
            canvas.requestRenderAll();
          }
        } else if (mode === 'free-form') {
          // Free-form: apply to shape/block, or create new rectangle
          const pointer = canvas.getScenePoint(e.nativeEvent as unknown as MouseEvent);
          const targetObject = canvas.findTarget(e.nativeEvent as unknown as MouseEvent) as any;

          if (targetObject) {
            // Apply fabric to existing object
            applyFabricToObject(targetObject, fabricData);
          } else {
            // Create new rectangle on empty canvas
            const fabric = await import('fabric');
            const gridSizeIn =
              gridSettings.size *
              (gridSettings.granularity === 'half'
                ? 0.5
                : gridSettings.granularity === 'quarter'
                  ? 0.25
                  : 1);

            // Snap drop point to grid corner
            const snappedPoint = gridSettings.snapToGrid
              ? snapToGridCorner(pointer, gridSizeIn, zoom)
              : pointer;

            // Create 6" default rectangle
            const rectSizePx = 6 * getPixelsPerUnit('imperial');
            const rect = new fabric.Rect({
              left: snappedPoint.x - rectSizePx / 2,
              top: snappedPoint.y - rectSizePx / 2,
              width: rectSizePx,
              height: rectSizePx,
              fill: fabricData.imageUrl || fabricData.color || '#cccccc',
            });

            canvas.add(rect);
            canvas.setActiveObject(rect);
          }

          canvas.requestRenderAll();
        }

        setActiveTool('select');
        const projectStore = useProjectStore.getState();
        projectStore.setHasContent(true);
      } catch {
        // Fabric drop failed silently
      }
    },
    [fabricCanvas, pushUndoState, setActiveTool]
  );

  return { handleDragOver, handleDrop };
}

/**
 * Check if the drop target is valid for fabric in Layout/Template mode
 */
function isValidFabricDropTarget(e: React.DragEvent, canvas: unknown): boolean {
  if (!canvas) return false;

  const fabricCanvas = canvas as FabricCanvas;
  const target = fabricCanvas.findTarget(e.nativeEvent as unknown as MouseEvent) as any;

  if (!target) return false;

  // Check if target is a block/patch or border/sashing
  const targetType = (target as any).__type || target.type;
  return ['block', 'patch', 'border', 'sashing'].includes(targetType);
}

/**
 * Apply fabric data to a Fabric.js object
 */
function applyFabricToObject(target: any, fabricData: any): void {
  if (target.fill !== undefined) {
    // For shapes that have fill
    target.set('fill', fabricData.imageUrl || fabricData.color || '#cccccc');
  }

  // Store fabric metadata
  target.__fabricId = fabricData.id;
  target.__fabricData = fabricData;
}
