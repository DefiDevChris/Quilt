'use client';

import { useState, useEffect, useCallback } from 'react';
import { useFabricLayout } from '@/hooks/useFabricLayout';
import { useCanvasStore } from '@/stores/canvasStore';

interface LayoutState {
  scaleX: number;
  scaleY: number;
  rotation: number;
  offsetX: number;
  offsetY: number;
  hasLayout: boolean;
}

const DEFAULT_STATE: LayoutState = {
  scaleX: 1,
  scaleY: 1,
  rotation: 0,
  offsetX: 0,
  offsetY: 0,
  hasLayout: false,
};

export function LayoutAdjuster() {
  const { updatePatternTransform, getPatternInfo } = useFabricLayout();
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);
  const [state, setState] = useState<LayoutState>(DEFAULT_STATE);

  // Refresh pattern info when selection changes
  const refreshPatternInfo = useCallback(async () => {
    const info = await getPatternInfo();
    if (info) {
      setState(info);
    } else {
      setState(DEFAULT_STATE);
    }
  }, [getPatternInfo]);

  useEffect(() => {
    if (!fabricCanvas) return;

    const handler = () => {
      refreshPatternInfo();
    };

    const canvas = fabricCanvas as {
      on: (event: string, handler: () => void) => void;
      off: (event: string, handler: () => void) => void;
    };

    canvas.on('selection:created', handler);
    canvas.on('selection:updated', handler);
    canvas.on('selection:cleared', handler);

    return () => {
      canvas.off('selection:created', handler);
      canvas.off('selection:updated', handler);
      canvas.off('selection:cleared', handler);
    };
  }, [fabricCanvas, refreshPatternInfo]);

  const handleChange = useCallback(
    (field: keyof LayoutState, value: number) => {
      const newState = { ...state, [field]: value };
      setState(newState);
      updatePatternTransform(
        newState.scaleX,
        newState.scaleY,
        newState.rotation,
        newState.offsetX,
        newState.offsetY
      );
    },
    [state, updatePatternTransform]
  );

  if (!state.hasLayout) return null;

  return (
    <div className="border-t border-[var(--color-border)] px-3 py-2">
      <h3 className="text-[14px] leading-[20px] font-medium text-[var(--color-text-dim)] mb-2">
        Layout Fill
      </h3>

      <div className="space-y-2">
        <div>
          <label className="flex items-center justify-between text-xs text-[var(--color-text-dim)]">
            <span>Scale X</span>
            <span className="text-xs text-[var(--color-text-dim)] font-mono">{state.scaleX.toFixed(2)}</span>
          </label>
          <input
            type="range"
            min={10}
            max={300}
            value={Math.round(state.scaleX * 100)}
            onChange={(e) => handleChange('scaleX', Number(e.target.value) / 100)}
            className="w-full accent-primary"
          />
        </div>

        <div>
          <label className="flex items-center justify-between text-xs text-[var(--color-text-dim)]">
            <span>Scale Y</span>
            <span className="text-xs text-[var(--color-text-dim)] font-mono">{state.scaleY.toFixed(2)}</span>
          </label>
          <input
            type="range"
            min={10}
            max={300}
            value={Math.round(state.scaleY * 100)}
            onChange={(e) => handleChange('scaleY', Number(e.target.value) / 100)}
            className="w-full accent-primary"
          />
        </div>

        <div>
          <label className="flex items-center justify-between text-xs text-[var(--color-text-dim)]">
            <span>Rotation</span>
            <span className="text-xs text-[var(--color-text-dim)] font-mono">
              {Math.round(state.rotation)}°
            </span>
          </label>
          <input
            type="range"
            min={0}
            max={360}
            value={Math.round(state.rotation)}
            onChange={(e) => handleChange('rotation', Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>

        <div>
          <label className="flex items-center justify-between text-xs text-[var(--color-text-dim)]">
            <span>Offset X</span>
            <span className="text-xs text-[var(--color-text-dim)] font-mono">
              {Math.round(state.offsetX)}px
            </span>
          </label>
          <input
            type="range"
            min={-200}
            max={200}
            value={Math.round(state.offsetX)}
            onChange={(e) => handleChange('offsetX', Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>

        <div>
          <label className="flex items-center justify-between text-xs text-[var(--color-text-dim)]">
            <span>Offset Y</span>
            <span className="text-xs text-[var(--color-text-dim)] font-mono">
              {Math.round(state.offsetY)}px
            </span>
          </label>
          <input
            type="range"
            min={-200}
            max={200}
            value={Math.round(state.offsetY)}
            onChange={(e) => handleChange('offsetY', Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>

        <button
          type="button"
          onClick={() => {
            setState(DEFAULT_STATE);
            updatePatternTransform(1, 1, 0, 0, 0);
          }}
          className="w-full rounded-lg bg-[var(--color-border)] px-2 py-1 text-xs text-[var(--color-text-dim)] hover:bg-[var(--color-secondary)]"
        >
          Reset Pattern Transform
        </button>
      </div>
    </div>
  );
}
