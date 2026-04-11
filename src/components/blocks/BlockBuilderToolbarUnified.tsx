'use client';

import { useCanvasStore, type ToolType } from '@/stores/canvasStore';
import { ToolDef } from '@/components/ui/ToolIcon';
import type { BlockBuilderMode } from '@/components/studio/BlockBuilderWorktable';

export interface BlockBuilderCallbacks {
  onModeChange: (mode: BlockBuilderMode) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function useBlockBuilderTools(callbacks: BlockBuilderCallbacks): ToolDef[] {
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
      id: 'pencil',
      label: 'Pencil',
      shortcut: 'P',
      toolType: 'easydraw' as ToolType,
      group: 'drawing',
      icon: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <path
            d="M18.5 4.5L23.5 9.5L8 25H3V20L18.5 4.5Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      ),
      onClick: () => callbacks.onModeChange('pencil'),
      isActive: () => useCanvasStore.getState().activeTool === ('easydraw' as ToolType),
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
          <polygon points="14,4 4,24 24,24" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
        </svg>
      ),
      onClick: () => callbacks.onModeChange('triangle'),
      isActive: () => useCanvasStore.getState().activeTool === ('triangle' as ToolType),
    },
    {
      id: 'circle',
      label: 'Circle',
      shortcut: 'C',
      toolType: 'circle' as ToolType,
      group: 'shapes',
      icon: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <circle cx="14" cy="14" r="9" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      ),
      onClick: () => callbacks.onModeChange('circle'),
      isActive: () => useCanvasStore.getState().activeTool === ('circle' as ToolType),
    },
    {
      id: 'bend',
      label: 'Bend',
      shortcut: 'B',
      toolType: 'bend' as ToolType,
      group: 'drawing',
      icon: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <path
            d="M4 20C4 20 8 6 14 6C20 6 24 20 24 20"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      ),
      onClick: () => callbacks.onModeChange('bend'),
      isActive: () => useCanvasStore.getState().activeTool === ('bend' as ToolType),
    },
    {
      id: 'undo',
      label: 'Undo',
      shortcut: 'Ctrl+Z',
      group: 'history',
      isDisabled: !callbacks.canUndo,
      icon: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <path
            d="M6 11H17C19.7614 11 22 13.2386 22 16C22 18.7614 19.7614 21 17 21H13"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M11 7L6 11L11 15"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      onClick: callbacks.onUndo,
    },
    {
      id: 'redo',
      label: 'Redo',
      shortcut: 'Ctrl+Shift+Z',
      group: 'history',
      isDisabled: !callbacks.canRedo,
      icon: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <path
            d="M22 11H11C8.23858 11 6 13.2386 6 16C6 18.7614 8.23858 21 11 21H15"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M17 7L22 11L17 15"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      onClick: callbacks.onRedo,
    },
    {
      id: 'clear',
      label: 'Clear',
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
      onClick: callbacks.onClear,
    },
  ];
}

/**
 * Renders the block builder toolbar using the shared ToolIcon pattern,
 * matching the quilt Toolbar's layout and styling.
 */
export function BlockBuilderToolbarUnified({
  callbacks,
  segmentCount,
}: {
  callbacks: BlockBuilderCallbacks;
  segmentCount: number;
}) {
  const tools = useBlockBuilderTools(callbacks);

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
      aria-label="Block builder tools"
      className="flex flex-col py-2 h-full overflow-y-auto min-w-[88px] w-[88px] shrink-0"
    >
      <div className="flex flex-col items-center gap-0.5 px-1">
        {groups.map((group, groupIdx) => (
          <div key={group.name}>
            {groupIdx > 0 && <div className="my-1 w-full border-t border-[#e8e1da]/15" />}
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
                    aria-disabled={tool.isDisabled ?? false}
                    onClick={tool.isDisabled ? undefined : tool.onClick}
                    className={`w-[72px] flex flex-col items-center justify-center gap-1 transition-colors duration-150 py-2 ${tool.isDisabled
                      ? 'text-[#6b655e]/25 cursor-default'
                      : isActive
                        ? 'text-[#ff8d49]'
                        : 'text-[#6b655e] hover:text-[#2d2a26]'
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

      {/* Seam count badge */}
      <div className="mt-auto px-2 pb-2">
        <div className="w-full rounded-lg bg-[#fdfaf7] px-2 py-1 text-[10px] font-mono text-[#6b655e] text-center">
          {segmentCount} seam{segmentCount !== 1 ? 's' : ''}
        </div>
      </div>
    </nav>
  );
}
