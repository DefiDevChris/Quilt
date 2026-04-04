'use client';

import { useCanvasStore } from '@/stores/canvasStore';
import { useLayoutStore } from '@/stores/layoutStore';

const PRESET_BACKGROUNDS = [
  { color: '#F5F5F0', label: 'Neutral Cream' },
  { color: '#FFFFFF', label: 'White' },
  { color: '#F0EAE0', label: 'Warm Beige' },
  { color: '#E8E4DC', label: 'Light Gray' },
];

export function BackgroundColorControl() {
  const layoutType = useLayoutStore((s) => s.layoutType);
  const backgroundColor = useCanvasStore((s) => s.backgroundColor);
  const setBackgroundColor = useCanvasStore((s) => s.setBackgroundColor);

  // Only show in No Layout mode
  if (layoutType !== 'none') return null;

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-surface-container rounded-lg border border-outline-variant/20">
      <span className="text-xs text-secondary font-medium">Background:</span>
      <div className="flex gap-1">
        {PRESET_BACKGROUNDS.map((preset) => (
          <button
            key={preset.color}
            type="button"
            onClick={() => setBackgroundColor(preset.color)}
            title={preset.label}
            className={`w-6 h-6 rounded border-2 transition-all ${
              backgroundColor === preset.color
                ? 'border-primary scale-110'
                : 'border-outline-variant hover:border-primary-container'
            }`}
            style={{ backgroundColor: preset.color }}
          />
        ))}
        <input
          type="color"
          value={backgroundColor}
          onChange={(e) => setBackgroundColor(e.target.value)}
          title="Custom color"
          className="w-6 h-6 rounded border-2 border-outline-variant hover:border-primary-container cursor-pointer"
        />
      </div>
    </div>
  );
}
