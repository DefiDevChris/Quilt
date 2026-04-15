'use client';

import { useState, useEffect } from 'react';
import { COLORS, OPACITY } from '@/lib/design-system';

interface QuiltPieceProps {
  /** Decorative fabric color — uses brand palette by default */
  color?: 'primary' | 'secondary' | 'accent' | 'bg' | 'surface';
  /** Size in px (width and height) */
  size?: number;
  /** Rotation in degrees */
  rotation?: number;
  /** Absolute positioning */
  top?: string | number;
  right?: string | number;
  bottom?: string | number;
  left?: string | number;
  /** Opacity of the fabric fill (0-100) */
  opacity?: number;
  /** Extra className for positioning wrapper */
  className?: string;
  /** Whether to show the stitch dashed outline */
  stitch?: boolean;
  /** Stroke width of the stitch line */
  strokeWidth?: number;
  /** Extra gap between stitch line and edge */
  stitchGap?: number;
  /** Color of the stitch line (defaults to same as fill color) */
  stitchColor?: string;
}

const COLOR_MAP: Record<string, string> = {
  primary: COLORS.primary,
  secondary: COLORS.secondary,
  accent: COLORS.accent,
  bg: COLORS.bg,
  surface: COLORS.surface,
};

/**
 * Decorative opaque fabric square with thick dashed "stitch" outline.
 * Used as background decoration across pages to create a quilted feel.
 */
export function QuiltPiece({
  color = 'primary',
  size = 120,
  rotation = 0,
  top,
  right,
  bottom,
  left,
  opacity = 15,
  className = '',
  stitch = true,
  strokeWidth = 2.5,
  stitchGap = 4,
  stitchColor,
}: QuiltPieceProps) {
  const fillColor = COLOR_MAP[color] || COLOR_MAP.primary;
  const strokeColor = stitchColor || fillColor;
  const innerSize = size - stitchGap * 2;
  const innerOffset = stitchGap;

  return (
    <div
      className={`absolute pointer-events-none select-none ${className}`}
      style={{
        width: size,
        height: size,
        top,
        right,
        bottom,
        left,
        transform: rotation !== 0 ? `rotate(${rotation}deg)` : undefined,
      }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Opaque fabric fill */}
        <rect
          x={0}
          y={0}
          width={size}
          height={size}
          fill={fillColor}
          opacity={(opacity / 100) * 0.15}
          rx={8}
          ry={8}
        />
        {/* Stitch dashed outline — thick sharpie look */}
        {stitch && (
          <rect
            x={innerOffset}
            y={innerOffset}
            width={innerSize}
            height={innerSize}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray="20 24"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.12}
            rx={6}
            ry={6}
          />
        )}
      </svg>
    </div>
  );
}

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

/** A full-width decorative band with scattered quilt pieces */
export function QuiltPieceBand({
  color = 'primary',
  height = 80,
  opacity = 10,
  pieceCount = 5,
  className = '',
}: {
  color?: 'primary' | 'secondary' | 'accent';
  height?: number;
  opacity?: number;
  pieceCount?: number;
  className?: string;
}) {
  const [pieces, setPieces] = useState<
    Array<{ size: number; left: string; top: string; rotation: number; opacity: number }>
  >([]);

  useEffect(() => {
    setPieces(
      Array.from({ length: pieceCount }).map((_, i) => ({
        size: 40 + Math.random() * 60,
        left: `${5 + (i / pieceCount) * 90}%`,
        top: `${10 + Math.random() * 60}%`,
        rotation: Math.floor(Math.random() * 30) - 15,
        opacity: opacity * (0.5 + Math.random() * 0.5),
      }))
    );
  }, [pieceCount, opacity]);

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ height }}>
      {pieces.map((p, i) => (
        <QuiltPiece
          key={i}
          color={color}
          size={p.size}
          rotation={p.rotation}
          left={p.left}
          top={p.top}
          opacity={p.opacity}
          stitch={false}
        />
      ))}
    </div>
  );
}
