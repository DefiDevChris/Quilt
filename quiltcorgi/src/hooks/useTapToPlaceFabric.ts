'use client';

import { useCallback, useEffect } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useFabricStore } from '@/stores/fabricStore';

export function useTapToPlaceFabric() {
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);
  const pushUndoState = useCanvasStore((s) => s.pushUndoState);
  const selectedFabricId = useFabricStore((s) => s.selectedFabricId);
  const selectedFabricUrl = useFabricStore((s) => s.selectedFabricUrl);
  const setSelectedFabric = useFabricStore((s) => s.setSelectedFabric);

  const applyFabricToObject = useCallback(
    async (target: import('fabric').FabricObject) => {
      const canvas = fabricCanvas as import('fabric').Canvas | null;
      if (!canvas || !selectedFabricUrl) return;

      try {
        const currentJson = JSON.stringify(canvas.toJSON());
        pushUndoState(currentJson);

        const fabric = await import('fabric');
        const pattern = await new Promise<import('fabric').Pattern>((resolve, reject) => {
          fabric.FabricImage.fromURL(selectedFabricUrl, {
            crossOrigin: 'anonymous',
          })
            .then((img) => {
              const pattern = new fabric.Pattern({
                source: img.getElement() as HTMLImageElement,
                repeat: 'repeat',
              });
              resolve(pattern);
            })
            .catch(reject);
        });

        target.set('fill', pattern);
        canvas.requestRenderAll();
      } catch {
        // silent
      }
    },
    [fabricCanvas, selectedFabricUrl, pushUndoState]
  );

  const handleCanvasClick = useCallback(
    (e: MouseEvent) => {
      const canvas = fabricCanvas as import('fabric').Canvas | null;
      if (!canvas || !selectedFabricId) return;

      const target = canvas.findTarget(e as unknown as import('fabric').TPointerEvent);
      if (target && (target as any).type !== 'activeSelection') {
        applyFabricToObject(target as any);
      }
    },
    [fabricCanvas, selectedFabricId, applyFabricToObject]
  );

  useEffect(() => {
    const canvas = fabricCanvas as import('fabric').Canvas | null;
    if (!canvas || !selectedFabricId) return;

    const canvasEl = canvas.getElement();
    canvasEl.addEventListener('click', handleCanvasClick);

    return () => {
      canvasEl.removeEventListener('click', handleCanvasClick);
    };
  }, [fabricCanvas, selectedFabricId, handleCanvasClick]);

  return {
    selectedFabricId,
    setSelectedFabric,
    cancelSelection: () => setSelectedFabric(null, null),
  };
}
