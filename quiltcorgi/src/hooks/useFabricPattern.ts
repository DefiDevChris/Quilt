'use client';

import { useCallback } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { computePatternTransform, type FussyCutConfig } from '@/lib/fussy-cut-engine';
import { saveRecentFabric } from '@/components/studio/SelectionPanel';

/**
 * Hook to apply fabric images as Fabric.js pattern fills to canvas objects.
 * Uses dynamic import for SSR safety.
 */
export function useFabricPattern() {
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);

  const applyFabricToObject = useCallback(
    async (objectId: string | null, imageUrl: string) => {
      if (!fabricCanvas) return;

      const fabric = await import('fabric');
      const canvas = fabricCanvas as InstanceType<typeof fabric.Canvas>;

      // Find target object — either by ID or use active selection
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
        const img = await loadImageElement(imageUrl);
        const pattern = new fabric.Pattern({
          source: img,
          repeat: 'repeat',
        });

        // Check for existing fussy cut metadata and apply per-patch transform
        const fussyCutMeta = (target as unknown as { fussyCut?: FussyCutConfig }).fussyCut;
        if (fussyCutMeta) {
          pattern.patternTransform = computePatternTransform(fussyCutMeta);
        }

        target.set('fill', pattern);
        canvas.renderAll();

        // Push undo state
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

      // Check for fussy cut metadata — per-patch transform takes priority
      const fussyCutMeta = (active as unknown as { fussyCut?: FussyCutConfig }).fussyCut;
      if (fussyCutMeta) {
        (fill as InstanceType<typeof fabric.Pattern>).patternTransform =
          computePatternTransform(fussyCutMeta);
      } else {
        // Global pattern transform
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
      }
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

    // Extract scale and rotation from transform matrix
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
      hasPattern: true,
    };
  }, [fabricCanvas]);

  return { applyFabricToObject, updatePatternTransform, getPatternInfo };
}

function loadImageElement(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

/**
 * Hook for drag-from-library-to-shape fabric application.
 * Similar to useBlockDrop but applies fabric pattern fills.
 */
export function useFabricDrop() {
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);
  const { applyFabricToObject } = useFabricPattern();

  const handleFabricDragStart = useCallback((e: React.DragEvent, fabricId: string) => {
    e.dataTransfer.setData('application/quiltcorgi-fabric-id', fabricId);
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  const handleFabricDragOver = useCallback((e: React.DragEvent) => {
    const hasFabricData = e.dataTransfer.types.includes('application/quiltcorgi-fabric-id');
    if (!hasFabricData) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleFabricDrop = useCallback(
    async (e: React.DragEvent) => {
      const fabricId = e.dataTransfer.getData('application/quiltcorgi-fabric-id');
      const imageUrl = e.dataTransfer.getData('application/quiltcorgi-fabric-url');
      const fabricName = e.dataTransfer.getData('application/quiltcorgi-fabric-name');
      if (!fabricId || !imageUrl || !fabricCanvas) return;
      e.preventDefault();

      const fabric = await import('fabric');
      const canvas = fabricCanvas as InstanceType<typeof fabric.Canvas>;

      // Find the object under the drop point
      const foundTarget = canvas.findTarget(e.nativeEvent);

      let applied = false;
      if (foundTarget && 'targets' in foundTarget && Array.isArray(foundTarget.targets)) {
        const target = foundTarget.targets[0] ?? foundTarget;
        canvas.setActiveObject(target as InstanceType<typeof fabric.FabricObject>);
        await applyFabricToObject(null, imageUrl);
        applied = true;
      } else if (foundTarget) {
        canvas.setActiveObject(foundTarget as unknown as InstanceType<typeof fabric.FabricObject>);
        await applyFabricToObject(null, imageUrl);
        applied = true;
      }

      if (applied) {
        saveRecentFabric({ id: fabricId, name: fabricName || fabricId, imageUrl });
      }
    },
    [fabricCanvas, applyFabricToObject]
  );

  return { handleFabricDragStart, handleFabricDragOver, handleFabricDrop };
}
