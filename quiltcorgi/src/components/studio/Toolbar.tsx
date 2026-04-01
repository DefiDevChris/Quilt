'use client';

import { useState } from 'react';
import { useCanvasStore, type ToolType, type WorktableType } from '@/stores/canvasStore';
import { TooltipHint } from '@/components/ui/TooltipHint';
import { ToolDef, ToolIcon } from '@/components/ui/ToolIcon';
import { Separator } from '@/components/ui/Separator';
import { useQuiltTools, useBlockTools, useImageTools, type ToolbarCallbacks } from './ToolbarConfig';

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
        className="w-10 h-10 flex items-center justify-center rounded-full transition-colors text-secondary hover:text-on-surface"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          {isOpen ? (
            <path
              d="M6 12L10 8L14 12"
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
  const imageTools = useImageTools();

  const TOOLS_MAP: Record<Exclude<WorktableType, 'print'>, ToolDef[]> = {
    quilt: quiltTools,
    block: blockTools,
    image: imageTools,
  };

  if (activeWorktable === 'print') return null;

  const tools = TOOLS_MAP[activeWorktable];

  // Split tools by tier (only quilt worktable uses tiers)
  const hasTiers = tools.some((t) => t.tier);

  if (!hasTiers) {
    // Block/Image worktables: simple flat list
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
        {groups.map((group, groupIdx) =>
          renderToolGroup(group.items, activeTool, setActiveTool, groupIdx > 0)
        )}
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
      className="w-12 bg-transparent flex flex-col items-center py-2 gap-0.5 h-full"
    >
      {/* Primary tools - always visible */}
      <div className="flex flex-col items-center gap-0.5">
        {primaryGroups.map((group, idx) =>
          renderToolGroup(group.items, activeTool, setActiveTool, idx > 0)
        )}
      </div>

      {/* More tools toggle */}
      <Separator />
      <MoreToolsToggle isOpen={advancedOpen} onClick={() => setAdvancedOpen((o) => !o)} />

      {/* Advanced tools - expandable */}
      {advancedOpen && (
        <div className="flex flex-col items-center gap-0.5 overflow-y-auto max-h-[45vh] scrollbar-none">
          {advancedGroups.map((group, idx) =>
            renderToolGroup(group.items, activeTool, setActiveTool, idx > 0)
          )}
        </div>
      )}

      {/* Spacer to push pinned to bottom */}
      <div className="flex-1" />

      {/* Pinned tools - always at bottom */}
      <Separator />
      <div className="flex flex-col items-center gap-0.5">
        {pinnedGroups.map((group, idx) =>
          renderToolGroup(group.items, activeTool, setActiveTool, idx > 0)
        )}
      </div>
    </nav>
  );
}
