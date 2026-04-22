'use client';

import { useMemo, useRef, useState } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useCanvasContext } from '@/contexts/CanvasContext';
import type { Canvas as FabricCanvas } from 'fabric';

interface HistoryEntry {
  json: string;
  timestamp: number;
  thumbnail?: string;
}

export function HistoryPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const undoStack = useCanvasStore((s) => s.undoStack);
  const [baseTimestamp] = useState(() => Date.now());
  const { getCanvas } = useCanvasContext();
  // Re-entry guard: loadFromJSON is asynchronous; clicking a second history entry
  // before the first finishes would interleave two canvas loads and corrupt the
  // stacks. We drop subsequent clicks until the in-flight jump completes.
  const isJumpingRef = useRef(false);

  const entries: HistoryEntry[] = useMemo(
    () =>
      undoStack.map((json, i) => ({
        json,
        timestamp: baseTimestamp - (undoStack.length - i) * 1000,
      })),
    [undoStack, baseTimestamp]
  );

  const jumpToState = (index: number) => {
    // Refuse concurrent jumps — the in-flight loadFromJSON is still resolving.
    if (isJumpingRef.current) return;
    const fabricCanvas = getCanvas();
    if (!fabricCanvas) return;

    const canvas = fabricCanvas as FabricCanvas;
    const targetJson = entries[index].json;

    // Snapshot the undoStack *before* the async load so subsequent canvas
    // events (object:added etc. fired during hydration) cannot influence the
    // slice indices we use to rebuild the undo/redo stacks.
    const snapshotStack = undoStack;

    isJumpingRef.current = true;
    canvas.loadFromJSON(JSON.parse(targetJson), () => {
      try {
        canvas.renderAll();
        // Stack update must happen AFTER loadFromJSON resolves; doing it
        // synchronously (the previous behavior) let events fired during load
        // push new entries onto the "new" stack, corrupting history ordering.
        const newUndoStack = snapshotStack.slice(0, index + 1);
        const newRedoStack = snapshotStack.slice(index + 1);
        useCanvasStore.setState({ undoStack: newUndoStack, redoStack: newRedoStack });
      } finally {
        isJumpingRef.current = false;
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-12 bottom-0 w-64 bg-[var(--color-bg)] border-l border-[var(--color-border)]/15 shadow-[0_1px_2px_rgba(26,26,26,0.08)] z-40 overflow-y-auto">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-label-sm uppercase text-[var(--color-text)]/70 font-medium">
            History
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-lg text-[var(--color-text)]/50 hover:text-[var(--color-text)] hover:bg-[var(--color-bg)] transition-colors"
            aria-label="Close history"
          >
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
              <path
                d="M5 5L15 15M5 15L15 5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {entries.length === 0 ? (
          <p className="text-body-sm text-[var(--color-text-dim)] text-center py-8">
            No history yet
          </p>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, i) => (
              <button
                key={i}
                type="button"
                onClick={() => jumpToState(i)}
                className="w-full text-left p-2 rounded-lg bg-[var(--color-bg)] hover:bg-[var(--color-border)] transition-colors"
              >
                <div className="text-body-sm text-[var(--color-text)]">
                  State {entries.length - i}
                </div>
                <div className="text-caption text-[var(--color-text-dim)]">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
