'use client';

import { useCallback, useRef } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';
import type { Canvas as FabricCanvas } from 'fabric';
import { showDropHighlight, clearDropHighlight } from '@/lib/drop-highlight';

const BLOCK_HIGHLIGHT_COLOR = '#6366F1';

/**
 * Hook for handling block drops onto the Fabric.js canvas.
 * Fetches the full block data, deserializes the Fabric.js JSON,
 * places it at drop coordinates, and snaps to fence cells.
 *
 * Fence-enforced: blocks can ONLY drop into block-cell areas.
 * Invalid drops are silently ignored.
 */
export function useBlockDrop() {
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);
  const pushUndoState = useCanvasStore((s) => s.pushUndoState);
  const setActiveTool = useCanvasStore((s) => s.setActiveTool);
  const dragBlockIdRef = useRef<string | null>(null);
  const highlightRectRef = useRef<import('fabric').FabricObject | null>(null);

  const handleDragStart = useCallback((_e: React.DragEvent, blockId: string) => {
    dragBlockIdRef.current = blockId;
  }, []);

  const clearHighlight = useCallback(() => {
    clearDropHighlight(fabricCanvas, highlightRectRef.current);
    highlightRectRef.current = null;
  }, [fabricCanvas]);

  const showCellHighlight = useCallback(
    async (target: unknown) => {
      if (!fabricCanvas || !target) return;
      clearHighlight();
      highlightRectRef.current = await showDropHighlight(
        fabricCanvas,
        target,
        BLOCK_HIGHLIGHT_COLOR
      );
    },
    [fabricCanvas, clearHighlight]
  );

  const handleDragOver = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();

      if (fabricCanvas) {
        const fabric = fabricCanvas as unknown as { findTarget: (e: MouseEvent) => unknown };
        const foundTarget = fabric.findTarget(e.nativeEvent as unknown as MouseEvent);

        if (foundTarget) {
          const areaObj = foundTarget as Record<string, unknown>;
          // Highlight when cursor is over a valid block cell area
          if (areaObj['_fenceElement'] && areaObj['_fenceRole'] === 'block-cell') {
            e.dataTransfer.dropEffect = 'copy';
            await showCellHighlight(foundTarget);
            return;
          }
        }
      }

      // Drops outside valid areas are rejected
      clearHighlight();
      e.dataTransfer.dropEffect = 'none';
    },
    [fabricCanvas, showCellHighlight, clearHighlight]
  );

  const handleDragLeave = useCallback(
    (_e: React.DragEvent) => {
      clearHighlight();
    },
    [clearHighlight]
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();

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

        // Disable non-fence objects temporarily so findTarget hits fence cells
        const allObjects = canvas.getObjects();
        const userBlocksToRestore: Array<{
          obj: import('fabric').FabricObject;
          prev: boolean;
        }> = [];
        for (const obj of allObjects) {
          const r = obj as unknown as Record<string, unknown>;
          if (!r['_fenceElement']) {
            userBlocksToRestore.push({ obj, prev: obj.evented ?? true });
            obj.evented = false;
          }
        }

        const pointer = canvas.getScenePoint(e.nativeEvent as unknown as MouseEvent);
        let hitTarget: unknown = canvas.findTarget(e.nativeEvent as unknown as import('fabric').TPointerEvent);

        for (const { obj, prev } of userBlocksToRestore) {
          obj.evented = prev;
        }

        // Only allow drops into block-cell areas
        if (!hitTarget) {
          const fallbackTarget = allObjects.find(o => {
            const r = o as unknown as Record<string, unknown>;
            return r['_fenceElement'] && r['_fenceRole'] === 'block-cell' && o.containsPoint(pointer);
          });

          if (!fallbackTarget) return;
          hitTarget = fallbackTarget;
        }

        const areaObj = hitTarget as Record<string, unknown>;
        if (!areaObj['_fenceElement'] || areaObj['_fenceRole'] !== 'block-cell') {
          return;
        }

        const fabricObj = hitTarget as unknown as import('fabric').FabricObject;
        const cellX = fabricObj.left ?? 0;
        const cellY = fabricObj.top ?? 0;
        const cellW = (fabricObj.width ?? 100) * (fabricObj.scaleX ?? 1);
        const cellH = (fabricObj.height ?? 100) * (fabricObj.scaleY ?? 1);
        const cellRotation = fabricObj.angle ?? 0;
        const targetCellId = (areaObj['_fenceAreaId'] as string | undefined) ?? null;

        // Remove existing block in this cell
        let previousOccupant: import('fabric').FabricObject | null = null;
        if (targetCellId) {
          for (const obj of allObjects) {
            const r = obj as unknown as Record<string, unknown>;
            if (r['_inFenceCellId'] === targetCellId) {
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
          (group as unknown as Record<string, unknown>)['_inFenceCellId'] = targetCellId;
        }

        canvas.add(group);
        canvas.setActiveObject(group);
        canvas.requestRenderAll();
        setActiveTool('select');
        useProjectStore.getState().setHasContent(true);
      } catch {
        // Block drop failed silently
      } finally {
        clearHighlight();
      }

      dragBlockIdRef.current = null;
    },
    [fabricCanvas, pushUndoState, setActiveTool, clearHighlight]
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
    case 'Rect':
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
    case 'Polygon': {
      const points = obj.points as Array<{ x: number; y: number }>;
      if (!points || points.length === 0) return null;
      return new fabric.Polygon(points, { fill, stroke, strokeWidth });
    }
    case 'Circle':
      return new fabric.Circle({
        left: obj.left as number,
        top: obj.top as number,
        radius: obj.radius as number,
        fill,
        stroke,
        strokeWidth,
      });
    case 'Path': {
      const pathData = obj.path as string;
      if (!pathData) return null;
      return new fabric.Path(pathData, { fill: fill || undefined, stroke, strokeWidth });
    }
    case 'Line': {
      const coords = [obj.x1 as number, obj.y1 as number, obj.x2 as number, obj.y2 as number] as [number, number, number, number];
      return new fabric.Line(coords, {
        stroke: (obj.stroke as string) ?? '#333',
        strokeWidth,
      });
    }
    default:
      return null;
  }
}
