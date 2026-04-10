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
      className={`w-[72px] flex flex-col items-center justify-center gap-1 transition-colors duration-150 py-2 ${disabled
          ? 'text-[#6b655e]/25 cursor-default'
          : isActive
            ? 'text-[#ff8d49]'
            : 'text-[#6b655e] hover:text-[#2d2a26]'
        }`}
    >
      <span aria-hidden="true" className="[&>svg]:w-7 [&>svg]:h-7">
        {tool.icon}
      </span>
      <span className="text-[14px] leading-[20px] text-center truncate w-full px-1">
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
