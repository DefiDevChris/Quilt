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

    // Migrate to server. Send EVERY persistable field from TempProjectData so that
    // upgrading free users do not lose worktables they created in block-builder mode.
    // Previously `worktables` and `activeWorktable` were omitted, silently dropping
    // any non-primary worktables when the user converted to Pro.
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
            worktables: tempData.worktables,
            activeWorktable: tempData.activeWorktable,
          }),
        });

        if (res.ok) {
          // Migration successful, delete temp data
          deleteTempProject(projectId);
        } else {
          // Preserve the temp copy so the user can retry after fixing the cause
          // (e.g., transient network failure, server-side validation error).
          console.warn(
            `[tempProjectMigration] Migration PUT failed with status ${res.status}; temp data preserved for retry.`,
          );
        }
      } catch (error) {
        console.error('Failed to migrate temp project:', error);
      }
    })();
  }, [isPro, projectId]);
}
