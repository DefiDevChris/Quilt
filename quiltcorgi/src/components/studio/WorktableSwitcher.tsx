'use client';

import { motion } from 'framer-motion';
import { useCanvasStore, type WorktableType } from '@/stores/canvasStore';

const TABS: { id: WorktableType; label: string }[] = [
  { id: 'quilt', label: 'QUILT' },
  { id: 'block', label: 'BLOCK' },
  { id: 'print', label: 'PRINT' },
];

export function WorktableSwitcher() {
  const activeWorktable = useCanvasStore((s) => s.activeWorktable);
  const setActiveWorktable = useCanvasStore((s) => s.setActiveWorktable);

  return (
    <div className="bg-surface-container/60 rounded-lg px-1 py-0.5 flex gap-0.5">
      {TABS.map((tab) => {
        const isActive = activeWorktable === tab.id;
        const isPrintActive = isActive && tab.id === 'print';

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveWorktable(tab.id)}
            className={`relative px-3.5 py-1.5 font-medium text-[12px] tracking-[0.04em] rounded-md transition-colors ${
              isActive
                ? isPrintActive
                  ? 'text-primary'
                  : 'text-on-surface'
                : 'text-on-surface/40 hover:text-on-surface/70'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="worktable-pill"
                className="absolute inset-0 bg-surface shadow-elevation-1 rounded-md"
                transition={{ type: 'tween', duration: 0.2, ease: 'easeOut' }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
