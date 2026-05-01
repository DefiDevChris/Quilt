'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useProjectStore } from '@/stores/projectStore';
import { NewDesignModal } from '@/components/studio/NewDesignModal';
import { BuildYourOwnShell } from '@/components/studio/BuildYourOwnShell';
import { TemplateGalleryModal } from '@/components/studio/TemplateGalleryModal';
import { CanvasProvider } from '@/contexts/CanvasContext';
import { DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT } from '@/lib/constants/canvas';
import type { Project } from '@/types/project';

const StudioLayout = dynamic(
  () =>
    import('@/components/studio/StudioLayout').then((mod) => ({
      default: mod.StudioLayout,
    })),
  { ssr: false },
);

type NewFlowPhase = 'choose-path' | 'build-your-own' | 'template-gallery';

const SYNTHETIC_PROJECT: Project = {
  id: 'pending',
  userId: '',
  name: 'Untitled Quilt',
  description: null,
  mode: 'scratch',
  canvasData: {},
  worktables: [{ id: 'main', name: 'Main', canvasData: {}, order: 0 }],
  unitSystem: 'imperial',
  gridSettings: { enabled: true, size: 1, snapToGrid: true },
  canvasWidth: DEFAULT_CANVAS_WIDTH,
  canvasHeight: DEFAULT_CANVAS_HEIGHT,
  thumbnailUrl: null,
  lastSavedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

export function NewStudioClient() {
  const router = useRouter();
  const [phase, setPhase] = useState<NewFlowPhase>('choose-path');

  const setMode = useProjectStore((s) => s.setMode);
  const setCreationPathChosen = useProjectStore((s) => s.setCreationPathChosen);
  const setIsPending = useProjectStore((s) => s.setIsPending);
  const resetProject = useProjectStore((s) => s.reset);

  useEffect(() => {
    resetProject();
    setIsPending(true);
  }, [resetProject, setIsPending]);

  const handleBuildYourOwn = useCallback(() => {
    setMode('scratch');
    setCreationPathChosen(true);
    setPhase('build-your-own');
  }, [setMode, setCreationPathChosen]);

  const handleUseTemplate = useCallback(() => {
    setMode('template');
    setCreationPathChosen(true);
    setPhase('template-gallery');
  }, [setMode, setCreationPathChosen]);

  const handleProjectCreated = useCallback(
    (projectId: string) => {
      setIsPending(false);
      router.replace(`/studio/${projectId}`);
    },
    [router, setIsPending],
  );

  const configuring = phase === 'build-your-own';

  return (
    <CanvasProvider>
      {phase === 'choose-path' && (
        <NewDesignModal
          onBuildYourOwn={handleBuildYourOwn}
          onUseTemplate={handleUseTemplate}
        />
      )}

      {phase === 'template-gallery' && (
        <TemplateGalleryModal
          onCommit={handleProjectCreated}
          onBack={() => setPhase('choose-path')}
        />
      )}

      {phase === 'build-your-own' && (
        <BuildYourOwnShell onCommit={handleProjectCreated} />
      )}

      <StudioLayout project={SYNTHETIC_PROJECT} configuring={configuring} />
    </CanvasProvider>
  );
}
