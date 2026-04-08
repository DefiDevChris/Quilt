'use client';

import { useCanvasStore, type ToolType } from '@/stores/canvasStore';
import { ToolDef } from '@/components/ui/ToolIcon';

export type LayoutCreatorTool = 'select' | 'rectangle' | 'triangle';

export interface LayoutCreatorCallbacks {
  onModeChange: (mode: LayoutCreatorTool) => void;
  onClearAll: () => void;
}

function useLayoutCreatorTools(callbacks: LayoutCreatorCallbacks): ToolDef[] {
  return [
    {
      id: 'select',
      label: 'Select',
      shortcut: 'V',
      toolType: 'select' as ToolType,
      group: 'tools',
      icon: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <path
            d="M5 4L5 20L10.5 14.5L15.5 22.5L18 21L13 13.5L20 13.5L5 4Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      ),
      onClick: () => callbacks.onModeChange('select'),
      isActive: () => useCanvasStore.getState().activeTool === ('select' as ToolType),
    },
    {
      id: 'rectangle',
      label: 'Rectangle',
      shortcut: 'R',
      toolType: 'rectangle' as ToolType,
      group: 'shapes',
      icon: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <rect x="4" y="7" width="20" height="14" rx="1" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      ),
      onClick: () => callbacks.onModeChange('rectangle'),
      isActive: () => useCanvasStore.getState().activeTool === ('rectangle' as ToolType),
    },
    {
      id: 'triangle',
      label: 'Triangle',
      shortcut: 'T',
      toolType: 'triangle' as ToolType,
      group: 'shapes',
      icon: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <path
            d="M14 5L24 22H4L14 5Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      ),
      onClick: () => callbacks.onModeChange('triangle'),
      isActive: () => useCanvasStore.getState().activeTool === ('triangle' as ToolType),
    },
    {
      id: 'clear',
      label: 'Clear All',
      group: 'actions',
      icon: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <path
            d="M7 7L21 21M21 7L7 21"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      ),
      onClick: callbacks.onClearAll,
    },
  ];
}

/**
 * Renders the layout creator toolbar using the shared ToolIcon pattern,
 * matching the quilt Toolbar's layout and styling.
 */
export function LayoutCreatorToolbarUnified({
  callbacks,
}: {
  callbacks: LayoutCreatorCallbacks;
}) {
  const tools = useLayoutCreatorTools(callbacks);

  // Group tools by group
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
      aria-label="Layout creator tools"
      className="flex flex-col py-2 h-full overflow-y-auto min-w-[88px] w-[88px] shrink-0"
    >
      <div className="flex flex-col items-center gap-0.5 px-1">
        {groups.map((group, groupIdx) => (
          <div key={group.name}>
            {groupIdx > 0 && <div className="my-1 w-full border-t border-outline-variant/15" />}
            <div className="flex flex-col items-center gap-0.5">
              {group.items.map((tool) => {
                const isActive = tool.isActive ? tool.isActive() : false;
                return (
                  <button
                    key={tool.id}
                    type="button"
                    title={tool.label}
                    aria-label={tool.label}
                    aria-pressed={isActive}
                    onClick={tool.onClick}
                    className={`w-[72px] flex flex-col items-center justify-center gap-1 transition-all duration-150 py-2 ${
                      isActive
                        ? 'text-primary'
                        : 'text-on-surface/60 hover:text-on-surface'
                    }`}
                  >
                    <span aria-hidden="true" className="[&>svg]:w-7 [&>svg]:h-7">
                      {tool.icon}
                    </span>
                    <span className="text-[11px] leading-tight text-center truncate w-full px-1 font-medium">
                      {tool.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </nav>
  );
}
