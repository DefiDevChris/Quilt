'use client';

import { useSearchParams } from 'next/navigation';
import SelectionShell from './SelectionShell';
import StudioLayout from './StudioLayout';
import { useProjectStore } from '@/stores/projectStore';

type StudioMode = 'template' | 'layout' | 'freeform';

export default function StudioClient() {
  const searchParams = useSearchParams();
  const rawMode = searchParams.get('mode') ?? 'freeform';
  const mode: StudioMode = (['template', 'layout', 'freeform'] as const).includes(rawMode as StudioMode)
    ? (rawMode as StudioMode)
    : 'freeform';

  const { isLocked, setProject } = useProjectStore();

  function handleStart(config: {
    width: number;
    height: number;
    templateId?: string;
    fabricIds?: string[];
  }) {
    setProject({
      mode,
      width: config.width,
      height: config.height,
      templateId: config.templateId,
      fabricIds: config.fabricIds ?? [],
      isLocked: true,
    });
  }

  if (!isLocked) {
    return <SelectionShell mode={mode} onStart={handleStart} />;
  }

  return <StudioLayout />;
}
