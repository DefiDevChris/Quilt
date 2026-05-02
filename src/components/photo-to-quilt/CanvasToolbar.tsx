'use client';

import { Eye, Paintbrush, Eraser, Undo2, Redo2, RotateCcw } from 'lucide-react';
import { usePhotoToQuiltStore } from '@/stores/photoToQuiltStore';

export default function CanvasToolbar() {
  const editMode = usePhotoToQuiltStore((s) => s.editMode);
  const paintColorIdx = usePhotoToQuiltStore((s) => s.paintColorIdx);
  const historyIndex = usePhotoToQuiltStore((s) => s.historyIndex);
  const history = usePhotoToQuiltStore((s) => s.history);
  const result = usePhotoToQuiltStore((s) => s.result);
  const setEditMode = usePhotoToQuiltStore((s) => s.setEditMode);
  const setPaintColorIdx = usePhotoToQuiltStore((s) => s.setPaintColorIdx);
  const showGrid = usePhotoToQuiltStore((s) => s.showGrid);
  const showBlockGrid = usePhotoToQuiltStore((s) => s.showBlockGrid);
  const setShowGrid = usePhotoToQuiltStore((s) => s.setShowGrid);
  const setShowBlockGrid = usePhotoToQuiltStore((s) => s.setShowBlockGrid);

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      usePhotoToQuiltStore.getState().setResult(prev);
      usePhotoToQuiltStore.getState().setHistoryIndex(historyIndex - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      usePhotoToQuiltStore.getState().setResult(next);
      usePhotoToQuiltStore.getState().setHistoryIndex(historyIndex + 1);
    }
  };

  const handleReset = () => {
    if (history.length > 0) {
      const base = history[0];
      usePhotoToQuiltStore.getState().setResult(base);
      usePhotoToQuiltStore.getState().setHistory([base]);
      usePhotoToQuiltStore.getState().setHistoryIndex(0);
    }
  };

  if (!result) return null;

  const fabricColors = result.palette.filter(
    (_, i) => i < result.palette.length - 1,
  );

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--color-border)]/15 bg-[var(--color-bg)]">
      <button
        onClick={() => setEditMode('view')}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-semibold transition-colors duration-150 ${
          editMode === 'view'
            ? 'bg-[var(--color-primary)] text-white'
            : 'text-[var(--color-text)] hover:bg-[var(--color-border)]'
        }`}
      >
        <Eye size={14} /> View
      </button>
      <button
        onClick={() => setEditMode('paint')}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-semibold transition-colors duration-150 ${
          editMode === 'paint'
            ? 'bg-[var(--color-primary)] text-white'
            : 'text-[var(--color-text)] hover:bg-[var(--color-border)]'
        }`}
      >
        <Paintbrush size={14} /> Paint
      </button>
      <button
        onClick={() => setEditMode('erase')}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-semibold transition-colors duration-150 ${
          editMode === 'erase'
            ? 'bg-[var(--color-primary)] text-white'
            : 'text-[var(--color-text)] hover:bg-[var(--color-border)]'
        }`}
      >
        <Eraser size={14} /> Erase
      </button>

      <div className="w-px h-5 bg-[var(--color-border)] mx-1" />

      <button
        onClick={handleUndo}
        disabled={historyIndex <= 0}
        title="Undo (Ctrl+Z)"
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-semibold transition-colors duration-150 border border-[var(--color-border)] ${
          historyIndex <= 0 ? 'opacity-40 cursor-not-allowed' : 'text-[var(--color-text)] hover:bg-[var(--color-border)]'
        }`}
      >
        <Undo2 size={14} /> Undo
      </button>
      <button
        onClick={handleRedo}
        disabled={historyIndex >= history.length - 1}
        title="Redo (Ctrl+Shift+Z)"
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-semibold transition-colors duration-150 border border-[var(--color-border)] ${
          historyIndex >= history.length - 1 ? 'opacity-40 cursor-not-allowed' : 'text-[var(--color-text)] hover:bg-[var(--color-border)]'
        }`}
      >
        <Redo2 size={14} /> Redo
      </button>
      <button
        onClick={handleReset}
        disabled={history.length === 0}
        title="Reset all changes"
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-semibold transition-colors duration-150 border border-[var(--color-border)] ${
          history.length === 0 ? 'opacity-40 cursor-not-allowed' : 'text-[var(--color-text)] hover:bg-[var(--color-border)]'
        }`}
      >
        <RotateCcw size={14} /> Reset
      </button>

      {editMode === 'paint' && (
        <>
          <div className="w-px h-5 bg-[var(--color-border)] mx-1" />
          <div className="flex gap-1 flex-wrap">
            {fabricColors.map((hex, i) => (
              <div
                key={i}
                onClick={() => setPaintColorIdx(i)}
                className="w-6 h-6 rounded cursor-pointer"
                style={{
                  background: hex,
                  border: i === paintColorIdx ? '3px solid var(--color-primary-hover)' : '2px solid #ccc',
                  boxShadow: i === paintColorIdx ? '0 0 0 1px var(--color-primary)' : 'none',
                }}
              />
            ))}
          </div>
        </>
      )}

      <div className="ml-auto flex items-center gap-2">
        <label className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-dim)] text-[13px] font-semibold cursor-pointer hover:bg-[var(--color-border)] transition-colors duration-150">
          <input
            type="checkbox"
            checked={showBlockGrid}
            onChange={(e) => setShowBlockGrid(e.target.checked)}
            className="w-4 h-4 accent-[var(--color-primary)]"
          />
          Block grid
        </label>
        <label className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-dim)] text-[13px] font-semibold cursor-pointer hover:bg-[var(--color-border)] transition-colors duration-150">
          <input
            type="checkbox"
            checked={showGrid}
            onChange={(e) => setShowGrid(e.target.checked)}
            className="w-4 h-4 accent-[var(--color-primary)]"
          />
          Piece outlines
        </label>
      </div>
    </div>
  );
}
