'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useProjectStore } from '@/stores/projectStore';
import { useLayoutStore } from '@/stores/layoutStore';
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
  readonly projectId: string;
}

type LoadState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; project: Project };

/**
 * Client-side bootstrap for the Studio. Runs through three phases:
 *
 *   1. Loading        — fetch the project from the API
 *   2. Selecting mode — first time the user opens a project, pick mode
 *   3. Configuring    — Phase 1: catalog / size picker (all three modes)
 *   4. Designing      — Phase 2: canvas + worktable tabs (locked layout)
 *
 * Note that Free-form ALSO has a 'configuring' phase (the size picker),
 * unlike the previous behaviour which short-circuited free-form straight
 * into 'designing'. The locked three-mode spec requires a Start Designing
 * gate for every mode.
 */
export function StudioClient({ projectId }: StudioClientProps) {
  const [loadState, setLoadState] = useState<LoadState>({ kind: 'loading' });

  const mode = useProjectStore((s) => s.mode);
  const modeSelected = useProjectStore((s) => s.modeSelected);
  const layoutLocked = useLayoutStore((s) => s.layoutLocked);

  // Fetch the project on mount. The Studio cannot render without a Project,
  // because Fabric canvas init (useCanvasInit) reads the project's
  // dimensions, unitSystem, gridSettings, and worktables.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}`, {
          credentials: 'include',
          cache: 'no-store',
        });
        if (!res.ok) {
          throw new Error(`Failed to load project: ${res.status}`);
        }
        const json = (await res.json()) as { success: boolean; data: Project };
        if (!json?.success || !json?.data) {
          throw new Error('Malformed project response');
        }
        if (cancelled) return;
        // Mode is "chosen once at project start and locked for the life of
        // that project" (per spec). The DB always has a `mode` column with
        // a default of 'layout', so we can't trust its presence alone.
        // Instead: show the mode picker only when the project has never
        // been saved (lastSavedAt within ~5s of createdAt).
        // We use setState directly rather than setMode() to avoid the
        // isDirty: true side-effect that setMode bakes in — hydrating
        // from the server is not a user edit.
        const created = json.data.createdAt ? new Date(json.data.createdAt).getTime() : 0;
        const lastSaved = json.data.lastSavedAt ? new Date(json.data.lastSavedAt).getTime() : 0;
        const isFresh = !lastSaved || Math.abs(lastSaved - created) < 5_000;
        if (!isFresh && json.data.mode) {
          useProjectStore.setState({ mode: json.data.mode, modeSelected: true });
        }
        setLoadState({ kind: 'ready', project: json.data });
      } catch (err) {
        if (cancelled) return;
        setLoadState({
          kind: 'error',
          message: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  if (loadState.kind === 'loading') {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[var(--color-bg)]">
        <p className="text-[13px] text-[var(--color-text-dim)]">Loading project…</p>
      </div>
    );
  }

  if (loadState.kind === 'error') {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[var(--color-bg)]">
        <p className="text-[13px] text-[var(--color-error)]">
          {loadState.message}
        </p>
      </div>
    );
  }

  const project = loadState.project;

  const phase = !modeSelected
    ? ('selecting-mode' as const)
    : layoutLocked
      ? ('designing' as const)
      : ('configuring' as const);

  return (
    <CanvasProvider>
      {phase === 'selecting-mode' && <ProjectModeModal />}

      <StudioLayout project={project} />

      {phase === 'configuring' && <SelectionShell mode={mode} />}
    </CanvasProvider>
  );
}
