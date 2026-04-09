'use client';

/* eslint-disable @typescript-eslint/no-unused-vars */
import { useCallback, useRef } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';

import { saveRecentFabric } from '@/lib/recent-fabrics';
import { loadImage } from '@/lib/image-processing';
import { showDropHighlight, clearDropHighlight } from '@/lib/drop-highlight';

const FABRIC_HIGHLIGHT_COLOR = '#10B981';

/**
 * Hook to apply fabric images as Fabric.js pattern fills to canvas objects.
 */
export function useFabricLayout() {
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);

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
        cos, sin, -sin, cos, offsetX, offsetY,
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
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);
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

  const ALLOWED_ROLES = ['sashing', 'cornerstone', 'border', 'binding', 'edging'] as const;

  const handleFabricDragOver = useCallback(
    async (e: React.DragEvent) => {
      const hasFabricData = e.dataTransfer.types.includes('application/quiltcorgi-fabric-id');
      if (!hasFabricData) return;
      e.preventDefault();

      if (fabricCanvas) {
        const fabric = fabricCanvas as unknown as { findTarget: (e: MouseEvent) => unknown };
        const foundTarget = fabric.findTarget(e.nativeEvent as unknown as MouseEvent);
        if (foundTarget) {
          const areaObj = foundTarget as Record<string, unknown>;
          // Highlight when cursor is over a valid fabric area
          if (areaObj['_fenceElement'] && ALLOWED_ROLES.includes(areaObj['_fenceRole'] as typeof ALLOWED_ROLES[number])) {
            e.dataTransfer.dropEffect = 'copy';
            await showFabricHighlight(foundTarget);
            return;
          }
        }
      }
      // Drops outside valid areas are rejected
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

      const foundTarget = canvas.findTarget(e.nativeEvent);
      if (!foundTarget) {
        clearHighlight();
        return;
      }

      const areaObj = foundTarget as Record<string, unknown>;
      if (!areaObj['_fenceElement'] || !ALLOWED_ROLES.includes(areaObj['_fenceRole'] as typeof ALLOWED_ROLES[number])) {
        clearHighlight();
        return;
      }

      canvas.setActiveObject(foundTarget as unknown as InstanceType<typeof fabric.FabricObject>);
      await applyFabricToObject(null, imageUrl);
      saveRecentFabric({ id: fabricId, name: fabricName || fabricId, imageUrl });
      useProjectStore.getState().setHasContent(true);
      clearHighlight();
    },
    [fabricCanvas, applyFabricToObject, clearHighlight]
  );

  return { handleFabricDragStart, handleFabricDragOver, handleFabricDrop };
}
