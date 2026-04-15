'use client';

import { useEffect } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';
import { useCanvasContext } from '@/contexts/CanvasContext';
import { isInputElement } from '@/lib/dom-utils';
import { clampPan } from '@/lib/canvas-utils';

export function useCanvasZoomPan() {
  const { getCanvas } = useCanvasContext();
  const fabricCanvas = getCanvas();

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

      function onMouseDown(e: { e: MouseEvent }) {
        if (!isPanActive()) return;
        if (isViewportLocked()) return;
        isPanning = true;
        lastPanX = e.e.clientX;
        lastPanY = e.e.clientY;
        canvas.defaultCursor = 'grabbing';
        canvas.wrapperEl?.classList.add('cursor-pan-grabbing');
        canvas.selection = false;
      }

      function applyPanClamp() {
        const vt = canvas.viewportTransform;
        if (!vt) return;
        const el = canvas.wrapperEl;
        if (!el) return;
        const { canvasWidth, canvasHeight } = useProjectStore.getState();
        const { unitSystem } = useCanvasStore.getState();
        const clamped = clampPan(
          vt[4],
          vt[5],
          vt[0],
          el.clientWidth,
          el.clientHeight,
          canvasWidth,
          canvasHeight,
          unitSystem
        );
        if (clamped.panX !== vt[4] || clamped.panY !== vt[5]) {
          canvas.setViewportTransform([vt[0], vt[1], vt[2], vt[3], clamped.panX, clamped.panY]);
        }
      }

      function onMouseMove(e: { e: MouseEvent }) {
        if (!isPanning) return;
        const dx = e.e.clientX - lastPanX;
        const dy = e.e.clientY - lastPanY;
        lastPanX = e.e.clientX;
        lastPanY = e.e.clientY;
        canvas.relativePan(new fabric.Point(dx, dy));
        applyPanClamp();
        canvas.renderAll();
      }

      function onMouseUp() {
        if (!isPanning) return;
        isPanning = false;
        canvas.wrapperEl?.classList.remove('cursor-pan-grabbing');
        const tool = useCanvasStore.getState().activeTool;
        if (tool === 'pan') {
          canvas.defaultCursor = 'grab';
          canvas.wrapperEl?.classList.add('cursor-pan-grab');
          canvas.selection = false;
        } else {
          canvas.defaultCursor = tool === 'select' ? 'default' : 'crosshair';
          canvas.wrapperEl?.classList.remove('cursor-pan-grab');
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
          canvas.wrapperEl?.classList.add('cursor-pan-grab');
          canvas.selection = false;
        }
      }

      function onKeyUp(e: KeyboardEvent) {
        if (isInputElement(e.target)) return;
        if (e.code === 'Space') {
          useCanvasStore.getState().setIsSpacePressed(false);
          isPanning = false;
          canvas.wrapperEl?.classList.remove('cursor-pan-grab', 'cursor-pan-grabbing');
          const tool = useCanvasStore.getState().activeTool;
          if (tool === 'pan') {
            canvas.defaultCursor = 'grab';
            canvas.wrapperEl?.classList.add('cursor-pan-grab');
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
            canvas.wrapperEl?.classList.add('cursor-pan-grab');
            canvas.selection = false;
          } else if (prev.activeTool === 'pan') {
            canvas.defaultCursor = state.activeTool === 'select' ? 'default' : 'crosshair';
            canvas.wrapperEl?.classList.remove('cursor-pan-grab', 'cursor-pan-grabbing');
            if (state.activeTool === 'select') {
              canvas.selection = true;
            }
          }
        }
      });

      // Wheel zoom — zooms toward the cursor without snapping back to center.
      // Skipped while the viewport is locked.
      function onMouseWheel(e: { e: WheelEvent }) {
        if (isViewportLocked()) return;
        const evt = e.e;
        evt.preventDefault();
        evt.stopPropagation();
        const delta = evt.deltaY;
        // Smooth, screen-relative zoom: ~10% per notch.
        const factor = Math.exp(-delta * 0.001);
        const currentZoom = useCanvasStore.getState().zoom;
        const nextZoom = currentZoom * factor;
        useCanvasStore.getState().zoomAtPoint(nextZoom, canvas, evt.offsetX, evt.offsetY);
      }

      canvas.on('mouse:down', onMouseDown as never);
      canvas.on('mouse:move', onMouseMove as never);
      canvas.on('mouse:up', onMouseUp as never);
      canvas.on('mouse:wheel', onMouseWheel as never);
      window.addEventListener('keydown', onKeyDown);
      window.addEventListener('keyup', onKeyUp);

      cleanup = () => {
        unsubscribe();
        canvas.off('mouse:down', onMouseDown as never);
        canvas.off('mouse:move', onMouseMove as never);
        canvas.off('mouse:up', onMouseUp as never);
        canvas.off('mouse:wheel', onMouseWheel as never);
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
