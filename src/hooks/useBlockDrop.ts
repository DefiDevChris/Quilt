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
    const target = e.currentTarget as HTMLElement;
    
    // Check if we're over a valid drop target
    if (fabricCanvas) {
      const fabric = fabricCanvas as unknown as { findTarget: (e: MouseEvent) => unknown };
      const foundTarget = fabric.findTarget(e.nativeEvent as unknown as MouseEvent);
      
      if (foundTarget) {
        const areaObj = foundTarget as Record<string, unknown>;
        if (areaObj['_layoutRendererElement'] && areaObj['_layoutAreaRole'] === 'block-cell') {
          e.dataTransfer.dropEffect = 'copy';
          target.style.cursor = 'copy';
          return;
        }
      }
    }
    
    // Invalid drop target
    e.dataTransfer.dropEffect = 'none';
    target.style.cursor = 'not-allowed';
  }, [fabricCanvas]);

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

        // Disable non-layout objects temporarily so findTarget hits the cells
        const allObjects = canvas.getObjects();
        const userBlocksToRestore: Array<{
          obj: import('fabric').FabricObject;
          prev: boolean;
        }> = [];
        for (const obj of allObjects) {
          const r = obj as unknown as Record<string, unknown>;
          if (!r['_layoutRendererElement']) {
            userBlocksToRestore.push({ obj, prev: obj.evented ?? true });
            obj.evented = false;
          }
        }

        // Use getScenePoint for accurate coordinate mapping on drop
        const pointer = canvas.getScenePoint(e.nativeEvent as unknown as MouseEvent);
        const foundTarget = canvas.findTarget(e.nativeEvent as unknown as import('fabric').TPointerEvent);

        // Restore eventedness immediately after hit-test
        for (const { obj, prev } of userBlocksToRestore) {
          obj.evented = prev;
        }

        // Only allow drops into block-cell areas
        if (!foundTarget) {
          console.warn('[useBlockDrop] findTarget failed - checking fallbackTarget');
          // Fallback: search objects at the pointer coordinate if findTarget missed
          const fallbackTarget = allObjects.find(o => {
            const r = o as unknown as Record<string, unknown>;
            return r['_layoutRendererElement'] && 
                   r['_layoutAreaRole'] === 'block-cell' && 
                   o.containsPoint(pointer);
          });
          
          if (!fallbackTarget) {
            console.warn('[useBlockDrop] No hit detected at pointer coords', pointer);
            return;
          }
          (foundTarget as any) = fallbackTarget;
        }

        const areaObj = foundTarget as Record<string, unknown>;
        console.log('[useBlockDrop] Found target:', areaObj['_layoutAreaId'], areaObj['_layoutAreaRole']);
        if (!areaObj['_layoutRendererElement'] || areaObj['_layoutAreaRole'] !== 'block-cell') {
          return;
        }

        const fabricObj = foundTarget as unknown as import('fabric').FabricObject;
        const cellX = fabricObj.left ?? 0;
        const cellY = fabricObj.top ?? 0;
        const cellW = (fabricObj.width ?? 100) * (fabricObj.scaleX ?? 1);
        const cellH = (fabricObj.height ?? 100) * (fabricObj.scaleY ?? 1);
        const cellRotation = fabricObj.angle ?? 0;
        const targetCellId = (areaObj['_layoutAreaId'] as string | undefined) ?? null;

        // Remove existing block in this cell
        let previousOccupant: import('fabric').FabricObject | null = null;
        if (targetCellId) {
          for (const obj of allObjects) {
            const r = obj as unknown as Record<string, unknown>;
            if (r['_inLayoutCellId'] === targetCellId) {
              previousOccupant = obj as unknown as import('fabric').FabricObject;
              break;
            }
          }
        }

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

        if (previousOccupant) {
          canvas.remove(previousOccupant);
        }

        const group = new fabric.Group(objects, {
          originX: 'center',
          originY: 'center',
          subTargetCheck: true,
          lockMovementX: true,
          lockMovementY: true,
          lockRotation: true,
          lockScalingX: true,
          lockScalingY: true,
        });

        const tightW = group.width ?? 100;
        const tightH = group.height ?? 100;

        group.set({
          left: cellX + cellW / 2,
          top: cellY + cellH / 2,
          scaleX: cellW / tightW,
          scaleY: cellH / tightH,
          angle: cellRotation,
        });

        if (targetCellId) {
          (group as unknown as Record<string, unknown>)['_inLayoutCellId'] = targetCellId;
        }

        canvas.add(group);
        canvas.setActiveObject(group);
        canvas.requestRenderAll();
        setActiveTool('select');
      } catch {
        // Block drop failed silently
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
