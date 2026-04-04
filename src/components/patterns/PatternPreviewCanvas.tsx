'use client';

interface PatternLayout {
  readonly type: string;
  readonly rows?: number | null;
  readonly cols?: number | null;
  readonly sashingWidth?: number | null;
}

interface PatternFabric {
  readonly label: string;
  readonly colorFamily?: string;
}

interface PatternBlock {
  readonly name: string;
  readonly quantity: number;
}

interface PatternPreviewCanvasProps {
  readonly layout: PatternLayout;
  readonly fabrics: readonly PatternFabric[];
  readonly blocks: readonly PatternBlock[];
}

const COLOR_MAP: Record<string, string> = {
  red: '#D4726A',
  orange: '#E89B6C',
  yellow: '#D4A62E',
  green: '#4a7c59',
  blue: '#3b6995',
  purple: '#7B5EA7',
  pink: '#D48BA0',
  brown: '#8B6B4A',
  black: '#383831',
  white: '#E8DCCB',
  gray: '#9B958C',
  neutral: '#C4B8A8',
  multi: '#C67B5C',
  teal: '#4A8B8D',
  cream: '#F0E4D0',
};

function getFabricColor(fabric: PatternFabric): string {
  if (!fabric.colorFamily) return '#C4B8A8';
  return COLOR_MAP[fabric.colorFamily.toLowerCase()] ?? '#C4B8A8';
}

export function PatternPreviewCanvas({
  layout,
  fabrics,
  blocks: _blocks,
}: PatternPreviewCanvasProps) {
  const rows = layout.rows ?? 3;
  const cols = layout.cols ?? 3;
  const hasSashing = (layout.sashingWidth ?? 0) > 0;
  const isOnPoint = layout.type === 'on-point';

  // Build color palette from fabrics
  const colors = fabrics.length > 0 ? fabrics.map(getFabricColor) : ['#C4B8A8', '#E8DCCB'];

  const cellSize = 32;
  const sashingSize = hasSashing ? 6 : 0;
  const padding = isOnPoint ? cellSize : 8;

  // For on-point, we need extra space for the diagonal rotation
  const gridWidth = cols * cellSize + (cols - 1) * sashingSize;
  const gridHeight = rows * cellSize + (rows - 1) * sashingSize;
  const svgWidth = isOnPoint
    ? (cols + rows) * cellSize * 0.5 + padding * 2
    : gridWidth + padding * 2;
  const svgHeight = isOnPoint
    ? (cols + rows) * cellSize * 0.5 + padding * 2
    : gridHeight + padding * 2;

  const sashingColor = '#F5F0E8';

  return (
    <div className="flex justify-center">
      <svg
        width={Math.min(svgWidth, 280)}
        height={Math.min(svgHeight, 200)}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="rounded-lg"
        style={{ backgroundColor: 'var(--color-surface-container)' }}
        role="img"
        aria-label={`${rows}×${cols} ${layout.type} layout preview`}
      >
        {isOnPoint ? (
          // On-point: rotated 45° blocks
          <g transform={`translate(${svgWidth / 2}, ${padding + cellSize * 0.35})`}>
            {Array.from({ length: rows }, (_, r) =>
              Array.from({ length: cols }, (_, c) => {
                const x = (c - r) * cellSize * 0.5;
                const y = (c + r) * cellSize * 0.5;
                const colorIdx = (r * cols + c) % colors.length;
                return (
                  <rect
                    key={`${r}-${c}`}
                    x={x - cellSize * 0.35}
                    y={y - cellSize * 0.35}
                    width={cellSize * 0.7}
                    height={cellSize * 0.7}
                    rx={2}
                    fill={colors[colorIdx]}
                    transform={`rotate(45, ${x}, ${y})`}
                    opacity={0.85}
                  />
                );
              })
            )}
          </g>
        ) : (
          // Standard grid or sashing layout
          <g transform={`translate(${padding}, ${padding})`}>
            {/* Sashing background */}
            {hasSashing && (
              <rect x={0} y={0} width={gridWidth} height={gridHeight} rx={3} fill={sashingColor} />
            )}
            {/* Blocks */}
            {Array.from({ length: rows }, (_, r) =>
              Array.from({ length: cols }, (_, c) => {
                const x = c * (cellSize + sashingSize);
                const y = r * (cellSize + sashingSize);
                const colorIdx = (r * cols + c) % colors.length;
                return (
                  <rect
                    key={`${r}-${c}`}
                    x={x}
                    y={y}
                    width={cellSize}
                    height={cellSize}
                    rx={2}
                    fill={colors[colorIdx]}
                    opacity={0.85}
                  />
                );
              })
            )}
          </g>
        )}
      </svg>
    </div>
  );
}
