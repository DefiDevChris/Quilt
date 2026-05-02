'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useProjectStore } from '@/stores/projectStore';
import { useLayoutStore } from '@/stores/layoutStore';
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
 *   1. Loading     — fetch the project from the API
 *   2. Configuring — Phase 1: catalog / size picker (all modes)
 *   3. Designing   — Phase 2: canvas + worktable tabs (locked layout)
 */
export function StudioClient({ projectId }: StudioClientProps) {
  const [loadState, setLoadState] = useState<LoadState>({ kind: 'loading' });

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
        // Mode is set at creation time (free-form / layout / template /
        // photo-to-quilt). Hydrate the store directly without setMode()
        // to avoid the isDirty: true side-effect — loading from the server
        // is not a user edit.
        if (json.data.mode) {
          useProjectStore.setState({ mode: json.data.mode });
          useLayoutStore.setState({
            layoutLocked: true,
            hasAppliedLayout: true,
          });
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

  const phase = layoutLocked ? ('designing' as const) : ('configuring' as const);

  return (
    <CanvasProvider>
      {/* Studio chrome (top bar, toolbar, canvas, context panel, bottom bar)
       * is mounted as soon as we have a project — even during the configuring
       * phase. The SelectionShell rails are rendered INSIDE StudioLayout's
       * work-area row so they overlay only the canvas band, not the top bar,
       * worktable tabs, or bottom bar. */}
      <StudioLayout project={project} configuring={phase === 'configuring'} />
    </CanvasProvider>
  );
}
