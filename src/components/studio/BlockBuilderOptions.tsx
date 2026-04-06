'use client';

import { useCanvasStore } from '@/stores/canvasStore';
import { SectionTitle } from '@/components/ui/SectionTitle';

export type BlockBuilderMode = 'straight' | 'smooth';

export function BlockBuilderOptions() {
  const activeTool = useCanvasStore((s) => s.activeTool);
  const blockBuilderMode = useCanvasStore((s) => s.blockBuilderMode);
  const setBlockBuilderMode = useCanvasStore((s) => s.setBlockBuilderMode);

  if (activeTool !== 'blockbuilder') return null;

  return (
    <div>
      <SectionTitle>Block Builder</SectionTitle>
      <div className="flex gap-1 mb-3">
        <button
          type="button"
          onClick={() => setBlockBuilderMode('straight')}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            blockBuilderMode === 'straight'
              ? 'bg-gradient-to-r from-orange-500 to-rose-400 text-white'
              : 'bg-surface-container text-on-surface/60 hover:text-on-surface'
          }`}
        >
          Straight Lines
        </button>
        <button
          type="button"
          onClick={() => setBlockBuilderMode('smooth')}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            blockBuilderMode === 'smooth'
              ? 'bg-gradient-to-r from-orange-500 to-rose-400 text-white'
              : 'bg-surface-container text-on-surface/60 hover:text-on-surface'
          }`}
        >
          Smooth Curve
        </button>
      </div>
      <p className="text-label-sm text-on-surface/60">
        {blockBuilderMode === 'straight'
          ? 'Click and drag to draw. Path snaps to grid points with straight segments and auto-closes into a shape.'
          : 'Click and drag to draw. Path snaps to grid with smooth curves and auto-closes into a shape.'}
      </p>
    </div>
  );
}
