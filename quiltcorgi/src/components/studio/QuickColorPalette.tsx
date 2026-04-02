'use client';

import { useEffect, useState, useRef } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import type { Canvas as FabricCanvas } from 'fabric';

interface ColorEntry {
  color: string;
  timestamp: number;
}

const MAX_COLORS = 8;

export function QuickColorPalette() {
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);
  const fillColor = useCanvasStore((s) => s.fillColor);
  const setFillColor = useCanvasStore((s) => s.setFillColor);
  const [recentColors, setRecentColors] = useState<ColorEntry[]>([]);
  const lastColorRef = useRef<string | null>(null);

  // Track color usage - defer setState to avoid sync update in effect
  useEffect(() => {
    if (!fillColor || fillColor === lastColorRef.current) return;
    lastColorRef.current = fillColor;

    queueMicrotask(() => {
      setRecentColors((prev) => {
        const filtered = prev.filter((c) => c.color !== fillColor);
        const updated = [{ color: fillColor, timestamp: Date.now() }, ...filtered];
        return updated.slice(0, MAX_COLORS);
      });
    });
  }, [fillColor]);

  const applyColor = (color: string) => {
    if (!fabricCanvas) return;

    const canvas = fabricCanvas as FabricCanvas;
    const active = canvas.getActiveObject();

    if (active) {
      active.set({ fill: color });
      canvas.renderAll();
      const json = JSON.stringify(canvas.toJSON());
      useCanvasStore.getState().pushUndoState(json);
    }

    setFillColor(color);
  };

  if (recentColors.length === 0) return null;

  return (
    <div className="mb-4">
      <div className="text-[11px] font-medium text-on-surface/70 uppercase tracking-wider mb-2">
        Recent Colors
      </div>
      <div className="flex flex-wrap gap-2">
        {recentColors.map((entry) => (
          <button
            key={entry.color}
            type="button"
            onClick={() => applyColor(entry.color)}
            className="w-8 h-8 rounded-md border border-outline-variant/30 cursor-pointer hover:scale-110 transition-transform shadow-elevation-1"
            style={{ backgroundColor: entry.color }}
            title={entry.color}
          />
        ))}
      </div>
    </div>
  );
}
