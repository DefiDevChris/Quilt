import { computeCanvasGeometry } from '@/lib/canvas-utils';
import { decimalToFraction, toMixedNumberString } from '@/lib/fraction-math';
import { CANVAS, FENCE, GRID } from '@/lib/design-system';
import type { UnitSystem } from '@/types/canvas';
import type { FenceArea } from '@/types/fence';

interface GridRenderOptions {
  gridSettings: { enabled: boolean; size: number };
  unitSystem: UnitSystem;
  quiltWidth: number;
  quiltHeight: number;
  layoutAreas?: FenceArea[];
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
    const hDir = corner.x === 0 ? -1 : 1;
    ctx.moveTo(corner.x, corner.y);
    ctx.lineTo(corner.x + hDir * len, corner.y);

    const vDir = corner.y === 0 ? -1 : 1;
    ctx.moveTo(corner.x, corner.y);
    ctx.lineTo(corner.x, corner.y + vDir * len);
  }
  ctx.stroke();
}

function renderLayoutAreas(ctx: CanvasRenderingContext2D, areas: FenceArea[], zoom: number): void {
  if (areas.length === 0) return;

  for (const area of areas) {
    const isBlockCell = area.role === 'block-cell';
    const fillMap = isBlockCell ? FENCE.preview.fills : FENCE.normal.fills;
    const strokeMap = isBlockCell ? FENCE.preview.strokes : FENCE.normal.strokes;
    const safeRole = (area.role in fillMap ? area.role : 'block-cell') as keyof typeof fillMap;

    ctx.save();
    ctx.fillStyle = fillMap[safeRole];
    ctx.strokeStyle = strokeMap[safeRole];
    ctx.lineWidth = (isBlockCell ? 1.2 : 0.9) / zoom;
    if (isBlockCell) {
      ctx.setLineDash([6 / zoom, 4 / zoom]);
    }

    if (area.points && area.points.length >= 3) {
      ctx.beginPath();
      ctx.moveTo(area.points[0].x, area.points[0].y);
      for (let i = 1; i < area.points.length; i += 1) {
        ctx.lineTo(area.points[i].x, area.points[i].y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      continue;
    }

    if (area.rotation) {
      const centerX = area.x + area.width / 2;
      const centerY = area.y + area.height / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate((area.rotation * Math.PI) / 180);
      ctx.fillRect(-area.width / 2, -area.height / 2, area.width, area.height);
      ctx.strokeRect(-area.width / 2, -area.height / 2, area.width, area.height);
      ctx.restore();
      continue;
    }

    ctx.fillRect(area.x, area.y, area.width, area.height);
    ctx.strokeRect(area.x, area.y, area.width, area.height);
    ctx.restore();
  }
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
  const { gridSettings, unitSystem, quiltWidth, quiltHeight, layoutAreas = [] } = options;

  // Use the unified geometry so grid and Fabric.js canvases stay aligned
  const zoom = fabricCanvas.getZoom();
  const vpt = fabricCanvas.viewportTransform;
  const geo = computeCanvasGeometry(quiltWidth, quiltHeight, unitSystem, zoom, vpt[4], vpt[5]);
  const { quiltWidthPx, quiltHeightPx, pxPerUnit } = geo;

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

  renderLayoutAreas(ctx, layoutAreas, zoom);

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
