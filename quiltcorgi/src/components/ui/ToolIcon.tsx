import { ToolType } from '@/stores/canvasStore';
import { TooltipHint } from '@/components/ui/TooltipHint';

export interface ToolDef {
  id: string;
  label: string;
  shortcut?: string;
  description?: string;
  isProFeature?: boolean;
  mascot?: string;
  toolType?: ToolType;
  group?: string;
  icon: React.ReactNode;
  onClick?: () => void;
  isActive?: () => boolean;
  isDisabled?: boolean;
  dataTour?: string;
  tier?: 'primary' | 'advanced' | 'pinned';
}

export function ToolIcon({
  tool,
  onClick,
  isActive,
}: {
  tool: ToolDef;
  onClick: () => void;
  isActive: boolean;
}) {
  const disabled = tool.isDisabled ?? false;

  const button = (
    <button
      type="button"
      title={tool.label}
      aria-label={tool.label}
      aria-pressed={isActive}
      aria-disabled={disabled}
      onClick={disabled ? undefined : onClick}
      className={`w-11 flex flex-col items-center justify-center gap-0.5 rounded-lg transition-all duration-150 py-1 ${
        disabled
          ? 'text-outline-variant/30 cursor-default'
          : isActive
            ? 'bg-primary/12 text-primary ring-1 ring-primary/20'
            : 'text-on-surface/60 hover:text-on-surface hover:bg-surface-container'
      }`}
    >
      <span aria-hidden="true" className="[&>svg]:w-5 [&>svg]:h-5">
        {tool.icon}
      </span>
      <span className="text-[9px] leading-tight text-center truncate w-full px-0.5">
        {tool.label}
      </span>
    </button>
  );

  if (tool.description) {
    return (
      <div className="my-1" {...(tool.dataTour ? { 'data-tour': tool.dataTour } : {})}>
        <TooltipHint
          name={tool.label}
          shortcut={tool.shortcut}
          description={tool.description}
          isProFeature={tool.isProFeature}
          mascot={tool.mascot}
        >
          {button}
        </TooltipHint>
      </div>
    );
  }

  return (
    <div
      className="relative flex items-center justify-center my-1"
      {...(tool.dataTour ? { 'data-tour': tool.dataTour } : {})}
    >
      {button}
    </div>
  );
}
