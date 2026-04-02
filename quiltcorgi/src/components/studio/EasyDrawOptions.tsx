'use client';

import { useCanvasStore } from '@/stores/canvasStore';
import { SectionTitle } from '@/components/ui/SectionTitle';

export type EasyDrawMode = 'straight' | 'smooth';

export function EasyDrawOptions() {
  const activeTool = useCanvasStore((s) => s.activeTool);
  const easyDrawMode = useCanvasStore((s) => s.easyDrawMode);
  const setEasyDrawMode = useCanvasStore((s) => s.setEasyDrawMode);

  if (activeTool !== 'easydraw') return null;

  return (
    <div>
      <SectionTitle>Easy Draw</SectionTitle>
      <div className="flex gap-1 mb-3">
        <button
          type="button"
          onClick={() => setEasyDrawMode('straight')}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            easyDrawMode === 'straight'
              ? 'bg-primary text-white'
              : 'bg-surface-container text-on-surface/60 hover:text-on-surface'
          }`}
        >
          Straight Lines
        </button>
        <button
          type="button"
          onClick={() => setEasyDrawMode('smooth')}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            easyDrawMode === 'smooth'
              ? 'bg-primary text-white'
              : 'bg-surface-container text-on-surface/60 hover:text-on-surface'
          }`}
        >
          Smooth Curve
        </button>
      </div>
      <p className="text-[11px] text-on-surface/60">
        {easyDrawMode === 'straight'
          ? 'Click and drag to draw. Path snaps to grid points with straight segments and auto-closes into a shape.'
          : 'Click and drag to draw. Path snaps to grid with smooth curves and auto-closes into a shape.'}
      </p>
    </div>
  );
}
