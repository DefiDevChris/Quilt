'use client';

import { useEffect } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';
import { AUTO_SAVE_INTERVAL_MS } from '@/lib/constants';
import { saveProject } from '@/hooks/useCanvasKeyboard';

export function useAutoSave() {
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);

  useEffect(() => {
    if (!fabricCanvas) return;

    const timer = setInterval(() => {
      const { isDirty } = useProjectStore.getState();
      const { projectId } = useProjectStore.getState();
      if (!isDirty || !projectId) return;
      saveProject(projectId, fabricCanvas);
    }, AUTO_SAVE_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [fabricCanvas]);
}
