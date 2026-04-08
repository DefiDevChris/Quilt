import { useCanvasStore } from '@/stores/canvasStore';
import { useYardageStore } from '@/stores/yardageStore';
import { usePrintlistStore } from '@/stores/printlistStore';

import { performUndo, performRedo } from '@/lib/canvas-history';
import { ToolDef } from '@/components/ui/ToolIcon';

export interface ToolbarCallbacks {
  onOpenImageExport?: () => void;
  onSaveBlock?: () => void;
  onNewBlock?: () => void;
}

export function useQuiltTools(callbacks: ToolbarCallbacks): ToolDef[] {
  const canUndo = useCanvasStore((s) => s.undoStack.length > 0);
  const canRedo = useCanvasStore((s) => s.redoStack.length > 0);
  const isViewportLocked = useCanvasStore((s) => s.isViewportLocked);
  const isSnapEnabled = useCanvasStore((s) => s.gridSettings.snapToGrid);

  return [
    // ── PRIMARY: Essentials a hobbyist needs every session ──
    {
      id: 'select',
      label: 'Select',
      shortcut: 'V',
      description: 'Select and move pieces on your canvas',
      toolType: 'select',
      group: 'tools',
      tier: 'primary',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M4 3L4 16L8 12L11 18L13 17L10 11L16 11L4 3Z"
            fill="currentColor"
          />
        </svg>
      ),
    },
    {
      id: 'pan',
      label: 'Pan',
      shortcut: 'H',
      description: 'Click and drag to move around your canvas',
      toolType: 'pan',
      group: 'tools',
      tier: 'primary',
      onClick: () => {
        if (isViewportLocked) return;
        useCanvasStore.getState().setActiveTool('pan');
      },
      isDisabled: isViewportLocked,
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M10 2C9 2 8 2.5 8 4C8 5 8.5 6 9 7V14C9 15 9.5 16 10 16C10.5 16 11 15 11 14V7C11.5 6 12 5 12 4C12 2.5 11 2 10 2Z"
            fill="currentColor"
          />
          <circle cx="6" cy="8" r="1.5" fill="currentColor" />
          <circle cx="14" cy="8" r="1.5" fill="currentColor" />
          <circle cx="10" cy="5" r="1.5" fill="currentColor" />
        </svg>
      ),
    },
    {
      id: 'easydraw',
      label: 'Easydraw',
      description: 'Freehand drawing tool',
      toolType: 'easydraw',
      group: 'tools',
      tier: 'primary',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M3 17L5 11L8 8L12 4L16 3L17 7L13 11L10 14L7 17L3 17Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="14" cy="6" r="1.5" fill="currentColor" />
        </svg>
      ),
    },
    {
      id: 'bend',
      label: 'Bend',
      description: 'Warp/modify existing shapes',
      toolType: 'bend',
      group: 'tools',
      tier: 'primary',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M4 16C4 16 6 12 10 12C14 12 16 16 16 16"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="4" cy="16" r="1.5" fill="currentColor" />
          <circle cx="10" cy="12" r="1.5" fill="currentColor" />
          <circle cx="16" cy="16" r="1.5" fill="currentColor" />
        </svg>
      ),
    },
    {
      id: 'snap-toggle',
      label: 'Snap Toggle',
      description: 'Enable/disable snap-to-grid',
      group: 'tools',
      tier: 'primary',
      onClick: () => useCanvasStore.getState().setGridSettings({ snapToGrid: !isSnapEnabled }),
      isActive: () => isSnapEnabled,
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.4" />
          <path
            d="M10 2V6M10 14V18M6 10H2M14 10H18"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <circle cx="10" cy="10" r="2" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      ),
    },
    // ── PINNED: History (always at bottom) ──
    {
      id: 'undo',
      label: 'Undo',
      shortcut: 'Ctrl+Z',
      description: 'Undo the last action',
      group: 'history',
      tier: 'pinned',
      isDisabled: !canUndo,
      onClick: () => {
        if (!canUndo) return;
        performUndo();
      },
      isActive: () => false,
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M5 8H13C14.6569 8 16 9.34315 16 11C16 12.6569 14.6569 14 13 14H10"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8 5L5 8L8 11"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      id: 'redo',
      label: 'Redo',
      shortcut: 'Ctrl+Shift+Z',
      description: 'Redo the last undone action',
      group: 'history',
      tier: 'pinned',
      isDisabled: !canRedo,
      onClick: () => {
        if (!canRedo) return;
        performRedo();
      },
      isActive: () => false,
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M15 8H7C5.34315 8 4 9.34315 4 11C4 12.6569 5.34315 14 7 14H10"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 5L15 8L12 11"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
  ];
}

export function useBlockTools(
  callbacks?: Pick<ToolbarCallbacks, 'onSaveBlock' | 'onNewBlock'>
): ToolDef[] {
  const canUndo = useCanvasStore((s) => s.undoStack.length > 0);
  const canRedo = useCanvasStore((s) => s.redoStack.length > 0);

  return [
    {
      id: 'select',
      label: 'Select',
      shortcut: 'V',
      description: 'Select and move elements',
      toolType: 'select',
      group: 'tools',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M5 3L5 15L8.5 11.5L12 17L14 16L10.5 10L15 10L5 3Z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      id: 'rectangle',
      label: 'Rectangle',
      shortcut: 'R',
      description: 'Draw a rectangle — hold Shift for a square',
      toolType: 'rectangle',
      group: 'tools',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="3" y="5" width="14" height="10" rx="1" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      ),
    },
    {
      id: 'polygon',
      label: 'Polygon',
      shortcut: 'P',
      description: 'Click to place points. Click start point to close. Escape cancels.',
      toolType: 'polygon',
      group: 'tools',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M10 3L16.5 7.5L14.5 15H5.5L3.5 7.5L10 3Z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    // ── History ──
    {
      id: 'undo',
      label: 'Undo',
      shortcut: 'Ctrl+Z',
      description: 'Undo the last action',
      group: 'history',
      isDisabled: !canUndo,
      onClick: () => {
        if (canUndo) performUndo();
      },
      isActive: () => false,
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M5 8H13C14.6569 8 16 9.34315 16 11C16 12.6569 14.6569 14 13 14H10"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8 5L5 8L8 11"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      id: 'redo',
      label: 'Redo',
      shortcut: 'Ctrl+Shift+Z',
      description: 'Redo the last undone action',
      group: 'history',
      isDisabled: !canRedo,
      onClick: () => {
        if (canRedo) performRedo();
      },
      isActive: () => false,
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M15 8H7C5.34315 8 4 9.34315 4 11C4 12.6569 5.34315 14 7 14H10"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 5L15 8L12 11"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    // ── Block actions ──
    {
      id: 'save-block',
      label: 'Save Block',
      description: 'Save current work as a block to My Blocks',
      group: 'actions',
      onClick: callbacks?.onSaveBlock,
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M5 3H13L17 7V15C17 16.1046 16.1046 17 15 17H5C3.89543 17 3 16.1046 3 15V5C3 3.89543 3.89543 3 5 3Z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <path d="M7 3V8H12V3" stroke="currentColor" strokeWidth="1.2" />
          <path d="M7 14H13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: 'new-block',
      label: 'New Block',
      description: 'Clear canvas and start a fresh block',
      group: 'actions',
      onClick: callbacks?.onNewBlock,
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.4" />
          <path
            d="M10 7V13M7 10H13"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
  ];
}

export function useLayoutCreatorTools(
  callbacks?: Pick<ToolbarCallbacks, 'onSaveBlock' | 'onNewBlock'>
): ToolDef[] {
  const canUndo = useCanvasStore((s) => s.undoStack.length > 0);
  const canRedo = useCanvasStore((s) => s.redoStack.length > 0);

  return [
    {
      id: 'select',
      label: 'Select',
      shortcut: 'V',
      description: 'Select a piece to assign its role',
      toolType: 'select',
      group: 'tools',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M5 3L5 15L8.5 11.5L12 17L14 16L10.5 10L15 10L5 3Z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      id: 'rectangle',
      label: 'Rectangle',
      shortcut: 'R',
      description: 'Draw a rectangle — the main shape for layout pieces',
      toolType: 'rectangle',
      group: 'tools',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="3" y="5" width="14" height="10" rx="1" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      ),
    },
    // ── History ──
    {
      id: 'undo',
      label: 'Undo',
      shortcut: 'Ctrl+Z',
      description: 'Undo the last action',
      group: 'history',
      isDisabled: !canUndo,
      onClick: () => {
        if (canUndo) performUndo();
      },
      isActive: () => false,
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M5 8H13C14.6569 8 16 9.34315 16 11C16 12.6569 14.6569 14 13 14H10"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8 5L5 8L8 11"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      id: 'redo',
      label: 'Redo',
      shortcut: 'Ctrl+Shift+Z',
      description: 'Redo the last undone action',
      group: 'history',
      isDisabled: !canRedo,
      onClick: () => {
        if (canRedo) performRedo();
      },
      isActive: () => false,
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M15 8H7C5.34315 8 4 9.34315 4 11C4 12.6569 5.34315 14 7 14H10"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 5L15 8L12 11"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    // ── Layout actions ──
    {
      id: 'save-layout',
      label: 'Save Layout',
      description: 'Save current layout as a template',
      group: 'actions',
      onClick: callbacks?.onSaveBlock,
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M5 3H13L17 7V15C17 16.1046 16.1046 17 15 17H5C3.89543 17 3 16.1046 3 15V5C3 3.89543 3.89543 3 5 3Z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <path d="M7 3V8H12V3" stroke="currentColor" strokeWidth="1.2" />
          <path d="M7 14H13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: 'new-layout',
      label: 'New Layout',
      description: 'Clear canvas and start a fresh layout',
      group: 'actions',
      onClick: callbacks?.onNewBlock,
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.4" />
          <path
            d="M10 7V13M7 10H13"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
  ];
}
