'use client';

import { useCallback, useRef } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useLayoutStore } from '@/stores/layoutStore';
import { PIXELS_PER_INCH } from '@/lib/constants';
import { computeLayout } from '@/lib/layout-utils';
import type { Canvas as FabricCanvas } from 'fabric';

/**
 * Hook for handling block drops onto the Fabric.js canvas.
 * Fetches the full block data, deserializes the Fabric.js JSON,
 * places it at drop coordinates, and applies grid snapping.
 */
export function useBlockDrop() {
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);
  const gridSettings = useCanvasStore((s) => s.gridSettings);
  const autoAlignToPattern = useCanvasStore((s) => s.autoAlignToPattern);
  const unitSystem = useCanvasStore((s) => s.unitSystem);
  const pushUndoState = useCanvasStore((s) => s.pushUndoState);
  const setActiveTool = useCanvasStore((s) => s.setActiveTool);
  const layoutType = useLayoutStore((s) => s.layoutType);
  const rows = useLayoutStore((s) => s.rows);
  const cols = useLayoutStore((s) => s.cols);
  const blockSize = useLayoutStore((s) => s.blockSize);
  const sashing = useLayoutStore((s) => s.sashing);
  const borders = useLayoutStore((s) => s.borders);
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

        const fabric = await import('fabric');

        // Get drop position relative to canvas
        const canvasEl = canvas.getElement();
        const rect = canvasEl.getBoundingClientRect();
        const vpt = canvas.viewportTransform;
        const zoom = canvas.getZoom();

        let dropX = (e.clientX - rect.left - (vpt?.[4] ?? 0)) / zoom;
        let dropY = (e.clientY - rect.top - (vpt?.[5] ?? 0)) / zoom;

        let cellRotation = 0;
        let skipGridSnap = false;

        // Auto-align to pattern cell if enabled
        if (autoAlignToPattern && layoutType !== 'free-form') {
          const pxPerUnit = unitSystem === 'imperial' ? PIXELS_PER_INCH : PIXELS_PER_INCH / 2.54;
          const layout = computeLayout(
            { type: layoutType, rows, cols, blockSize, sashing, borders },
            pxPerUnit
          );

          if (layout.cells.length > 0) {
            let nearestCell = layout.cells[0];
            let minDist = Infinity;

            for (const cell of layout.cells) {
              const dx = dropX - cell.centerX;
              const dy = dropY - cell.centerY;
              const dist = dx * dx + dy * dy;
              if (dist < minDist) {
                minDist = dist;
                nearestCell = cell;
              }
            }

            dropX = nearestCell.centerX;
            dropY = nearestCell.centerY;
            cellRotation = nearestCell.rotation;
            skipGridSnap = true;
          }
        }

        // Snap to grid if enabled and not already aligned to pattern
        if (!skipGridSnap && gridSettings.snapToGrid && gridSettings.enabled) {
          const gridSizePx = gridSettings.size * PIXELS_PER_INCH;
          dropX = Math.round(dropX / gridSizePx) * gridSizePx;
          dropY = Math.round(dropY / gridSizePx) * gridSizePx;
        }

        // Save undo state before adding
        const currentJson = JSON.stringify(canvas.toJSON());
        pushUndoState(currentJson);

        // Build the group from fabricJsData
        const objects: import('fabric').FabricObject[] = [];
        const groupData = fabricJsData as {
          objects?: Array<Record<string, unknown>>;
          width?: number;
          height?: number;
        };

        if (groupData.objects && Array.isArray(groupData.objects)) {
          for (const obj of groupData.objects) {
            const fabricObj = await createFabricObject(fabric, obj);
            if (fabricObj) objects.push(fabricObj);
          }
        }

        if (objects.length === 0) return;

        // Scale the block to match layout blockSize
        const targetSize = blockSize * PIXELS_PER_INCH;
        const group = new fabric.Group(objects, {
          left: dropX,
          top: dropY,
          scaleX: targetSize / (groupData.width ?? 100),
          scaleY: targetSize / (groupData.height ?? 100),
          angle: cellRotation,
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
    [fabricCanvas, gridSettings, autoAlignToPattern, unitSystem, layoutType, rows, cols, blockSize, sashing, borders, pushUndoState, setActiveTool]
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
