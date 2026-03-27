'use client';

import { useCanvasStore, type ToolType, type WorktableType } from '@/stores/canvasStore';
import { useBlockStore } from '@/stores/blockStore';
import { useFabricStore } from '@/stores/fabricStore';
import { useLayoutStore } from '@/stores/layoutStore';
import { useYardageStore } from '@/stores/yardageStore';
import { usePrintlistStore } from '@/stores/printlistStore';
import { TooltipHint } from '@/components/ui/TooltipHint';

interface ToolDef {
  id: string;
  label: string;
  shortcut?: string;
  description?: string;
  isProFeature?: boolean;
  toolType?: ToolType;
  group?: string;
  icon: React.ReactNode;
  onClick?: () => void;
  isActive?: () => boolean;
  dataTour?: string;
}

function ToolIcon({
  tool,
  onClick,
  isActive,
}: {
  tool: ToolDef;
  activeTool: ToolType;
  onClick: () => void;
  isActive: boolean;
}) {
  const button = (
    <button
      type="button"
      title={tool.label}
      aria-label={tool.label}
      aria-pressed={isActive}
      onClick={onClick}
      className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
        isActive ? 'bg-primary-container/30 text-primary' : 'text-secondary hover:text-on-surface'
      }`}
    >
      {tool.icon}
    </button>
  );

  if (tool.description) {
    return (
      <div {...(tool.dataTour ? { 'data-tour': tool.dataTour } : {})}>
        <TooltipHint
          name={tool.label}
          shortcut={tool.shortcut}
          description={tool.description}
          isProFeature={tool.isProFeature}
        >
          {button}
        </TooltipHint>
      </div>
    );
  }

  return (
    <div
      className="relative flex items-center justify-center"
      {...(tool.dataTour ? { 'data-tour': tool.dataTour } : {})}
    >
      {button}
    </div>
  );
}

function Separator() {
  return <div className="w-6 h-px bg-outline-variant/10 mx-auto my-1" />;
}

// --- Tool definitions per worktable ---

function useQuiltTools(callbacks: ToolbarCallbacks): ToolDef[] {
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

  return [
    // Drawing tools
    {
      id: 'select',
      label: 'Select',
      shortcut: 'V',
      description: 'Click to select and move objects on the canvas',
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
      description: 'Click and drag to draw a rectangle shape',
      toolType: 'rectangle',
      group: 'tools',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="3" y="5" width="14" height="10" rx="1" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      ),
    },
    {
      id: 'triangle',
      label: 'Triangle',
      shortcut: 'T',
      description: 'Click and drag to draw a triangle shape',
      toolType: 'triangle',
      group: 'tools',
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
      id: 'polygon',
      label: 'Polygon',
      shortcut: 'P',
      description: 'Click and drag to draw a polygon with adjustable sides',
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
      id: 'line',
      label: 'Line',
      shortcut: 'L',
      description: 'Click and drag to draw a straight line',
      toolType: 'line',
      group: 'tools',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M4 16L16 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: 'curve',
      label: 'Bezier Curve',
      shortcut: 'C',
      description: 'Click to place control points for smooth curves',
      toolType: 'curve',
      group: 'tools',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M4 14C4 14 6 4 10 4C14 4 16 14 16 14"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      id: 'text',
      label: 'Text',
      shortcut: 'X',
      description: 'Click to place a text label on the canvas',
      toolType: 'text',
      group: 'tools',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M5 5H15M10 5V16M7 5V4M13 5V4"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    // Library
    {
      id: 'blocks',
      label: 'Block Library',
      shortcut: 'B',
      description: 'Browse and drag quilt blocks onto your canvas',
      group: 'library',
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
      description: 'Upload fabrics and drag them onto patches',
      group: 'library',
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
    // Layout
    {
      id: 'layout',
      label: 'Layout Settings',
      description: 'Configure grid, sashing, and quilt layout options',
      group: 'layout',
      onClick: callbacks.onOpenLayoutSettings,
      isActive: () => layoutType !== 'free-form',
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
    // Generate
    {
      id: 'symmetry',
      label: 'Symmetry Tool',
      description: 'Mirror your design with vertical, horizontal, or radial symmetry',
      group: 'generate',
      onClick: callbacks.onOpenSymmetry,
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 3V17" stroke="currentColor" strokeWidth="1.4" strokeDasharray="2 2" />
          <path
            d="M6 7L3 10L6 13"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M14 7L17 10L14 13"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      id: 'serendipity',
      label: 'Serendipity Generator',
      description: 'Randomly shuffle fabric assignments for unexpected combinations',
      group: 'generate',
      onClick: callbacks.onOpenSerendipity,
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="2" stroke="currentColor" strokeWidth="1.4" />
          <circle cx="10" cy="4" r="1.5" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="10" cy="16" r="1.5" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="4" cy="10" r="1.5" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="16" cy="10" r="1.5" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      ),
    },
    // Photo
    {
      id: 'photo-patchwork',
      label: 'Photo Patchwork',
      description: 'Convert a photo into a patchwork quilt pattern',
      group: 'photo',
      onClick: callbacks.onOpenPhotoPatchwork,
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
      id: 'quilt-ocr',
      label: 'Import from Photo',
      description: 'Analyze a photo of a quilt and recreate the pattern digitally',
      isProFeature: true,
      group: 'photo',
      onClick: callbacks.onOpenQuiltOcr,
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M3 7V4C3 3.44772 3.44772 3 4 3H7M13 3H16C16.5523 3 17 3.44772 17 4V7M17 13V16C17 16.5523 16.5523 17 16 17H13M7 17H4C3.44772 17 3 16.5523 3 16V13"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <path
            d="M7 10L9 12L13 8"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    // Measure
    {
      id: 'yardage',
      label: 'Yardage Estimator',
      description: 'Calculate fabric yardage needed for your design',
      group: 'measure',
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
      id: 'calculator',
      label: 'Fraction Calculator',
      description: 'Calculate fractions for precise quilt measurements',
      group: 'measure',
      onClick: callbacks.onOpenCalculator,
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect
            x="4"
            y="3"
            width="12"
            height="14"
            rx="1.5"
            stroke="currentColor"
            strokeWidth="1.4"
          />
          <path
            d="M7 7H13M7 10H13M7 13H10"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    // Export
    {
      id: 'printlist',
      label: 'Printlist',
      description: 'Review and print your quilt project materials list',
      group: 'export',
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
      description: 'Save your design as a high-resolution PNG or JPEG',
      group: 'export',
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
    // History
    {
      id: 'undo',
      label: 'Undo',
      shortcut: 'Ctrl+Z',
      description: 'Undo the last action',
      group: 'history',
      onClick: () => {
        if (canUndo) {
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true }));
        }
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
      onClick: () => {
        if (canRedo) {
          document.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, shiftKey: true })
          );
        }
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

function useBlockTools(): ToolDef[] {
  return [
    {
      id: 'select',
      label: 'Select (V)',
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
      label: 'Line (L)',
      toolType: 'line',
      group: 'tools',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M4 16L16 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: 'curve',
      label: 'Bezier Curve (C)',
      toolType: 'curve',
      group: 'tools',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M4 14C4 14 6 4 10 4C14 4 16 14 16 14"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      id: 'rectangle',
      label: 'Rectangle (R)',
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
      label: 'Polygon (P)',
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
  ];
}

function useImageTools(): ToolDef[] {
  return [
    {
      id: 'select',
      label: 'Select (V)',
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
      id: 'crop',
      label: 'Crop',
      group: 'tools',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M5 2V14H18" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M15 18V6H2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: 'rotate',
      label: 'Rotate',
      group: 'tools',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M15 10C15 12.7614 12.7614 15 10 15C7.23858 15 5 12.7614 5 10C5 7.23858 7.23858 5 10 5C11.8 5 13.4 6 14.2 7.5"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <path
            d="M12 7.5H15V4.5"
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

interface ToolbarCallbacks {
  onOpenLayoutSettings?: () => void;
  onOpenSymmetry?: () => void;
  onOpenSerendipity?: () => void;
  onOpenCalculator?: () => void;
  onOpenImageExport?: () => void;
  onOpenPhotoPatchwork?: () => void;
  onOpenQuiltOcr?: () => void;
}

interface ToolbarProps extends ToolbarCallbacks {}

export function Toolbar({
  onOpenLayoutSettings,
  onOpenSymmetry,
  onOpenSerendipity,
  onOpenCalculator,
  onOpenImageExport,
  onOpenPhotoPatchwork,
  onOpenQuiltOcr,
}: ToolbarProps) {
  const activeTool = useCanvasStore((s) => s.activeTool);
  const setActiveTool = useCanvasStore((s) => s.setActiveTool);
  const activeWorktable = useCanvasStore((s) => s.activeWorktable);

  const callbacks: ToolbarCallbacks = {
    onOpenLayoutSettings,
    onOpenSymmetry,
    onOpenSerendipity,
    onOpenCalculator,
    onOpenImageExport,
    onOpenPhotoPatchwork,
    onOpenQuiltOcr,
  };

  const quiltTools = useQuiltTools(callbacks);
  const blockTools = useBlockTools();
  const imageTools = useImageTools();

  const TOOLS_MAP: Record<Exclude<WorktableType, 'print'>, ToolDef[]> = {
    quilt: quiltTools,
    block: blockTools,
    image: imageTools,
  };

  if (activeWorktable === 'print') return null;

  const tools = TOOLS_MAP[activeWorktable];

  // Group tools by their group
  const groups: { name: string; items: ToolDef[] }[] = [];
  let currentGroup = '';
  for (const tool of tools) {
    const group = tool.group ?? 'default';
    if (group !== currentGroup) {
      groups.push({ name: group, items: [tool] });
      currentGroup = group;
    } else {
      groups[groups.length - 1].items.push(tool);
    }
  }

  return (
    <nav
      aria-label="Design tools"
      data-tour="toolbar"
      className="w-12 bg-transparent flex flex-col items-center py-2 gap-0.5"
    >
      {groups.map((group, groupIdx) => (
        <div key={group.name}>
          {groupIdx > 0 && <Separator />}
          {group.items.map((tool) => {
            const isActive = tool.toolType
              ? activeTool === tool.toolType
              : tool.isActive
                ? tool.isActive()
                : false;

            return (
              <ToolIcon
                key={tool.id}
                tool={tool}
                activeTool={activeTool}
                isActive={isActive}
                onClick={() => {
                  if (tool.onClick) {
                    tool.onClick();
                  } else if (tool.toolType) {
                    setActiveTool(tool.toolType);
                  }
                }}
              />
            );
          })}
        </div>
      ))}
    </nav>
  );
}
