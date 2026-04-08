'use client';

type BuilderTool = 'select' | 'draw' | 'rectangle' | 'triangle' | 'pan';

interface LayoutBuilderToolbarProps {
  readonly activeTool: BuilderTool;
  readonly onToolChange: (tool: BuilderTool) => void;
}

const TOOLS: { id: BuilderTool; label: string; icon: React.ReactNode }[] = [
  {
    id: 'select',
    label: 'Select',
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <path d="M4 3L4 15L8 11L12 17L14 15.5L10 10L15 10L4 3Z" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'pan',
    label: 'Pan',
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <path d="M8 12V4C8 3.4 8.4 3 9 3C9.6 3 10 3.4 10 4V8H12V5C12 4.4 12.4 4 13 4C13.6 4 14 4.4 14 5V10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M14 10V6C14 5.4 14.4 5 15 5C15.6 5 16 5.4 16 6V12C16 14.2 14.2 16 12 16H8C4.7 16 2 13.3 2 10V8C2 7.4 2.4 7 3 7C3.6 7 4 7.4 4 8V10" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'draw',
    label: 'Draw',
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <path d="M13.5 3.5L16.5 6.5M3 17L4 13L13 4L16 7L7 16L3 17Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'rectangle',
    label: 'Rectangle',
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="5" width="14" height="10" rx="1" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
  },
  {
    id: 'triangle',
    label: 'Triangle',
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <path d="M10 3L17 16H3L10 3Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
    ),
  },
];

/**
 * Layout Builder Toolbar — left-side tool strip with select, pan, draw,
 * rectangle, and triangle tools.
 */
export function LayoutBuilderToolbar({ activeTool, onToolChange }: LayoutBuilderToolbarProps) {
  return (
    <div className="w-[88px] h-full flex-shrink-0 bg-white/60 backdrop-blur-xl border-r border-white/40 flex flex-col overflow-hidden">
      {/* Tools */}
      <div className="flex-1 p-2 grid grid-cols-2 gap-1.5 content-start overflow-y-auto">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            type="button"
            onClick={() => onToolChange(tool.id)}
            className={`flex flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-2 text-[10px] transition-all ${activeTool === tool.id
                ? 'bg-primary text-white shadow-elevation-1'
                : 'text-secondary hover:bg-surface-container hover:text-on-surface'
              }`}
            title={tool.label}
          >
            {tool.icon}
            <span className="leading-tight">{tool.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
