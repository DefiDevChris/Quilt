import { COLORS } from '@/lib/design-system';

/**
 * A subtle quilt-block SVG pattern used as placeholder for project thumbnails.
 * Renders a simple nine-patch block with brand colors.
 */
export function QuiltPlaceholder({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Background */}
      <rect width="200" height="200" fill={COLORS.bg} />

      {/* Nine-patch quilt block */}
      {/* Row 1 */}
      <rect x="20" y="20" width="50" height="50" fill={COLORS.primary} rx="1" />
      <rect x="75" y="20" width="50" height="50" fill={COLORS.secondary} rx="1" />
      <rect x="130" y="20" width="50" height="50" fill={COLORS.accent} rx="1" />

      {/* Row 2 */}
      <rect x="20" y="75" width="50" height="50" fill={COLORS.secondary} rx="1" />
      <rect
        x="75"
        y="75"
        width="50"
        height="50"
        fill={COLORS.bg}
        stroke={COLORS.border}
        strokeWidth="1"
        rx="1"
      />
      <rect x="130" y="75" width="50" height="50" fill={COLORS.primary} rx="1" />

      {/* Row 3 */}
      <rect x="20" y="130" width="50" height="50" fill={COLORS.accent} rx="1" />
      <rect x="75" y="130" width="50" height="50" fill={COLORS.primary} rx="1" />
      <rect x="130" y="130" width="50" height="50" fill={COLORS.secondary} rx="1" />

      {/* Stitch lines */}
      <line x1="20" y1="75" x2="180" y2="75" stroke={COLORS.border} strokeWidth="0.5" />
      <line x1="20" y1="130" x2="180" y2="130" stroke={COLORS.border} strokeWidth="0.5" />
      <line x1="75" y1="20" x2="75" y2="180" stroke={COLORS.border} strokeWidth="0.5" />
      <line x1="130" y1="20" x2="130" y2="180" stroke={COLORS.border} strokeWidth="0.5" />
    </svg>
  );
}
