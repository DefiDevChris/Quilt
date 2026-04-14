'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Project } from '@/types/project';

import { StudioDialogsProvider } from '@/components/studio/StudioDialogs';
import { CanvasProvider } from '@/contexts/CanvasContext';

import { useAuthStore } from '@/stores/authStore';
import { useProjectStore } from '@/stores/projectStore';
import { applyInitialSetup, markSetupModalDismissed } from '@/lib/wizard-hydration';
import { useLayoutStore } from '@/stores/layoutStore';
import { DesignerLayout } from '@/components/designer/DesignerLayout';

interface DesignerClientProps {
  readonly designId: string;
}

/**
 * Designer project loader + shell mounter. All UI lives in DesignerLayout;
 * all dialogs live in StudioDialogsProvider. This component just owns the
 * project fetch lifecycle and the loading/error states.
 */
export function DesignerClient({ designId }: DesignerClientProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const isPro = useAuthStore((s) => s.isPro);

  useEffect(() => {
    let cancelled = false;

    async function fetchProject() {
      try {
        const res = await fetch(`/api/projects/${designId}`);
        const data = await res.json();
        if (cancelled) return;

        if (!res.ok) {
          setError(data.error ?? 'Failed to load design');
          return;
        }

        const projectData = data.data as Project;

        // For free users, check if there's a newer temp version in localStorage
        if (!isPro) {
          const { loadTempProject } = await import('@/lib/temp-project-storage');
          const tempData = loadTempProject(designId);
          if (tempData && tempData.savedAt > new Date(projectData.lastSavedAt).getTime()) {
            projectData.canvasData = tempData.canvasData as Project['canvasData'];
            projectData.unitSystem = tempData.unitSystem as Project['unitSystem'];
            projectData.gridSettings = tempData.gridSettings as unknown as Project['gridSettings'];
            projectData.fabricPresets = tempData.fabricPresets;
            projectData.canvasWidth = tempData.canvasWidth;
            projectData.canvasHeight = tempData.canvasHeight;
          }
        }

        // Hydrate layoutStore from canvasData.initialSetup
        const layoutSetters = useLayoutStore.getState();
        const hydration = applyInitialSetup(projectData, layoutSetters, {
          setCanvasDimensions: (w: number, h: number) => {
            useProjectStore.getState().setCanvasDimensions(w, h);
          },
        });
        if (hydration.hydrated) {
          markSetupModalDismissed(projectData.id);
        }

        setProject(projectData);
      } catch {
        if (!cancelled) setError('Failed to load design');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchProject();
    return () => {
      cancelled = true;
    };
  }, [designId, isPro]);

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
            {error || 'Failed to load design.'}
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
        <DesignerLayout project={project} />
      </StudioDialogsProvider>
    </CanvasProvider>
  );
}
