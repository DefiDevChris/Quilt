'use client';

import { useEffect } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';

async function saveProject(projectId: string | null, fabricCanvas: unknown) {
  if (!projectId || !fabricCanvas) return;
  const store = useProjectStore.getState();
  store.setSaveStatus('saving');
  try {
    const canvas = fabricCanvas as { toJSON: () => Record<string, unknown> };
    const canvasData = canvas.toJSON();
    const { unitSystem, gridSettings } = useCanvasStore.getState();

    const res = await fetch(`/api/projects/${projectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ canvasData, unitSystem, gridSettings }),
    });

    if (!res.ok) throw new Error('Save failed');
    store.setSaveStatus('saved');
    store.setDirty(false);
    store.setLastSavedAt(new Date());
  } catch {
    store.setSaveStatus('error');
    setTimeout(() => {
      if (useProjectStore.getState().saveStatus === 'error') {
        saveProject(projectId, fabricCanvas);
      }
    }, 10_000);
  }
}

export function useCanvasKeyboard() {
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);

  useEffect(() => {
    if (!fabricCanvas) return;

    let cleanupAsync: (() => void) | null = null;

    (async () => {
      const fabric = await import('fabric');
      const canvas = fabricCanvas as {
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
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
          return;

        if (isCtrl && e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          const currentJson = JSON.stringify(canvas.toJSON());
          const prevJson = useCanvasStore.getState().popUndo(currentJson);
          if (prevJson) {
            canvas.loadFromJSON(JSON.parse(prevJson)).then(() => {
              canvas.renderAll();
              useProjectStore.getState().setDirty(true);
            });
          }
          return;
        }

        if (isCtrl && e.key === 'z' && e.shiftKey) {
          e.preventDefault();
          const currentJson = JSON.stringify(canvas.toJSON());
          const nextJson = useCanvasStore.getState().popRedo(currentJson);
          if (nextJson) {
            canvas.loadFromJSON(JSON.parse(nextJson)).then(() => {
              canvas.renderAll();
              useProjectStore.getState().setDirty(true);
            });
          }
          return;
        }

        if (isCtrl && e.key === 'y') {
          e.preventDefault();
          const currentJson = JSON.stringify(canvas.toJSON());
          const nextJson = useCanvasStore.getState().popRedo(currentJson);
          if (nextJson) {
            canvas.loadFromJSON(JSON.parse(nextJson)).then(() => {
              canvas.renderAll();
              useProjectStore.getState().setDirty(true);
            });
          }
          return;
        }

        if (isCtrl && e.key === 's') {
          e.preventDefault();
          const { projectId } = useProjectStore.getState();
          saveProject(projectId, fabricCanvas);
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
            const json = JSON.stringify(canvas.toJSON());
            useCanvasStore.getState().pushUndoState(json);
            const clonePromises = active.map((obj) => obj.clone());
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
              useProjectStore.getState().setDirty(true);
            });
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

export { saveProject };
