'use client';

import { useRef, useEffect } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { getPixelsPerUnit } from '@/lib/canvas-utils';

const RULER_WIDTH = 24;

function getTickConfig(zoomPxPerUnit: number) {
  const target = 80;
  const unitsPerTick = target / zoomPxPerUnit;
  const nice = [0.125, 0.25, 0.5, 1, 2, 5, 10, 20, 50, 100];
  let major = 1;
  for (const n of nice) {
    if (n >= unitsPerTick) {
      major = n;
      break;
    }
  }
  return { major, minor: major / 4 };
}

export function VerticalRuler() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const zoom = useCanvasStore((s) => s.zoom);
  const unitSystem = useCanvasStore((s) => s.unitSystem);
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);
  const cursorPosition = useCanvasStore((s) => s.cursorPosition);

  useEffect(() => {
    const el = canvasRef.current;
    const container = containerRef.current;
    if (!el || !container) return;

    const rect = container.getBoundingClientRect();
    el.width = RULER_WIDTH;
    el.height = rect.height;

    const ctx = el.getContext('2d');
    if (!ctx) return;

    const pxPerUnit = getPixelsPerUnit(unitSystem);
    const fc = fabricCanvas as { viewportTransform?: number[]; getZoom?: () => number } | null;
    const vpt = fc?.viewportTransform ?? [1, 0, 0, 1, 0, 0];
    const currentZoom = fc?.getZoom?.() ?? zoom;
    const panY = vpt[5];
    const zoomPxPerUnit = pxPerUnit * currentZoom;

    ctx.clearRect(0, 0, RULER_WIDTH, el.height);
    ctx.fillStyle = '#fffcf7';
    ctx.fillRect(0, 0, RULER_WIDTH, el.height);

    const { major, minor } = getTickConfig(zoomPxPerUnit);

    const startUnit = Math.floor(-panY / zoomPxPerUnit / major) * major;
    const endUnit = Math.ceil((el.height - panY) / zoomPxPerUnit / major) * major;

    ctx.strokeStyle = '#babab0';
    ctx.fillStyle = '#6c635a';
    ctx.font = '10px Manrope, system-ui, sans-serif';
    ctx.textAlign = 'right';

    for (let u = startUnit; u <= endUnit; u += major) {
      const screenY = u * zoomPxPerUnit + panY;
      if (screenY < -10 || screenY > el.height + 10) continue;

      ctx.beginPath();
      ctx.moveTo(RULER_WIDTH, screenY);
      ctx.lineTo(RULER_WIDTH - 12, screenY);
      ctx.stroke();

      ctx.save();
      ctx.translate(RULER_WIDTH - 14, screenY);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'center';
      ctx.fillText(`${u}`, 0, 0);
      ctx.restore();

      for (let i = 1; i < 4; i++) {
        const minorY = screenY + i * minor * zoomPxPerUnit;
        if (minorY < 0 || minorY > el.height) continue;
        ctx.beginPath();
        ctx.moveTo(RULER_WIDTH, minorY);
        ctx.lineTo(RULER_WIDTH - 6, minorY);
        ctx.stroke();
      }
    }

    const cursorScreenY = cursorPosition.y * pxPerUnit * currentZoom + panY;
    if (cursorScreenY >= 0 && cursorScreenY <= el.height) {
      ctx.fillStyle = '#8d4f00';
      ctx.fillRect(0, cursorScreenY - 0.5, RULER_WIDTH, 1);
    }

    ctx.strokeStyle = '#babab0';
    ctx.beginPath();
    ctx.moveTo(RULER_WIDTH - 0.5, 0);
    ctx.lineTo(RULER_WIDTH - 0.5, el.height);
    ctx.stroke();
  }, [zoom, unitSystem, fabricCanvas, cursorPosition]);

  return (
    <div ref={containerRef} className="w-6 bg-surface border-r border-outline-variant">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}
