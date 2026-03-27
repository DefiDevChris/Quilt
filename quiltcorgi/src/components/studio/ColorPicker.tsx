'use client';

import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';

export function ColorPicker() {
  const fillColor = useCanvasStore((s) => s.fillColor);
  const strokeColor = useCanvasStore((s) => s.strokeColor);
  const strokeWidth = useCanvasStore((s) => s.strokeWidth);
  const setFillColor = useCanvasStore((s) => s.setFillColor);
  const setStrokeColor = useCanvasStore((s) => s.setStrokeColor);
  const setStrokeWidth = useCanvasStore((s) => s.setStrokeWidth);
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);

  function applyToSelected(props: Record<string, unknown>) {
    if (!fabricCanvas) return;
    const canvas = fabricCanvas as {
      getActiveObjects: () => { set: (p: Record<string, unknown>) => void }[];
      renderAll: () => void;
      toJSON: () => Record<string, unknown>;
    };
    const active = canvas.getActiveObjects();
    if (active.length === 0) return;
    active.forEach((obj) => obj.set(props));
    canvas.renderAll();
    const json = JSON.stringify(canvas.toJSON());
    useCanvasStore.getState().pushUndoState(json);
    useProjectStore.getState().setDirty(true);
  }

  function handleFillChange(color: string) {
    setFillColor(color);
    applyToSelected({ fill: color });
  }

  function handleStrokeChange(color: string) {
    setStrokeColor(color);
    applyToSelected({ stroke: color });
  }

  function handleWidthChange(width: number) {
    setStrokeWidth(width);
    applyToSelected({ strokeWidth: width });
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1" title="Fill color">
        <span className="text-[10px] text-secondary">Fill</span>
        <input
          type="color"
          value={fillColor}
          onChange={(e) => handleFillChange(e.target.value)}
          className="w-6 h-6 rounded border border-outline-variant cursor-pointer p-0"
        />
      </div>
      <div className="flex items-center gap-1" title="Stroke color">
        <span className="text-[10px] text-secondary">Stroke</span>
        <input
          type="color"
          value={strokeColor}
          onChange={(e) => handleStrokeChange(e.target.value)}
          className="w-6 h-6 rounded border border-outline-variant cursor-pointer p-0"
        />
      </div>
      <input
        type="number"
        min={0.5}
        max={10}
        step={0.5}
        value={strokeWidth}
        onChange={(e) => handleWidthChange(Number(e.target.value))}
        className="w-12 rounded-sm border border-outline-variant px-1.5 py-0.5 text-[10px] text-on-surface"
        title="Stroke width"
      />
    </div>
  );
}
