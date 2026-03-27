'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';
import { pixelsToUnits, unitsToPixels, getUnitLabel } from '@/lib/canvas-utils';

interface ObjectInfo {
  width: number;
  height: number;
  area: number;
  rotation: number;
  x: number;
  y: number;
}

export function QuickInfo() {
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);
  const unitSystem = useCanvasStore((s) => s.unitSystem);
  const selectedObjectIds = useCanvasStore((s) => s.selectedObjectIds);
  const [info, setInfo] = useState<ObjectInfo | null>(null);
  const [panelPos, setPanelPos] = useState({ x: 0, y: 0 });
  const [editField, setEditField] = useState<keyof ObjectInfo | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const updateInfo = useCallback(async () => {
    if (!fabricCanvas) {
      setInfo(null);
      return;
    }
    const fabric = await import('fabric');
    const canvas = fabricCanvas as InstanceType<typeof fabric.Canvas>;
    const active = canvas.getActiveObject();

    if (!active) {
      setInfo(null);
      return;
    }

    const widthPx = (active.width ?? 0) * (active.scaleX ?? 1);
    const heightPx = (active.height ?? 0) * (active.scaleY ?? 1);
    const w = pixelsToUnits(widthPx, unitSystem);
    const h = pixelsToUnits(heightPx, unitSystem);

    setInfo({
      width: parseFloat(w.toFixed(2)),
      height: parseFloat(h.toFixed(2)),
      area: parseFloat((w * h).toFixed(2)),
      rotation: parseFloat(((active.angle ?? 0) % 360).toFixed(1)),
      x: parseFloat(pixelsToUnits(active.left ?? 0, unitSystem).toFixed(2)),
      y: parseFloat(pixelsToUnits(active.top ?? 0, unitSystem).toFixed(2)),
    });

    // Position panel near the object but not overlapping
    const bound = active.getBoundingRect();
    const vpt = canvas.viewportTransform ?? [1, 0, 0, 1, 0, 0];
    const screenX = bound.left * vpt[0] + vpt[4] + bound.width * vpt[0] + 16;
    const screenY = bound.top * vpt[3] + vpt[5];
    setPanelPos({ x: screenX, y: Math.max(8, screenY) });
  }, [fabricCanvas, unitSystem]);

  useEffect(() => {
    updateInfo();
  }, [selectedObjectIds, updateInfo]);

  // Listen to real-time object changes
  useEffect(() => {
    if (!fabricCanvas) return;

    let cleanup: (() => void) | null = null;

    (async () => {
      const fabric = await import('fabric');
      const canvas = fabricCanvas as InstanceType<typeof fabric.Canvas>;

      const handler = () => updateInfo();
      canvas.on('object:moving', handler as never);
      canvas.on('object:scaling', handler as never);
      canvas.on('object:rotating', handler as never);
      canvas.on('object:modified', handler as never);

      cleanup = () => {
        canvas.off('object:moving', handler as never);
        canvas.off('object:scaling', handler as never);
        canvas.off('object:rotating', handler as never);
        canvas.off('object:modified', handler as never);
      };
    })();

    return () => {
      cleanup?.();
    };
  }, [fabricCanvas, updateInfo]);

  const applyEdit = useCallback(
    async (field: keyof ObjectInfo, value: string) => {
      const numVal = parseFloat(value);
      if (isNaN(numVal) || numVal < 0) return;
      if (!fabricCanvas) return;

      const fabric = await import('fabric');
      const canvas = fabricCanvas as InstanceType<typeof fabric.Canvas>;
      const active = canvas.getActiveObject();
      if (!active) return;

      switch (field) {
        case 'width': {
          const targetPx = unitsToPixels(numVal, unitSystem);
          const scale = targetPx / (active.width ?? 1);
          active.set({ scaleX: scale });
          break;
        }
        case 'height': {
          const targetPx = unitsToPixels(numVal, unitSystem);
          const scale = targetPx / (active.height ?? 1);
          active.set({ scaleY: scale });
          break;
        }
        case 'rotation':
          active.rotate(numVal);
          break;
        case 'x':
          active.set({ left: unitsToPixels(numVal, unitSystem) });
          break;
        case 'y':
          active.set({ top: unitsToPixels(numVal, unitSystem) });
          break;
      }

      active.setCoords();
      canvas.renderAll();
      const json = JSON.stringify(canvas.toJSON());
      useCanvasStore.getState().pushUndoState(json);
      useProjectStore.getState().setDirty(true);
      setEditField(null);
      updateInfo();
    },
    [fabricCanvas, unitSystem, updateInfo]
  );

  if (!info) return null;

  const unit = getUnitLabel(unitSystem);

  const fields: { key: keyof ObjectInfo; label: string; suffix: string }[] = [
    { key: 'width', label: 'W', suffix: unit },
    { key: 'height', label: 'H', suffix: unit },
    { key: 'area', label: 'Area', suffix: `${unit}²` },
    { key: 'rotation', label: '∠', suffix: '°' },
    { key: 'x', label: 'X', suffix: unit },
    { key: 'y', label: 'Y', suffix: unit },
  ];

  return (
    <div
      className="absolute z-40 min-w-[160px] rounded-lg border border-outline-variant bg-surface p-2 shadow-elevation-3"
      style={{ left: panelPos.x, top: panelPos.y }}
    >
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-secondary">
        Quick Info
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
        {fields.map(({ key, label, suffix }) => (
          <div key={key} className="flex items-center gap-1 text-xs">
            <span className="w-8 text-secondary">{label}</span>
            {editField === key ? (
              <input
                ref={inputRef}
                type="number"
                step="0.01"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => applyEdit(key, editValue)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') applyEdit(key, editValue);
                  if (e.key === 'Escape') setEditField(null);
                }}
                className="w-16 rounded border border-primary bg-white px-1 py-0 font-mono text-xs text-on-surface outline-none"
                autoFocus
              />
            ) : key === 'area' ? (
              <span className="font-mono text-on-surface">
                {info[key]}{suffix}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setEditField(key);
                  setEditValue(String(info[key]));
                }}
                className="cursor-text rounded px-0.5 font-mono text-on-surface hover:bg-background"
                title="Click to edit"
              >
                {info[key]}{suffix}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
