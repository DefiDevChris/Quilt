import { useCanvasStore } from '@/stores/canvasStore';
import { useBlockStore } from '@/stores/blockStore';
import { useFabricStore } from '@/stores/fabricStore';
import { useLayoutStore } from '@/stores/layoutStore';
import { useYardageStore } from '@/stores/yardageStore';
import { usePrintlistStore } from '@/stores/printlistStore';

import { performUndo, performRedo } from '@/lib/canvas-history';
import { ToolDef } from '@/components/ui/ToolIcon';

export interface ToolbarCallbacks {
  onOpenLayoutSettings?: () => void;
  onOpenGridDimensions?: () => void;
  onOpenImageExport?: () => void;
  onOpenPhotoToPattern?: () => void;
  onOpenResize?: () => void;
  onOpenPatternOverlay?: () => void;
}

export function useQuiltTools(callbacks: ToolbarCallbacks): ToolDef[] {
  const isBlockPanelOpen = useBlockStore((s) => s.isPanelOpen);
  const toggleBlockPanel = useBlockStore((s) => s.togglePanel);
  const isFabricPanelOpen = useFabricStore((s) => s.isPanelOpen);
  const toggleFabricPanel = useFabricStore((s) => s.togglePanel);
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
      id: 'bend',
      label: 'Curved Edge',
      shortcut: 'U',
      description: 'Bend edges of shapes',
      mascot: '/mascots&avatars/corgi24.png',
      toolType: 'bend',
      group: 'tools',
      tier: 'primary',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M4 16 Q 10 4 16 16"
            stroke="currentColor"
            strokeWidth="1.4"
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
            d="M12.5 3C12.5 2.17 11.83 1.5 11 1.5C10.17 1.5 9.5 2.17 9.5 3V10L7.5 8.5C7 8.1 6.3 8.1 5.8 8.5C5.3 8.9 5.2 9.6 5.6 10.1L8.5 14.5L10 17C10.3 17.5 10.8 17.7 11.3 17.6C11.8 17.5 12.1 17.1 12.1 16.6V11H14.5C15.3 11 16 10.3 16 9.5C16 8.7 15.3 8 14.5 8H12.5V3Z"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      id: 'blocks',
      label: 'Block Library',
      shortcut: 'B',
      description: 'Browse 651+ quilt blocks and drag them onto your canvas',
      mascot: '/mascots&avatars/corgi4.png',
      group: 'library',
      tier: 'primary',
      onClick: toggleBlockPanel,
      isActive: () => isBlockPanelOpen,
      dataTour: 'block-library',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M10 3L16 10L10 17L4 10L10 3Z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      id: 'fabrics',
      label: 'Fabric Library',
      shortcut: 'F',
      description: 'Upload your fabric photos and apply them to patches',
      mascot: '/mascots&avatars/corgi6.png',
      group: 'library',
      tier: 'primary',
      onClick: toggleFabricPanel,
      isActive: () => isFabricPanelOpen,
      dataTour: 'fabric-library',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.4" />
          <path d="M3 10H17M10 3V17" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
        </svg>
      ),
    },
    {
      id: 'photo-to-pattern',
      label: 'Photo to Pattern',
      description: 'Turn any photo into a quilt pattern — the fastest way to start a design',
      mascot: '/mascots&avatars/corgi10.png',
      group: 'create',
      tier: 'primary',
      isProFeature: true,
      onClick: callbacks.onOpenPhotoToPattern,
      dataTour: 'photo-to-pattern',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.4" />
          <path d="M3 10H17" stroke="currentColor" strokeWidth="1.2" />
          <path d="M10 3V17" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="7" cy="7" r="1.5" stroke="currentColor" strokeWidth="1" />
        </svg>
      ),
    },
    {
      id: 'layout',
      label: 'Layout Settings',
      description: 'Set up your quilt layout — grid, sashing, on-point, and more',
      mascot: '/mascots&avatars/corgi12.png',
      group: 'layout',
      tier: 'primary',
      onClick: callbacks.onOpenLayoutSettings,
      isActive: () => layoutType !== 'none',
      dataTour: 'layout-settings',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="3" y="3" width="6" height="6" stroke="currentColor" strokeWidth="1.4" />
          <rect x="11" y="3" width="6" height="6" stroke="currentColor" strokeWidth="1.4" />
          <rect x="3" y="11" width="6" height="6" stroke="currentColor" strokeWidth="1.4" />
          <rect x="11" y="11" width="6" height="6" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      ),
    },
    // ── Sashing & Border Tools (No Layout mode only) ──
    {
      id: 'sashing',
      label: 'Sashing',
      shortcut: 'S',
      description: 'Draw sashing strips between blocks',
      mascot: '/mascots&avatars/corgi14.png',
      toolType: 'sashing',
      group: 'layout',
      tier: 'primary',
      isActive: () => layoutType === 'none',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="3" y="8" width="14" height="4" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      ),
    },
    {
      id: 'border',
      label: 'Border',
      shortcut: 'B',
      description: 'Draw border strips around your quilt',
      mascot: '/mascots&avatars/corgi16.png',
      toolType: 'border',
      group: 'layout',
      tier: 'primary',
      isActive: () => layoutType === 'none',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="3" y="3" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" />
        </svg>
      ),
    },
    // ── PRIMARY: Drawing shapes ──
    {
      id: 'rectangle',
      label: 'Rectangle',
      shortcut: 'R',
      description: 'Draw a rectangle — hold Shift for a perfect square',
      mascot: '/mascots&avatars/corgi14.png',
      toolType: 'rectangle',
      group: 'shapes',
      tier: 'primary',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="3" y="5" width="14" height="10" rx="1" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      ),
    },
    {
      id: 'circle',
      label: 'Circle',
      shortcut: 'O',
      description: 'Draw a circle — hold Shift for a perfect circle',
      mascot: '/mascots&avatars/corgi16.png',
      toolType: 'circle',
      group: 'shapes',
      tier: 'primary',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      ),
    },
    {
      id: 'triangle',
      label: 'Triangle',
      shortcut: 'T',
      description: 'Draw a triangle patch',
      mascot: '/mascots&avatars/corgi18.png',
      toolType: 'triangle',
      group: 'shapes',
      tier: 'primary',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M10 4L17 16H3L10 4Z"
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
      description: 'Draw freehand shapes that snap to grid and auto-close into patches',
      mascot: '/mascots&avatars/corgi2.png',
      toolType: 'blockbuilder',
      group: 'shapes',
      tier: 'primary',
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
    // ── PRIMARY: Layout & sizing ──
    {
      id: 'grid-dimensions',
      label: 'Grid & Dimensions',
      description: 'Set your quilt dimensions and grid spacing',
      mascot: '/mascots&avatars/corgi26.png',
      group: 'layout',
      tier: 'primary',
      onClick: callbacks.onOpenGridDimensions,
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="3" y="3" width="14" height="14" rx="1" stroke="currentColor" strokeWidth="1.4" />
          <path d="M3 10H17" stroke="currentColor" strokeWidth="1" strokeOpacity="0.5" />
          <path d="M10 3V17" stroke="currentColor" strokeWidth="1" strokeOpacity="0.5" />
          <path d="M3 6.5H17" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.3" />
          <path d="M3 13.5H17" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.3" />
          <path d="M6.5 3V17" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.3" />
          <path d="M13.5 3V17" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.3" />
          <path
            d="M1 3V1H3"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M17 1H19V3"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      id: 'resize-quilt',
      label: 'Resize Quilt',
      description: 'Scale the entire quilt or add blocks to change dimensions',
      mascot: '/mascots&avatars/corgi28.png',
      group: 'layout-adv',
      tier: 'advanced',
      onClick: callbacks.onOpenResize,
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M4 13V16H7M16 7V4H13"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M16 4L11 9M4 16L9 11"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
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
      onClick: callbacks.onOpenPatternOverlay,
      isActive: () => useCanvasStore.getState().showPatternOverlay,
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

export function useBlockTools(): ToolDef[] {
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
      id: 'blockbuilder',
      label: 'Easy Draw',
      shortcut: 'E',
      description: 'Draw freehand paths that snap to grid — auto-close into shapes',
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
  ];
}
