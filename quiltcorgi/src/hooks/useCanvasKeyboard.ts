'use client';

import { useEffect } from 'react';
import { useCanvasStore, type ToolType } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';
import { usePieceInspectorStore } from '@/stores/pieceInspectorStore';
import { useBlockStore } from '@/stores/blockStore';
import { useFabricStore } from '@/stores/fabricStore';
import { saveProject } from '@/lib/save-project';
import { performUndo, performRedo } from '@/lib/canvas-history';
import { isInputElement } from '@/lib/dom-utils';

// Toast notification helper (imported dynamically to avoid circular deps)
const toastFn: ((opts: { type: string; title: string; description?: string }) => void) | null = null;
if (typeof window !== 'undefined') {
  import('@/components/ui/ToastProvider').then((mod) => {
    // Will be set when component mounts
  });
}

export function useCanvasKeyboard() {
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);

  useEffect(() => {
    if (!fabricCanvas) return;

    let cleanupAsync: (() => void) | null = null;

    (async () => {
      const fabric = await import('fabric');
      const canvas = fabricCanvas as unknown as {
        toJSON: () => Record<string, unknown>;
        loadFromJSON: (json: Record<string, unknown>) => Promise<void>;
        renderAll: () => void;
        getActiveObjects: () => { id?: string; clone: () => Promise<unknown> }[];
        getObjects: () => { _layoutElement?: boolean }[];
        remove: (obj: unknown) => void;
        discardActiveObject: () => void;
        setActiveObject: (obj: unknown) => void;
        add: (...objs: unknown[]) => void;
        requestRenderAll: () => void;
      };
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
            saveProject({ projectId, fabricCanvas }).then(() => {
              // Show success toast
              if (typeof window !== 'undefined') {
                const event = new CustomEvent('quiltcorgi:save-success');
                window.dispatchEvent(event);
              }
            }).catch(() => {
              // Error handling is done in saveProject
            });
          }
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
                const clonedObj = clone as {
                  left: number;
                  top: number;
                  set: (props: Record<string, number>) => void;
                };
                clonedObj.set({ left: clonedObj.left + OFFSET, top: clonedObj.top + OFFSET });
                canvas.add(clone);
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
            active.forEach((obj) => canvas.remove(obj));
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
          const userObjects = allObjects.filter((obj) => !obj._layoutElement);
          if (userObjects.length > 0) {
            const selection = new ActiveSelection(userObjects as never[], {
              canvas: canvas as never,
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
          const TOOL_SHORTCUTS: Record<string, ToolType> = {
            v: 'select',
            r: 'rectangle',
            t: 'triangle',
            p: 'polygon',
            l: 'line',
            c: 'curve',
            x: 'text',
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

          // Puzzle view toggle
          if (e.key === 'i' || e.key === 'I') {
            e.preventDefault();
            usePieceInspectorStore.getState().togglePuzzleView();
            return;
          }
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
