'use client';

import { useCanvasStore, type ToolType } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';
import { TooltipHint } from '@/components/ui/TooltipHint';
import { ToolDef, ToolIcon } from '@/components/ui/ToolIcon';
import { Separator } from '@/components/ui/Separator';
import { useQuiltTools, type ToolbarCallbacks } from './ToolbarConfig';

type ToolbarProps = ToolbarCallbacks;

const GROUP_LABELS: Record<string, string> = {
  tools: '',
  shapes: '',
  history: '',
  zoom: '',
  default: '',
};

export function Toolbar({ onOpenImageExport, onSaveBlock, onNewBlock }: ToolbarProps) {
  const activeTool = useCanvasStore((s) => s.activeTool);
  const setActiveTool = useCanvasStore((s) => s.setActiveTool);
  const activeWorktable = useCanvasStore((s) => s.activeWorktable);
  const projectMode = useProjectStore((s) => s.mode);

  const callbacks: ToolbarCallbacks = {
    onOpenImageExport,
    onSaveBlock,
    onNewBlock,
  };

  const tools = useQuiltTools(callbacks);

  const shouldRender = activeWorktable === 'quilt' && projectMode === 'free-form';

  if (!shouldRender) return null;

  // Group tools by group name
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
      className="bg-[var(--color-bg)] border-r border-[var(--color-border)]/15 flex flex-col py-2 h-full overflow-y-auto min-w-[88px] w-[88px] shrink-0"
    >
      <div className="flex flex-col items-center gap-0.5 px-1">
        {groups.map((group, groupIdx) => (
          <div key={group.name}>
            {groupIdx > 0 && <Separator />}
            <div className="flex flex-col items-center gap-0.5 py-0.5">
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
        ))}
      </div>
    </nav>
  );
}
