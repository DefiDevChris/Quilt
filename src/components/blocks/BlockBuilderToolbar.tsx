'use client';

import { Separator } from '@/components/ui/Separator';

export type BlockBuilderMode = 'pencil' | 'rectangle' | 'circle' | 'bend';

interface BlockBuilderToolbarProps {
  activeMode: BlockBuilderMode;
  onModeChange: (mode: BlockBuilderMode) => void;
  segmentCount: number;
  onClear: () => void;
  onUndoSegment: () => void;
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      title={title}
      aria-pressed={active}
      aria-disabled={disabled}
      className={`w-[72px] flex flex-col items-center justify-center gap-1 transition-all duration-150 py-2 ${disabled
          ? 'text-on-surface/25 cursor-default'
          : active
            ? 'text-primary'
            : 'text-on-surface/60 hover:text-on-surface'
        }`}
    >
      <span aria-hidden="true" className="[&>svg]:w-7 [&>svg]:h-7">
        {children}
      </span>
      <span className="text-[11px] leading-tight text-center truncate w-full px-1 font-medium">
        {title}
      </span>
    </button>
  );
}

export function BlockBuilderToolbar({
  activeMode,
  onModeChange,
  segmentCount,
  onClear,
  onUndoSegment,
}: BlockBuilderToolbarProps) {
  return (
    <div className="space-y-1">
      {/* Shape tools */}
      <div className="flex flex-col gap-0.5">
        <ToolbarButton
          onClick={() => onModeChange('pencil')}
          active={activeMode === 'pencil'}
          title="Pencil"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M16.24 3.76a2.12 2.12 0 0 1 3 3l-9.9 9.9a2 2 0 0 1-.7.47L4.5 18.5l1.37-4.14a2 2 0 0 1 .47-.7l9.9-9.9Z"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </ToolbarButton>

        <ToolbarButton
          onClick={() => onModeChange('rectangle')}
          active={activeMode === 'rectangle'}
          title="Rectangle"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="5" width="18" height="14" rx="1" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </ToolbarButton>

        <ToolbarButton
          onClick={() => onModeChange('circle')}
          active={activeMode === 'circle'}
          title="Circle"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </ToolbarButton>

        <ToolbarButton
          onClick={() => onModeChange('bend')}
          active={activeMode === 'bend'}
          title="Bend"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 18C3 12 9 6 15 6C21 6 21 18 21 18"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
            <path
              d="M3 6L3 18"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
        </ToolbarButton>
      </div>

      <Separator />

      {/* Actions */}
      <div className="flex flex-col gap-0.5">
        <ToolbarButton
          onClick={onUndoSegment}
          disabled={segmentCount === 0}
          title="Undo"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 10H15C17.7614 10 20 12.2386 20 15C20 17.7614 17.7614 20 15 20H11"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M8 7L5 10L8 13"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </ToolbarButton>

        <ToolbarButton
          onClick={onClear}
          disabled={segmentCount === 0}
          title="Clear"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </ToolbarButton>
      </div>

      {/* Seam count */}
      <div className="text-center text-[10px] text-secondary font-mono tracking-tight bg-surface-container py-1 px-2 rounded">
        {segmentCount} {segmentCount === 1 ? 'seam' : 'seams'}
      </div>
    </div>
  );
}
