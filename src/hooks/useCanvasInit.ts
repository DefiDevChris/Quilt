'use client';

import { useEffect, useRef, type RefObject } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useCanvasContext } from '@/contexts/CanvasContext';
import { useProjectStore } from '@/stores/projectStore';
import { renderGrid } from '@/lib/canvas-grid';
import { getPixelsPerUnit, fitToScreenZoom, snapToGrid } from '@/lib/canvas-utils';
import { applyCustomControls, applyHoverEffects } from '@/lib/fabric-controls';
import { registerFabricCustomProperties } from '@/lib/fabric-custom-props';
import { useLayoutStore } from '@/stores/layoutStore';
import { CANVAS } from '@/lib/design-system';
import type { Project } from '@/types/project';

export function useCanvasInit(
  fabricCanvasRef: RefObject<HTMLCanvasElement | null>,
  gridCanvasRef: RefObject<HTMLCanvasElement | null>,
  containerRef: RefObject<HTMLDivElement | null>,
  project: Project
) {
  const { setCanvas } = useCanvasContext();
  const generationRef = useRef(0);

  useEffect(() => {
    const generation = ++generationRef.current;
    let disposed = false;
    let resizeObserver: ResizeObserver | null = null;
    let canvasInstance: import('fabric').Canvas | null = null;

    (async () => {
      registerFabricCustomProperties();
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

      canvasInstance = canvas;

      // Apply Figma-like control styling
      applyCustomControls();
      applyHoverEffects(canvas);

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
      // Restore worktable mode (quilt vs block-builder) if saved
      if (project.activeWorktable) {
        useCanvasStore.getState().setActiveWorktable(project.activeWorktable);
      }
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
        const vt = canvas.viewportTransform;
        // When viewport is unlocked, always redraw grid (no caching)
        // When locked, cache based on key to avoid unnecessary redraws
        const key = state.isViewportLocked
          ? `${vt[0]},${vt[4]},${vt[5]},${state.gridSettings.size},${state.unitSystem},${proj.canvasWidth},${proj.canvasHeight},${gridEl.width},${gridEl.height}`
          : '';
        if (key && key === lastGridKey) return;
        lastGridKey = key;

        // Layout geometry is rendered on the Fabric.js canvas by
        // useFenceRenderer (as selectable Rect objects). The grid layer
        // only draws the background quilt rectangle + grid lines.
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
        useCanvasStore.getState().setSelectedPatch(null);
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

      const onObjectScaling = (e: { target?: import('fabric').FabricObject; e?: MouseEvent }) => {
        const { canvasWidth, canvasHeight } = useProjectStore.getState();
        const us = useCanvasStore.getState().unitSystem;
        const ppu = getPixelsPerUnit(us);
        const obj = e.target;
        const left = obj?.left ?? 0;
        const top = obj?.top ?? 0;
        const width = (obj?.width ?? 0) * (obj?.scaleX ?? 1);
        const height = (obj?.height ?? 0) * (obj?.scaleY ?? 1);

        // Minimum size enforcement (at least 4px)
        const minScale = 4 / Math.max(obj?.width ?? 1, 1);
        if ((obj?.scaleX ?? 1) < minScale) obj?.set({ scaleX: minScale });
        if ((obj?.scaleY ?? 1) < minScale) obj?.set({ scaleY: minScale });

        // Constrain to canvas bounds
        if (left < 0) obj?.set({ left: 0 });
        if (top < 0) obj?.set({ top: 0 });
        if (left + width > canvasWidth * ppu) {
          obj?.set({ scaleX: (canvasWidth * ppu - left) / (obj?.width ?? 1) });
        }
        if (top + height > canvasHeight * ppu) {
          obj?.set({ scaleY: (canvasHeight * ppu - top) / (obj?.height ?? 1) });
        }
      };

      const onObjectRotating = (e: { target?: import('fabric').FabricObject; e?: MouseEvent }) => {
        if (!e.target || !e.e) return;
        // Snap to 15° increments when holding Shift
        if (e.e.shiftKey) {
          const angle = e.target.angle ?? 0;
          e.target.set({ angle: Math.round(angle / 15) * 15 });
        }
      };

      const onObjectModified = () => {
        const json = JSON.stringify(canvas.toJSON());
        useCanvasStore.getState().pushUndoState(json);
        useProjectStore.getState().setDirty(true);
      };

      // Sub-target click detection for per-piece fabric assignment.
      // When a user clicks inside a block group, we identify which patch
      // was hit via Fabric's subTargets array and store it for the UI.
      const onMouseDown = (e: { target?: unknown; subTargets?: unknown[] }) => {
        if (!e.target || !e.subTargets || e.subTargets.length === 0) {
          // Clicked outside a group or on a non-group object — clear patch
          useCanvasStore.getState().setSelectedPatch(null);
          return;
        }

        const targetMeta = e.target as Record<string, unknown>;
        if (!targetMeta.__isBlockGroup) {
          // Clicked a non-block object — clear patch
          useCanvasStore.getState().setSelectedPatch(null);
          return;
        }

        const subTarget = e.subTargets[0] as Record<string, unknown>;
        if (subTarget.__pieceRole === 'patch') {
          useCanvasStore.getState().setSelectedPatch(subTarget);
        } else {
          useCanvasStore.getState().setSelectedPatch(null);
        }
      };

      // Patch hover highlighting — shows which piece the cursor is over
      // inside block groups. Uses a subtle stroke change, restored on leave.
      let hoveredPatch: import('fabric').FabricObject | null = null;
      let hoveredPatchPrevStroke: string | null = null;
      let hoveredPatchPrevStrokeWidth: number | null = null;

      const PATCH_HOVER_STROKE = CANVAS.patchHover;
      const PATCH_HOVER_STROKE_WIDTH = 2;

      const onPatchHover = (e: { target?: unknown; subTargets?: unknown[] }) => {
        const newPatch = (() => {
          if (!e.target || !e.subTargets || e.subTargets.length === 0) return null;
          const targetMeta = e.target as Record<string, unknown>;
          if (!targetMeta.__isBlockGroup) return null;
          const sub = e.subTargets[0] as Record<string, unknown>;
          if (sub.__pieceRole !== 'patch') return null;
          return e.subTargets[0] as import('fabric').FabricObject;
        })();

        // Same patch — nothing to do
        if (newPatch === hoveredPatch) return;

        // Restore previous patch
        if (hoveredPatch) {
          hoveredPatch.set({
            stroke: hoveredPatchPrevStroke ?? undefined,
            strokeWidth: hoveredPatchPrevStrokeWidth ?? 0.5,
          });
          hoveredPatch = null;
          hoveredPatchPrevStroke = null;
          hoveredPatchPrevStrokeWidth = null;
        }

        // Apply hover to new patch
        if (newPatch) {
          hoveredPatchPrevStroke = (newPatch.stroke as string) ?? null;
          hoveredPatchPrevStrokeWidth = newPatch.strokeWidth ?? 0.5;
          newPatch.set({
            stroke: PATCH_HOVER_STROKE,
            strokeWidth: PATCH_HOVER_STROKE_WIDTH,
          });
          hoveredPatch = newPatch;
        }

        canvas.requestRenderAll();
      };

      canvas.on('after:render', onAfterRender);
      canvas.on('mouse:move', onMouseMove);
      canvas.on('mouse:move', onPatchHover as never);
      canvas.on('mouse:down', onMouseDown as never);
      canvas.on('selection:created', onSelectionCreated);
      canvas.on('selection:updated', onSelectionUpdated);
      canvas.on('selection:cleared', onSelectionCleared);
      canvas.on('object:moving', onObjectMoving);
      canvas.on('object:scaling', onObjectScaling as never);
      canvas.on('object:rotating', onObjectRotating as never);
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
        // Restore layout store state if embedded in the canvas data.
        // This allows the fence renderer to reconstruct the layout on reload.
        const layoutData = (canvasDataToLoad as Record<string, unknown>).__layoutState as
          | Record<string, unknown>
          | undefined;
        if (layoutData && layoutData.layoutType && layoutData.layoutType !== 'none') {
          const ls = useLayoutStore.getState();
          if (layoutData.layoutType)
            ls.setLayoutType(
              layoutData.layoutType as
                | 'none'
                | 'free-form'
                | 'grid'
                | 'sashing'
                | 'on-point'
                | 'strippy'
                | 'medallion'
            );
          if (layoutData.selectedPresetId !== undefined)
            ls.setSelectedPreset(layoutData.selectedPresetId as string | null);
          if (typeof layoutData.rows === 'number') ls.setRows(layoutData.rows);
          if (typeof layoutData.cols === 'number') ls.setCols(layoutData.cols);
          if (typeof layoutData.blockSize === 'number') ls.setBlockSize(layoutData.blockSize);
          if (layoutData.sashing) ls.setSashing(layoutData.sashing as Record<string, unknown>);
          if (Array.isArray(layoutData.borders)) ls.setBorders(layoutData.borders);
          if (typeof layoutData.hasCornerstones === 'boolean')
            ls.setHasCornerstones(layoutData.hasCornerstones);
          if (typeof layoutData.bindingWidth === 'number')
            ls.setBindingWidth(layoutData.bindingWidth);
          if (layoutData.hasAppliedLayout) ls.applyLayout();
        }

        // Defensively drop any backgroundImage whose src is a blob: URL —
        // those are session-bound and fail to load across reloads, which
        // would otherwise cause loadFromJSON to throw and the canvas to
        // silently render empty.
        const sanitized = canvasDataToLoad as Record<string, unknown>;
        const bgImage = sanitized.backgroundImage as { src?: string } | undefined;
        if (bgImage && typeof bgImage.src === 'string' && bgImage.src.startsWith('blob:')) {
          delete sanitized.backgroundImage;
        }

        try {
          await canvas.loadFromJSON(sanitized);
        } catch (err) {
          console.error('Failed to load canvas state from JSON:', err);
        }
      }
      canvas.renderAll();

      const initialJson = JSON.stringify(canvas.toJSON());
      useCanvasStore.getState().pushUndoState(initialJson);

      // Check generation before mutating store (prevents race condition)
      if (disposed || generation !== generationRef.current) {
        // Clean up this orphaned canvas instance
        canvas.off('after:render', onAfterRender);
        canvas.off('mouse:move', onMouseMove);
        canvas.off('mouse:down', onMouseDown as never);
        canvas.off('selection:created', onSelectionCreated);
        canvas.off('selection:updated', onSelectionUpdated);
        canvas.off('selection:cleared', onSelectionCleared);
        canvas.off('object:moving', onObjectMoving);
        canvas.off('object:scaling', onObjectScaling);
        canvas.off('object:rotating', onObjectRotating);
        canvas.off('object:modified', onObjectModified);
        resizeObserver?.disconnect();
        canvas.dispose();
        return;
      }

      useCanvasStore.getState().setZoom(initZoom);
      setCanvas(canvas);

      // Expose for E2E testing
      if (typeof window !== 'undefined') {
        (window as any).fabricCanvas = canvas;
        (window as any).useCanvasStore = useCanvasStore;
      }
    })();

    return () => {
      disposed = true;
      resizeObserver?.disconnect();

      if (canvasInstance) {
        canvasInstance.off('after:render');
        canvasInstance.off('mouse:move');
        canvasInstance.off('mouse:down');
        canvasInstance.off('selection:created');
        canvasInstance.off('selection:updated');
        canvasInstance.off('selection:cleared');
        canvasInstance.off('object:moving');
        canvasInstance.off('object:scaling');
        canvasInstance.off('object:rotating');
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
