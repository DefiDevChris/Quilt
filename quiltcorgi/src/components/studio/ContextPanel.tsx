'use client';

import { useState } from 'react';
import { useCanvasStore, type WorktableType } from '@/stores/canvasStore';
import { TextToolOptions } from '@/components/studio/TextToolOptions';
import { ColorwayTools } from '@/components/studio/ColorwayTools';

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
}: {
  label: string;
  value: string;
  onChange?: (val: string) => void;
  suffix?: string;
}) {
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
  const [blockWidth, setBlockWidth] = useState('12.000');
  const [blockHeight, setBlockHeight] = useState('12.000');
  const [snapsH, setSnapsH] = useState('24');
  const [snapsV, setSnapsV] = useState('24');
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [rotation, setRotation] = useState('0');
  const [shear, setShear] = useState('0');

  const SWATCHES = ['#D4883C', '#8B4513', '#F5DEB3', '#2E4057', '#7B3F00', '#A0522D'];

  return (
    <div className="flex flex-col gap-[2.75rem]">
      {/* Sketchbook Fabrics & Colors */}
      <div>
        <SectionTitle>Sketchbook Fabrics &amp; Colors</SectionTitle>
        <div className="flex gap-2 flex-wrap mb-2">
          {SWATCHES.map((color) => (
            <div
              key={color}
              className="w-14 h-14 rounded-sm cursor-pointer hover:ring-2 hover:ring-primary/30 transition-shadow"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <button type="button" className="text-primary text-body-sm font-medium hover:underline">
          Open Library
        </button>
      </div>

      {/* Precision Bar */}
      <div>
        <SectionTitle>Precision Bar</SectionTitle>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <NumberInput label="Block Width" value={blockWidth} onChange={setBlockWidth} />
          <NumberInput label="Block Height" value={blockHeight} onChange={setBlockHeight} />
        </div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <NumberInput label="Snaps Horiz" value={snapsH} onChange={setSnapsH} />
          <NumberInput label="Snaps Vert" value={snapsV} onChange={setSnapsV} />
        </div>
        <Checkbox label="Snap to Grid" checked={snapToGrid} onChange={setSnapToGrid} />
      </div>

      {/* Rotate & Shear */}
      <div>
        <SectionTitle>Rotate &amp; Shear</SectionTitle>
        <div className="flex gap-2 mb-3">
          <button
            type="button"
            className="flex-1 bg-surface-container text-on-surface rounded-md py-2 text-body-sm font-medium hover:bg-surface-container-high transition-colors"
          >
            Straighten
          </button>
          <button
            type="button"
            className="flex-1 bg-surface-container text-on-surface rounded-md py-2 text-body-sm font-medium hover:bg-surface-container-high transition-colors"
          >
            Apply
          </button>
        </div>
        <div className="flex gap-2 mb-3">
          <button
            type="button"
            className="flex-1 bg-surface-container text-on-surface rounded-md py-2 text-body-sm font-medium hover:bg-surface-container-high transition-colors"
          >
            Flip Horiz
          </button>
          <button
            type="button"
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
            className="bg-primary text-white rounded-md px-3 h-9 text-body-sm font-medium hover:opacity-90 transition-opacity"
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
            className="bg-primary text-white rounded-md px-3 h-9 text-body-sm font-medium hover:opacity-90 transition-opacity"
          >
            APPLY
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-body-sm text-secondary">Canvas Color</span>
          <div className="w-6 h-6 rounded-sm bg-white border border-outline-variant/30 cursor-pointer" />
        </div>
      </div>

      {/* Colorway Tools */}
      <ColorwayTools />

      {/* Text Tool Properties (shown when text object selected) */}
      <TextToolOptions />

      {/* Print Capabilities */}
      <div>
        <SectionTitle>Print Capabilities</SectionTitle>
        <div className="flex flex-col">
          {['Block Overview', 'Cutting Diagram', 'Patch Count', 'Templates'].map((item) => (
            <button
              key={item}
              type="button"
              className="flex items-center justify-between py-2.5 text-body-md text-on-surface hover:bg-surface-container rounded-md px-2 transition-colors"
            >
              <span>{item}</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M6 4L10 8L6 12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function BlockPanel() {
  const [blockWidth, setBlockWidth] = useState('12.000');
  const [blockHeight, setBlockHeight] = useState('12.000');
  const [snapsH, setSnapsH] = useState('24');
  const [snapsV, setSnapsV] = useState('24');
  const [graphH, setGraphH] = useState('4');
  const [graphV, setGraphV] = useState('4');
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [snapToNodes, setSnapToNodes] = useState(false);

  return (
    <div className="flex flex-col gap-[2.75rem]">
      <div>
        <h3 className="text-headline-sm font-semibold text-on-surface mb-4">Block Properties</h3>
      </div>

      <div>
        <SectionTitle>Precision</SectionTitle>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <NumberInput label="Block Width" value={blockWidth} onChange={setBlockWidth} />
          <NumberInput label="Block Height" value={blockHeight} onChange={setBlockHeight} />
        </div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <NumberInput label="Snaps Horiz" value={snapsH} onChange={setSnapsH} />
          <NumberInput label="Snaps Vert" value={snapsV} onChange={setSnapsV} />
        </div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <NumberInput label="Graph Horiz" value={graphH} onChange={setGraphH} />
          <NumberInput label="Graph Vert" value={graphV} onChange={setGraphV} />
        </div>
        <div className="flex flex-col gap-2">
          <Checkbox label="Snap to Grid" checked={snapToGrid} onChange={setSnapToGrid} />
          <Checkbox label="Snap to Nodes" checked={snapToNodes} onChange={setSnapToNodes} />
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
            className="flex-1 bg-surface-container text-on-surface rounded-md py-2.5 text-body-sm font-medium hover:bg-surface-container-high transition-colors"
          >
            Rotate 90&#176;
          </button>
          <button
            type="button"
            className="flex-1 bg-surface-container text-on-surface rounded-md py-2.5 text-body-sm font-medium hover:bg-surface-container-high transition-colors"
          >
            Rotate -90&#176;
          </button>
        </div>

        {/* Flip buttons */}
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            className="flex-1 bg-surface-container text-on-surface rounded-md py-2.5 text-body-sm font-medium hover:bg-surface-container-high transition-colors"
          >
            Flip Horiz
          </button>
          <button
            type="button"
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
          className="w-full bg-primary text-white rounded-md py-2.5 text-body-sm font-medium hover:opacity-90 transition-opacity mb-4"
        >
          Straighten (Apply)
        </button>
      </div>

      {/* Background */}
      <div>
        <SectionTitle>Background</SectionTitle>
        <button
          type="button"
          className="w-full bg-surface-container text-on-surface rounded-md py-2.5 text-body-sm font-medium hover:bg-surface-container-high transition-colors mb-3"
        >
          Change Canvas Color
        </button>
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
