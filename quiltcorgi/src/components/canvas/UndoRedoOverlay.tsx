'use client';

import { Undo2, Redo2 } from 'lucide-react';
import { useCanvasStore } from '@/stores/canvasStore';

export function UndoRedoOverlay() {
  const performUndo = useCanvasStore((s) => s.performUndo);
  const performRedo = useCanvasStore((s) => s.performRedo);
  const undoStack = useCanvasStore((s) => s.undoStack);
  const redoStack = useCanvasStore((s) => s.redoStack);

  const canUndo = undoStack.length > 0;
  const canRedo = redoStack.length > 0;

  return (
    <div
      className="absolute top-4 left-1/2 -translate-x-1/2 z-40 glass-elevated border-white/60 rounded-full px-2 py-2 shadow-elevation-3 flex items-center gap-1"
      role="toolbar"
      aria-label="Undo and redo actions"
    >
      <button
        type="button"
        onClick={performUndo}
        disabled={!canUndo}
        className="min-w-[48px] min-h-[48px] rounded-full flex flex-col items-center justify-center gap-0.5 transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface-container active:scale-95"
        aria-label="Undo (Ctrl+Z)"
        title="Undo (Ctrl+Z)"
      >
        <Undo2 size={20} className="text-on-surface" />
        <span className="text-[9px] text-secondary font-medium">Undo</span>
      </button>
      <div className="w-px h-8 bg-outline-variant/30" />
      <button
        type="button"
        onClick={performRedo}
        disabled={!canRedo}
        className="min-w-[48px] min-h-[48px] rounded-full flex flex-col items-center justify-center gap-0.5 transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface-container active:scale-95"
        aria-label="Redo (Ctrl+Shift+Z)"
        title="Redo (Ctrl+Shift+Z)"
      >
        <Redo2 size={20} className="text-on-surface" />
        <span className="text-[9px] text-secondary font-medium">Redo</span>
      </button>
    </div>
  );
}
