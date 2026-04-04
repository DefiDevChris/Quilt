'use client';

import { useEffect, useRef, type RefObject } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';
import { useLayoutStore } from '@/stores/layoutStore';
import { renderGrid } from '@/lib/canvas-grid';
import { getPixelsPerUnit, fitToScreenZoom, snapToGrid } from '@/lib/canvas-utils';
import { computeLayout } from '@/lib/layout-utils';
import type { Project } from '@/types/project';

export function useCanvasInit(
  fabricCanvasRef: RefObject<HTMLCanvasElement | null>,
  gridCanvasRef: RefObject<HTMLCanvasElement | null>,
  containerRef: RefObject<HTMLDivElement | null>,
  project: Project
) {
  const generationRef = useRef(0);

  useEffect(() => {
    const generation = ++generationRef.current;
    let disposed = false;
    let resizeObserver: ResizeObserver | null = null;
    let canvasInstance: import('fabric').Canvas | null = null;

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
        backgroundColor: useCanvasStore.getState().backgroundColor,
        selection: true,
        preserveObjectStacking: true,
      });

      canvasInstance = canvas;

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

      // Seed stores before any renderAll so onAfterRender reads the correct
      // project dimensions from the first paint, not the store's 48×48 defaults.
      useCanvasStore.getState().setUnitSystem(project.unitSystem);
      useCanvasStore.getState().setGridSettings(project.gridSettings);
      useProjectStore.getState().setProject({
        id: project.id,
        name: project.name,
        width: project.canvasWidth,
        height: project.canvasHeight,
        worktables: project.worktables,
      });
      if (project.fabricPresets) {
        useProjectStore.getState().setFabricPresets(project.fabricPresets);
      }

      let lastGridKey = '';
      const onAfterRender = () => {
        const state = useCanvasStore.getState();
        const proj = useProjectStore.getState();
        const layout = useLayoutStore.getState();
        const vt = canvas.viewportTransform;
        // When viewport is unlocked, always redraw grid (no caching)
        // When locked, cache based on key to avoid unnecessary redraws
        const key = state.isViewportLocked
          ? `${vt[0]},${vt[4]},${vt[5]},${state.gridSettings.size},${state.unitSystem},${proj.canvasWidth},${proj.canvasHeight},${gridEl.width},${gridEl.height},${state.showPatternOverlay},${layout.layoutType}`
          : '';
        if (key && key === lastGridKey) return;
        lastGridKey = key;

        // Compute layout cells for pattern overlay
        let layoutCells;
        if (state.showPatternOverlay && layout.layoutType !== 'free-form') {
          const pxPerUnit = state.unitSystem === 'imperial' ? 96 : 96 / 2.54;
          const layoutResult = computeLayout(
            {
              type: layout.layoutType,
              rows: layout.rows,
              cols: layout.cols,
              blockSize: layout.blockSize,
              sashing: layout.sashing,
              borders: layout.borders,
            },
            pxPerUnit
          );
          layoutCells = layoutResult.cells;
        }

        renderGrid(
          gridEl,
          canvas as unknown as { getZoom: () => number; viewportTransform: number[] },
          {
            gridSettings: state.gridSettings,
            unitSystem: state.unitSystem,
            quiltWidth: proj.canvasWidth,
            quiltHeight: proj.canvasHeight,
            showPatternOverlay: state.showPatternOverlay,
            layoutType: layout.layoutType,
            layoutCells,
          }
        );
      };

      let lastCursorX = -1;
      let lastCursorY = -1;
      const CURSOR_THRESHOLD = 0.01;
      const onMouseMove = (e: { e: Event }) => {
        const pointer = canvas.getScenePoint(e.e as MouseEvent);
        const us = useCanvasStore.getState().unitSystem;
        const ppu = getPixelsPerUnit(us);
        const x = pointer.x / ppu;
        const y = pointer.y / ppu;
        if (
          Math.abs(x - lastCursorX) < CURSOR_THRESHOLD &&
          Math.abs(y - lastCursorY) < CURSOR_THRESHOLD
        )
          return;
        lastCursorX = x;
        lastCursorY = y;
        useCanvasStore.getState().setCursorPosition({ x, y });
      };

      const onSelectionCreated = (e: { selected?: unknown[] }) => {
        const ids = (e.selected ?? []).map((o) => (o as { id?: string }).id ?? '').filter(Boolean);
        useCanvasStore.getState().setSelectedObjectIds(ids);
      };

      const onSelectionUpdated = (e: { selected?: unknown[] }) => {
        const ids = (e.selected ?? []).map((o) => (o as { id?: string }).id ?? '').filter(Boolean);
        useCanvasStore.getState().setSelectedObjectIds(ids);
      };

      const onSelectionCleared = () => {
        useCanvasStore.getState().setSelectedObjectIds([]);
      };

      const onObjectMoving = (e: { target?: import('fabric').FabricObject }) => {
        const { gridSettings, unitSystem: us } = useCanvasStore.getState();
        const { canvasWidth, canvasHeight } = useProjectStore.getState();
        const ppu = getPixelsPerUnit(us);
        const maxX = canvasWidth * ppu;
        const maxY = canvasHeight * ppu;

        if (!e.target) return;

        // Constrain to canvas bounds
        const obj = e.target;
        const left = obj.left ?? 0;
        const top = obj.top ?? 0;
        const width = (obj.width ?? 0) * (obj.scaleX ?? 1);
        const height = (obj.height ?? 0) * (obj.scaleY ?? 1);

        let newLeft = left;
        let newTop = top;

        if (left < 0) newLeft = 0;
        if (top < 0) newTop = 0;
        if (left + width > maxX) newLeft = maxX - width;
        if (top + height > maxY) newTop = maxY - height;

        // Apply snap to grid if enabled
        if (gridSettings.snapToGrid) {
          const gridSizePx = gridSettings.size * ppu;
          newLeft = snapToGrid(newLeft, gridSizePx);
          newTop = snapToGrid(newTop, gridSizePx);
        }

        obj.set({ left: newLeft, top: newTop });
      };

      const onObjectModified = () => {
        const json = JSON.stringify(canvas.toJSON());
        useCanvasStore.getState().pushUndoState(json);
        useProjectStore.getState().setDirty(true);
      };

      canvas.on('after:render', onAfterRender);
      canvas.on('mouse:move', onMouseMove);
      canvas.on('selection:created', onSelectionCreated);
      canvas.on('selection:updated', onSelectionUpdated);
      canvas.on('selection:cleared', onSelectionCleared);
      canvas.on('object:moving', onObjectMoving);
      canvas.on('object:modified', onObjectModified);

      const handleResize = () => {
        if (disposed) return;
        const r = container.getBoundingClientRect();
        canvas.setDimensions({ width: r.width, height: r.height });
        gridEl.width = r.width;
        gridEl.height = r.height;
        canvas.renderAll();
      };
      resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(container);

      // Load canvas from active worktable
      const activeWorktableId = useProjectStore.getState().activeWorktableId;
      const activeWorktable = project.worktables?.find((w) => w.id === activeWorktableId);
      const canvasDataToLoad = activeWorktable?.canvasData ?? project.canvasData;

      if (canvasDataToLoad && Object.keys(canvasDataToLoad).length > 0) {
        await canvas.loadFromJSON(canvasDataToLoad);
      }
      canvas.renderAll();

      const initialJson = JSON.stringify(canvas.toJSON());
      useCanvasStore.getState().pushUndoState(initialJson);

      // Check generation before mutating store (prevents race condition)
      if (disposed || generation !== generationRef.current) {
        // Clean up this orphaned canvas instance
        canvas.off('after:render', onAfterRender);
        canvas.off('mouse:move', onMouseMove);
        canvas.off('selection:created', onSelectionCreated);
        canvas.off('selection:updated', onSelectionUpdated);
        canvas.off('selection:cleared', onSelectionCleared);
        canvas.off('object:moving', onObjectMoving);
        canvas.off('object:modified', onObjectModified);
        resizeObserver?.disconnect();
        canvas.dispose();
        return;
      }

      useCanvasStore.getState().setFabricCanvas(canvas);
      useCanvasStore.getState().setZoom(initZoom);
    })();

    return () => {
      disposed = true;
      resizeObserver?.disconnect();

      if (canvasInstance) {
        canvasInstance.off('after:render');
        canvasInstance.off('mouse:move');
        canvasInstance.off('selection:created');
        canvasInstance.off('selection:updated');
        canvasInstance.off('selection:cleared');
        canvasInstance.off('object:moving');
        canvasInstance.off('object:modified');
        canvasInstance.dispose();
      } else {
        const canvas = useCanvasStore.getState().fabricCanvas;
        if (canvas && typeof (canvas as { dispose?: () => void }).dispose === 'function') {
          (canvas as { dispose: () => void }).dispose();
        }
      }

      useCanvasStore.getState().setFabricCanvas(null);
      useCanvasStore.getState().resetHistory();
      useProjectStore.getState().reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Only re-init on project.id change
  }, [project.id, fabricCanvasRef, gridCanvasRef, containerRef]);
}
