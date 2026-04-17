import { useCanvasStore } from '@/stores/canvasStore';
import { useCanvasContext } from '@/contexts/CanvasContext';
import { useLayoutStore } from '@/stores/layoutStore';
import { useYardageStore } from '@/stores/yardageStore';
import { usePrintlistStore } from '@/stores/printlistStore';

import { performUndo, performRedo } from '@/lib/canvas-history';
import { ToolDef } from '@/components/ui/ToolIcon';
import {
  MousePointer2,
  Hand,
  Pencil,
  Wand2,
  Grid3x3,
  Undo2,
  Redo2,
  Square,
  Triangle,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { ZOOM_FACTOR } from '@/lib/constants';

export interface ToolbarCallbacks {
  onOpenImageExport?: () => void;
  onSaveBlock?: () => void;
  onNewBlock?: () => void;
}

export function useQuiltTools(callbacks: ToolbarCallbacks): ToolDef[] {
  const canUndo = useCanvasStore((s) => s.undoStack.length > 0);
  const canRedo = useCanvasStore((s) => s.redoStack.length > 0);
  const isViewportLocked = useCanvasStore((s) => s.isViewportLocked);
  const zoom = useCanvasStore((s) => s.zoom);
  const { getCanvas } = useCanvasContext();

  // Drawing tools only make sense in free-form mode or before a layout is
  // applied. When a grid/medallion/etc. layout is applied, hide them to
  // prevent users from drawing outside fence cells.
  const hasAppliedLayout = useLayoutStore((s) => s.hasAppliedLayout);
  const layoutType = useLayoutStore((s) => s.layoutType);
  const showDrawingTools = !hasAppliedLayout || layoutType === 'free-form';

  const tools: ToolDef[] = [
    // ── PRIMARY: Essentials a hobbyist needs every session ──
    {
      id: 'select',
      label: 'Select',
      shortcut: 'V',
      description: 'Select and move pieces on your canvas',
      toolType: 'select',
      group: 'tools',
      icon: <MousePointer2 size={20} />,
    },
    {
      id: 'pan',
      label: 'Pan',
      shortcut: 'H',
      description: 'Click and drag to move around your canvas',
      toolType: 'pan',
      group: 'tools',
      onClick: () => {
        if (isViewportLocked) return;
        useCanvasStore.getState().setActiveTool('pan');
      },
      isDisabled: isViewportLocked,
      icon: <Hand size={20} />,
    },
    {
      id: 'easydraw',
      label: 'Easydraw',
      description: 'Freehand drawing tool',
      toolType: 'easydraw',
      group: 'tools',
      icon: <Pencil size={20} />,
    },
    {
      id: 'bend',
      label: 'Bend',
      description: 'Warp/modify existing shapes',
      toolType: 'bend',
      group: 'tools',
      icon: <Wand2 size={20} />,
    },
    // ── Shapes ──
    {
      id: 'rectangle',
      label: 'Rectangle',
      shortcut: 'R',
      description: 'Draw a rectangle',
      toolType: 'rectangle',
      group: 'shapes',
      icon: <Square size={20} />,
    },
    {
      id: 'triangle',
      label: 'Triangle',
      shortcut: 'T',
      description: 'Draw a triangle',
      toolType: 'triangle',
      group: 'shapes',
      icon: <Triangle size={20} />,
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
        if (!canUndo) return;
        performUndo();
      },
      isActive: () => false,
      icon: <Undo2 size={20} />,
    },
    {
      id: 'redo',
      label: 'Redo',
      shortcut: 'Ctrl+Shift+Z',
      description: 'Redo the last undone action',
      group: 'history',
      isDisabled: !canRedo,
      onClick: () => {
        if (!canRedo) return;
        performRedo();
      },
      isActive: () => false,
      icon: <Redo2 size={20} />,
    },
    // ── Zoom ──
    {
      id: 'zoom-in',
      label: 'Zoom In',
      shortcut: 'Ctrl+=',
      description: 'Zoom in on the canvas',
      group: 'zoom',
      onClick: () => useCanvasStore.getState().zoomAtPoint(zoom * ZOOM_FACTOR, getCanvas()),
      isActive: () => false,
      icon: <ZoomIn size={20} />,
    },
    {
      id: 'zoom-out',
      label: 'Zoom Out',
      shortcut: 'Ctrl+-',
      description: 'Zoom out on the canvas',
      group: 'zoom',
      onClick: () => useCanvasStore.getState().zoomAtPoint(zoom / ZOOM_FACTOR, getCanvas()),
      isActive: () => false,
      icon: <ZoomOut size={20} />,
    },
  ];

  // Filter drawing/shape tools when an applied layout constrains the canvas
  // to fence cells. The drawing group + rectangle/triangle shapes are only
  // useful in free-form mode.
  if (!showDrawingTools) {
    return tools.filter(
      (tool) => !['easydraw', 'bend', 'rectangle', 'triangle'].includes(tool.id)
    );
  }

  return tools;
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
