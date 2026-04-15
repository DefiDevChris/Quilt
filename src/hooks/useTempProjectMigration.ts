/**
 * Hook to migrate temporary localStorage project to permanent server storage
 * when a free user upgrades to Pro.
 */

import { useEffect } from 'react';
import { useAuthDerived } from '@/stores/authStore';
import { useProjectStore } from '@/stores/projectStore';
import { loadTempProject, deleteTempProject } from '@/lib/temp-project-storage';

export function useTempProjectMigration() {
  const { isPro } = useAuthDerived();
  const projectId = useProjectStore((s) => s.projectId);

  useEffect(() => {
    if (!isPro || !projectId) return;

    // Check if there's a temp project to migrate
    const tempData = loadTempProject(projectId);
    if (!tempData) return;

    // Migrate to server
    (async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            canvasData: tempData.canvasData,
            unitSystem: tempData.unitSystem,
            gridSettings: tempData.gridSettings,
            fabricPresets: tempData.fabricPresets,
            canvasWidth: tempData.canvasWidth,
            canvasHeight: tempData.canvasHeight,
          }),
        });

        if (res.ok) {
          // Migration successful, delete temp data
          deleteTempProject(projectId);
        }
      } catch (error) {
        console.error('Failed to migrate temp project:', error);
      }
    })();
  }, [isPro, projectId]);
}
