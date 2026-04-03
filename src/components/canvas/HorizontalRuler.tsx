'use client';

import { useRef, useEffect } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { getPixelsPerUnit } from '@/lib/canvas-utils';

const RULER_HEIGHT = 24;

// Design system colors for canvas rendering
function getRulerColors() {
  if (typeof window === 'undefined') {
    return {
      background: '#fffcf7',
      tick: '#babab0',
      text: '#6b5a4d',
      cursor: '#8d4f00',
    };
  }
  const style = getComputedStyle(document.documentElement);
  return {
    background: style.getPropertyValue('--color-surface-container-lowest').trim() || '#fffcf7',
    tick: style.getPropertyValue('--color-outline-variant').trim() || '#babab0',
    text: style.getPropertyValue('--color-secondary').trim() || '#6b5a4d',
    cursor: style.getPropertyValue('--color-primary-dark').trim() || '#8d4f00',
  };
}

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

export function HorizontalRuler() {
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
    el.width = rect.width;
    el.height = RULER_HEIGHT;

    const ctx = el.getContext('2d');
    if (!ctx) return;

    const pxPerUnit = getPixelsPerUnit(unitSystem);
    const fc = fabricCanvas as { viewportTransform?: number[]; getZoom?: () => number } | null;
    const vpt = fc?.viewportTransform ?? [1, 0, 0, 1, 0, 0];
    const currentZoom = fc?.getZoom?.() ?? zoom;
    const panX = vpt[4];
    const zoomPxPerUnit = pxPerUnit * currentZoom;

    const colors = getRulerColors();
    ctx.clearRect(0, 0, el.width, RULER_HEIGHT);
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, el.width, RULER_HEIGHT);

    const { major, minor } = getTickConfig(zoomPxPerUnit);

    const startUnit = Math.floor(-panX / zoomPxPerUnit / major) * major;
    const endUnit = Math.ceil((el.width - panX) / zoomPxPerUnit / major) * major;

    ctx.strokeStyle = colors.tick;
    ctx.fillStyle = colors.text;
    ctx.font = '10px Manrope, system-ui, sans-serif';
    ctx.textAlign = 'center';

    for (let u = startUnit; u <= endUnit; u += major) {
      const screenX = u * zoomPxPerUnit + panX;
      if (screenX < -10 || screenX > el.width + 10) continue;

      ctx.beginPath();
      ctx.moveTo(screenX, RULER_HEIGHT);
      ctx.lineTo(screenX, RULER_HEIGHT - 12);
      ctx.stroke();
      ctx.fillText(`${u}`, screenX, RULER_HEIGHT - 14);

      for (let i = 1; i < 4; i++) {
        const minorX = screenX + i * minor * zoomPxPerUnit;
        if (minorX < 0 || minorX > el.width) continue;
        ctx.beginPath();
        ctx.moveTo(minorX, RULER_HEIGHT);
        ctx.lineTo(minorX, RULER_HEIGHT - 6);
        ctx.stroke();
      }
    }

    const cursorScreenX = cursorPosition.x * pxPerUnit * currentZoom + panX;
    if (cursorScreenX >= 0 && cursorScreenX <= el.width) {
      ctx.fillStyle = colors.cursor;
      ctx.fillRect(cursorScreenX - 0.5, 0, 1, RULER_HEIGHT);
    }

    ctx.strokeStyle = colors.tick;
    ctx.beginPath();
    ctx.moveTo(0, RULER_HEIGHT - 0.5);
    ctx.lineTo(el.width, RULER_HEIGHT - 0.5);
    ctx.stroke();
  }, [zoom, unitSystem, fabricCanvas, cursorPosition]);

  return (
    <div ref={containerRef} className="h-6 bg-surface border-b border-outline-variant ml-6 z-10">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}
