'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { FabricObject, Canvas as FabricCanvas } from 'fabric';
import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';
import { TextToolOptions } from '@/components/studio/TextToolOptions';
import { EasyDrawOptions } from '@/components/studio/EasyDrawOptions';
import { ColorwayTools } from '@/components/studio/ColorwayTools';
import { SelectionPanel } from '@/components/studio/SelectionPanel';

import { SectionTitle } from '@/components/ui/SectionTitle';
import { NumberInput } from '@/components/ui/NumberInput';
import { Checkbox } from '@/components/ui/Checkbox';
import { QuickColorPalette } from '@/components/studio/QuickColorPalette';

function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
}: {
  readonly title: string;
  readonly defaultOpen?: boolean;
  readonly children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-outline-variant/10 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between py-2.5 px-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-on-surface/70 transition-shadow shadow-elevation-1 hover:shadow-elevation-2 rounded-md"
      >
        {title}
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          <path d="M3 4.5L6 7.5L9 4.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && <div className="pb-3">{children}</div>}
    </div>
  );
}

function usePrecisionControls() {
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

  return {
    blockWidth,
    blockHeight,
    snapsH,
    snapsV,
    snapToGrid,
    handleBlockWidthChange,
    handleBlockHeightChange,
    handleSnapsHChange,
    handleSnapsVChange,
    handleSnapToGridChange,
    pushUndo,
    fabricCanvas,
  };
}

function PrecisionBar() {
  const {
    blockWidth,
    blockHeight,
    snapsH,
    snapsV,
    snapToGrid,
    handleBlockWidthChange,
    handleBlockHeightChange,
    handleSnapsHChange,
    handleSnapsVChange,
    handleSnapToGridChange,
  } = usePrecisionControls();

  return (
    <div>
      <SectionTitle>Precision</SectionTitle>
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
  );
}

function RotateAndShear({ includeCanvasColor = true }: { includeCanvasColor?: boolean }) {
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);
  const [rotation, setRotation] = useState('0');
  const [shearH, setShearH] = useState('0');
  const [shearV, setShearV] = useState('0');
  const [canvasColor, setCanvasColor] = useState(() => {
    if (!fabricCanvas) return '#ffffff';
    const canvas = fabricCanvas as { backgroundColor?: string };
    return (canvas.backgroundColor && typeof canvas.backgroundColor === 'string') 
      ? canvas.backgroundColor 
      : '#ffffff';
  });
  const colorInputRef = useRef<HTMLInputElement>(null);
  // Refs track the latest typed value so applyFn reads current data even before
  // React state flushes (NumberInput commits on blur/Enter which is async state).
  const rotationRef = useRef('0');
  const shearHRef = useRef('0');
  const shearVRef = useRef('0');

  const applyTransform = useCallback(
    async (transformFn: (active: FabricObject, canvas: FabricCanvas) => void) => {
      if (!fabricCanvas) return;
      const canvas = fabricCanvas as FabricCanvas;
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

  const applyRotation = useCallback(() => {
    applyTransform((active) => active.rotate(parseFloat(rotationRef.current) || 0));
  }, [applyTransform]);

  const applyShearH = useCallback(() => {
    applyTransform((active) => active.set({ skewX: parseFloat(shearHRef.current) || 0 }));
  }, [applyTransform]);

  const applyShearV = useCallback(() => {
    applyTransform((active) => active.set({ skewY: parseFloat(shearVRef.current) || 0 }));
  }, [applyTransform]);

  const handleRotationKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') applyRotation();
    },
    [applyRotation]
  );

  const handleShearHKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') applyShearH();
    },
    [applyShearH]
  );

  const handleShearVKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') applyShearV();
    },
    [applyShearV]
  );

  const handleCanvasColorClick = () => colorInputRef.current?.click();
  const handleCanvasColorChange = (hex: string) => {
    setCanvasColor(hex);
    if (!fabricCanvas) return;
    const canvas = fabricCanvas as {
      set: (props: Record<string, unknown>) => void;
      renderAll: () => void;
      toJSON: () => Record<string, unknown>;
    };
    canvas.set({ backgroundColor: hex });
    canvas.renderAll();
    useCanvasStore.getState().pushUndoState(JSON.stringify(canvas.toJSON()));
  };

  return (
    <div>
      <SectionTitle>Rotate &amp; Shear</SectionTitle>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <button
          type="button"
          onClick={() => applyTransform((active) => active.rotate((active.angle ?? 0) + 90))}
          className="bg-surface-container text-on-surface rounded-md py-2 text-[12px] font-medium hover:bg-surface-container-high transition-colors"
        >
          +90&#176;
        </button>
        <button
          type="button"
          onClick={() => applyTransform((active) => active.rotate((active.angle ?? 0) - 90))}
          className="bg-surface-container text-on-surface rounded-md py-2 text-[12px] font-medium hover:bg-surface-container-high transition-colors"
        >
          -90&#176;
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          type="button"
          onClick={() => applyTransform((active) => active.set({ flipX: !active.flipX }))}
          className="bg-surface-container text-on-surface rounded-md py-2 text-[12px] font-medium hover:bg-surface-container-high transition-colors"
        >
          Flip H
        </button>
        <button
          type="button"
          onClick={() => applyTransform((active) => active.set({ flipY: !active.flipY }))}
          className="bg-surface-container text-on-surface rounded-md py-2 text-[12px] font-medium hover:bg-surface-container-high transition-colors"
        >
          Flip V
        </button>
      </div>

      <div className="mb-3" onKeyDown={handleRotationKeyDown}>
        <NumberInput
          label="Rotation"
          value={rotation}
          onChange={(val) => {
            setRotation(val);
            rotationRef.current = val;
          }}
          suffix="deg"
        />
      </div>

      <div className="mb-3" onKeyDown={handleShearHKeyDown}>
        <NumberInput
          label="Skew X"
          value={shearH}
          onChange={(val) => {
            setShearH(val);
            shearHRef.current = val;
          }}
          suffix="deg"
        />
      </div>

      <div className="mb-4" onKeyDown={handleShearVKeyDown}>
        <NumberInput
          label="Skew Y"
          value={shearV}
          onChange={(val) => {
            setShearV(val);
            shearVRef.current = val;
          }}
          suffix="deg"
        />
      </div>

      <button
        type="button"
        onClick={() =>
          applyTransform((active) => {
            active.rotate(0);
            active.set({ skewX: 0, skewY: 0 });
          })
        }
        className="w-full bg-surface-container text-on-surface/80 rounded-md py-2 text-[12px] font-medium hover:bg-surface-container-high hover:text-on-surface transition-colors mb-4 border border-outline-variant/10"
      >
        Reset Transform
      </button>

      {includeCanvasColor && (
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] font-medium text-on-surface/70 uppercase tracking-wider">
            Canvas
          </span>
          <div
            className="w-6 h-6 rounded-md border border-outline-variant/30 cursor-pointer shadow-elevation-1"
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
      )}
    </div>
  );
}

function QuiltPanel() {
  return (
    <div className="flex flex-col">
      <CollapsibleSection title="Selection" defaultOpen={true}>
        <SelectionPanel />
      </CollapsibleSection>
      <CollapsibleSection title="Colors" defaultOpen={true}>
        <QuickColorPalette />
      </CollapsibleSection>
      <CollapsibleSection title="Precision">
        <PrecisionBar />
      </CollapsibleSection>
      <CollapsibleSection title="Rotate & Shear">
        <RotateAndShear includeCanvasColor={true} />
      </CollapsibleSection>
      <CollapsibleSection title="Colorway">
        <ColorwayTools />
      </CollapsibleSection>
      <CollapsibleSection title="Text">
        <TextToolOptions />
      </CollapsibleSection>
      <CollapsibleSection title="Easy Draw">
        <EasyDrawOptions />
      </CollapsibleSection>
    </div>
  );
}

function BlockPanel() {
  return (
    <div className="flex flex-col">
      <CollapsibleSection title="Precision" defaultOpen={true}>
        <PrecisionBar />
      </CollapsibleSection>
      <CollapsibleSection title="Easy Draw">
        <EasyDrawOptions />
      </CollapsibleSection>
    </div>
  );
}

const PANELS: Record<'quilt' | 'block', React.FC> = {
  quilt: QuiltPanel,
  block: BlockPanel,
};

export function ContextPanel() {
  const activeWorktable = useCanvasStore((s) => s.activeWorktable);

  if (activeWorktable === 'print' || activeWorktable === 'image') return null;

  const PanelContent = PANELS[activeWorktable];

  return (
    <div className="w-[280px] bg-surface flex-shrink-0 overflow-y-auto overflow-x-hidden border-l border-outline-variant/15">
      <div className="px-4 py-5">
        <PanelContent />
      </div>
    </div>
  );
}
