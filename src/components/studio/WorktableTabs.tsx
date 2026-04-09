'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useCanvasStore, type WorktableTab } from '@/stores/canvasStore';
import { useLayoutStore } from '@/stores/layoutStore';
import { useProjectStore } from '@/stores/projectStore';
import type { BorderConfig } from '@/lib/layout-utils';

/**
 * Restore a layout snapshot from a worktable tab into the layoutStore
 * and resize the quilt canvas to match the layout dimensions.
 * Does NOT re-center the viewport — caller should do that via useEffect
 * after React state has settled.
 */
function restoreLayoutSnapshot(ls: WorktableTab['layoutSnapshot']) {
  if (!ls) return;
  const store = useLayoutStore.getState();
  store.setLayoutType(ls.layoutType as never);
  store.setRows(ls.rows);
  store.setCols(ls.cols);
  store.setBlockSize(ls.blockSize);
  store.setSashing({
    width: ls.sashingWidth,
    color: '#E8E2D8',
    fabricId: null,
  });
  store.setBorders(ls.borders as BorderConfig[]);
  store.setBindingWidth(ls.bindingWidth);
  if (ls.selectedPresetId) {
    store.setSelectedPreset(ls.selectedPresetId);
  }

  // Resize the quilt canvas to match the layout dimensions
  const blockAreaW = ls.cols * ls.blockSize;
  const blockAreaH = ls.rows * ls.blockSize;
  const sashingCols = Math.max(0, ls.cols - 1) * ls.sashingWidth;
  const sashingRows = Math.max(0, ls.rows - 1) * ls.sashingWidth;

  let borderW = 0;
  let borderH = 0;
  for (const b of (ls.borders as BorderConfig[])) {
    borderW += b.width * 2;
    borderH += b.width * 2;
  }

  const bindingTotal = ls.bindingWidth * 2;
  const totalW = blockAreaW + sashingCols + borderW + bindingTotal;
  const totalH = blockAreaH + sashingRows + borderH + bindingTotal;

  useProjectStore.getState().setCanvasWidth(Math.max(1, Math.round(totalW * 100) / 100));
  useProjectStore.getState().setCanvasHeight(Math.max(1, Math.round(totalH * 100) / 100));
}

/**
 * Re-center the viewport after a tab switch.
 * Uses requestAnimationFrame to ensure React state has flushed.
 */
function useViewportRecenter(activeWorktableId: string | null) {
  const prevIdRef = useRef(activeWorktableId);

  useEffect(() => {
    if (prevIdRef.current === activeWorktableId) return;
    prevIdRef.current = activeWorktableId;
    if (!activeWorktableId) return;

    // Wait for React to flush state, then re-center
    const id = requestAnimationFrame(() => {
      useCanvasStore.getState().centerAndFitViewport();
    });
    return () => cancelAnimationFrame(id);
  }, [activeWorktableId]);
}

/**
 * Worktable tab bar shown above the canvas.
 * Shows mode tabs (Quilt, Block Builder, Layout Creator) and quilt worktable tabs when in quilt mode.
 * Each tab preserves its pan/zoom position when switching between tabs.
 */
export function WorktableTabs() {
  const worktableTabs = useCanvasStore((s) => s.worktableTabs);
  const activeWorktableId = useCanvasStore((s) => s.activeWorktableId);
  const activeWorktable = useCanvasStore((s) => s.activeWorktable);
  const addWorktableTab = useCanvasStore((s) => s.addWorktableTab);
  const removeWorktableTab = useCanvasStore((s) => s.removeWorktableTab);
  const setActiveWorktableId = useCanvasStore((s) => s.setActiveWorktableId);
  const setActiveWorktable = useCanvasStore((s) => s.setActiveWorktable);

  // Re-center viewport after tab changes
  useViewportRecenter(activeWorktableId);

  const handleAddTab = useCallback(() => {
    // Adding a new tab with no layout (free-draw mode)
    const tab: WorktableTab = {
      id: `wt-${Date.now()}`,
      name: `Quilt ${worktableTabs.length + 1}`,
      type: 'quilt',
      layoutSnapshot: null,
      createdAt: Date.now(),
    };
    addWorktableTab(tab);
    setActiveWorktable('quilt');
  }, [worktableTabs.length, addWorktableTab, setActiveWorktable]);

  const handleCloseTab = useCallback(
    (tabId: string) => {
      const tab = worktableTabs.find((t) => t.id === tabId);
      if (!tab) return;

      // If this is the active tab, restore its layout snapshot
      // before removing it (resize is handled inside restoreLayoutSnapshot)
      if (tabId === activeWorktableId && tab.layoutSnapshot) {
        restoreLayoutSnapshot(tab.layoutSnapshot);
      }

      removeWorktableTab(tabId);
      setActiveWorktable(tab.type !== 'quilt' ? 'quilt' : tab.type);
    },
    [worktableTabs, activeWorktableId, removeWorktableTab, setActiveWorktable]
  );

  const handleSwitchTab = useCallback(
    (tabId: string) => {
      const tab = worktableTabs.find((t) => t.id === tabId);
      if (!tab) return;

      // Restore the layout snapshot from the tab (includes resize + viewport re-center)
      restoreLayoutSnapshot(tab.layoutSnapshot);

      if (!tab.layoutSnapshot) {
        // No layout = free-draw mode, clear layout
        useLayoutStore.getState().setLayoutType('none');
      }

      setActiveWorktableId(tabId);
      setActiveWorktable(tab.type);
    },
    [worktableTabs, setActiveWorktableId, setActiveWorktable]
  );

  const handleSwitchMode = useCallback(
    (mode: 'quilt' | 'block-builder') => {
      setActiveWorktable(mode);
      if (mode === 'quilt' && worktableTabs.length > 0) {
        // Switch to the first quilt tab if available
        const firstTab = worktableTabs[0];
        handleSwitchTab(firstTab.id);
      }
    },
    [setActiveWorktable, worktableTabs, handleSwitchTab]
  );

  const modeTabs = [
    { id: 'quilt', label: 'Worktable' },
    { id: 'block-builder', label: 'Block Builder' },
  ] as const;

  return (
    <div>
      {/* Mode tabs */}
      <div className="flex items-center gap-1 px-3 py-1.5 bg-surface-container/30 border-b border-outline-variant/15">
        {modeTabs.map((mode) => (
          <button
            key={mode.id}
            type="button"
            onClick={() => handleSwitchMode(mode.id)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${activeWorktable === mode.id
              ? 'bg-primary/10 text-primary border border-primary/20'
              : 'text-on-surface/60 hover:text-on-surface hover:bg-surface-container'
              }`}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {/* Quilt worktable tabs (always visible, hidden when not in quilt mode) */}
      <div className={`overflow-x-auto ${activeWorktable === 'quilt' ? '' : 'hidden'}`}>
        <div className="flex items-center gap-1 px-3 py-1.5 bg-surface-container/30 border-b border-outline-variant/15">
          {worktableTabs.map((tab) => (
            <WorktableTabItem
              key={tab.id}
              tab={tab}
              isActive={tab.id === activeWorktableId}
              onSwitch={() => handleSwitchTab(tab.id)}
              onClose={() => handleCloseTab(tab.id)}
            />
          ))}

          <button
            type="button"
            onClick={handleAddTab}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-secondary hover:text-on-surface hover:bg-surface-container transition-colors"
            title="Add new worktable"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M6 2V10M2 6H10"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <span className="text-[10px] font-medium">New Worktable</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function WorktableTabItem({
  tab,
  isActive,
  onSwitch,
  onClose,
}: {
  readonly tab: WorktableTab;
  readonly isActive: boolean;
  readonly onSwitch: () => void;
  readonly onClose: () => void;
}) {
  const layoutLabel = tab.layoutSnapshot
    ? `${tab.name} — ${tab.layoutSnapshot.selectedPresetId ?? 'Custom'}`
    : tab.name;

  return (
    <div
      className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${isActive
        ? 'bg-primary/10 text-primary border border-primary/20'
        : 'bg-white/40 text-on-surface/60 border border-transparent hover:bg-surface-container'
        }`}
      onClick={onSwitch}
    >
      <span className="truncate max-w-[140px]">{layoutLabel}</span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="w-4 h-4 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 hover:bg-primary/20 text-on-surface/40 hover:text-on-surface transition-opacity"
        aria-label={`Close ${tab.name}`}
      >
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
          <path
            d="M1 1L7 7M7 1L1 7"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}
