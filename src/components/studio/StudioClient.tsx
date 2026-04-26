'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useLayoutStore } from '@/stores/layoutStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { ProjectModeModal } from '@/components/studio/ProjectModeModal';
import { SelectionShell } from '@/components/studio/SelectionShell';
import { CanvasProvider } from '@/contexts/CanvasContext';
import type { Project } from '@/types/project';

const StudioLayout = dynamic(
  () =>
    import('@/components/studio/StudioLayout').then((mod) => ({
      default: mod.StudioLayout,
    })),
  { ssr: false },
);

interface StudioClientProps {
  /** Project ID from /studio/[projectId] route. */
  projectId: string;
}

interface ProjectFetchState {
  status: 'idle' | 'loading' | 'ready' | 'error';
  project: Project | null;
  error: string | null;
}

/**
 * StudioClient — the top of the studio component tree.
 *
 * Responsibilities:
 *   1. Fetch the Project by id from /api/projects/[id] on mount.
 *   2. Derive the current studio phase from project mode + lock state:
 *      - `selecting-mode`  — no mode chosen yet (new project).
 *      - `configuring`     — Phase 1 of the spec: pick a template, layout, or
 *                            quilt size (for freeform), with live preview and
 *                            sliders. `SelectionShell` handles all 3 modes.
 *      - `designing`       — Phase 2 of the spec: full studio chrome with
 *                            tools, canvas, and library panels.
 *   3. Pass the loaded project to `StudioLayout` so the canvas can mount and
 *      hydrate stores via `useCanvasInit`.
 *
 * Per the spec, the user's mode and template/layout/size selection is locked
 * after they click "Start Designing" — `applyLayoutAndLock` in the layout
 * store enforces this immutably for the rest of the project's life.
 */
export function StudioClient({ projectId }: StudioClientProps) {
  const mode = useProjectStore((s) => s.mode);
  const modeSelected = useProjectStore((s) => s.modeSelected);
  const layoutLocked = useLayoutStore((s) => s.layoutLocked);

  const [fetchState, setFetchState] = useState<ProjectFetchState>({
    status: 'idle',
    project: null,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    setFetchState({ status: 'loading', project: null, error: null });

    (async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}`);
        if (!res.ok) {
          const errBody = (await res.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(errBody?.error ?? `Failed to load project (${res.status})`);
        }
        const body = (await res.json()) as { success: boolean; data: Project };
        if (cancelled) return;
        setFetchState({ status: 'ready', project: body.data, error: null });
      } catch (err) {
        if (cancelled) return;
        setFetchState({
          status: 'error',
          project: null,
          error: err instanceof Error ? err.message : 'Failed to load project',
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  // Reset stores on project change so a stale lock or worktable doesn't
  // bleed into a freshly opened project.
  useEffect(() => {
    return () => {
      useProjectStore.getState().reset();
      useLayoutStore.getState().reset();
      useCanvasStore.getState().reset();
    };
  }, [projectId]);

  // Spec: all 3 modes have a Phase 1 (selection / size picker), and only
  // `applyLayoutAndLock` advances to Phase 2. Freeform's Phase 1 is just a
  // size picker; layout and template are catalog browsers.
  const phase = !modeSelected
    ? ('selecting-mode' as const)
    : layoutLocked
      ? ('designing' as const)
      : ('configuring' as const);

  if (fetchState.status === 'loading' || fetchState.status === 'idle') {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p className="text-sm text-[var(--color-text-dim)]">Loading project…</p>
      </div>
    );
  }

  if (fetchState.status === 'error' || !fetchState.project) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-8">
        <p className="text-sm font-semibold text-[var(--color-text)]">
          Couldn&apos;t load project
        </p>
        <p className="text-xs text-[var(--color-text-dim)]">
          {fetchState.error ?? 'Unknown error'}
        </p>
      </div>
    );
  }

  const project = fetchState.project;

  return (
    <CanvasProvider>
      {phase === 'selecting-mode' && <ProjectModeModal />}

      <StudioLayout project={project} />

      {phase === 'configuring' && <SelectionShell mode={mode} />}
    </CanvasProvider>
  );
}
