'use client';

import { useCallback, useRef } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';
import { useLayoutStore } from '@/stores/layoutStore';
import type { Canvas as FabricCanvas } from 'fabric';
import { showDropHighlight, clearDropHighlight } from '@/lib/drop-highlight';
import { CANVAS, DEFAULT_CANVAS } from '@/lib/design-system';

const BLOCK_HIGHLIGHT_COLOR = CANVAS.blockHighlight;

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

      // Freeform mode: allow drops anywhere on the canvas
      const { hasAppliedLayout } = useLayoutStore.getState();
      if (!hasAppliedLayout) {
        e.dataTransfer.dropEffect = 'copy';
        clearHighlight();
        return;
      }

      // Drops outside valid areas are rejected when a layout is applied
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
        let hitTarget: unknown = canvas.findTarget(
          e.nativeEvent as unknown as import('fabric').TPointerEvent
        );

        for (const { obj, prev } of userBlocksToRestore) {
          obj.evented = prev;
        }

        const { hasAppliedLayout } = useLayoutStore.getState();

        // Try to find a fence cell target (fallback to containsPoint scan)
        if (!hitTarget) {
          const fallbackTarget = allObjects.find((o) => {
            const r = o as unknown as Record<string, unknown>;
            return (
              r['_fenceElement'] && r['_fenceRole'] === 'block-cell' && o.containsPoint(pointer)
            );
          });
          if (fallbackTarget) {
            hitTarget = fallbackTarget;
          }
        }

        const areaObj = (hitTarget as Record<string, unknown>) ?? {};
        const isFenceCell = areaObj['_fenceElement'] && areaObj['_fenceRole'] === 'block-cell';

        // If a layout is applied, only allow drops into fence cells
        if (hasAppliedLayout && !isFenceCell) {
          return;
        }

        // In freeform mode with no hit target, we still allow placement at pointer
        if (!hasAppliedLayout && !hitTarget) {
          // hitTarget stays null — freeform path below handles it
        }

        // Build Fabric objects from the block data
        const objects: import('fabric').FabricObject[] = [];
        if (groupData.objects && Array.isArray(groupData.objects)) {
          for (const obj of groupData.objects) {
            const fabricObj = await createFabricObject(fabric, obj);
            if (fabricObj) objects.push(fabricObj);
          }
        }
        if (objects.length === 0) return;

        const currentJson = JSON.stringify(canvas.toJSON());
        const undoSaved = pushUndoState(currentJson);

        if (isFenceCell) {
          // ── Fence cell placement: snap to cell, locked ──
          const cellObj = hitTarget as unknown as import('fabric').FabricObject;
          const cellX = cellObj.left ?? 0;
          const cellY = cellObj.top ?? 0;
          const cellW = (cellObj.width ?? 100) * (cellObj.scaleX ?? 1);
          const cellH = (cellObj.height ?? 100) * (cellObj.scaleY ?? 1);
          const cellRotation = cellObj.angle ?? 0;
          const targetCellId = (areaObj['_fenceAreaId'] as string | undefined) ?? null;

          // Remove existing block in this cell (only if undo can protect the action)
          if (targetCellId && undoSaved) {
            for (const obj of allObjects) {
              const r = obj as unknown as Record<string, unknown>;
              if (r['_inFenceCellId'] === targetCellId) {
                canvas.remove(obj);
                break;
              }
            }
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

          const groupMeta = group as unknown as Record<string, unknown>;
          groupMeta.__isBlockGroup = true;
          groupMeta.__blockId = blockId;

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
            groupMeta._inFenceCellId = targetCellId;
          }

          canvas.add(group);
          canvas.setActiveObject(group);
        } else {
          // ── Freeform placement: drop at pointer, movable ──
          const group = new fabric.Group(objects, {
            originX: 'center',
            originY: 'center',
            subTargetCheck: true,
          });

          const groupMeta = group as unknown as Record<string, unknown>;
          groupMeta.__isBlockGroup = true;
          groupMeta.__blockId = blockId;

          group.set({
            left: pointer.x,
            top: pointer.y,
          });

          canvas.add(group);
          canvas.setActiveObject(group);
        }

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
  const fill = (obj.fill as string) ?? DEFAULT_CANVAS.fill;
  const stroke = (obj.stroke as string) ?? null;
  const strokeWidth = (obj.strokeWidth as number) ?? 0.5;

  let result: import('fabric').FabricObject | null = null;

  switch (type) {
    case 'Rect':
      result = new fabric.Rect({
        left: obj.left as number,
        top: obj.top as number,
        width: obj.width as number,
        height: obj.height as number,
        fill,
        stroke,
        strokeWidth,
        opacity: (obj.opacity as number) ?? 1,
      });
      break;
    case 'Polygon': {
      const points = obj.points as Array<{ x: number; y: number }>;
      if (!points || points.length === 0) return null;
      result = new fabric.Polygon(points, { fill, stroke, strokeWidth });
      break;
    }
    case 'Circle':
      result = new fabric.Circle({
        left: obj.left as number,
        top: obj.top as number,
        radius: obj.radius as number,
        fill,
        stroke,
        strokeWidth,
      });
      break;
    case 'Path': {
      const pathData = obj.path as string;
      if (!pathData) return null;
      result = new fabric.Path(pathData, { fill: fill || undefined, stroke, strokeWidth });
      break;
    }
    case 'Line': {
      const coords = [obj.x1 as number, obj.y1 as number, obj.x2 as number, obj.y2 as number] as [
        number,
        number,
        number,
        number,
      ];
      result = new fabric.Line(coords, {
        stroke: (obj.stroke as string) ?? CANVAS.seamLine,
        strokeWidth,
      });
      break;
    }
    default:
      return null;
  }

  // Forward patch metadata so it survives onto the canvas object.
  // These properties are registered in fabric-custom-props.ts and will
  // persist through toJSON/loadFromJSON serialization cycles.
  if (result) {
    const meta = result as unknown as Record<string, unknown>;
    if (obj.__shade != null) meta.__shade = obj.__shade;
    if (obj.__pieceRole != null) meta.__pieceRole = obj.__pieceRole;
    if (obj.__blockPatchIndex != null) meta.__blockPatchIndex = obj.__blockPatchIndex;
    if (obj.__blockId != null) meta.__blockId = obj.__blockId;
  }

  return result;
}
