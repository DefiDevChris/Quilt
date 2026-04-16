'use client';

import { useCallback, useRef } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useCanvasContext } from '@/contexts/CanvasContext';
import { useProjectStore } from '@/stores/projectStore';
import { useLayoutStore } from '@/stores/layoutStore';
import type { Canvas as FabricCanvas } from 'fabric';
import { showDropHighlight, clearDropHighlight } from '@/lib/drop-highlight';
import { computeBlockDropScale } from '@/lib/block-drop-scale';
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
  const { getCanvas } = useCanvasContext();
  const fabricCanvas = getCanvas();
  const pushUndoState = useCanvasStore((s) => s.pushUndoState);
  const setActiveTool = useCanvasStore((s) => s.setActiveTool);
  const dragBlockIdRef = useRef<string | null>(null);
  const highlightRectRef = useRef<import('fabric').FabricObject | null>(null);
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

      // Visual feedback: briefly flash the canvas wrapper border to signal
      // the drop target is invalid. Guard against continuous fire (~60/sec)
      // by clearing the previous timeout before scheduling a new one.
      const wrapper = (e.currentTarget as HTMLElement)?.closest('[data-canvas-wrapper]');
      if (wrapper && !wrapper.classList.contains('invalid-drop-flash')) {
        if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
        wrapper.classList.add('invalid-drop-flash');
        flashTimeoutRef.current = setTimeout(() => {
          wrapper.classList.remove('invalid-drop-flash');
          flashTimeoutRef.current = null;
        }, 400);
      }
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
          // Visual feedback: flash the canvas wrapper to indicate invalid drop
          const wrapper = (e.target as HTMLElement)?.closest?.('[data-canvas-wrapper]');
          if (wrapper && !wrapper.classList.contains('invalid-drop-flash')) {
            wrapper.classList.add('invalid-drop-flash');
            setTimeout(() => wrapper.classList.remove('invalid-drop-flash'), 400);
          }
          // Notify user via toast event
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('quiltstudio:invalid-drop', {
              detail: { message: 'Blocks can only be placed in block cells' },
            }));
          }
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
          // Uniform scale: maintain aspect ratio per project conventions
          // (scaleX === scaleY, see CLAUDE.md Fabric.js section)
          const uniformScale = computeBlockDropScale(cellW, cellH, tightW, tightH);
          group.set({
            left: cellX + cellW / 2,
            top: cellY + cellH / 2,
            scaleX: uniformScale,
            scaleY: uniformScale,
            angle: cellRotation,
          });

          if (targetCellId) {
            groupMeta._inFenceCellId = targetCellId;
          }

          canvas.add(group);
          canvas.setActiveObject(group);
        } else {
          // ── Freeform placement: drop at pointer with grid snap, movable ──
          const group = new fabric.Group(objects, {
            originX: 'center',
            originY: 'center',
            subTargetCheck: true,
          });

          const groupMeta = group as unknown as Record<string, unknown>;
          groupMeta.__isBlockGroup = true;
          groupMeta.__blockId = blockId;

          // Snap to grid for clean placement
          const { gridSettings, unitSystem: us } = useCanvasStore.getState();
          const { canvasWidth, canvasHeight } = useProjectStore.getState();
          const { blockSize } = useLayoutStore.getState();
          const { getPixelsPerUnit, snapToGrid: snapFn } = await import('@/lib/canvas-utils');
          const { computeBlockDropScale: calcScale } = await import('@/lib/block-drop-scale');
          const ppu = getPixelsPerUnit(us);

          // Scale block to the configured block cell size so it appears correctly
          // sized relative to the quilt grid — same logic as fence cell placement
          const targetSizePx = blockSize * ppu;
          const rawW = group.width ?? 100;
          const rawH = group.height ?? 100;
          const uniformScale = calcScale(targetSizePx, targetSizePx, rawW, rawH);
          group.set({ scaleX: uniformScale, scaleY: uniformScale });

          let dropX = pointer.x;
          let dropY = pointer.y;

          const halfW = (rawW * uniformScale) / 2;
          const halfH = (rawH * uniformScale) / 2;

          if (gridSettings.snapToGrid) {
            const gridSizePx = gridSettings.size * ppu;
            // Snap the top-left corner, then offset back to center origin
            dropX = snapFn(dropX - halfW, gridSizePx) + halfW;
            dropY = snapFn(dropY - halfH, gridSizePx) + halfH;
          }

          // Constrain within quilt bounds
          const maxX = canvasWidth * ppu;
          const maxY = canvasHeight * ppu;
          dropX = Math.max(halfW, Math.min(maxX - halfW, dropX));
          dropY = Math.max(halfH, Math.min(maxY - halfH, dropY));

          group.set({
            left: dropX,
            top: dropY,
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
