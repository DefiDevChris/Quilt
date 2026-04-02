'use client';

export type BlockBuilderMode = 'line' | 'arc' | 'select';

interface BlockBuilderToolbarProps {
  activeMode: BlockBuilderMode;
  onModeChange: (mode: BlockBuilderMode) => void;
  segmentCount: number;
  onClear: () => void;
  onUndoSegment: () => void;
}

const TOOLS: { id: BlockBuilderMode; label: string; icon: string }[] = [
  { id: 'select', label: 'Select', icon: '↖' },
  { id: 'line', label: 'Line', icon: '╱' },
  { id: 'arc', label: 'Arc', icon: '◠' },
];

export function BlockBuilderToolbar({
  activeMode,
  onModeChange,
  segmentCount,
  onClear,
  onUndoSegment,
}: BlockBuilderToolbarProps) {
  return (
    <div className="mb-2 flex items-center gap-1">
      {TOOLS.map((tool) => (
        <button
          key={tool.id}
          type="button"
          onClick={() => onModeChange(tool.id)}
          title={tool.label}
          className={`h-8 w-8 rounded text-sm ${
            activeMode === tool.id ? 'bg-primary text-white' : 'text-secondary hover:bg-background'
          }`}
        >
          {tool.icon}
        </button>
      ))}

      <div className="mx-1 h-5 w-px bg-outline-variant" />

      <button
        type="button"
        onClick={onUndoSegment}
        disabled={segmentCount === 0}
        title="Undo last segment"
        className="h-8 w-8 rounded text-sm text-secondary hover:bg-background disabled:opacity-30"
      >
        ↩
      </button>

      <button
        type="button"
        onClick={onClear}
        disabled={segmentCount === 0}
        title="Clear all segments"
        className="h-8 w-8 rounded text-sm text-secondary hover:bg-background disabled:opacity-30"
      >
        ✕
      </button>

      <span className="ml-auto text-xs text-secondary">
        {segmentCount} {segmentCount === 1 ? 'seam' : 'seams'}
      </span>
    </div>
  );
}
