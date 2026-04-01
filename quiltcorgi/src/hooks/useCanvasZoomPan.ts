'use client';

import { useEffect } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { ZOOM_MIN, ZOOM_MAX } from '@/lib/constants';
import { isInputElement } from '@/lib/dom-utils';

export function useCanvasZoomPan() {
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);

  useEffect(() => {
    if (!fabricCanvas) return;
    let isMounted = true;
    let cleanup: (() => void) | null = null;

    (async () => {
      const fabric = await import('fabric');
      if (!isMounted) return;
      const canvas = fabricCanvas as InstanceType<typeof fabric.Canvas>;

      let isPanning = false;
      let lastPanX = 0;
      let lastPanY = 0;

      function isViewportLocked() {
        return useCanvasStore.getState().isViewportLocked;
      }

      function isPanActive() {
        const state = useCanvasStore.getState();
        return state.isSpacePressed || state.activeTool === 'pan';
      }

      function onWheel(e: { e: WheelEvent }) {
        if (isViewportLocked()) return;
        e.e.preventDefault();
        e.e.stopPropagation();

        const delta = e.e.deltaY;
        const pointer = canvas.getScenePoint(e.e);
        let zoom = canvas.getZoom();
        zoom *= 0.995 ** delta;
        zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoom));

        canvas.zoomToPoint(new fabric.Point(pointer.x, pointer.y), zoom);
        useCanvasStore.getState().setZoom(zoom);
        canvas.renderAll();
      }

      function onMouseDown(e: { e: MouseEvent }) {
        if (!isPanActive()) return;
        if (isViewportLocked()) return;
        isPanning = true;
        lastPanX = e.e.clientX;
        lastPanY = e.e.clientY;
        canvas.defaultCursor = 'grabbing';
        canvas.selection = false;
      }

      function onMouseMove(e: { e: MouseEvent }) {
        if (!isPanning) return;
        const dx = e.e.clientX - lastPanX;
        const dy = e.e.clientY - lastPanY;
        lastPanX = e.e.clientX;
        lastPanY = e.e.clientY;
        canvas.relativePan(new fabric.Point(dx, dy));
        canvas.renderAll();
      }

      function onMouseUp() {
        if (!isPanning) return;
        isPanning = false;
        const tool = useCanvasStore.getState().activeTool;
        if (tool === 'pan') {
          canvas.defaultCursor = 'grab';
          canvas.selection = false;
        } else {
          canvas.defaultCursor = tool === 'select' ? 'default' : 'crosshair';
          if (tool === 'select') {
            canvas.selection = true;
          }
        }
      }

      function onKeyDown(e: KeyboardEvent) {
        if (isInputElement(e.target)) return;
        if (e.code === 'Space' && !e.repeat) {
          if (isViewportLocked()) return;
          e.preventDefault();
          useCanvasStore.getState().setIsSpacePressed(true);
          canvas.defaultCursor = 'grab';
          canvas.selection = false;
        }
      }

      function onKeyUp(e: KeyboardEvent) {
        if (isInputElement(e.target)) return;
        if (e.code === 'Space') {
          useCanvasStore.getState().setIsSpacePressed(false);
          isPanning = false;
          const tool = useCanvasStore.getState().activeTool;
          if (tool === 'pan') {
            canvas.defaultCursor = 'grab';
            canvas.selection = false;
          } else {
            canvas.defaultCursor = tool === 'select' ? 'default' : 'crosshair';
            if (tool === 'select') {
              canvas.selection = true;
            }
          }
        }
      }

      // Set cursor when pan tool is activated via toolbar
      const unsubscribe = useCanvasStore.subscribe((state, prev) => {
        if (state.activeTool !== prev.activeTool) {
          if (state.activeTool === 'pan') {
            canvas.defaultCursor = 'grab';
            canvas.selection = false;
          } else if (prev.activeTool === 'pan') {
            canvas.defaultCursor = state.activeTool === 'select' ? 'default' : 'crosshair';
            if (state.activeTool === 'select') {
              canvas.selection = true;
            }
          }
        }
      });

      canvas.on('mouse:wheel', onWheel as never);
      canvas.on('mouse:down', onMouseDown as never);
      canvas.on('mouse:move', onMouseMove as never);
      canvas.on('mouse:up', onMouseUp as never);
      window.addEventListener('keydown', onKeyDown);
      window.addEventListener('keyup', onKeyUp);

      cleanup = () => {
        unsubscribe();
        canvas.off('mouse:wheel', onWheel as never);
        canvas.off('mouse:down', onMouseDown as never);
        canvas.off('mouse:move', onMouseMove as never);
        canvas.off('mouse:up', onMouseUp as never);
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
      };
    })();

    return () => {
      isMounted = false;
      cleanup?.();
    };
  }, [fabricCanvas]);
}
