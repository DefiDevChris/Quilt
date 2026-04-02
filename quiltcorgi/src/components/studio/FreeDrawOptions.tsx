'use client';

import { useCanvasStore } from '@/stores/canvasStore';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { Checkbox } from '@/components/ui/Checkbox';

export function FreeDrawOptions() {
  const activeTool = useCanvasStore((s) => s.activeTool);
  const easyDrawMode = useCanvasStore((s) => s.easyDrawMode);
  const setEasyDrawMode = useCanvasStore((s) => s.setEasyDrawMode);

  if (activeTool !== 'easydraw') return null;

  return (
    <div>
      <SectionTitle>Easy Draw</SectionTitle>
      <Checkbox
        label="Smooth Curves"
        checked={easyDrawMode === 'smooth'}
        onChange={(checked) => setEasyDrawMode(checked ? 'smooth' : 'straight')}
      />
      <p className="text-[11px] text-on-surface/60 mt-2">
        When enabled, drawn lines are smoothed with curves. When disabled, lines snap to straight segments between grid points.
      </p>
    </div>
  );
}
