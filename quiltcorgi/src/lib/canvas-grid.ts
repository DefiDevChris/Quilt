import { getPixelsPerUnit } from '@/lib/canvas-utils';
import type { UnitSystem } from '@/types/canvas';

interface GridRenderOptions {
  gridSettings: { enabled: boolean; size: number };
  unitSystem: UnitSystem;
  quiltWidth: number;
  quiltHeight: number;
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

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#EDEBE8';
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.transform(vpt[0], vpt[1], vpt[2], vpt[3], vpt[4], vpt[5]);

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, quiltWidthPx, quiltHeightPx);

  ctx.strokeStyle = '#B0ADA8';
  ctx.lineWidth = 1.5 / zoom;
  ctx.strokeRect(0, 0, quiltWidthPx, quiltHeightPx);

  if (gridSettings.enabled && gridSettings.size > 0) {
    const gridSizePx = gridSettings.size * pxPerUnit;
    ctx.strokeStyle = 'rgba(229, 226, 221, 0.7)';
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

  ctx.restore();
}
