'use client';

import { useEffect } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useAuthStore } from '@/stores/authStore';
import { deleteTempProject } from '@/lib/temp-project-storage';

export function useBeforeUnload() {
  const isDirty = useProjectStore((s) => s.isDirty);
  const isPro = useAuthStore((s) => s.isPro);
  const projectId = useProjectStore((s) => s.projectId);

  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      // Only warn free users with unsaved work
      if (!isPro && isDirty) {
        e.preventDefault();
        // Delete temp data on unload (user declined to save)
        if (projectId) {
          deleteTempProject(projectId);
        }
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, isPro, projectId]);
}
