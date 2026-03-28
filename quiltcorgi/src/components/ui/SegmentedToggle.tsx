'use client';

interface SegmentOption {
  value: string;
  label: string;
}

interface SegmentedToggleProps {
  options: readonly SegmentOption[];
  value: string;
  onChange: (value: string) => void;
}

export function SegmentedToggle({ options, value, onChange }: SegmentedToggleProps) {
  return (
    <div
      className="inline-flex rounded-lg p-1"
      style={{ background: 'var(--glass-warm)', backdropFilter: 'blur(12px)' }}
      role="group"
    >
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => {
              if (!isActive) onChange(option.value);
            }}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
              isActive
                ? 'bg-surface text-on-surface shadow-elevation-1'
                : 'text-secondary hover:text-on-surface'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
