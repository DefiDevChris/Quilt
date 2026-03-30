'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useCanvasStore, type WorktableType } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';
import { TextToolOptions } from '@/components/studio/TextToolOptions';
import { ColorwayTools } from '@/components/studio/ColorwayTools';
import { SelectionPanel } from '@/components/studio/SelectionPanel';

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-label-sm uppercase text-secondary tracking-[0.02em] font-medium mb-3">
      {children}
    </h3>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  suffix,
  step = 1,
}: {
  label: string;
  value: string;
  onChange?: (val: string) => void;
  suffix?: string;
  step?: number;
}) {
  const increment = () => {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      onChange?.(String(parseFloat((num + step).toFixed(6))));
    }
  };

  const decrement = () => {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      onChange?.(String(parseFloat((num - step).toFixed(6))));
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <label className="text-body-sm text-secondary">{label}</label>
      <div className="flex items-center bg-surface-container rounded-sm h-9">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="flex-1 bg-transparent font-mono text-body-sm text-on-surface px-2 outline-none min-w-0"
        />
        {suffix && <span className="text-body-sm text-secondary pr-2">{suffix}</span>}
        <div className="flex flex-col border-l border-outline-variant/20">
          <button
            type="button"
            onClick={increment}
            className="px-1.5 h-[18px] flex items-center justify-center text-secondary hover:text-on-surface"
            aria-label={`Increase ${label}`}
          >
            <svg width="8" height="5" viewBox="0 0 8 5" fill="none">
              <path
                d="M1 4L4 1L7 4"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={decrement}
            className="px-1.5 h-[18px] flex items-center justify-center text-secondary hover:text-on-surface"
            aria-label={`Decrease ${label}`}
          >
            <svg width="8" height="5" viewBox="0 0 8 5" fill="none">
              <path
                d="M1 1L4 4L7 1"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange?: (val: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <div
        className={`w-4 h-4 rounded-sm flex items-center justify-center transition-colors ${
          checked ? 'bg-primary' : 'bg-surface-container'
        }`}
        onClick={() => onChange?.(!checked)}
        role="checkbox"
        aria-checked={checked}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            onChange?.(!checked);
          }
        }}
      >
        {checked && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path
              d="M1 4L3.5 6.5L9 1"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      <span className="text-body-sm text-on-surface group-hover:text-on-surface">{label}</span>
    </label>
  );
}

function QuiltPanel() {
  const canvasWidth = useProjectStore((s) => s.canvasWidth);
  const canvasHeight = useProjectStore((s) => s.canvasHeight);
  const gridSettings = useCanvasStore((s) => s.gridSettings);
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);

  const [blockWidth, setBlockWidth] = useState(() => canvasWidth.toFixed(3));
  const [blockHeight, setBlockHeight] = useState(() => canvasHeight.toFixed(3));
  const [snapsH, setSnapsH] = useState(() =>
    String(Math.max(1, Math.round(canvasWidth / Math.max(gridSettings.size, 0.01))))
  );
  const [snapsV, setSnapsV] = useState(() =>
    String(Math.max(1, Math.round(canvasHeight / Math.max(gridSettings.size, 0.01))))
  );
  const [snapToGrid, setSnapToGrid] = useState(() => gridSettings.snapToGrid);
  const [rotation, setRotation] = useState('0');
  const [shear, setShear] = useState('0');
  const [canvasColor, setCanvasColor] = useState('#ffffff');
  const colorInputRef = useRef<HTMLInputElement>(null);

  // Sync local state when store values change externally
  useEffect(() => {
    setBlockWidth(canvasWidth.toFixed(3));
  }, [canvasWidth]);
  useEffect(() => {
    setBlockHeight(canvasHeight.toFixed(3));
  }, [canvasHeight]);

  const pushUndo = useCallback(() => {
    if (!fabricCanvas) return;
    const canvas = fabricCanvas as { toJSON: () => Record<string, unknown> };
    const json = JSON.stringify(canvas.toJSON());
    useCanvasStore.getState().pushUndoState(json);
    useProjectStore.getState().setDirty(true);
  }, [fabricCanvas]);

  const handleBlockWidthChange = useCallback(
    (val: string) => {
      setBlockWidth(val);
      const num = parseFloat(val);
      if (!isNaN(num) && num > 0) {
        pushUndo();
        useProjectStore.getState().setCanvasWidth(num);
        // Recompute snaps from new width
        const gridSize = useCanvasStore.getState().gridSettings.size;
        setSnapsH(String(Math.max(1, Math.round(num / Math.max(gridSize, 0.01)))));
      }
    },
    [pushUndo]
  );

  const handleBlockHeightChange = useCallback(
    (val: string) => {
      setBlockHeight(val);
      const num = parseFloat(val);
      if (!isNaN(num) && num > 0) {
        pushUndo();
        useProjectStore.getState().setCanvasHeight(num);
        const gridSize = useCanvasStore.getState().gridSettings.size;
        setSnapsV(String(Math.max(1, Math.round(num / Math.max(gridSize, 0.01)))));
      }
    },
    [pushUndo]
  );

  const handleSnapsHChange = useCallback(
    (val: string) => {
      setSnapsH(val);
      const num = parseInt(val, 10);
      if (!isNaN(num) && num > 0) {
        pushUndo();
        const width = useProjectStore.getState().canvasWidth;
        useCanvasStore.getState().setGridSettings({ size: width / num });
      }
    },
    [pushUndo]
  );

  const handleSnapsVChange = useCallback(
    (val: string) => {
      setSnapsV(val);
      const num = parseInt(val, 10);
      if (!isNaN(num) && num > 0) {
        pushUndo();
        const height = useProjectStore.getState().canvasHeight;
        useCanvasStore.getState().setGridSettings({ size: height / num });
      }
    },
    [pushUndo]
  );

  const handleSnapToGridChange = useCallback(
    (val: boolean) => {
      setSnapToGrid(val);
      pushUndo();
      useCanvasStore.getState().setGridSettings({ snapToGrid: val });
    },
    [pushUndo]
  );

  const handleCanvasColorClick = useCallback(() => {
    colorInputRef.current?.click();
  }, []);

  const handleCanvasColorChange = useCallback(
    async (hex: string) => {
      setCanvasColor(hex);
      if (!fabricCanvas) return;
      pushUndo();
      const canvas = fabricCanvas as {
        set: (props: Record<string, unknown>) => void;
        renderAll: () => void;
      };
      canvas.set({ backgroundColor: hex });
      canvas.renderAll();
    },
    [fabricCanvas, pushUndo]
  );

  // Read initial canvas background color
  useEffect(() => {
    if (!fabricCanvas) return;
    const canvas = fabricCanvas as { backgroundColor?: string };
    if (canvas.backgroundColor && typeof canvas.backgroundColor === 'string') {
      setCanvasColor(canvas.backgroundColor);
    }
  }, [fabricCanvas]);

  const applyTransform = useCallback(
    async (transformFn: (active: any, canvas: any) => void) => {
      if (!fabricCanvas) return;
      const fabric = await import('fabric');
      const canvas = fabricCanvas as InstanceType<typeof fabric.Canvas>;
      const active = canvas.getActiveObject();
      if (!active) return;

      transformFn(active, canvas);
      active.setCoords();
      canvas.renderAll();
      const json = JSON.stringify(canvas.toJSON());
      useCanvasStore.getState().pushUndoState(json);
      useProjectStore.getState().setDirty(true);
    },
    [fabricCanvas]
  );

  return (
    <div className="flex flex-col gap-[2.75rem]">
      {/* Selection details: shape preview, dimensions, color/fabric picker */}
      <SelectionPanel />

      {/* Precision Bar */}
      <div>
        <SectionTitle>Precision Bar</SectionTitle>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <NumberInput
            label="Block Width"
            value={blockWidth}
            onChange={handleBlockWidthChange}
            suffix="in"
          />
          <NumberInput
            label="Block Height"
            value={blockHeight}
            onChange={handleBlockHeightChange}
            suffix="in"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <NumberInput label="Snaps Horiz" value={snapsH} onChange={handleSnapsHChange} />
          <NumberInput label="Snaps Vert" value={snapsV} onChange={handleSnapsVChange} />
        </div>
        <Checkbox label="Snap to Grid" checked={snapToGrid} onChange={handleSnapToGridChange} />
      </div>

      {/* Rotate & Shear */}
      <div>
        <SectionTitle>Rotate &amp; Shear</SectionTitle>
        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={() => applyTransform((active) => active.rotate(0))}
            className="flex-1 bg-surface-container text-on-surface rounded-md py-2 text-body-sm font-medium hover:bg-surface-container-high transition-colors"
          >
            Straighten
          </button>
          <button
            type="button"
            onClick={() => applyTransform((active) => active.rotate(parseFloat(rotation)))}
            className="flex-1 bg-surface-container text-on-surface rounded-md py-2 text-body-sm font-medium hover:bg-surface-container-high transition-colors"
          >
            Apply
          </button>
        </div>
        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={() => applyTransform((active) => active.set({ flipX: !active.flipX }))}
            className="flex-1 bg-surface-container text-on-surface rounded-md py-2 text-body-sm font-medium hover:bg-surface-container-high transition-colors"
          >
            Flip Horiz
          </button>
          <button
            type="button"
            onClick={() => applyTransform((active) => active.set({ flipY: !active.flipY }))}
            className="flex-1 bg-surface-container text-on-surface rounded-md py-2 text-body-sm font-medium hover:bg-surface-container-high transition-colors"
          >
            Flip Vert
          </button>
        </div>
        <div className="flex items-end gap-2 mb-3">
          <div className="flex-1">
            <NumberInput label="Rotation" value={rotation} onChange={setRotation} suffix="deg" />
          </div>
          <button
            type="button"
            onClick={() => applyTransform((active) => active.rotate(parseFloat(rotation)))}
            className="bg-primary text-on-primary rounded-md px-3 h-9 text-body-sm font-medium hover:bg-primary/90 transition-colors"
          >
            APPLY
          </button>
        </div>
        <div className="flex items-end gap-2 mb-3">
          <div className="flex-1">
            <NumberInput label="Shear" value={shear} onChange={setShear} suffix="deg" />
          </div>
          <button
            type="button"
            onClick={() => applyTransform((active) => active.set({ skewX: parseFloat(shear) }))}
            className="bg-primary text-on-primary rounded-md px-3 h-9 text-body-sm font-medium hover:bg-primary/90 transition-colors"
          >
            APPLY
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-body-sm text-secondary">Canvas Color</span>
          <div
            className="w-6 h-6 rounded-sm border border-outline-variant/30 cursor-pointer"
            style={{ backgroundColor: canvasColor }}
            onClick={handleCanvasColorClick}
          />
          <input
            ref={colorInputRef}
            type="color"
            value={canvasColor}
            onChange={(e) => handleCanvasColorChange(e.target.value)}
            className="sr-only"
          />
        </div>
      </div>

      {/* Colorway Tools */}
      <ColorwayTools />

      {/* Text Tool Properties (shown when text object selected) */}
      <TextToolOptions />
    </div>
  );
}

function BlockPanel() {
  const canvasWidth = useProjectStore((s) => s.canvasWidth);
  const canvasHeight = useProjectStore((s) => s.canvasHeight);
  const gridSettings = useCanvasStore((s) => s.gridSettings);
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);

  const [blockWidth, setBlockWidth] = useState(() => canvasWidth.toFixed(3));
  const [blockHeight, setBlockHeight] = useState(() => canvasHeight.toFixed(3));
  const [snapsH, setSnapsH] = useState(() =>
    String(Math.max(1, Math.round(canvasWidth / Math.max(gridSettings.size, 0.01))))
  );
  const [snapsV, setSnapsV] = useState(() =>
    String(Math.max(1, Math.round(canvasHeight / Math.max(gridSettings.size, 0.01))))
  );
  const [snapToGrid, setSnapToGrid] = useState(() => gridSettings.snapToGrid);

  useEffect(() => {
    setBlockWidth(canvasWidth.toFixed(3));
  }, [canvasWidth]);
  useEffect(() => {
    setBlockHeight(canvasHeight.toFixed(3));
  }, [canvasHeight]);

  const pushUndo = useCallback(() => {
    if (!fabricCanvas) return;
    const canvas = fabricCanvas as { toJSON: () => Record<string, unknown> };
    const json = JSON.stringify(canvas.toJSON());
    useCanvasStore.getState().pushUndoState(json);
    useProjectStore.getState().setDirty(true);
  }, [fabricCanvas]);

  const handleBlockWidthChange = useCallback(
    (val: string) => {
      setBlockWidth(val);
      const num = parseFloat(val);
      if (!isNaN(num) && num > 0) {
        pushUndo();
        useProjectStore.getState().setCanvasWidth(num);
        const gridSize = useCanvasStore.getState().gridSettings.size;
        setSnapsH(String(Math.max(1, Math.round(num / Math.max(gridSize, 0.01)))));
      }
    },
    [pushUndo]
  );

  const handleBlockHeightChange = useCallback(
    (val: string) => {
      setBlockHeight(val);
      const num = parseFloat(val);
      if (!isNaN(num) && num > 0) {
        pushUndo();
        useProjectStore.getState().setCanvasHeight(num);
        const gridSize = useCanvasStore.getState().gridSettings.size;
        setSnapsV(String(Math.max(1, Math.round(num / Math.max(gridSize, 0.01)))));
      }
    },
    [pushUndo]
  );

  const handleSnapsHChange = useCallback(
    (val: string) => {
      setSnapsH(val);
      const num = parseInt(val, 10);
      if (!isNaN(num) && num > 0) {
        const newSize = canvasWidth / num;
        useCanvasStore.getState().setGridSettings({ size: newSize });
      }
    },
    [canvasWidth]
  );

  const handleSnapsVChange = useCallback(
    (val: string) => {
      setSnapsV(val);
      const num = parseInt(val, 10);
      if (!isNaN(num) && num > 0) {
        const newSize = canvasHeight / num;
        useCanvasStore.getState().setGridSettings({ size: newSize });
      }
    },
    [canvasHeight]
  );

  const handleSnapToGridChange = useCallback((val: boolean) => {
    setSnapToGrid(val);
    useCanvasStore.getState().setGridSettings({ snapToGrid: val });
  }, []);

  return (
    <div className="flex flex-col gap-[2.75rem]">
      <div>
        <h3 className="text-headline-sm font-semibold text-on-surface mb-4">Block Properties</h3>
      </div>

      <div>
        <SectionTitle>Precision</SectionTitle>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <NumberInput label="Block Width" value={blockWidth} onChange={handleBlockWidthChange} />
          <NumberInput
            label="Block Height"
            value={blockHeight}
            onChange={handleBlockHeightChange}
          />
        </div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <NumberInput label="Snaps Horiz" value={snapsH} onChange={handleSnapsHChange} />
          <NumberInput label="Snaps Vert" value={snapsV} onChange={handleSnapsVChange} />
        </div>
        <div className="flex flex-col gap-2">
          <Checkbox label="Snap to Grid" checked={snapToGrid} onChange={handleSnapToGridChange} />
        </div>
      </div>
    </div>
  );
}

function ImagePanel() {
  const [rotation, setRotation] = useState('0');
  const [shearH, setShearH] = useState(0);
  const [shearV, setShearV] = useState(0);
  const [cropAfterRotation, setCropAfterRotation] = useState(true);
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);

  const applyTransform = useCallback(
    async (transformFn: (active: any, canvas: any) => void) => {
      if (!fabricCanvas) return;
      const fabric = await import('fabric');
      const canvas = fabricCanvas as InstanceType<typeof fabric.Canvas>;
      const active = canvas.getActiveObject();
      if (!active) return;

      transformFn(active, canvas);
      active.setCoords();
      canvas.renderAll();
      const json = JSON.stringify(canvas.toJSON());
      useCanvasStore.getState().pushUndoState(json);
      useProjectStore.getState().setDirty(true);
    },
    [fabricCanvas]
  );

  return (
    <div className="flex flex-col gap-[2.75rem]">
      <div>
        <h3 className="text-headline-sm font-semibold text-on-surface mb-4">
          Rotation &amp; Shear
        </h3>

        {/* Rotate buttons */}
        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={() => applyTransform((active) => active.rotate((active.angle ?? 0) + 90))}
            className="flex-1 bg-surface-container text-on-surface rounded-md py-2.5 text-body-sm font-medium hover:bg-surface-container-high transition-colors"
          >
            Rotate 90&#176;
          </button>
          <button
            type="button"
            onClick={() => applyTransform((active) => active.rotate((active.angle ?? 0) - 90))}
            className="flex-1 bg-surface-container text-on-surface rounded-md py-2.5 text-body-sm font-medium hover:bg-surface-container-high transition-colors"
          >
            Rotate -90&#176;
          </button>
        </div>

        {/* Flip buttons */}
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => applyTransform((active) => active.set({ flipX: !active.flipX }))}
            className="flex-1 bg-surface-container text-on-surface rounded-md py-2.5 text-body-sm font-medium hover:bg-surface-container-high transition-colors"
          >
            Flip Horiz
          </button>
          <button
            type="button"
            onClick={() => applyTransform((active) => active.set({ flipY: !active.flipY }))}
            className="flex-1 bg-surface-container text-on-surface rounded-md py-2.5 text-body-sm font-medium hover:bg-surface-container-high transition-colors"
          >
            Flip Vert
          </button>
        </div>

        {/* Precise Rotation */}
        <div className="mb-4">
          <NumberInput
            label="Precise Rotation"
            value={rotation}
            onChange={setRotation}
            suffix="deg"
          />
        </div>

        {/* Shear Horizontally */}
        <div className="mb-3">
          <label className="text-body-sm text-secondary mb-1 block">Shear Horizontally</label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={-45}
              max={45}
              value={shearH}
              onChange={(e) => setShearH(Number(e.target.value))}
              className="flex-1 h-1 appearance-none rounded-full bg-surface-container-highest accent-primary"
            />
            <span className="font-mono text-body-sm text-secondary w-8 text-right">
              {shearH}&#176;
            </span>
          </div>
        </div>

        {/* Shear Vertically */}
        <div className="mb-4">
          <label className="text-body-sm text-secondary mb-1 block">Shear Vertically</label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={-45}
              max={45}
              value={shearV}
              onChange={(e) => setShearV(Number(e.target.value))}
              className="flex-1 h-1 appearance-none rounded-full bg-surface-container-highest accent-primary"
            />
            <span className="font-mono text-body-sm text-secondary w-8 text-right">
              {shearV}&#176;
            </span>
          </div>
        </div>

        {/* Straighten button */}
        <button
          type="button"
          onClick={() =>
            applyTransform((active) => {
              active.rotate(parseFloat(rotation) || 0);
              active.set({ skewX: shearH, skewY: shearV });
            })
          }
          className="w-full bg-primary text-on-primary rounded-md py-2.5 text-body-sm font-medium hover:bg-primary/90 transition-colors mb-4"
        >
          Straighten (Apply)
        </button>
      </div>

      {/* Background */}
      <div>
        <SectionTitle>Background</SectionTitle>
        <Checkbox
          label="Crop image after rotation"
          checked={cropAfterRotation}
          onChange={setCropAfterRotation}
        />
      </div>
    </div>
  );
}

const PANELS: Record<Exclude<WorktableType, 'print'>, React.FC> = {
  quilt: QuiltPanel,
  block: BlockPanel,
  image: ImagePanel,
};

export function ContextPanel() {
  const activeWorktable = useCanvasStore((s) => s.activeWorktable);

  if (activeWorktable === 'print') return null;

  const PanelContent = PANELS[activeWorktable];

  return (
    <div className="w-70 bg-surface flex-shrink-0 overflow-y-auto">
      <div className="p-4">
        <PanelContent />
      </div>
    </div>
  );
}
