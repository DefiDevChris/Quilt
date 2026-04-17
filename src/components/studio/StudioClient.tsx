'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Project } from '@/types/project';

import { StudioDialogsProvider } from '@/components/studio/StudioDialogs';
import { StudioLayout } from '@/components/studio/StudioLayout';
import { CanvasProvider } from '@/contexts/CanvasContext';

import { useAuthDerived } from '@/stores/authStore';
import { useLayoutStore } from '@/stores/layoutStore';
import { useProjectStore } from '@/stores/projectStore';
import { useTempProjectMigration } from '@/hooks/useTempProjectMigration';
import { cleanupExpiredProjects } from '@/lib/temp-project-storage';
import { applyInitialSetup, markSetupModalDismissed } from '@/lib/wizard-hydration';

interface StudioClientProps {
  readonly projectId: string;
}

/**
 * Project loader + shell mounter. All UI lives in StudioLayout; all dialogs
 * live in StudioDialogsProvider. This component just owns the project fetch
 * lifecycle and the loading/error states.
 */
export function StudioClient({ projectId }: StudioClientProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const { isPro } = useAuthDerived();

  // Cleanup expired temp projects on mount
  useEffect(() => {
    cleanupExpiredProjects();
  }, []);

  // Migrate temp project to server when user upgrades to Pro
  useTempProjectMigration();

  useEffect(() => {
    let cancelled = false;

    async function fetchProject() {
      try {
        const res = await fetch(`/api/projects/${projectId}`);
        const data = await res.json();
        if (cancelled) return;

        if (!res.ok) {
          setError(data.error ?? 'Failed to load project');
          return;
        }

        const projectData = data.data as Project;

        // For free users, check if there's a newer temp version in localStorage
        if (!isPro) {
          const { loadTempProject } = await import('@/lib/temp-project-storage');
          const tempData = loadTempProject(projectId);
          if (tempData && tempData.savedAt > new Date(projectData.lastSavedAt).getTime()) {
            projectData.canvasData = tempData.canvasData as Project['canvasData'];
            projectData.unitSystem = tempData.unitSystem as Project['unitSystem'];
            projectData.gridSettings = tempData.gridSettings as unknown as Project['gridSettings'];
            projectData.fabricPresets = tempData.fabricPresets;
            projectData.canvasWidth = tempData.canvasWidth;
            projectData.canvasHeight = tempData.canvasHeight;
          }
        }

        // If the project was created via the New Project wizard, hydrate the
        // layoutStore from canvasData.initialSetup so the canvas paints with
        // the chosen layout/template on first frame, then suppress the legacy
        // first-visit setup modal.
        const layoutSetters = useLayoutStore.getState();
        const hydration = applyInitialSetup(projectData, layoutSetters, {
          setCanvasDimensions: (w, h) => {
            useProjectStore.getState().setCanvasDimensions(w, h);
          },
        });
        if (hydration.hydrated) {
          markSetupModalDismissed(projectData.id);
        }

        const activeCanvasData =
          projectData.worktables?.find((worktable) => worktable.id === 'main')?.canvasData ??
          projectData.worktables?.[0]?.canvasData ??
          projectData.canvasData;
        const layoutState = (activeCanvasData as Record<string, unknown> | undefined)?.__layoutState as
          | Record<string, unknown>
          | undefined;

        if (layoutState?.layoutType && layoutState.layoutType !== 'none') {
          layoutSetters.reset();
          layoutSetters.setLayoutType(layoutState.layoutType as Parameters<typeof layoutSetters.setLayoutType>[0]);
          layoutSetters.setSelectedPreset((layoutState.selectedPresetId as string | null) ?? null);
          if (typeof layoutState.rows === 'number') layoutSetters.setRows(layoutState.rows);
          if (typeof layoutState.cols === 'number') layoutSetters.setCols(layoutState.cols);
          if (typeof layoutState.blockSize === 'number') layoutSetters.setBlockSize(layoutState.blockSize);
          if (layoutState.sashing) {
            layoutSetters.setSashing(layoutState.sashing as Record<string, unknown>);
          }
          if (Array.isArray(layoutState.borders)) {
            layoutSetters.setBorders(layoutState.borders as Parameters<typeof layoutSetters.setBorders>[0]);
          }
          if (typeof layoutState.hasCornerstones === 'boolean') {
            layoutSetters.setHasCornerstones(layoutState.hasCornerstones);
          }
          if (typeof layoutState.bindingWidth === 'number') {
            layoutSetters.setBindingWidth(layoutState.bindingWidth);
          }
          if (layoutState.hasAppliedLayout) {
            layoutSetters.applyLayout();
            markSetupModalDismissed(projectData.id);
          }
        }

        setProject(projectData);
      } catch {
        if (!cancelled) setError('Failed to load project');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchProject();
    return () => {
      cancelled = true;
    };
  }, [projectId, isPro]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animation-spinner mx-auto mb-3" />
          <p className="text-sm text-[var(--color-text-dim)]">Loading your design...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="text-center">
          <p className="text-sm text-[var(--color-accent)] mb-4">
            {error || 'Failed to load project.'}
          </p>
          <Link
            href="/dashboard"
            className="inline-block rounded-full bg-[var(--color-primary)] px-6 py-2 text-[14px] font-semibold text-[var(--color-text)] hover:opacity-90 transition-colors duration-150"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <CanvasProvider>
      <StudioDialogsProvider>
        <StudioLayout project={project} />
      </StudioDialogsProvider>
    </CanvasProvider>
  );
}
