'use client';

import { useCanvasStore, type WorktableType, type ToolType } from '@/stores/canvasStore';
import { performUndo, performRedo } from '@/lib/canvas-history';
import { ZOOM_STEP } from '@/lib/constants';

interface FloatingTool {
  id: string;
  label: string;
  shortcut?: string;
  toolType?: ToolType;
  onClick?: () => void;
  isActive?: () => boolean;
  isDisabled?: boolean;
  icon: React.ReactNode;
}

/* ── Shared icons ── */
const SELECT_ICON = (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path
      d="M5 3L5 17L9.5 12.5L13.5 19L15.5 18L11.5 11L17 11L5 3Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);

const UNDO_ICON = (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path
      d="M5 9H14C15.6569 9 17 10.3431 17 12C17 13.6569 15.6569 15 14 15H11"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9 5.5L5 9L9 12.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const REDO_ICON = (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path
      d="M17 9H8C6.34315 9 5 10.3431 5 12C5 13.6569 6.34315 15 8 15H11"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M13 5.5L17 9L13 12.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ZOOM_IN_ICON = (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <circle cx="10" cy="10" r="6" stroke="currentColor" strokeWidth="1.5" />
    <path d="M14.5 14.5L19 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M7 10H13M10 7V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const ZOOM_OUT_ICON = (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <circle cx="10" cy="10" r="6" stroke="currentColor" strokeWidth="1.5" />
    <path d="M14.5 14.5L19 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M7 10H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

function useQuiltFloatingTools(): FloatingTool[] {
  const canUndo = useCanvasStore((s) => s.undoStack.length > 0);
  const canRedo = useCanvasStore((s) => s.redoStack.length > 0);

  return [
    { id: 'select', label: 'Select', shortcut: 'V', toolType: 'select', icon: SELECT_ICON },
    {
      id: 'rectangle',
      label: 'Rectangle',
      shortcut: 'R',
      toolType: 'rectangle',
      icon: (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <rect x="3" y="5" width="16" height="12" rx="1" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      ),
    },
    {
      id: 'triangle',
      label: 'Triangle',
      shortcut: 'T',
      toolType: 'triangle',
      icon: (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path
            d="M11 4L19 18H3L11 4Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      id: 'line',
      label: 'Line',
      shortcut: 'L',
      toolType: 'line',
      icon: (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M4 18L18 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: 'curve',
      label: 'Curve',
      shortcut: 'C',
      toolType: 'curve',
      icon: (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path
            d="M4 16C4 16 6 4 11 4C16 4 18 16 18 16"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      id: 'text',
      label: 'Text',
      shortcut: 'X',
      toolType: 'text',
      icon: (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path
            d="M5 5H17M11 5V18M8 5V4M14 5V4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      id: 'undo',
      label: 'Undo',
      shortcut: 'Ctrl+Z',
      isDisabled: !canUndo,
      onClick: () => {
        if (canUndo) performUndo();
      },
      icon: UNDO_ICON,
    },
    {
      id: 'redo',
      label: 'Redo',
      shortcut: 'Ctrl+Shift+Z',
      isDisabled: !canRedo,
      onClick: () => {
        if (canRedo) performRedo();
      },
      icon: REDO_ICON,
    },
  ];
}

const BLOCK_TOOLS: FloatingTool[] = [
  { id: 'select', label: 'Select', toolType: 'select', icon: SELECT_ICON },
  {
    id: 'line',
    label: 'Line',
    toolType: 'line',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M4 18L18 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'arc',
    label: 'Arc',
    toolType: 'curve',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path
          d="M4 17C4 9 9 4 17 4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: 'rectangle',
    label: 'Rectangle',
    toolType: 'rectangle',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="3" y="5" width="16" height="12" rx="1" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    id: 'polygon',
    label: 'Polygon',
    toolType: 'polygon',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path
          d="M11 3L18.5 8.5L16 17H6L3.5 8.5L11 3Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

export function FloatingToolbar() {
  const activeWorktable = useCanvasStore((s) => s.activeWorktable);
  const activeTool = useCanvasStore((s) => s.activeTool);
  const setActiveTool = useCanvasStore((s) => s.setActiveTool);
  const undoDepth = useCanvasStore((s) => s.undoStack.length);
  const zoom = useCanvasStore((s) => s.zoom);
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);

  const quiltTools = useQuiltFloatingTools();

  const applyZoom = (newZoom: number) => {
    useCanvasStore.getState().setZoom(newZoom);
    if (!fabricCanvas) return;
    const centerX = fabricCanvas.width! / 2;
    const centerY = fabricCanvas.height! / 2;
    fabricCanvas.zoomToPoint({ x: centerX, y: centerY } as never, newZoom);
    fabricCanvas.renderAll();
  };

  const handleZoomIn = () => applyZoom(zoom + ZOOM_STEP);
  const handleZoomOut = () => applyZoom(zoom - ZOOM_STEP);

  const TOOLS_BY_WORKTABLE: Record<WorktableType, FloatingTool[]> = {
    quilt: quiltTools,
    block: BLOCK_TOOLS,
    image: [],
    print: [],
  };

  const tools = TOOLS_BY_WORKTABLE[activeWorktable];

  if (activeWorktable === 'print' || tools.length === 0) return null;

  // Split undo/redo from drawing tools for a visual separator
  const drawingTools = tools.filter((t) => t.id !== 'undo' && t.id !== 'redo');
  const historyTools = tools.filter((t) => t.id === 'undo' || t.id === 'redo');

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
      <div className="bg-surface/90 backdrop-blur-[24px] shadow-elevation-3 rounded-xl h-11 px-3 flex items-center gap-1 border border-outline-variant/10">
        {drawingTools.map((tool) => {
          const isActive = tool.toolType
            ? activeTool === tool.toolType
            : (tool.isActive?.() ?? false);

          return (
            <button
              key={tool.id}
              type="button"
              title={`${tool.label}${tool.shortcut ? ` (${tool.shortcut})` : ''}`}
              aria-label={tool.label}
              onClick={() => {
                if (tool.onClick) {
                  tool.onClick();
                } else if (tool.toolType) {
                  setActiveTool(tool.toolType);
                }
              }}
              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-150 ${
                isActive
                  ? 'bg-primary/20 text-primary ring-1 ring-primary/35'
                  : 'text-on-surface/65 hover:text-on-surface hover:bg-surface-container'
              }`}
            >
              {tool.icon}
            </button>
          );
        })}

        {/* Undo/Redo separator + buttons */}
        {historyTools.length > 0 && (
          <>
            <div className="w-px h-5 bg-outline-variant/25 mx-1" />
            {historyTools.map((tool) => {
              const disabled = tool.isDisabled ?? false;
              const showDepth = tool.id === 'undo' && undoDepth > 0;
              return (
                <button
                  key={tool.id}
                  type="button"
                  title={`${tool.label}${tool.shortcut ? ` (${tool.shortcut})` : ''}${tool.id === 'undo' && undoDepth > 0 ? ` · ${undoDepth} steps` : ''}`}
                  aria-label={tool.label}
                  aria-disabled={disabled}
                  onClick={disabled ? undefined : tool.onClick}
                  className={`relative w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-150 ${
                    disabled
                      ? 'text-outline-variant/45 cursor-default'
                      : 'text-on-surface/65 hover:text-on-surface hover:bg-surface-container'
                  }`}
                >
                  {tool.icon}
                  {showDepth && (
                    <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] bg-primary text-white text-[9px] font-semibold rounded-full flex items-center justify-center px-[3px] leading-none">
                      {undoDepth > 9 ? '9+' : undoDepth}
                    </span>
                  )}
                </button>
              );
            })}
          </>
        )}

        {/* Zoom controls */}
        <div className="w-px h-5 bg-outline-variant/25 mx-1" />
        <button
          type="button"
          title="Zoom Out"
          aria-label="Zoom Out"
          onClick={handleZoomOut}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface/65 hover:text-on-surface hover:bg-surface-container transition-all duration-150"
        >
          {ZOOM_OUT_ICON}
        </button>
        <span className="text-xs font-mono text-on-surface/50 min-w-[2.5rem] text-center select-none">
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          title="Zoom In"
          aria-label="Zoom In"
          onClick={handleZoomIn}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface/65 hover:text-on-surface hover:bg-surface-container transition-all duration-150"
        >
          {ZOOM_IN_ICON}
        </button>
      </div>
    </div>
  );
}
