'use client';

import { useEffect } from 'react';
import { useCanvasStore, type ToolType } from '@/stores/canvasStore';
import { useCanvasContext } from '@/contexts/CanvasContext';
import { useProjectStore } from '@/stores/projectStore';

import { useBlockStore } from '@/stores/blockStore';
import { useFabricStore } from '@/stores/fabricStore';
import { saveProject } from '@/lib/save-project';
import { performUndo, performRedo } from '@/lib/canvas-history';
import { isInputElement } from '@/lib/dom-utils';
import { ZOOM_FACTOR } from '@/lib/constants';
import { getPixelsPerUnit } from '@/lib/canvas-utils';

export function useCanvasKeyboard() {
  const { getCanvas } = useCanvasContext();
  const fabricCanvas = getCanvas();

  useEffect(() => {
    if (!fabricCanvas) return;

    let cleanupAsync: (() => void) | null = null;

    (async () => {
      const fabric = await import('fabric');
      const canvas = fabricCanvas as InstanceType<typeof fabric.Canvas>;
      const ActiveSelection = fabric.ActiveSelection;

      function onKeyDown(e: KeyboardEvent) {
        const isCtrl = e.ctrlKey || e.metaKey;
        if (isInputElement(e.target)) return;

        if (isCtrl && e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          performUndo();
          return;
        }

        if (isCtrl && e.key === 'z' && e.shiftKey) {
          e.preventDefault();
          performRedo();
          return;
        }

        if (isCtrl && e.key === 'y') {
          e.preventDefault();
          performRedo();
          return;
        }

        if (isCtrl && e.key === 's') {
          e.preventDefault();
          const { projectId } = useProjectStore.getState();
          if (projectId) {
            saveProject({ projectId, fabricCanvas })
              .then(() => {
                // Show success toast
                if (typeof window !== 'undefined') {
                  const event = new CustomEvent('quiltstudio:save-success');
                  window.dispatchEvent(event);
                }
              })
              .catch(() => {
                // Error handling is done in saveProject
              });
          }
          return;
        }

        if (isCtrl && (e.key === '=' || e.key === '+')) {
          e.preventDefault();
          const { zoom, zoomAtPoint } = useCanvasStore.getState();
          zoomAtPoint(zoom * ZOOM_FACTOR, canvas);
          return;
        }

        if (isCtrl && e.key === '-') {
          e.preventDefault();
          const { zoom, zoomAtPoint } = useCanvasStore.getState();
          zoomAtPoint(zoom / ZOOM_FACTOR, canvas);
          return;
        }

        if (isCtrl && e.key === 'c') {
          e.preventDefault();
          const active = canvas.getActiveObjects();
          if (active.length > 0) {
            useCanvasStore.getState().setClipboard(active);
          }
          return;
        }

        if (isCtrl && e.key === 'v') {
          e.preventDefault();
          const clipboard = useCanvasStore.getState().clipboard;
          if (clipboard.length > 0) {
            const clonePromises = clipboard.map((obj) =>
              (obj as { clone: () => Promise<unknown> }).clone()
            );
            Promise.all(clonePromises).then((clones) => {
              canvas.discardActiveObject();
              const OFFSET = 20;
              clones.forEach((clone) => {
                const clonedObj = clone as InstanceType<typeof fabric.FabricObject>;
                clonedObj.set({ left: clonedObj.left + OFFSET, top: clonedObj.top + OFFSET });
                canvas.add(clonedObj);
              });
              canvas.requestRenderAll();
              const json = JSON.stringify(canvas.toJSON());
              useCanvasStore.getState().pushUndoState(json);
              useProjectStore.getState().setDirty(true);
            });
          }
          return;
        }

        if (e.key === 'Delete' || e.key === 'Backspace') {
          const active = canvas.getActiveObjects();
          if (active.length > 0) {
            e.preventDefault();
            active.forEach((obj) => canvas.remove(obj as InstanceType<typeof fabric.FabricObject>));
            canvas.discardActiveObject();
            const json = JSON.stringify(canvas.toJSON());
            useCanvasStore.getState().pushUndoState(json);
            useProjectStore.getState().setDirty(true);
            canvas.renderAll();
          }
          return;
        }

        if (isCtrl && e.key === 'a') {
          e.preventDefault();
          const allObjects = canvas.getObjects();
          const userObjects = allObjects.filter(
            (obj) => !(obj as unknown as { _layoutElement?: boolean })._layoutElement
          );
          if (userObjects.length > 0) {
            const selection = new ActiveSelection(userObjects, {
              canvas: canvas,
            });
            canvas.setActiveObject(selection);
            canvas.requestRenderAll();
          }
          return;
        }

        if (isCtrl && e.key === 'd') {
          e.preventDefault();
          const active = canvas.getActiveObjects();
          if (active.length > 0) {
            // Show duplicate options popup
            const event = new CustomEvent('quiltcorgi:show-duplicate-options', {
              detail: { objects: active },
            });
            window.dispatchEvent(event);
          }
          return;
        }

        // Single-key tool shortcuts (only when no modifier)
        if (!isCtrl && !e.altKey) {
          // R key: rotate block in fence cell by 90 degrees, or switch
          // to rectangle tool if no block is selected in a cell
          if (e.key === 'r' || e.key === 'R') {
            const active = canvas.getActiveObjects();
            if (active.length === 1) {
              const obj = active[0];
              const meta = obj as unknown as Record<string, unknown>;
              if (meta['_inFenceCellId']) {
                e.preventDefault();
                const currentAngle = (obj.angle ?? 0) as number;
                obj.set({ angle: (currentAngle + 90) % 360 });
                obj.setCoords();
                canvas.requestRenderAll();
                const json = JSON.stringify(canvas.toJSON());
                useCanvasStore.getState().pushUndoState(json);
                useProjectStore.getState().setDirty(true);
                return;
              }
            }
          }

          // S key: swap blocks between two selected fence cells
          if (e.key === 's' || e.key === 'S') {
            const active = canvas.getActiveObjects();
            if (active.length === 2) {
              const meta0 = active[0] as unknown as Record<string, unknown>;
              const meta1 = active[1] as unknown as Record<string, unknown>;
              const isFence0 = meta0['_fenceElement'] && meta0['_fenceRole'] === 'block-cell';
              const isFence1 = meta1['_fenceElement'] && meta1['_fenceRole'] === 'block-cell';
              if (isFence0 && isFence1) {
                e.preventDefault();
                const cellId0 = meta0['_fenceAreaId'] as string;
                const cellId1 = meta1['_fenceAreaId'] as string;
                // Find blocks assigned to each cell
                const allObjs = canvas.getObjects();
                let block0: (typeof allObjs)[0] | null = null;
                let block1: (typeof allObjs)[0] | null = null;
                for (const obj of allObjs) {
                  const r = obj as unknown as Record<string, unknown>;
                  if (r['_inFenceCellId'] === cellId0) block0 = obj;
                  if (r['_inFenceCellId'] === cellId1) block1 = obj;
                }
                if (block0 || block1) {
                  // Swap positions and cell assignments
                  const cell0Center = { x: (active[0].left ?? 0) + ((active[0].width ?? 0) * (active[0].scaleX ?? 1)) / 2, y: (active[0].top ?? 0) + ((active[0].height ?? 0) * (active[0].scaleY ?? 1)) / 2 };
                  const cell1Center = { x: (active[1].left ?? 0) + ((active[1].width ?? 0) * (active[1].scaleX ?? 1)) / 2, y: (active[1].top ?? 0) + ((active[1].height ?? 0) * (active[1].scaleY ?? 1)) / 2 };
                  if (block0) {
                    block0.set({ left: cell1Center.x, top: cell1Center.y });
                    (block0 as unknown as Record<string, unknown>)['_inFenceCellId'] = cellId1;
                    block0.setCoords();
                  }
                  if (block1) {
                    block1.set({ left: cell0Center.x, top: cell0Center.y });
                    (block1 as unknown as Record<string, unknown>)['_inFenceCellId'] = cellId0;
                    block1.setCoords();
                  }
                  canvas.requestRenderAll();
                  const json = JSON.stringify(canvas.toJSON());
                  useCanvasStore.getState().pushUndoState(json);
                  useProjectStore.getState().setDirty(true);
                  return;
                }
              }
            }
          }

          const TOOL_SHORTCUTS: Record<string, ToolType> = {
            v: 'select',
            r: 'rectangle',
            t: 'triangle',
            h: 'pan',
            o: 'circle',
            p: 'polygon',
          };
          const tool = TOOL_SHORTCUTS[e.key.toLowerCase()];
          if (tool) {
            e.preventDefault();
            useCanvasStore.getState().setActiveTool(tool);
            return;
          }

          // Panel toggles
          if (e.key === 'b' || e.key === 'B') {
            e.preventDefault();
            useBlockStore.getState().togglePanel();
            return;
          }
          if (e.key === 'f' || e.key === 'F') {
            e.preventDefault();
            useFabricStore.getState().togglePanel();
            return;
          }

          // Grid/Snap toggles
          if (e.key === 'g' || e.key === 'G') {
            e.preventDefault();
            const state = useCanvasStore.getState();
            if (e.shiftKey) {
              state.setGridSettings({ snapToGrid: !state.gridSettings.snapToGrid });
            } else {
              state.setGridSettings({ enabled: !state.gridSettings.enabled });
            }
            return;
          }

          // Help panel
          if (e.key === '?') {
            e.preventDefault();
            window.dispatchEvent(new CustomEvent('quiltcorgi:toggle-help'));
            return;
          }
        }

        // Arrow key nudging for selected objects
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
          const active = canvas.getActiveObjects();
          if (active.length > 0) {
            e.preventDefault();

            // Determine nudge distance
            const { gridSettings, unitSystem } = useCanvasStore.getState();
            const ppu = getPixelsPerUnit(unitSystem);
            const gridPx = gridSettings.snapToGrid ? gridSettings.size * ppu : 1;
            const step = e.shiftKey ? gridPx * 10 : gridPx;

            let dx = 0;
            let dy = 0;
            if (e.key === 'ArrowLeft') dx = -step;
            if (e.key === 'ArrowRight') dx = step;
            if (e.key === 'ArrowUp') dy = -step;
            if (e.key === 'ArrowDown') dy = step;

            active.forEach((obj) => {
              obj.set({
                left: (obj.left ?? 0) + dx,
                top: (obj.top ?? 0) + dy,
              });
              obj.setCoords();
            });

            canvas.requestRenderAll();
            const json = JSON.stringify(canvas.toJSON());
            useCanvasStore.getState().pushUndoState(json);
            useProjectStore.getState().setDirty(true);
          }
          return;
        }

        if (e.key === 'Escape') {
          canvas.discardActiveObject();
          useCanvasStore.getState().setActiveTool('select');
          canvas.renderAll();
        }
      }

      window.addEventListener('keydown', onKeyDown);
      cleanupAsync = () => {
        window.removeEventListener('keydown', onKeyDown);
      };
    })();

    return () => {
      cleanupAsync?.();
    };
  }, [fabricCanvas]);
}
