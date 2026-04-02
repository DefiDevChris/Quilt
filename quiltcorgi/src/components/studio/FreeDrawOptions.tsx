'use client';

import { useCanvasStore } from '@/stores/canvasStore';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { Checkbox } from '@/components/ui/Checkbox';

export function FreeDrawOptions() {
  const activeTool = useCanvasStore((s) => s.activeTool);
  const freeDrawSmooth = useCanvasStore((s) => s.freeDrawSmooth);
  const setFreeDrawSmooth = useCanvasStore((s) => s.setFreeDrawSmooth);

  if (activeTool !== 'freedraw') return null;

  return (
    <div>
      <SectionTitle>Free Draw</SectionTitle>
      <Checkbox
        label="Smooth Curves"
        checked={freeDrawSmooth}
        onChange={setFreeDrawSmooth}
      />
      <p className="text-[11px] text-on-surface/60 mt-2">
        When enabled, drawn lines are smoothed with curves. When disabled, lines snap to straight segments between grid points.
      </p>
    </div>
  );
}
