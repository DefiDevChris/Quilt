import { getPixelsPerUnit } from '@/lib/canvas-utils';
import { decimalToFraction, toMixedNumberString } from '@/lib/fraction-math';
import { CANVAS, GRID } from '@/lib/design-system';
import type { UnitSystem } from '@/types/canvas';

interface GridRenderOptions {
  gridSettings: { enabled: boolean; size: number };
  unitSystem: UnitSystem;
  quiltWidth: number;
  quiltHeight: number;
}

const CORNER_MARK_LENGTH = 8;
const LABEL_OFFSET = 14;
const LABEL_FONT_SIZE = 11;

function renderDimensionLabels(
  ctx: CanvasRenderingContext2D,
  quiltWidthPx: number,
  quiltHeightPx: number,
  quiltWidth: number,
  quiltHeight: number,
  unitSystem: UnitSystem,
  zoom: number
): void {
  const unitLabel = unitSystem === 'imperial' ? '"' : 'cm';
  const widthLabel =
    unitSystem === 'imperial'
      ? `${toMixedNumberString(decimalToFraction(quiltWidth))}${unitLabel}`
      : `${quiltWidth}${unitLabel}`;
  const heightLabel =
    unitSystem === 'imperial'
      ? `${toMixedNumberString(decimalToFraction(quiltHeight))}${unitLabel}`
      : `${quiltHeight}${unitLabel}`;

  const fontSize = LABEL_FONT_SIZE / zoom;
  ctx.font = `500 ${fontSize}px Manrope, system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillStyle = GRID.label;

  // Width label centered along top edge
  ctx.fillText(widthLabel, quiltWidthPx / 2, -(LABEL_OFFSET / zoom));

  // Height label centered along left edge (rotated)
  ctx.save();
  ctx.translate(-(LABEL_OFFSET / zoom), quiltHeightPx / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(heightLabel, 0, 0);
  ctx.restore();
}

function renderCornerMarks(
  ctx: CanvasRenderingContext2D,
  quiltWidthPx: number,
  quiltHeightPx: number,
  zoom: number
): void {
  const len = CORNER_MARK_LENGTH / zoom;
  ctx.strokeStyle = GRID.label;
  ctx.lineWidth = 1 / zoom;

  const corners = [
    { x: 0, y: 0 },
    { x: quiltWidthPx, y: 0 },
    { x: 0, y: quiltHeightPx },
    { x: quiltWidthPx, y: quiltHeightPx },
  ] as const;

  ctx.beginPath();
  for (const corner of corners) {
    // Horizontal arm
    const hDir = corner.x === 0 ? -1 : 1;
    ctx.moveTo(corner.x, corner.y);
    ctx.lineTo(corner.x + hDir * len, corner.y);

    // Vertical arm
    const vDir = corner.y === 0 ? -1 : 1;
    ctx.moveTo(corner.x, corner.y);
    ctx.lineTo(corner.x, corner.y + vDir * len);
  }
  ctx.stroke();
}

export function renderGrid(
  gridEl: HTMLCanvasElement,
  fabricCanvas: { getZoom: () => number; viewportTransform: number[] },
  options: GridRenderOptions
): void {
  const ctx = gridEl.getContext('2d');
  if (!ctx) return;

  const w = gridEl.width;
  const h = gridEl.height;
  const { gridSettings, unitSystem, quiltWidth, quiltHeight } = options;
  const pxPerUnit = getPixelsPerUnit(unitSystem);
  const quiltWidthPx = quiltWidth * pxPerUnit;
  const quiltHeightPx = quiltHeight * pxPerUnit;
  const zoom = fabricCanvas.getZoom();
  const vpt = fabricCanvas.viewportTransform;
  const panX = vpt[4];
  const panY = vpt[5];

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = GRID.bg;
  ctx.fillRect(0, 0, w, h);

  // --- Infinite background grid removed as per user request ---


  ctx.save();
  ctx.transform(vpt[0], vpt[1], vpt[2], vpt[3], vpt[4], vpt[5]);

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, quiltWidthPx, quiltHeightPx);

  ctx.strokeStyle = GRID.border;
  ctx.lineWidth = 1.5 / zoom;
  ctx.strokeRect(0, 0, quiltWidthPx, quiltHeightPx);

  // Grid lines inside the quilt area
  if (gridSettings.size > 0) {
    const gridSizePx = gridSettings.size * pxPerUnit;
    ctx.strokeStyle = CANVAS.gridLineDimmed;
    ctx.lineWidth = 1 / zoom;

    ctx.beginPath();
    for (let x = gridSizePx; x < quiltWidthPx; x += gridSizePx) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, quiltHeightPx);
    }
    for (let y = gridSizePx; y < quiltHeightPx; y += gridSizePx) {
      ctx.moveTo(0, y);
      ctx.lineTo(quiltWidthPx, y);
    }
    ctx.stroke();
  }

  renderDimensionLabels(
    ctx,
    quiltWidthPx,
    quiltHeightPx,
    quiltWidth,
    quiltHeight,
    unitSystem,
    zoom
  );
  renderCornerMarks(ctx, quiltWidthPx, quiltHeightPx, zoom);

  ctx.restore();
}
