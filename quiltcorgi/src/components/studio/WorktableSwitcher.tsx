'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useProjectStore } from '@/stores/projectStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { Plus, MoreVertical } from 'lucide-react';

export function WorktableSwitcher() {
  const worktables = useProjectStore((s) => s.worktables);
  const activeWorktableId = useProjectStore((s) => s.activeWorktableId);
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ id: string; x: number; y: number } | null>(
    null
  );

  const switchWorktable = (id: string) => {
    if (id === activeWorktableId || !fabricCanvas) return;

    // Save current canvas to active worktable
    const canvas = fabricCanvas as unknown as { toJSON: () => Record<string, unknown> };
    const canvasData = canvas.toJSON();
    useProjectStore.getState().updateWorktableCanvas(activeWorktableId, canvasData);

    // Load target worktable canvas
    const target = worktables.find((w) => w.id === id);
    if (target) {
      useProjectStore.getState().setActiveWorktableId(id);
      (canvas as unknown as { loadFromJSON: (data: unknown) => Promise<void> })
        .loadFromJSON(target.canvasData)
        .then(() => {
          (canvas as unknown as { renderAll: () => void }).renderAll();
        });
    }
  };

  return (
    <>
      <div className="bg-surface-container/60 rounded-lg px-1 py-0.5 flex gap-0.5 items-center">
        {worktables.map((wt) => {
          const isActive = activeWorktableId === wt.id;
          return (
            <div key={wt.id} className="relative flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => switchWorktable(wt.id)}
                className={`relative px-3.5 py-1.5 font-medium text-[12px] tracking-[0.04em] rounded-md transition-colors ${
                  isActive ? 'text-on-surface' : 'text-on-surface/50 hover:text-on-surface/70'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="worktable-pill"
                    className="absolute inset-0 bg-surface shadow-elevation-1 rounded-md"
                    transition={{ type: 'tween', duration: 0.2, ease: 'easeOut' }}
                  />
                )}
                <span className="relative z-10">{wt.name}</span>
              </button>
              {isActive && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setContextMenu({ id: wt.id, x: e.clientX, y: e.clientY });
                  }}
                  className="relative z-10 w-5 h-5 flex items-center justify-center rounded hover:bg-surface-container transition-colors"
                  aria-label="Worktable options"
                >
                  <MoreVertical className="w-3.5 h-3.5 text-on-surface/50" />
                </button>
              )}
            </div>
          );
        })}
        {worktables.length < 10 && (
          <button
            type="button"
            onClick={() => setShowNewDialog(true)}
            className="w-6 h-6 flex items-center justify-center rounded-md text-on-surface/50 hover:text-on-surface hover:bg-surface-container transition-colors"
            aria-label="Add worktable"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {showNewDialog && <NewWorktableDialog onClose={() => setShowNewDialog(false)} />}
      {contextMenu && (
        <WorktableContextMenu
          worktableId={contextMenu.id}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  );
}

function NewWorktableDialog({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const worktables = useProjectStore((s) => s.worktables);

  const handleCreate = () => {
    const defaultName = `Worktable ${worktables.length + 1}`;
    useProjectStore.getState().addWorktable(name.trim() || defaultName);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-lg shadow-elevation-3 p-6 w-96"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-on-surface mb-4">New Worktable</h3>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={`Worktable ${worktables.length + 1}`}
          className="w-full px-3 py-2 bg-surface-container rounded-md text-on-surface text-sm border border-outline-variant/20 focus:outline-none focus:border-primary"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleCreate();
            if (e.key === 'Escape') onClose();
          }}
        />
        <div className="flex gap-2 mt-4 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-on-surface/70 hover:bg-surface-container rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-md hover:opacity-90 transition-opacity"
          >
            Create Worktable
          </button>
        </div>
      </div>
    </div>
  );
}

function WorktableContextMenu({
  worktableId,
  x,
  y,
  onClose,
}: {
  worktableId: string;
  x: number;
  y: number;
  onClose: () => void;
}) {
  const worktables = useProjectStore((s) => s.worktables);
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);
  const [showRename, setShowRename] = useState(false);

  const handleDuplicate = () => {
    // Save current canvas to active worktable before duplicating
    if (fabricCanvas) {
      const canvas = fabricCanvas as unknown as { toJSON: () => Record<string, unknown> };
      const canvasData = canvas.toJSON();
      useProjectStore.getState().updateWorktableCanvas(worktableId, canvasData);
    }
    useProjectStore.getState().duplicateWorktable(worktableId);
    onClose();
  };

  const handleDelete = () => {
    if (worktables.length <= 1) return;
    useProjectStore.getState().deleteWorktable(worktableId);
    onClose();
  };

  if (showRename) {
    return <RenameDialog worktableId={worktableId} onClose={onClose} />;
  }

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed bg-surface rounded-lg shadow-elevation-3 py-1 z-50 min-w-32"
        style={{ left: x, top: y }}
      >
        <button
          type="button"
          onClick={() => setShowRename(true)}
          className="w-full px-4 py-2 text-left text-sm text-on-surface hover:bg-surface-container transition-colors"
        >
          Rename
        </button>
        {worktables.length < 10 && (
          <button
            type="button"
            onClick={handleDuplicate}
            className="w-full px-4 py-2 text-left text-sm text-on-surface hover:bg-surface-container transition-colors"
          >
            Duplicate
          </button>
        )}
        {worktables.length > 1 && (
          <button
            type="button"
            onClick={handleDelete}
            className="w-full px-4 py-2 text-left text-sm text-error hover:bg-surface-container transition-colors"
          >
            Delete
          </button>
        )}
      </div>
    </>
  );
}

function RenameDialog({ worktableId, onClose }: { worktableId: string; onClose: () => void }) {
  const worktable = useProjectStore((s) => s.worktables.find((w) => w.id === worktableId));
  const [name, setName] = useState(worktable?.name ?? '');

  const handleRename = () => {
    if (name.trim()) {
      useProjectStore.getState().renameWorktable(worktableId, name.trim());
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-lg shadow-elevation-3 p-6 w-96"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-on-surface mb-4">Rename Worktable</h3>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 bg-surface-container rounded-md text-on-surface text-sm border border-outline-variant/20 focus:outline-none focus:border-primary"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleRename();
            if (e.key === 'Escape') onClose();
          }}
        />
        <div className="flex gap-2 mt-4 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-on-surface/70 hover:bg-surface-container rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleRename}
            className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-md hover:opacity-90 transition-opacity"
          >
            Rename
          </button>
        </div>
      </div>
    </div>
  );
}
