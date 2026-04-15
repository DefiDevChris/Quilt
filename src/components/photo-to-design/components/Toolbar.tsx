'use client';

import { useEffect } from 'react';
import { usePhotoDesignStore } from '@/stores/photoDesignStore';
import type { PhotoDesignClient } from '@/lib/photo-to-design/client';

interface ToolbarProps {
  client: PhotoDesignClient | null;
}

const TOOLS = [
  { id: 'select', label: 'Select' },
  { id: 'drawSeam', label: 'Draw Seam' },
  { id: 'eraseSeam', label: 'Erase Seam' },
  { id: 'floodFill', label: 'Flood Fill' },
] as const;

export function Toolbar({ client }: ToolbarProps) {
  const activeTool = usePhotoDesignStore((s) => s.activeTool);
  const setActiveTool = usePhotoDesignStore((s) => s.setActiveTool);
  const canUndo = usePhotoDesignStore((s) => s.canUndo);
  const canRedo = usePhotoDesignStore((s) => s.canRedo);

  // Default select when none is active but we're in review mode.
  useEffect(() => {
    if (activeTool === null) setActiveTool('select');
  }, [activeTool, setActiveTool]);

  // Ctrl/Cmd+Z / Ctrl/Cmd+Shift+Z.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      if (e.key === 'z' || e.key === 'Z') {
        e.preventDefault();
        if (e.shiftKey) {
          if (canRedo) client?.redo();
        } else {
          if (canUndo) client?.undo();
        }
      } else if (e.key === 'y' || e.key === 'Y') {
        e.preventDefault();
        if (canRedo) client?.redo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [client, canUndo, canRedo]);

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-[#d4d4d4] bg-[#ffffff] px-4 py-2">
      <div className="flex items-center gap-1 rounded-full border border-[#d4d4d4] p-1">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTool(t.id)}
            className={`rounded-full px-3 py-1.5 text-[13px] transition-colors duration-150 ${
              activeTool === t.id
                ? 'bg-[#ff8d49] text-[#1a1a1a]'
                : 'text-[#4a4a4a] hover:bg-[#ff8d49]/10'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          disabled={!canUndo}
          onClick={() => client?.undo()}
          className={`rounded-full border border-[#d4d4d4] px-3 py-1.5 text-[13px] transition-colors duration-150 ${
            canUndo ? 'text-[#1a1a1a] hover:bg-[#ff8d49]/10' : 'cursor-not-allowed text-[#d4d4d4]'
          }`}
          title="Undo (Ctrl/Cmd+Z)"
        >
          Undo
        </button>
        <button
          type="button"
          disabled={!canRedo}
          onClick={() => client?.redo()}
          className={`rounded-full border border-[#d4d4d4] px-3 py-1.5 text-[13px] transition-colors duration-150 ${
            canRedo ? 'text-[#1a1a1a] hover:bg-[#ff8d49]/10' : 'cursor-not-allowed text-[#d4d4d4]'
          }`}
          title="Redo (Ctrl/Cmd+Shift+Z)"
        >
          Redo
        </button>
      </div>
    </div>
  );
}
