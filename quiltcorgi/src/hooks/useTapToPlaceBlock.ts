'use client';

import { useCallback, useEffect } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useBlockStore } from '@/stores/blockStore';
import { PIXELS_PER_INCH } from '@/lib/constants';

export function useTapToPlaceBlock() {
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);
  const gridSettings = useCanvasStore((s) => s.gridSettings);
  const pushUndoState = useCanvasStore((s) => s.pushUndoState);
  const setActiveTool = useCanvasStore((s) => s.setActiveTool);
  const selectedBlockId = useBlockStore((s) => s.selectedBlockId);
  const setSelectedBlockId = useBlockStore((s) => s.setSelectedBlockId);

  const placeBlockAtPosition = useCallback(
    async (x: number, y: number) => {
      const canvas = fabricCanvas as import('fabric').Canvas | null;
      if (!canvas || !selectedBlockId) return;

      try {
        const res = await fetch(`/api/blocks/${selectedBlockId}`);
        const json = await res.json();
        if (!res.ok || !json.data) return;

        const blockData = json.data;
        const fabricJsData = blockData.fabricJsData;
        if (!fabricJsData) return;

        const fabric = await import('fabric');

        let dropX = x;
        let dropY = y;

        if (gridSettings.snapToGrid && gridSettings.enabled) {
          const gridSizePx = gridSettings.size * PIXELS_PER_INCH;
          dropX = Math.round(dropX / gridSizePx) * gridSizePx;
          dropY = Math.round(dropY / gridSizePx) * gridSizePx;
        }

        const currentJson = JSON.stringify(canvas.toJSON());
        pushUndoState(currentJson);

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

        const blockSize = PIXELS_PER_INCH;
        const group = new fabric.Group(objects, {
          left: dropX,
          top: dropY,
          scaleX: blockSize / (groupData.width ?? 100),
          scaleY: blockSize / (groupData.height ?? 100),
        });

        canvas.add(group);
        canvas.setActiveObject(group);
        canvas.requestRenderAll();
        setActiveTool('select');
      } catch {
        // silent
      }
    },
    [fabricCanvas, gridSettings, pushUndoState, setActiveTool, selectedBlockId]
  );

  const handleCanvasClick = useCallback(
    (e: MouseEvent) => {
      const canvas = fabricCanvas as import('fabric').Canvas | null;
      if (!canvas || !selectedBlockId) return;

      const canvasEl = canvas.getElement();
      const rect = canvasEl.getBoundingClientRect();
      const vpt = canvas.viewportTransform;
      const zoom = canvas.getZoom();

      const x = (e.clientX - rect.left - (vpt?.[4] ?? 0)) / zoom;
      const y = (e.clientY - rect.top - (vpt?.[5] ?? 0)) / zoom;

      placeBlockAtPosition(x, y);
    },
    [fabricCanvas, selectedBlockId, placeBlockAtPosition]
  );

  useEffect(() => {
    const canvas = fabricCanvas as import('fabric').Canvas | null;
    if (!canvas || !selectedBlockId) return;

    const canvasEl = canvas.getElement();
    canvasEl.addEventListener('click', handleCanvasClick);

    return () => {
      canvasEl.removeEventListener('click', handleCanvasClick);
    };
  }, [fabricCanvas, selectedBlockId, handleCanvasClick]);

  return {
    selectedBlockId,
    setSelectedBlockId,
    cancelSelection: () => setSelectedBlockId(null),
  };
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
      const coords = [obj.x1 as number, obj.y1 as number, obj.x2 as number, obj.y2 as number] as [
        number,
        number,
        number,
        number,
      ];
      return new fabric.Line(coords, { stroke: (obj.stroke as string) ?? '#333', strokeWidth });
    }
    default:
      return null;
  }
}
