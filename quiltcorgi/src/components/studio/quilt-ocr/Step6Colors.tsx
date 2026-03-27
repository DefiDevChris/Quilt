'use client';

import type { StepProps } from '@/types/wizard';
import type { OcrWizardData } from '@/components/studio/QuiltPhotoImportWizard';

export function Step6Colors({ data }: StepProps<OcrWizardData>) {
  const { colors } = data;

  if (colors.length === 0) {
    return (
      <div className="py-8 text-center text-secondary">
        No color data extracted.
      </div>
    );
  }

  // Aggregate all unique colors across blocks
  const colorMap = new Map<string, { hex: string; totalPercentage: number; blockCount: number }>();
  for (const blockColor of colors) {
    for (const color of blockColor.dominantColors) {
      const existing = colorMap.get(color.hex);
      if (existing) {
        colorMap.set(color.hex, {
          ...existing,
          totalPercentage: existing.totalPercentage + color.percentage,
          blockCount: existing.blockCount + 1,
        });
      } else {
        colorMap.set(color.hex, {
          hex: color.hex,
          totalPercentage: color.percentage,
          blockCount: 1,
        });
      }
    }
  }

  const sortedColors = [...colorMap.values()].sort(
    (a, b) => b.totalPercentage - a.totalPercentage
  );

  return (
    <div className="space-y-4">
      <p className="text-body-sm text-secondary">
        {sortedColors.length} unique colors detected across {colors.length}{' '}
        blocks.
      </p>

      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {sortedColors.map((color) => (
          <div
            key={color.hex}
            className="flex items-center gap-3 bg-surface-container rounded-md px-3 py-2"
          >
            <div
              className="w-8 h-8 rounded-sm border border-outline-variant/20 flex-shrink-0"
              style={{ backgroundColor: color.hex }}
            />
            <div className="flex-1 min-w-0">
              <span className="text-body-sm font-mono text-on-surface">
                {color.hex}
              </span>
            </div>
            <span className="text-label-sm text-secondary">
              {color.blockCount} block{color.blockCount !== 1 ? 's' : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
