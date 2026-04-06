'use client';

import { useCallback, useRef } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useLayoutStore } from '@/stores/layoutStore';
import { PIXELS_PER_INCH } from '@/lib/constants';
import type { Canvas as FabricCanvas } from 'fabric';

/**
 * Hook for handling block drops onto the Fabric.js canvas.
 * Fetches the full block data, deserializes the Fabric.js JSON,
 * places it at drop coordinates, and applies grid snapping.
 */
export function useBlockDrop() {
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);
  const gridSettings = useCanvasStore((s) => s.gridSettings);
  const pushUndoState = useCanvasStore((s) => s.pushUndoState);
  const setActiveTool = useCanvasStore((s) => s.setActiveTool);
  const blockSize = useLayoutStore((s) => s.blockSize);
  const dragBlockIdRef = useRef<string | null>(null);

  const handleDragStart = useCallback((_e: React.DragEvent, blockId: string) => {
    dragBlockIdRef.current = blockId;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    const target = e.currentTarget as HTMLElement;
    target.style.cursor = 'copy';
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement;
    target.style.cursor = '';
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      const target = e.currentTarget as HTMLElement;
      target.style.cursor = '';

      if (!fabricCanvas) return;
      const canvas = fabricCanvas as FabricCanvas | null;
      if (!canvas) return;

      const blockId =
        e.dataTransfer.getData('application/quiltcorgi-block-id') || dragBlockIdRef.current;
      if (!blockId) return;

      try {
        const res = await fetch(`/api/blocks/${blockId}`);
        const json = await res.json();
        if (!res.ok || !json.data) return;

        const blockData = json.data;
        const fabricJsData = blockData.fabricJsData;
        if (!fabricJsData) return;

        const groupData = fabricJsData as {
          objects?: Array<Record<string, unknown>>;
          width?: number;
          height?: number;
        };

        const fabric = await import('fabric');

        // Get drop position relative to canvas
        const canvasEl = canvas.getElement();
        const rect = canvasEl.getBoundingClientRect();
        const vpt = canvas.viewportTransform;
        const zoom = canvas.getZoom();

        let dropX = (e.clientX - rect.left - (vpt?.[4] ?? 0)) / zoom;
        let dropY = (e.clientY - rect.top - (vpt?.[5] ?? 0)) / zoom;

        let cellRotation = 0;
        let targetScaleX = (blockSize * PIXELS_PER_INCH) / (groupData.width ?? 100);
        let targetScaleY = (blockSize * PIXELS_PER_INCH) / (groupData.height ?? 100);

        // Check if we dropped over a layout area (block-cell)
        const foundTarget = canvas.findTarget(e.nativeEvent as unknown as import('fabric').TPointerEvent);
        if (foundTarget) {
          const areaObj = foundTarget as Record<string, unknown>;
          if (areaObj['_layoutRendererElement'] && areaObj['_layoutAreaRole'] === 'block-cell') {
            const fabricObj = foundTarget as unknown as import('fabric').FabricObject;
            dropX = fabricObj.left ?? dropX;
            dropY = fabricObj.top ?? dropY;
            
            const cellW = (fabricObj.width ?? blockSize * PIXELS_PER_INCH) * (fabricObj.scaleX ?? 1);
            const cellH = (fabricObj.height ?? blockSize * PIXELS_PER_INCH) * (fabricObj.scaleY ?? 1);
            
            targetScaleX = cellW / (groupData.width ?? 100);
            targetScaleY = cellH / (groupData.height ?? 100);
            cellRotation = fabricObj.angle ?? 0;
          } else {
            // Only snap to grid if NOT dropping on a layout cell
            if (gridSettings.snapToGrid && gridSettings.enabled) {
              const gridSizePx = gridSettings.size * PIXELS_PER_INCH;
              dropX = Math.round(dropX / gridSizePx) * gridSizePx;
              dropY = Math.round(dropY / gridSizePx) * gridSizePx;
            }
          }
        } else if (gridSettings.snapToGrid && gridSettings.enabled) {
          const gridSizePx = gridSettings.size * PIXELS_PER_INCH;
          dropX = Math.round(dropX / gridSizePx) * gridSizePx;
          dropY = Math.round(dropY / gridSizePx) * gridSizePx;
        }

        // Save undo state before adding
        const currentJson = JSON.stringify(canvas.toJSON());
        pushUndoState(currentJson);

        const objects: import('fabric').FabricObject[] = [];

        if (groupData.objects && Array.isArray(groupData.objects)) {
          for (const obj of groupData.objects) {
            const fabricObj = await createFabricObject(fabric, obj);
            if (fabricObj) objects.push(fabricObj);
          }
        }

        if (objects.length === 0) return;

        const group = new fabric.Group(objects, {
          left: dropX,
          top: dropY,
          scaleX: targetScaleX,
          scaleY: targetScaleY,
          angle: cellRotation,
          subTargetCheck: true,
        });

        canvas.add(group);
        canvas.setActiveObject(group);
        canvas.requestRenderAll();
        setActiveTool('select');
      } catch {
        // Block drop failed silently — canvas state unchanged
      }

      dragBlockIdRef.current = null;
    },
    [fabricCanvas, gridSettings, blockSize, pushUndoState, setActiveTool]
  );

  return { handleDragStart, handleDragOver, handleDrop, handleDragLeave };
}

async function createFabricObject(
  fabric: typeof import('fabric'),
  obj: Record<string, unknown>
): Promise<import('fabric').FabricObject | null> {
  const type = obj.type as string;
  const fill = (obj.fill as string) ?? '#000';
  const stroke = (obj.stroke as string) ?? null;
  const strokeWidth = (obj.strokeWidth as number) ?? 0.5;

  switch (type) {
    case 'Rect': {
      return new fabric.Rect({
        left: obj.left as number,
        top: obj.top as number,
        width: obj.width as number,
        height: obj.height as number,
        fill,
        stroke,
        strokeWidth,
        opacity: (obj.opacity as number) ?? 1,
      });
    }
    case 'Polygon': {
      const points = obj.points as Array<{ x: number; y: number }>;
      if (!points || points.length === 0) return null;
      return new fabric.Polygon(points, {
        fill,
        stroke,
        strokeWidth,
      });
    }
    case 'Circle': {
      return new fabric.Circle({
        left: obj.left as number,
        top: obj.top as number,
        radius: obj.radius as number,
        fill,
        stroke,
        strokeWidth,
      });
    }
    case 'Path': {
      const pathData = obj.path as string;
      if (!pathData) return null;
      return new fabric.Path(pathData, {
        fill: fill || undefined,
        stroke,
        strokeWidth,
      });
    }
    case 'Line': {
      const coords = [obj.x1 as number, obj.y1 as number, obj.x2 as number, obj.y2 as number] as [
        number,
        number,
        number,
        number,
      ];
      return new fabric.Line(coords, {
        stroke: (obj.stroke as string) ?? '#333',
        strokeWidth,
      });
    }
    default:
      return null;
  }
}
