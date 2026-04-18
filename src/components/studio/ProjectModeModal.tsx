'use client';

interface ProjectModeModalProps {
  readonly open: boolean;
  readonly onSelect: (mode: 'template' | 'layout' | 'free-form') => void;
}

const MODES = [
  { id: 'template' as const, name: 'Start from Template', icon: '🎨', description: 'Start with a fully designed quilt and tweak it' },
  { id: 'layout' as const, name: 'Start with Layout', icon: '📐', description: 'Start with a grid or shape layout, then fill in' },
  { id: 'free-form' as const, name: 'Start Free-form', icon: '📏', description: 'Start with blank canvas and draw or place blocks anywhere' },
];

export function ProjectModeModal({ open, onSelect }: ProjectModeModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-elevation-4 w-full max-w-3xl p-8">
        <h2 className="text-2xl font-semibold text-[var(--color-text)] mb-6 text-center">
          How would you like to start?
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => onSelect(mode.id)}
              className="flex flex-col items-center gap-4 rounded-xl border-2 border-[var(--color-border)]/20 bg-white p-6 text-center transition-all hover:border-primary hover:shadow-elevation-2"
            >
              <span className="text-5xl">{mode.icon}</span>
              <div>
                <h3 className="text-base font-semibold text-[var(--color-text)] mb-2">{mode.name}</h3>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{mode.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
