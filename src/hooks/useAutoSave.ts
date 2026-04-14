'use client';

import { useEffect, useRef } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useCanvasContext } from '@/contexts/CanvasContext';
import { useProjectStore } from '@/stores/projectStore';
import { AUTO_SAVE_INTERVAL_MS } from '@/lib/constants';
import { saveProject, cancelSaveProject } from '@/lib/save-project';

export function useAutoSave() {
  const { getCanvas } = useCanvasContext();
  const fabricCanvas = getCanvas();
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!fabricCanvas) return;

    // Create abort controller for cleanup
    abortControllerRef.current = new AbortController();

    const timer = setInterval(() => {
      const { isDirty } = useProjectStore.getState();
      const { projectId } = useProjectStore.getState();
      if (!isDirty || !projectId) return;

      saveProject({
        projectId,
        fabricCanvas,
        signal: abortControllerRef.current?.signal,
        source: 'auto',
      }).catch((err) => {
        console.error('Auto-save failed:', err);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('quiltcorgi:save-error', {
              detail: {
                message:
                  err instanceof Error
                    ? err.message
                    : 'Auto-save failed. Your changes may not be saved.',
              },
            })
          );
        }
      });
    }, AUTO_SAVE_INTERVAL_MS);

    return () => {
      clearInterval(timer);
      // Cancel any pending save when unmounting
      const { projectId } = useProjectStore.getState();
      if (projectId) {
        cancelSaveProject(projectId);
      }
      abortControllerRef.current?.abort();
    };
  }, [fabricCanvas]);
}
