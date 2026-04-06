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
      className={`w-[72px] flex flex-col items-center justify-center gap-1 transition-all duration-150 py-2 ${
        disabled
          ? 'text-on-surface/25 cursor-default'
          : isActive
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
