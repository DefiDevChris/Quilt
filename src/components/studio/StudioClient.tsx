'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Project } from '@/types/project';

import { StudioDialogsProvider } from '@/components/studio/StudioDialogs';
import { StudioLayout } from '@/components/studio/StudioLayout';

import { useAuthStore } from '@/stores/authStore';
import { useTempProjectMigration } from '@/hooks/useTempProjectMigration';
import { cleanupExpiredProjects } from '@/lib/temp-project-storage';

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
  const isPro = useAuthStore((s) => s.isPro);

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

        const projectData = data.data;

        // For free users, check if there's a newer temp version in localStorage
        if (!isPro) {
          const { loadTempProject } = await import('@/lib/temp-project-storage');
          const tempData = loadTempProject(projectId);
          if (tempData && tempData.savedAt > new Date(projectData.lastSavedAt).getTime()) {
            projectData.canvasData = tempData.canvasData;
            projectData.unitSystem = tempData.unitSystem;
            projectData.gridSettings = tempData.gridSettings;
            projectData.fabricPresets = tempData.fabricPresets;
            projectData.canvasWidth = tempData.canvasWidth;
            projectData.canvasHeight = tempData.canvasHeight;
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
      <div className="h-screen flex items-center justify-center bg-surface">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-secondary">Loading your design...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="h-screen flex items-center justify-center bg-surface">
        <div className="text-center">
          <p className="text-sm text-error mb-4">{error || 'Failed to load project.'}</p>
          <Link
            href="/dashboard"
            className="rounded-md bg-gradient-to-r from-orange-500 to-rose-400 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <StudioDialogsProvider>
      <StudioLayout project={project} />
    </StudioDialogsProvider>
  );
}
