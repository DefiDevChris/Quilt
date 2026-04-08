import { useCanvasStore } from '@/stores/canvasStore';
import { useLayoutStore } from '@/stores/layoutStore';
import { useYardageStore } from '@/stores/yardageStore';
import { usePrintlistStore } from '@/stores/printlistStore';

import { performUndo, performRedo } from '@/lib/canvas-history';
import { ToolDef } from '@/components/ui/ToolIcon';

export interface ToolbarCallbacks {
  onOpenImageExport?: () => void;
  onOpenReferenceImage?: () => void;
  onOpenLayoutOverlay?: () => void;
  onSaveBlock?: () => void;
  onNewBlock?: () => void;
}

export function useQuiltTools(callbacks: ToolbarCallbacks): ToolDef[] {
  const layoutType = useLayoutStore((s) => s.layoutType);
  const isYardagePanelOpen = useYardageStore((s) => s.isPanelOpen);
  const toggleYardagePanel = useYardageStore((s) => s.togglePanel);
  const isPrintlistPanelOpen = usePrintlistStore((s) => s.isPanelOpen);
  const togglePrintlistPanel = usePrintlistStore((s) => s.togglePanel);
  const canUndo = useCanvasStore((s) => s.undoStack.length > 0);
  const canRedo = useCanvasStore((s) => s.redoStack.length > 0);
  const isViewportLocked = useCanvasStore((s) => s.isViewportLocked);
  const gridSettings = useCanvasStore((s) => s.gridSettings);
  const setGridSettings = useCanvasStore((s) => s.setGridSettings);

  return [
    // ── PRIMARY: Essentials a hobbyist needs every session ──
    {
      id: 'select',
      label: 'Select',
      shortcut: 'V',
      description: 'Select and move pieces on your canvas',
      mascot: '/mascots&avatars/corgi2.png',
      toolType: 'select',
      group: 'tools',
      tier: 'primary',
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
      id: 'pan',
      label: 'Pan',
      shortcut: 'H',
      description: 'Click and drag to move around your canvas',
      mascot: '/mascots&avatars/corgi8.png',
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
            d="M10 3C8.5 3 7 4 7 6C7 7.5 8 9 9 10V15C9 16 10 17 11 17C12 17 13 16 13 15V10C14 9 15 7.5 15 6C15 4 13.5 3 12 3H10Z"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M7 6V4M13 6V4M10 10V8"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      id: 'pan',
      label: 'Pan',
      shortcut: 'H',
      description: 'Click and drag to move around your canvas',
      mascot: '/mascots&avatars/corgi8.png',
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
            d="M10 3C8.5 3 7 4 7 6C7 7.5 8 9 9 10V15C9 16 10 17 11 17C12 17 13 16 13 15V10C14 9 15 7.5 15 6C15 4 13.5 3 12 3H10Z"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M7 6V4M13 6V4M10 10V8"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    // ── ADVANCED: Inspect & refine ──
    {
      id: 'grid-toggle',
      label: 'Toggle Grid',
      shortcut: 'G',
      description: 'Show or hide the grid overlay',
      mascot: '/mascots&avatars/corgi7.png',
      group: 'view-adv',
      tier: 'advanced',
      onClick: () => setGridSettings({ enabled: !gridSettings.enabled }),
      isActive: () => gridSettings.enabled,
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="3" y="3" width="5" height="5" stroke="currentColor" strokeWidth="1.2" />
          <rect x="9" y="3" width="5" height="5" stroke="currentColor" strokeWidth="1.2" />
          <rect x="15" y="3" width="2" height="5" stroke="currentColor" strokeWidth="1.2" />
          <rect x="3" y="9" width="5" height="5" stroke="currentColor" strokeWidth="1.2" />
          <rect x="9" y="9" width="5" height="5" stroke="currentColor" strokeWidth="1.2" />
          <rect x="15" y="9" width="2" height="5" stroke="currentColor" strokeWidth="1.2" />
          <rect x="3" y="15" width="5" height="2" stroke="currentColor" strokeWidth="1.2" />
          <rect x="9" y="15" width="5" height="2" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      ),
    },
    {
      id: 'reference-image',
      label: 'Reference Image',
      description: 'Import a photo to trace over — adjust opacity and lock in place',
      mascot: '/mascots&avatars/corgi9.png',
      group: 'view-adv',
      tier: 'advanced',
      onClick: callbacks.onOpenReferenceImage,
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.4" />
          <circle cx="7" cy="7" r="1.5" fill="currentColor" opacity="0.5" />
          <path
            d="M3 14L7 10L10 13L14 9L17 12V15C17 15.5 16.5 16 16 16H4C3.5 16 3 15.5 3 15V14Z"
            fill="currentColor"
            opacity="0.3"
          />
        </svg>
      ),
    },
    {
      id: 'snap-toggle',
      label: 'Toggle Snap',
      shortcut: 'Shift+G',
      description: 'Enable or disable snap-to-grid',
      mascot: '/mascots&avatars/corgi11.png',
      group: 'view-adv',
      tier: 'advanced',
      onClick: () => setGridSettings({ snapToGrid: !gridSettings.snapToGrid }),
      isActive: () => gridSettings.snapToGrid,
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="6" cy="6" r="1.5" fill="currentColor" />
          <circle cx="14" cy="6" r="1.5" fill="currentColor" />
          <circle cx="6" cy="14" r="1.5" fill="currentColor" />
          <circle cx="14" cy="14" r="1.5" fill="currentColor" />
          <circle cx="10" cy="10" r="2" stroke="currentColor" strokeWidth="1.4" fill="none" />
        </svg>
      ),
    },
    {
      id: 'pattern-overlay',
      label: 'Pattern Overlay',
      description: 'Show layout cell boundaries and enable auto-align to cells',
      mascot: '/mascots&avatars/corgi17.png',
      group: 'view-adv',
      tier: 'advanced',
      onClick: callbacks.onOpenLayoutOverlay,
      isActive: () => useCanvasStore.getState().showLayoutOverlay,
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect
            x="3"
            y="3"
            width="5"
            height="5"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeDasharray="2 2"
          />
          <rect
            x="9"
            y="3"
            width="5"
            height="5"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeDasharray="2 2"
          />
          <rect
            x="15"
            y="3"
            width="2"
            height="5"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeDasharray="2 2"
          />
          <rect
            x="3"
            y="9"
            width="5"
            height="5"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeDasharray="2 2"
          />
          <rect
            x="9"
            y="9"
            width="5"
            height="5"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeDasharray="2 2"
          />
          <rect
            x="15"
            y="9"
            width="2"
            height="5"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeDasharray="2 2"
          />
          <rect
            x="3"
            y="15"
            width="5"
            height="2"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeDasharray="2 2"
          />
          <rect
            x="9"
            y="15"
            width="5"
            height="2"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeDasharray="2 2"
          />
        </svg>
      ),
    },
    {
      id: 'block-grid-toggle',
      label: 'Block Grid',
      description: 'Show block boundaries overlay',
      mascot: '/mascots&avatars/corgi17.png',
      group: 'view-adv',
      tier: 'advanced',
      onClick: () => setGridSettings({ showBlockGrid: !gridSettings.showBlockGrid }),
      isActive: () => gridSettings.showBlockGrid ?? false,
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="3" y="3" width="14" height="14" stroke="currentColor" strokeWidth="1.4" />
          <path d="M3 10H17M10 3V17" stroke="currentColor" strokeWidth="2" />
          <path d="M3 6.5H17M3 13.5H17" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
          <path d="M6.5 3V17M13.5 3V17" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
        </svg>
      ),
    },
    // ── ADVANCED: Measure & export ──
    {
      id: 'yardage',
      label: 'Yardage Estimator',
      description: 'Calculate how much fabric you need for your quilt',
      mascot: '/mascots&avatars/corgi19.png',
      group: 'export-adv',
      tier: 'advanced',
      onClick: toggleYardagePanel,
      isActive: () => isYardagePanelOpen,
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M4 4V16H16"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M7 12L10 8L13 10L16 6"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      id: 'printlist',
      label: 'Printlist',
      description: 'Review your materials list and generate a printable PDF',
      mascot: '/mascots&avatars/corgi21.png',
      group: 'export-adv',
      tier: 'advanced',
      onClick: togglePrintlistPanel,
      isActive: () => isPrintlistPanelOpen,
      dataTour: 'export',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="5" y="9" width="10" height="7" rx="1" stroke="currentColor" strokeWidth="1.4" />
          <path d="M7 9V4H13V9" stroke="currentColor" strokeWidth="1.4" />
          <path d="M3 9H17V14H3V9Z" stroke="currentColor" strokeWidth="1.4" />
          <path d="M8 12H12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: 'export-image',
      label: 'Export Image',
      description: 'Save your design as a high-res image to share online',
      mascot: '/mascots&avatars/corgi23.png',
      group: 'export-adv',
      tier: 'advanced',
      onClick: callbacks.onOpenImageExport,
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.4" />
          <circle cx="7" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.2" />
          <path
            d="M3 14L7 10L10 13L13 9L17 14"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    // ── PINNED: History (always at bottom) ──
    {
      id: 'undo',
      label: 'Undo',
      shortcut: 'Ctrl+Z',
      description: 'Undo the last action',
      mascot: '/mascots&avatars/corgi25.png',
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
      mascot: '/mascots&avatars/corgi27.png',
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
      id: 'line',
      label: 'Line',
      shortcut: 'L',
      description: 'Draw a seam line between two points',
      toolType: 'line',
      group: 'tools',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M4 16L16 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
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
    {
      id: 'blockbuilder',
      label: 'Easy Draw',
      shortcut: 'E',
      description: 'Draw freehand — lines snap to grid when you release',
      toolType: 'blockbuilder',
      group: 'tools',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M12.5 3.5L16.5 7.5L7 17H3V13L12.5 3.5Z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M10.5 5.5L14.5 9.5" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      ),
    },
    {
      id: 'bend',
      label: 'Bend',
      shortcut: 'B',
      description: 'Click and drag a shape edge to bend it into a curve',
      toolType: 'bend',
      group: 'tools',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M12 16C12 16 10 10 8 7C6 4 5.5 3 5.5 3L4.5 4C4.5 4 5 6 7 9C9 12 10 14 10 14"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M3 5L4.5 4L5 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
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
    {
      id: 'line',
      label: 'Line',
      shortcut: 'L',
      description: 'Draw a dividing line to split areas',
      toolType: 'line',
      group: 'tools',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M4 16L16 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: 'blockbuilder',
      label: 'Easy Draw',
      shortcut: 'E',
      description: 'Draw freehand paths that snap to grid',
      toolType: 'blockbuilder',
      group: 'tools',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M12.5 3.5L16.5 7.5L7 17H3V13L12.5 3.5Z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M10.5 5.5L14.5 9.5" stroke="currentColor" strokeWidth="1.2" />
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
