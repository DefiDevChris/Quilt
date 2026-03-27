'use client';

import { useEffect, type RefObject } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';
import { renderGrid } from '@/lib/canvas-grid';
import { getPixelsPerUnit, fitToScreenZoom, snapToGrid } from '@/lib/canvas-utils';
import type { Project } from '@/types/project';

export function useCanvasInit(
  fabricCanvasRef: RefObject<HTMLCanvasElement | null>,
  gridCanvasRef: RefObject<HTMLCanvasElement | null>,
  containerRef: RefObject<HTMLDivElement | null>,
  project: Project
) {
  useEffect(() => {
    let disposed = false;

    (async () => {
      const fabric = await import('fabric');
      if (disposed || !fabricCanvasRef.current || !containerRef.current || !gridCanvasRef.current)
        return;

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const gridEl = gridCanvasRef.current;

      gridEl.width = rect.width;
      gridEl.height = rect.height;

      const canvas = new fabric.Canvas(fabricCanvasRef.current, {
        width: rect.width,
        height: rect.height,
        backgroundColor: 'transparent',
        selection: true,
        preserveObjectStacking: true,
      });

      const wrapper = canvas.wrapperEl as HTMLDivElement;
      wrapper.style.position = 'absolute';
      wrapper.style.top = '0';
      wrapper.style.left = '0';

      const unitSystem = project.unitSystem;
      const pxPerUnit = getPixelsPerUnit(unitSystem);

      const initZoom = fitToScreenZoom(
        rect.width,
        rect.height,
        project.canvasWidth,
        project.canvasHeight,
        unitSystem
      );
      const quiltWidthPx = project.canvasWidth * pxPerUnit;
      const quiltHeightPx = project.canvasHeight * pxPerUnit;
      const panX = (rect.width - quiltWidthPx * initZoom) / 2;
      const panY = (rect.height - quiltHeightPx * initZoom) / 2;
      canvas.setViewportTransform([initZoom, 0, 0, initZoom, panX, panY]);

      canvas.on('after:render', () => {
        const state = useCanvasStore.getState();
        const proj = useProjectStore.getState();
        renderGrid(
          gridEl,
          canvas as unknown as { getZoom: () => number; viewportTransform: number[] },
          {
            gridSettings: state.gridSettings,
            unitSystem: state.unitSystem,
            quiltWidth: proj.canvasWidth,
            quiltHeight: proj.canvasHeight,
          }
        );
      });

      canvas.on('mouse:move', (e) => {
        const pointer = canvas.getScenePoint(e.e);
        const us = useCanvasStore.getState().unitSystem;
        const ppu = getPixelsPerUnit(us);
        useCanvasStore.getState().setCursorPosition({
          x: pointer.x / ppu,
          y: pointer.y / ppu,
        });
      });

      canvas.on('selection:created', (e) => {
        const ids = (e.selected ?? []).map((o) => (o as { id?: string }).id ?? '').filter(Boolean);
        useCanvasStore.getState().setSelectedObjectIds(ids);
      });
      canvas.on('selection:updated', (e) => {
        const ids = (e.selected ?? []).map((o) => (o as { id?: string }).id ?? '').filter(Boolean);
        useCanvasStore.getState().setSelectedObjectIds(ids);
      });
      canvas.on('selection:cleared', () => {
        useCanvasStore.getState().setSelectedObjectIds([]);
      });

      canvas.on('object:moving', (e) => {
        const { gridSettings, unitSystem: us } = useCanvasStore.getState();
        if (!gridSettings.snapToGrid || !e.target) return;
        const gridSizePx = gridSettings.size * getPixelsPerUnit(us);
        e.target.set({
          left: snapToGrid(e.target.left ?? 0, gridSizePx),
          top: snapToGrid(e.target.top ?? 0, gridSizePx),
        });
      });

      canvas.on('object:modified', () => {
        const json = JSON.stringify(canvas.toJSON());
        useCanvasStore.getState().pushUndoState(json);
        useProjectStore.getState().setDirty(true);
      });

      const handleResize = () => {
        if (disposed) return;
        const r = container.getBoundingClientRect();
        canvas.setDimensions({ width: r.width, height: r.height });
        gridEl.width = r.width;
        gridEl.height = r.height;
        canvas.renderAll();
      };
      const resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(container);

      if (project.canvasData && Object.keys(project.canvasData).length > 0) {
        await canvas.loadFromJSON(project.canvasData);
        canvas.renderAll();
      }

      const initialJson = JSON.stringify(canvas.toJSON());
      useCanvasStore.getState().pushUndoState(initialJson);

      if (!disposed) {
        useCanvasStore.getState().setFabricCanvas(canvas);
        useCanvasStore.getState().setZoom(initZoom);
        useCanvasStore.getState().setUnitSystem(project.unitSystem);
        useCanvasStore.getState().setGridSettings(project.gridSettings);
        useProjectStore.getState().setProject({
          id: project.id,
          name: project.name,
          width: project.canvasWidth,
          height: project.canvasHeight,
        });
      }

      return () => {
        resizeObserver.disconnect();
      };
    })();

    return () => {
      disposed = true;
      const canvas = useCanvasStore.getState().fabricCanvas;
      if (canvas && typeof (canvas as { dispose?: () => void }).dispose === 'function') {
        (canvas as { dispose: () => void }).dispose();
      }
      useCanvasStore.getState().setFabricCanvas(null);
      useCanvasStore.getState().resetHistory();
      useProjectStore.getState().reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Only re-init on project.id change
  }, [project.id, fabricCanvasRef, gridCanvasRef, containerRef]);
}
