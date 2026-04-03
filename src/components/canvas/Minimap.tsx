'use client';

import { useEffect, useState } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';
import type { Canvas as FabricCanvas } from 'fabric';

export function Minimap() {
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);
  const canvasWidth = useProjectStore((s) => s.canvasWidth);
  const canvasHeight = useProjectStore((s) => s.canvasHeight);
  const [viewportRect, setViewportRect] = useState({ x: 0, y: 0, w: 100, h: 100 });

  useEffect(() => {
    if (!fabricCanvas) return;

    const canvas = fabricCanvas as FabricCanvas;

    const updateViewport = () => {
      const vpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0];
      const zoom = vpt[0];
      const panX = vpt[4];
      const panY = vpt[5];

      const el = (canvas as unknown as { wrapperEl: HTMLElement }).wrapperEl;
      if (!el) return;

      const containerW = el.clientWidth;
      const containerH = el.clientHeight;

      // Viewport in canvas coordinates
      const vpLeft = -panX / zoom;
      const vpTop = -panY / zoom;
      const vpWidth = containerW / zoom;
      const vpHeight = containerH / zoom;

      // Normalize to 0-100 for minimap
      const x = (vpLeft / canvasWidth) * 100;
      const y = (vpTop / canvasHeight) * 100;
      const w = (vpWidth / canvasWidth) * 100;
      const h = (vpHeight / canvasHeight) * 100;

      setViewportRect({ x, y, w, h });
    };

    updateViewport();
    canvas.on('after:render', updateViewport);

    return () => {
      canvas.off('after:render', updateViewport);
    };
  }, [fabricCanvas, canvasWidth, canvasHeight]);

  const handleMinimapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!fabricCanvas) return;

    const canvas = fabricCanvas as FabricCanvas;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvasWidth;
    const y = ((e.clientY - rect.top) / rect.height) * canvasHeight;

    const vpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0];
    const zoom = vpt[0];

    const el = (canvas as unknown as { wrapperEl: HTMLElement }).wrapperEl;
    if (!el) return;

    const containerW = el.clientWidth;
    const containerH = el.clientHeight;

    const panX = -x * zoom + containerW / 2;
    const panY = -y * zoom + containerH / 2;

    canvas.setViewportTransform([zoom, 0, 0, zoom, panX, panY]);
    canvas.renderAll();
  };

  if (!fabricCanvas) return null;

  const aspectRatio = canvasWidth / canvasHeight;
  const minimapWidth = 160;
  const minimapHeight = minimapWidth / aspectRatio;

  return (
    <div className="p-3">
      <div className="text-[11px] font-medium text-on-surface/70 uppercase tracking-wider mb-2">
        Navigator
      </div>
      <div
        className="relative bg-surface-container border border-outline-variant/30 rounded-md cursor-pointer overflow-hidden"
        style={{ width: minimapWidth, height: minimapHeight }}
        onClick={handleMinimapClick}
      >
        {/* Canvas representation */}
        <div className="absolute inset-0 bg-surface-container-high" />

        {/* Viewport indicator */}
        <div
          className="absolute border-2 border-primary bg-primary/10"
          style={{
            left: `${viewportRect.x}%`,
            top: `${viewportRect.y}%`,
            width: `${viewportRect.w}%`,
            height: `${viewportRect.h}%`,
          }}
        />
      </div>
    </div>
  );
}
