import { useCanvasStore } from '@/stores/canvasStore';
import { useLayoutStore } from '@/stores/layoutStore';
import { useProjectStore } from '@/stores/projectStore';

import { performUndo, performRedo } from '@/lib/canvas-history';
import { ToolDef } from '@/components/ui/ToolIcon';
import {
  MousePointer2,
  Hand,
  Pencil,
  Wand2,
  Undo2,
  Redo2,
  Square,
  Triangle,
  ZoomIn,
  ZoomOut,
  Frame,
  Box,
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
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);

  // Drawing tools only make sense in free-form mode or before a layout is
  // applied. When a grid/medallion/etc. layout is applied, hide them to
  // prevent users from drawing outside fence cells.
  const hasAppliedLayout = useLayoutStore((s) => s.hasAppliedLayout);
  const layoutType = useLayoutStore((s) => s.layoutType);
  const layoutLocked = useLayoutStore((s) => s.layoutLocked);
  const projectMode = useProjectStore((s) => s.mode);
  const showDrawingTools = !hasAppliedLayout || layoutType === 'free-form';

  // Free-form Phase 2 actions: Add Border / Add Edging (binding) directly
  // from the toolbar. Only show once the user has clicked "Start Designing"
  // — pre-lock these are configured via the SelectionShell sliders.
  const showFreeformActions = projectMode === 'free-form' && layoutLocked;
  // We avoid an unused variable lint warning for ignored callbacks
  void callbacks;

  // Labels are kept short so they always display in full at 14px in the
  // 72-px-wide button. The TooltipHint (`description` below) carries the
  // full sentence for hover discovery.
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
      label: 'Draw',
      description: 'Freehand drawing tool (Easydraw)',
      toolType: 'easydraw',
      group: 'tools',
      icon: <Pencil size={20} />,
    },
    {
      id: 'bend',
      label: 'Bend',
      description: 'Warp / modify existing shapes',
      toolType: 'bend',
      group: 'tools',
      icon: <Wand2 size={20} />,
    },
    // ── Shapes ──
    {
      id: 'rectangle',
      label: 'Rect',
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
      label: 'Zoom +',
      shortcut: 'Ctrl+=',
      description: 'Zoom in on the canvas',
      group: 'zoom',
      onClick: () => useCanvasStore.getState().zoomAtPoint(zoom * ZOOM_FACTOR, fabricCanvas),
      isActive: () => false,
      icon: <ZoomIn size={20} />,
    },
    {
      id: 'zoom-out',
      label: 'Zoom −',
      shortcut: 'Ctrl+-',
      description: 'Zoom out on the canvas',
      group: 'zoom',
      onClick: () => useCanvasStore.getState().zoomAtPoint(zoom / ZOOM_FACTOR, fabricCanvas),
      isActive: () => false,
      icon: <ZoomOut size={20} />,
    },
  ];

  // Free-form actions: Add Border (appends a new 2" border, capped at 5)
  // and Add Edging (toggles bindingWidth between 0 and 0.5"). The layout
  // store's locks have a free-form bypass for these decoration setters.
  if (showFreeformActions) {
    tools.push(
      {
        id: 'add-border',
        label: 'Add Border',
        description: 'Append a new outer border to the quilt',
        group: 'actions',
        onClick: () => useLayoutStore.getState().addBorder(),
        isActive: () => false,
        icon: <Frame size={20} />,
      },
      {
        id: 'add-edging',
        label: 'Add Edging',
        description: 'Toggle binding/edging on the quilt perimeter',
        group: 'actions',
        onClick: () => {
          const ls = useLayoutStore.getState();
          ls.setBindingWidth(ls.bindingWidth > 0 ? 0 : 0.5);
        },
        isActive: () => useLayoutStore.getState().bindingWidth > 0,
        icon: <Box size={20} />,
      }
    );
  }

  // Template mode: only selection, panning, history, and zoom. Template users
  // interact exclusively through fabric swaps — no shape drawing at all.
  if (projectMode === 'template') {
    const TEMPLATE_ALLOWED = new Set([
      'select', 'pan', 'undo', 'redo', 'zoom-in', 'zoom-out',
    ]);
    return tools.filter((tool) => TEMPLATE_ALLOWED.has(tool.id));
  }

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
