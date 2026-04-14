/**
 * Custom SVG icons for the QuiltCorgi shop.
 * Simple, professional icons that match the brand aesthetic.
 */

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
}

export function FabricSwatchIcon({
  size = 48,
  color = 'var(--color-primary)',
  className = '',
}: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <rect x="6" y="6" width="36" height="36" rx="4" fill={color} opacity="0.15" />
      <rect x="10" y="10" width="12" height="12" rx="2" fill={color} />
      <rect x="26" y="10" width="12" height="12" rx="2" fill={color} opacity="0.7" />
      <rect x="10" y="26" width="12" height="12" rx="2" fill={color} opacity="0.5" />
      <rect x="26" y="26" width="12" height="12" rx="2" fill={color} opacity="0.3" />
    </svg>
  );
}

export function CharmPackIcon({
  size = 48,
  color = 'var(--color-primary)',
  className = '',
}: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <rect x="8" y="8" width="32" height="32" rx="3" fill={color} opacity="0.15" />
      <rect x="12" y="12" width="8" height="8" fill={color} />
      <rect x="20" y="12" width="8" height="8" fill={color} opacity="0.8" />
      <rect x="28" y="12" width="8" height="8" fill={color} opacity="0.6" />
      <rect x="12" y="20" width="8" height="8" fill={color} opacity="0.7" />
      <rect x="20" y="20" width="8" height="8" fill={color} opacity="0.5" />
      <rect x="28" y="20" width="8" height="8" fill={color} opacity="0.4" />
      <rect x="12" y="28" width="8" height="8" fill={color} opacity="0.4" />
      <rect x="20" y="28" width="8" height="8" fill={color} opacity="0.3" />
      <rect x="28" y="28" width="8" height="8" fill={color} opacity="0.2" />
      <line x1="8" y1="8" x2="40" y2="40" stroke={color} strokeWidth="2" opacity="0.3" />
      <line x1="40" y1="8" x2="8" y2="40" stroke={color} strokeWidth="2" opacity="0.3" />
    </svg>
  );
}

export function JellyRollIcon({
  size = 48,
  color = 'var(--color-primary)',
  className = '',
}: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <rect x="12" y="6" width="24" height="36" rx="3" fill={color} opacity="0.15" />
      <rect x="14" y="8" width="20" height="4" rx="1" fill={color} />
      <rect x="14" y="14" width="20" height="4" rx="1" fill={color} opacity="0.8" />
      <rect x="14" y="20" width="20" height="4" rx="1" fill={color} opacity="0.6" />
      <rect x="14" y="26" width="20" height="4" rx="1" fill={color} opacity="0.7" />
      <rect x="14" y="32" width="20" height="4" rx="1" fill={color} opacity="0.5" />
      <rect x="14" y="38" width="20" height="4" rx="1" fill={color} opacity="0.4" />
    </svg>
  );
}

export function LayerCakeIcon({
  size = 48,
  color = 'var(--color-primary)',
  className = '',
}: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <rect x="8" y="8" width="32" height="32" rx="3" fill={color} opacity="0.15" />
      <rect x="12" y="12" width="24" height="6" rx="1" fill={color} />
      <rect x="12" y="20" width="24" height="6" rx="1" fill={color} opacity="0.8" />
      <rect x="12" y="28" width="24" height="6" rx="1" fill={color} opacity="0.6" />
      <rect x="12" y="36" width="24" height="2" rx="1" fill={color} opacity="0.4" />
    </svg>
  );
}

export function FabricByYardIcon({
  size = 48,
  color = 'var(--color-primary)',
  className = '',
}: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <rect x="6" y="12" width="36" height="24" rx="3" fill={color} opacity="0.15" />
      <path d="M6 18 Q18 12 30 18 Q42 24 42 30" stroke={color} strokeWidth="2" fill="none" />
      <path
        d="M6 24 Q18 18 30 24 Q42 30 42 36"
        stroke={color}
        strokeWidth="2"
        fill="none"
        opacity="0.7"
      />
      <path
        d="M6 30 Q18 24 30 30 Q42 36 42 42"
        stroke={color}
        strokeWidth="2"
        fill="none"
        opacity="0.5"
      />
    </svg>
  );
}

export function QuiltingNotionsIcon({
  size = 48,
  color = 'var(--color-primary)',
  className = '',
}: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <circle cx="16" cy="16" r="4" fill={color} />
      <circle cx="24" cy="12" r="4" fill={color} opacity="0.7" />
      <circle cx="32" cy="16" r="4" fill={color} opacity="0.5" />
      <rect x="14" y="22" width="20" height="16" rx="3" fill={color} opacity="0.15" />
      <line x1="18" y1="26" x2="30" y2="26" stroke={color} strokeWidth="2" />
      <line x1="18" y1="30" x2="30" y2="30" stroke={color} strokeWidth="2" opacity="0.7" />
      <line x1="18" y1="34" x2="30" y2="34" stroke={color} strokeWidth="2" opacity="0.5" />
    </svg>
  );
}

export function BattingIcon({
  size = 48,
  color = 'var(--color-primary)',
  className = '',
}: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <rect x="8" y="12" width="32" height="24" rx="3" fill={color} opacity="0.15" />
      <rect x="10" y="14" width="28" height="4" rx="1" fill={color} opacity="0.3" />
      <rect x="10" y="20" width="28" height="4" rx="1" fill={color} opacity="0.4" />
      <rect x="10" y="26" width="28" height="4" rx="1" fill={color} opacity="0.5" />
      <rect x="10" y="32" width="28" height="2" rx="1" fill={color} opacity="0.3" />
    </svg>
  );
}

export function PatternBookIcon({
  size = 48,
  color = 'var(--color-primary)',
  className = '',
}: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <rect x="10" y="8" width="28" height="32" rx="3" fill={color} opacity="0.15" />
      <rect x="14" y="12" width="20" height="12" rx="2" fill={color} opacity="0.3" />
      <rect x="14" y="28" width="20" height="2" fill={color} opacity="0.5" />
      <rect x="14" y="32" width="14" height="2" fill={color} opacity="0.4" />
      <path d="M18 16 L22 20 L28 14" stroke={color} strokeWidth="2" fill="none" />
    </svg>
  );
}

export function MachineQuiltingIcon({
  size = 48,
  color = 'var(--color-primary)',
  className = '',
}: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <rect x="16" y="8" width="16" height="12" rx="2" fill={color} opacity="0.3" />
      <rect x="20" y="20" width="8" height="16" rx="2" fill={color} opacity="0.2" />
      <circle cx="24" cy="40" r="4" fill={color} />
      <line x1="24" y1="36" x2="24" y2="20" stroke={color} strokeWidth="2" />
      <path d="M12 28 Q24 20 36 28" stroke={color} strokeWidth="2" fill="none" opacity="0.5" />
    </svg>
  );
}

export function QuiltPatternIcon({
  size = 48,
  color = 'var(--color-primary)',
  className = '',
}: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <rect x="8" y="8" width="32" height="32" rx="3" fill={color} opacity="0.15" />
      <path d="M16 16 L32 16 L32 32 L16 32 Z" stroke={color} strokeWidth="2" fill="none" />
      <path d="M16 16 L24 24 L16 32" stroke={color} strokeWidth="2" fill="none" />
      <path d="M32 16 L24 24 L32 32" stroke={color} strokeWidth="2" fill="none" />
      <circle cx="24" cy="24" r="3" fill={color} />
    </svg>
  );
}

export function ThreadIcon({
  size = 48,
  color = 'var(--color-primary)',
  className = '',
}: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <rect x="16" y="12" width="16" height="24" rx="8" fill={color} opacity="0.2" />
      <rect x="18" y="16" width="12" height="16" rx="6" fill={color} />
      <rect x="20" y="20" width="8" height="8" rx="4" fill={color} opacity="0.5" />
      <path d="M24 36 L24 44" stroke={color} strokeWidth="2" />
      <path d="M22 40 Q24 38 26 40" stroke={color} strokeWidth="1.5" fill="none" />
    </svg>
  );
}

export function ShoppingBagLargeIcon({
  size = 64,
  color = 'var(--color-primary)',
  className = '',
}: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
      <path d="M20 20 L44 20 L48 52 L16 52 Z" fill={color} opacity="0.15" />
      <path d="M20 20 L44 20 L48 52 L16 52 Z" stroke={color} strokeWidth="2" fill="none" />
      <path d="M26 20 Q26 12 32 12 Q38 12 38 20" stroke={color} strokeWidth="2" fill="none" />
      <circle cx="28" cy="36" r="3" fill={color} />
      <circle cx="36" cy="36" r="3" fill={color} />
    </svg>
  );
}
