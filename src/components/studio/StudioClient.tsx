'use client';

import dynamic from 'next/dynamic';
import { useProjectStore } from '@/stores/projectStore';
import { useLayoutStore } from '@/stores/layoutStore';
import { ProjectModeModal } from '@/components/studio/ProjectModeModal';
import { SelectionShell } from '@/components/studio/SelectionShell';
import { CanvasProvider } from '@/contexts/CanvasContext';

const StudioLayout = dynamic(
  () =>
    import('@/components/studio/StudioLayout').then((mod) => ({
      default: mod.StudioLayout,
    })),
  { ssr: false },
);

export function StudioClient() {
  const mode = useProjectStore((s) => s.mode);
  const modeSelected = useProjectStore((s) => s.modeSelected);
  const layoutLocked = useLayoutStore((s) => s.layoutLocked);

  const phase = !modeSelected
    ? ('selecting-mode' as const)
    : mode === 'free-form' || layoutLocked
      ? ('designing' as const)
      : ('configuring' as const);

  return (
    <CanvasProvider>
      {phase === 'selecting-mode' && <ProjectModeModal />}

      <StudioLayout />

      {phase === 'configuring' && (
        <SelectionShell
          mode={mode === 'template' ? 'template' : 'layout'}
        />
      )}
    </CanvasProvider>
  );
}
