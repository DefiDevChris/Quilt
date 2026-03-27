'use client';

import { useCanvasStore, type WorktableType, type ToolType } from '@/stores/canvasStore';

interface FloatingTool {
  id: string;
  label: string;
  toolType?: ToolType;
  icon: React.ReactNode;
}

const QUILT_TOOLS: FloatingTool[] = [
  {
    id: 'select',
    label: 'Select',
    toolType: 'select',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path
          d="M5 3L5 17L9.5 12.5L13.5 19L15.5 18L11.5 11L17 11L5 3Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: 'pan',
    label: 'Pan',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path
          d="M11 3V19M3 11H19M11 3L8 6M11 3L14 6M11 19L8 16M11 19L14 16M3 11L6 8M3 11L6 14M19 11L16 8M19 11L16 14"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: 'cut',
    label: 'Cut',
    toolType: 'line',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="7" cy="16" r="2.5" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="15" cy="16" r="2.5" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M9 14L16 4M13 14L6 4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: 'curves',
    label: 'Curves',
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
    id: 'grid',
    label: 'Grid',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="3" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="13" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="3" y="13" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="13" y="13" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    id: 'sashing',
    label: 'Sashing',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="3" y="3" width="6" height="6" stroke="currentColor" strokeWidth="1.5" />
        <rect x="13" y="3" width="6" height="6" stroke="currentColor" strokeWidth="1.5" />
        <rect x="3" y="13" width="6" height="6" stroke="currentColor" strokeWidth="1.5" />
        <rect x="13" y="13" width="6" height="6" stroke="currentColor" strokeWidth="1.5" />
        <line x1="11" y1="3" x2="11" y2="19" stroke="currentColor" strokeWidth="1.5" />
        <line x1="3" y1="11" x2="19" y2="11" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    id: 'mirror',
    label: 'Mirror',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M11 3V19" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
        <path d="M6 7L3 11L6 15L9 11L6 7Z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M16 7L19 11L16 15L13 11L16 7Z" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    id: 'rotate',
    label: 'Rotate',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path
          d="M17 11C17 14.3137 14.3137 17 11 17C7.68629 17 5 14.3137 5 11C5 7.68629 7.68629 5 11 5C13.2 5 15.1 6.2 16.1 8"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M14 8H17V5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

const BLOCK_TOOLS: FloatingTool[] = [
  {
    id: 'select',
    label: 'Select',
    toolType: 'select',
    icon: QUILT_TOOLS[0].icon,
  },
  {
    id: 'pan',
    label: 'Pan',
    icon: QUILT_TOOLS[1].icon,
  },
  {
    id: 'edit-nodes',
    label: 'Edit Nodes',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="5" cy="5" r="2" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="17" cy="5" r="2" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="11" cy="17" r="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 5H15M5 7L11 15M17 7L11 15" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    id: 'snap',
    label: 'Snap',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path
          d="M11 3V7M11 15V19M3 11H7M15 11H19"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="11" cy="11" r="3" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    id: 'trace',
    label: 'Trace',
    toolType: 'line',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M4 18L18 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="4" cy="18" r="2" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="18" cy="4" r="2" stroke="currentColor" strokeWidth="1.5" />
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
];

const IMAGE_TOOLS: FloatingTool[] = [
  {
    id: 'select',
    label: 'Select',
    toolType: 'select',
    icon: QUILT_TOOLS[0].icon,
  },
  {
    id: 'pan',
    label: 'Pan',
    icon: QUILT_TOOLS[1].icon,
  },
  {
    id: 'crop',
    label: 'Crop',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M6 2V16H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M16 20V6H2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'straighten',
    label: 'Straighten',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M4 18L18 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path
          d="M4 11H18"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="2 2"
        />
      </svg>
    ),
  },
];

const TOOLS_BY_WORKTABLE: Record<WorktableType, FloatingTool[]> = {
  quilt: QUILT_TOOLS,
  block: BLOCK_TOOLS,
  image: IMAGE_TOOLS,
  print: [],
};

export function FloatingToolbar() {
  const activeWorktable = useCanvasStore((s) => s.activeWorktable);
  const activeTool = useCanvasStore((s) => s.activeTool);
  const setActiveTool = useCanvasStore((s) => s.setActiveTool);

  const tools = TOOLS_BY_WORKTABLE[activeWorktable];

  if (activeWorktable === 'print' || tools.length === 0) return null;

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
      <div className="bg-surface/95 backdrop-blur-[20px] shadow-elevation-3 rounded-xl h-12 px-[1.75rem] py-[0.7rem] flex items-center gap-[1.75rem]">
        {tools.map((tool) => {
          const isActive = tool.toolType ? activeTool === tool.toolType : false;

          return (
            <button
              key={tool.id}
              type="button"
              title={tool.label}
              aria-label={tool.label}
              onClick={() => {
                if (tool.toolType) {
                  setActiveTool(tool.toolType);
                }
              }}
              className={`flex items-center justify-center transition-colors ${
                isActive ? 'text-primary' : 'text-secondary hover:text-on-surface'
              }`}
            >
              {tool.icon}
            </button>
          );
        })}
      </div>
    </div>
  );
}
