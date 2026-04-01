'use client';

import { useState } from 'react';
import { useCanvasStore, type ToolType } from '@/stores/canvasStore';
import { TooltipHint } from '@/components/ui/TooltipHint';
import { ToolDef, ToolIcon } from '@/components/ui/ToolIcon';
import { Separator } from '@/components/ui/Separator';
import { useQuiltTools, useBlockTools, type ToolbarCallbacks } from './ToolbarConfig';

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
        className="w-10 h-10 flex items-center justify-center rounded-lg transition-colors text-on-surface/50 hover:text-on-surface hover:bg-surface-container"
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

function renderToolGroup(
  tools: ToolDef[],
  activeTool: ToolType,
  setActiveTool: (tool: ToolType) => void,
  showSeparatorBefore: boolean
) {
  return (
    <div>
      {showSeparatorBefore && <Separator />}
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
  );
}

export function Toolbar({
  onOpenLayoutSettings,
  onOpenGridDimensions,
  onOpenSymmetry,
  onOpenImageExport,
  onOpenPhotoToPattern,
  onOpenResize,
}: ToolbarProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const activeTool = useCanvasStore((s) => s.activeTool);
  const setActiveTool = useCanvasStore((s) => s.setActiveTool);
  const activeWorktable = useCanvasStore((s) => s.activeWorktable);

  const callbacks: ToolbarCallbacks = {
    onOpenLayoutSettings,
    onOpenGridDimensions,
    onOpenSymmetry,
    onOpenImageExport,
    onOpenPhotoToPattern,
    onOpenResize,
  };

  const quiltTools = useQuiltTools(callbacks);
  const blockTools = useBlockTools();

  const TOOLS_MAP: Record<'quilt' | 'block', ToolDef[]> = {
    quilt: quiltTools,
    block: blockTools,
  };

  if (activeWorktable === 'print' || activeWorktable === 'image') return null;

  const tools = TOOLS_MAP[activeWorktable];

  // Split tools by tier (only quilt worktable uses tiers)
  const hasTiers = tools.some((t) => t.tier);

  if (!hasTiers) {
    // Block worktable: simple flat list
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
        className="bg-transparent flex items-start py-2"
      >
        <div className="flex flex-col items-center gap-0.5">
          {groups.map((group, groupIdx) =>
            renderToolGroup(group.items, activeTool, setActiveTool, groupIdx > 0)
          )}
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
      className="bg-transparent flex items-start py-2 h-full"
    >
      {/* Primary column */}
      <div className="flex flex-col items-center gap-0.5 h-full">
        <div className="flex flex-col items-center gap-0.5">
          {primaryGroups.map((group, idx) =>
            renderToolGroup(group.items, activeTool, setActiveTool, idx > 0)
          )}
        </div>

        {/* More tools toggle */}
        <Separator />
        <MoreToolsToggle isOpen={advancedOpen} onClick={() => setAdvancedOpen((o) => !o)} />

        {/* Spacer to push pinned to bottom */}
        <div className="flex-1" />

        {/* Pinned tools - always at bottom */}
        <Separator />
        <div className="flex flex-col items-center gap-0.5">
          {pinnedGroups.map((group, idx) =>
            renderToolGroup(group.items, activeTool, setActiveTool, idx > 0)
          )}
        </div>
      </div>

      {/* Advanced column - appears beside primary when expanded */}
      {advancedOpen && (
        <div className="flex flex-col items-center gap-0.5 border-l border-outline-variant/20 ml-0.5 pl-0.5 py-0">
          {advancedGroups.map((group, idx) =>
            renderToolGroup(group.items, activeTool, setActiveTool, idx > 0)
          )}
        </div>
      )}
    </nav>
  );
}
