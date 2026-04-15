'use client';

import { usePhotoDesignStore } from '@/stores/photoDesignStore';
import { slidersToProcessParams } from '@/lib/photo-to-design/sliders';
import type { PhotoDesignClient } from '@/lib/photo-to-design/client';

interface SliderPanelProps {
  client: PhotoDesignClient | null;
}

export function SliderPanel({ client }: SliderPanelProps) {
  const sliders = usePhotoDesignStore((s) => s.sliders);
  const setSlider = usePhotoDesignStore((s) => s.setSlider);
  const sourceDimensions = usePhotoDesignStore((s) => s.sourceDimensions);
  const pixelsPerUnit = usePhotoDesignStore((s) => s.pixelsPerUnit);
  const calibrationUnit = usePhotoDesignStore((s) => s.calibrationUnit);
  const viewMode = usePhotoDesignStore((s) => s.viewMode);

  const setViewMode = (mode: typeof viewMode) =>
    usePhotoDesignStore.setState({ viewMode: mode });

  const requestPreview = () => {
    if (!client || !sourceDimensions || !pixelsPerUnit) return;
    const totalPixels = sourceDimensions.width * sourceDimensions.height;
    const params = slidersToProcessParams(
      {
        ...sliders,
        pixelsPerUnit,
        unit: calibrationUnit,
      },
      totalPixels,
      pixelsPerUnit,
      calibrationUnit
    );
    client.requestPreview(params);
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* View mode segmented control */}
      <div>
        <label className="text-[12px] font-medium uppercase tracking-wide text-[#4a4a4a]">
          View
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          {(
            [
              ['photo+outlines', 'Photo + outlines'],
              ['colorFill', 'Color fill'],
              ['outlinesOnly', 'Outlines only'],
              ['photoOnly', 'Photo only'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setViewMode(key)}
              className={`rounded-full px-3 py-1.5 text-[13px] transition-colors duration-150 ${
                viewMode === key
                  ? 'bg-[#ff8d49] text-[#1a1a1a]'
                  : 'border border-[#d4d4d4] text-[#4a4a4a] hover:bg-[#ff8d49]/10'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <Divider />

      <SliderRow
        label="Lighting"
        value={sliders.lighting}
        onChange={(v) => {
          setSlider('lighting', v);
          requestPreview();
        }}
      />
      <SliderRow
        label="Smoothing"
        value={sliders.smoothing}
        onChange={(v) => {
          setSlider('smoothing', v);
          requestPreview();
        }}
      />

      <ToggleRow
        label="Heavy Prints"
        value={sliders.heavyPrints}
        onChange={(v) => {
          setSlider('heavyPrints', v);
          requestPreview();
        }}
      />

      <ColorsRow
        value={sliders.colors}
        onChange={(v) => {
          setSlider('colors', v);
          requestPreview();
        }}
      />

      <SliderRow
        label="Min Patch Size"
        value={sliders.minPatchSize}
        onChange={(v) => {
          setSlider('minPatchSize', v);
          requestPreview();
        }}
      />

      <ToggleRow
        label="Edge Enhancement"
        value={sliders.edgeEnhance}
        onChange={(v) => {
          setSlider('edgeEnhance', v);
          requestPreview();
        }}
      />

      {sliders.edgeEnhance && (
        <SliderRow
          label="Edge Sensitivity"
          value={sliders.edgeSensitivity}
          onChange={(v) => {
            setSlider('edgeSensitivity', v);
            requestPreview();
          }}
        />
      )}

      <SliderRow
        label="Grid Snap"
        value={sliders.gridSnap}
        onChange={(v) => {
          setSlider('gridSnap', v);
          requestPreview();
        }}
      />
    </div>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────

function Divider() {
  return <div className="my-1 h-px bg-[#d4d4d4]" />;
}

interface SliderRowProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}

function SliderRow({ label, value, onChange, min = 0, max = 100 }: SliderRowProps) {
  return (
    <label className="block">
      <div className="flex items-center justify-between text-[13px]">
        <span className="text-[#1a1a1a]">{label}</span>
        <span className="text-[#4a4a4a]">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full accent-[#ff8d49]"
      />
    </label>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 text-[13px]">
      <span className="text-[#1a1a1a]">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative h-6 w-11 rounded-full border transition-colors duration-150 ${
          value ? 'border-[#ff8d49] bg-[#ff8d49]' : 'border-[#d4d4d4] bg-[#ffffff]'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-[#ffffff] shadow-[0_1px_2px_rgba(26,26,26,0.08)] transition-all duration-150 ${
            value ? 'left-5' : 'left-0.5'
          }`}
        />
      </button>
    </label>
  );
}

function ColorsRow({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const manualMode = value > 0;
  const manualCount = manualMode ? Math.round(2 + (value / 100) * 28) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-[13px]">
        <span className="text-[#1a1a1a]">Colors</span>
        <span className="text-[#4a4a4a]">
          {manualMode ? `Manual: ${manualCount}` : 'Auto'}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full accent-[#ff8d49]"
      />
    </div>
  );
}
