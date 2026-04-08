'use client';

import { useState } from 'react';
import { useCanvasStore, type ToolType } from '@/stores/canvasStore';
import { TooltipHint } from '@/components/ui/TooltipHint';
import { ToolDef, ToolIcon } from '@/components/ui/ToolIcon';
import { Separator } from '@/components/ui/Separator';
import {
  useQuiltTools,
  useBlockTools,
  useLayoutCreatorTools,
  type ToolbarCallbacks,
} from './ToolbarConfig';

type ToolbarProps = ToolbarCallbacks;

function MoreToolsToggle({ isOpen, onClick }: { isOpen: boolean; onClick: () => void }) {
  return (
    <TooltipHint
      name={isOpen ? 'Fewer Tools' : 'More Tools'}
      description={isOpen ? 'Collapse advanced tools' : 'Show additional tools'}
    >
      <button
        type="button"
        aria-label={isOpen ? 'Collapse advanced tools' : 'Expand advanced tools'}
        aria-expanded={isOpen}
        onClick={onClick}
        className="w-full h-10 flex items-center justify-center rounded-lg text-on-surface/50 hover:bg-surface-container transition-colors"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          {isOpen ? (
            <path
              d="M12 6L8 10L12 14"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : (
            <>
              <circle cx="10" cy="5" r="1.5" fill="currentColor" />
              <circle cx="10" cy="10" r="1.5" fill="currentColor" />
              <circle cx="10" cy="15" r="1.5" fill="currentColor" />
            </>
          )}
        </svg>
      </button>
    </TooltipHint>
  );
}

const GROUP_LABELS: Record<string, string> = {
  tools: 'Tools',
  create: '',
  layout: 'Layout',
  shapes: 'Shapes',
  drawing: 'Drawing',
  canvas: 'Canvas',
  history: '',
  actions: '',
  default: '',
};

function renderToolGroup(
  tools: ToolDef[],
  activeTool: ToolType,
  setActiveTool: (tool: ToolType) => void,
  showSeparatorBefore: boolean,
  groupName: string,
  groupIdx: number
) {
  const label = groupName ? (GROUP_LABELS[groupName] ?? '') : '';
  return (
    <div key={`${groupName}-${groupIdx}`}>
      {showSeparatorBefore && <Separator />}
      {label && (
        <div className="text-[10px] font-semibold uppercase tracking-wider text-on-surface/35 px-1 pt-1.5 pb-0.5 text-center">
          {label}
        </div>
      )}
      <div className="grid grid-cols-1 gap-1">
        {tools.map((tool) => {
          const isActive = tool.toolType
            ? activeTool === tool.toolType
            : tool.isActive
              ? tool.isActive()
              : false;
          return (
            <ToolIcon
              key={tool.id}
              tool={tool}
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
    </div>
  );
}

export function Toolbar({
  onOpenLayoutSettings,
  onOpenGridDimensions,
  onOpenImageExport,
  onOpenPhotoToDesign,
  onOpenResize,
  onOpenReferenceImage,
  onOpenLayoutOverlay,
  onSaveBlock,
  onNewBlock,
}: ToolbarProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const activeTool = useCanvasStore((s) => s.activeTool);
  const setActiveTool = useCanvasStore((s) => s.setActiveTool);
  const activeWorktable = useCanvasStore((s) => s.activeWorktable);

  const callbacks: ToolbarCallbacks = {
    onOpenLayoutSettings,
    onOpenGridDimensions,
    onOpenImageExport,
    onOpenPhotoToDesign,
    onOpenResize,
    onOpenReferenceImage,
    onOpenLayoutOverlay,
    onSaveBlock,
    onNewBlock,
  };

  const quiltTools = useQuiltTools(callbacks);
  const blockTools = useBlockTools({ onOpenGridDimensions, onSaveBlock, onNewBlock });
  const layoutTools = useLayoutCreatorTools({ onOpenGridDimensions, onSaveBlock, onNewBlock });

  if (activeWorktable === 'print' || activeWorktable === 'image') return null;

  const TOOLS_MAP: Record<'quilt' | 'block' | 'layout-builder' | 'block-builder', ToolDef[]> = {
    quilt: quiltTools,
    block: blockTools,
    'layout-builder': [],
    'block-builder': [],
  };

  const tools = TOOLS_MAP[activeWorktable];

  // Split tools by tier (only quilt worktable uses tiers)
  const hasTiers = tools.some((t) => t.tier);

  if (!hasTiers) {
    // Block worktable: single-column flat list
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
        className="bg-surface border-r border-outline-variant/15 flex flex-col py-2 h-full overflow-y-auto min-w-[88px] w-[88px] shrink-0"
      >
        <div className="flex flex-col items-center gap-0.5 px-1">
          {groups.map((group, groupIdx) => {
            const label = GROUP_LABELS[group.name] ?? '';
            return (
              <div key={group.name}>
                {groupIdx > 0 && <Separator />}
                {label && (
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-on-surface/35 px-1 pt-1.5 pb-0.5 text-center">
                    {label}
                  </div>
                )}
                <div className="flex flex-col items-center gap-0.5">
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
              </div>
            );
          })}
        </div>
      </nav>
    );
  }

  // Quilt worktable: primary / advanced / pinned layout
  const primaryTools = tools.filter((t) => t.tier === 'primary');
  const advancedTools = tools.filter((t) => t.tier === 'advanced');
  const pinnedTools = tools.filter((t) => t.tier === 'pinned');

  // Group each tier by group
  function groupTools(list: ToolDef[]): { name: string; items: ToolDef[] }[] {
    const groups: { name: string; items: ToolDef[] }[] = [];
    let current = '';
    for (const tool of list) {
      const group = tool.group ?? 'default';
      if (group !== current) {
        groups.push({ name: group, items: [tool] });
        current = group;
      } else {
        groups[groups.length - 1].items.push(tool);
      }
    }
    return groups;
  }

  const primaryGroups = groupTools(primaryTools);
  const advancedGroups = groupTools(advancedTools);
  const pinnedGroups = groupTools(pinnedTools);

  return (
    <nav
      aria-label="Design tools"
      data-tour="toolbar"
      className="bg-surface border-r border-outline-variant/15 flex flex-col py-2 h-full overflow-y-auto min-w-[88px] w-[88px] shrink-0"
    >
      {/* Main tools column - single column */}
      <div className="flex flex-col items-center gap-1 h-full px-1">
        {primaryGroups.map((group, idx) =>
          renderToolGroup(group.items, activeTool, setActiveTool, idx > 0, group.name, idx)
        )}

        {/* More tools toggle */}
        <Separator />
        <div className="w-full px-1">
          <MoreToolsToggle isOpen={advancedOpen} onClick={() => setAdvancedOpen((o) => !o)} />
        </div>

        {/* Advanced tools - inline below toggle when expanded */}
        {advancedOpen && (
          <>
            <Separator />
            {advancedGroups.map((group, idx) =>
              renderToolGroup(group.items, activeTool, setActiveTool, idx > 0, group.name, idx)
            )}
          </>
        )}

        {/* Spacer to push pinned to bottom */}
        <div className="flex-1" />

        {/* Pinned tools - always at bottom */}
        <Separator />
        {pinnedGroups.map((group, idx) =>
          renderToolGroup(group.items, activeTool, setActiveTool, idx > 0, group.name, idx)
        )}
      </div>
    </nav>
  );
}
