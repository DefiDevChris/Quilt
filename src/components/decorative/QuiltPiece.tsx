'use client';

import { COLORS, OPACITY } from '@/lib/design-system';

const COLOR_MAP: Record<string, string> = {
  primary: COLORS.primary,
  secondary: COLORS.secondary,
  accent: COLORS.accent,
  bg: COLORS.bg,
  surface: COLORS.surface,
};

/** A row of small decorative quilt pieces used as section dividers */
export function QuiltPieceRow({
  count = 3,
  size = 16,
  gap = 8,
  colors = ['primary', 'secondary', 'accent'],
  className = '',
}: {
  count?: number;
  size?: number;
  gap?: number;
  colors?: Array<'primary' | 'secondary' | 'accent' | 'bg' | 'surface'>;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2 ${className}`} style={{ gap }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg"
          style={{
            width: size,
            height: size,
            backgroundColor: COLOR_MAP[colors[i % colors.length]],
            opacity: OPACITY.fencePreview,
          }}
        />
      ))}
    </div>
  );
}
