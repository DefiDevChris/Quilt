'use client';

import { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useLayoutStore } from '@/stores/layoutStore';
import { useProjectStore } from '@/stores/projectStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { QUILT_SIZE_PRESETS } from '@/lib/constants/canvas';
import { LAYOUT_PRESETS } from '@/lib/layout-library';
import { computeLayoutSize } from '@/lib/layout-size-utils';
import type { LayoutType } from '@/lib/layout-utils';

interface BuildYourOwnShellProps {
  onCommit: (projectId: string) => void;
}

const LAYOUT_GUIDES: { id: LayoutType; label: string; description: string }[] = [
  { id: 'free-form', label: 'No Guide', description: 'Free-form placement' },
  { id: 'grid', label: 'Grid', description: 'Rows × columns of blocks' },
  { id: 'on-point', label: 'On-Point', description: '45° rotated blocks' },
];

export function BuildYourOwnShell({ onCommit }: BuildYourOwnShellProps) {
  const [committing, setCommitting] = useState(false);

  const layoutType = useLayoutStore((s) => s.layoutType);
  const rows = useLayoutStore((s) => s.rows);
  const cols = useLayoutStore((s) => s.cols);
  const blockSize = useLayoutStore((s) => s.blockSize);
  const sashing = useLayoutStore((s) => s.sashing);
  const bindingWidth = useLayoutStore((s) => s.bindingWidth);

  const setLayoutType = useLayoutStore((s) => s.setLayoutType);
  const setRows = useLayoutStore((s) => s.setRows);
  const setCols = useLayoutStore((s) => s.setCols);
  const setBlockSize = useLayoutStore((s) => s.setBlockSize);
  const setSashing = useLayoutStore((s) => s.setSashing);
  const setBindingWidth = useLayoutStore((s) => s.setBindingWidth);
  const applyLayoutAndLock = useLayoutStore((s) => s.applyLayoutAndLock);

  const baseQuiltWidth = useProjectStore((s) => s.baseQuiltWidth);
  const baseQuiltHeight = useProjectStore((s) => s.baseQuiltHeight);
  const lockBaseQuiltSize = useProjectStore((s) => s.lockBaseQuiltSize);
  const setProjectName = useProjectStore((s) => s.setProjectName);
  const projectName = useProjectStore((s) => s.projectName);

  const selectedPresetId = useLayoutStore((s) => s.selectedPresetId);
  const setSelectedPreset = useLayoutStore((s) => s.setSelectedPreset);

  const showSashingToggle = layoutType === 'grid' || layoutType === 'on-point';

  const handleCommit = useCallback(async () => {
    setCommitting(true);
    try {
      applyLayoutAndLock();

      const finalMode = layoutType === 'free-form' ? 'free-form' : 'layout';

      const body: Record<string, unknown> = {
        name: projectName,
        mode: finalMode,
        unitSystem: 'imperial',
        canvasWidth: baseQuiltWidth,
        canvasHeight: baseQuiltHeight,
        gridSettings: { enabled: true, size: 1, snapToGrid: true },
      };

      if (layoutType !== 'free-form' && selectedPresetId) {
        body.canvasData = { initialSetup: { kind: 'layout', presetId: selectedPresetId, blockSize, rotated: false } };
      }

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Failed to create project');
      }

      const { data } = await res.json();
      onCommit(data.id);
    } catch (err) {
      console.error('[BuildYourOwnShell] commit failed:', err);
      setCommitting(false);
    }
  }, [
    applyLayoutAndLock,
    projectName,
    baseQuiltWidth,
    baseQuiltHeight,
    layoutType,
    selectedPresetId,
    blockSize,
    onCommit,
  ]);

  return (
    <AnimatePresence>
      <motion.div
        key="build-your-own-shell"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.24 }}
        className="absolute inset-0 z-40 flex pointer-events-none"
      >
        {/* Left rail — Layout Guide Selector */}
        <div className="w-[280px] shrink-0 bg-[var(--color-bg)] border-r border-[var(--color-border)] overflow-y-auto pointer-events-auto p-4 flex flex-col gap-4">
          <h2 className="font-heading text-sm font-semibold text-[var(--color-text)] uppercase tracking-wide">
            Layout Guide
          </h2>

          <div className="grid gap-2">
            {LAYOUT_GUIDES.map((guide) => (
              <button
                key={guide.id}
                onClick={() => {
                  setLayoutType(guide.id);
                  if (guide.id !== 'free-form') {
                    const defaultPreset = LAYOUT_PRESETS.find(
                      (p) => p.id.startsWith(guide.id) && p.id.includes('4x4')
                    ) ?? LAYOUT_PRESETS.find((p) => p.id.startsWith(guide.id));
                    if (defaultPreset) setSelectedPreset(defaultPreset.id);
                  } else {
                    setSelectedPreset(null);
                  }
                }}
                className={`rounded-lg border p-3 text-left transition-colors duration-150 ${
                  layoutType === guide.id
                    ? 'border-[var(--color-primary)] bg-[var(--color-secondary)]'
                    : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-strong)]'
                }`}
              >
                <div className="text-sm font-semibold text-[var(--color-text)]">{guide.label}</div>
                <div className="text-xs text-[var(--color-text-dim)] mt-0.5">{guide.description}</div>
              </button>
            ))}
          </div>

          {layoutType !== 'free-form' && (
            <div className="space-y-3 pt-2 border-t border-[var(--color-border)]">
              <h3 className="text-xs font-semibold text-[var(--color-text-dim)] uppercase tracking-wide">Grid</h3>
              <SliderRow label="Rows" value={rows} min={2} max={12} onChange={setRows} />
              <SliderRow label="Columns" value={cols} min={2} max={12} onChange={setCols} />
              <SliderRow label="Block size" value={blockSize} min={2} max={18} step={0.5} onChange={setBlockSize} unit="in" />
            </div>
          )}

          {showSashingToggle && (
            <div className="space-y-3 pt-2 border-t border-[var(--color-border)]">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-[var(--color-text-dim)] uppercase tracking-wide">Sashing</h3>
                <button
                  onClick={() => setSashing({ width: sashing.width > 0 ? 0 : 1 })}
                  className={`relative h-5 w-9 rounded-full transition-colors duration-150 ${
                    sashing.width > 0 ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform duration-150 ${
                      sashing.width > 0 ? 'translate-x-4' : ''
                    }`}
                  />
                </button>
              </div>
              {sashing.width > 0 && (
                <SliderRow label="Width" value={sashing.width} min={0.5} max={4} step={0.25} onChange={(v) => setSashing({ width: v })} unit="in" />
              )}
            </div>
          )}

          <SliderRow label="Binding" value={bindingWidth} min={0} max={1} step={0.125} onChange={setBindingWidth} unit="in" />
        </div>

        {/* Center — blank canvas area (transparent, clicks pass through) */}
        <div className="flex-1" />

        {/* Right rail — Quilt Size */}
        <div className="w-[320px] shrink-0 bg-[var(--color-bg)] border-l border-[var(--color-border)] overflow-y-auto pointer-events-auto p-4 flex flex-col gap-4">
          <h2 className="font-heading text-sm font-semibold text-[var(--color-text)] uppercase tracking-wide">
            Quilt Size
          </h2>

          <div className="grid grid-cols-2 gap-2">
            {QUILT_SIZE_PRESETS.map((preset) => {
              const active = baseQuiltWidth === preset.width && baseQuiltHeight === preset.height;
              return (
                <button
                  key={preset.label}
                  onClick={() => {
                    lockBaseQuiltSize(preset.width, preset.height);
                  }}
                  className={`rounded-lg border p-2 text-left transition-colors duration-150 ${
                    active
                      ? 'border-[var(--color-primary)] bg-[var(--color-secondary)]'
                      : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-strong)]'
                  }`}
                >
                  <div className="text-xs font-semibold text-[var(--color-text)]">{preset.label}</div>
                  <div className="text-[10px] text-[var(--color-text-dim)]">
                    {preset.width}&times;{preset.height}&Prime;
                  </div>
                </button>
              );
            })}
          </div>

          <div className="space-y-3 pt-2 border-t border-[var(--color-border)]">
            <h3 className="text-xs font-semibold text-[var(--color-text-dim)] uppercase tracking-wide">Custom</h3>
            <SliderRow label="Width" value={baseQuiltWidth} min={12} max={120} onChange={(v) => lockBaseQuiltSize(v, baseQuiltHeight)} unit="in" />
            <SliderRow label="Height" value={baseQuiltHeight} min={12} max={120} onChange={(v) => lockBaseQuiltSize(baseQuiltWidth, v)} unit="in" />
          </div>

          <div className="space-y-3 pt-2 border-t border-[var(--color-border)]">
            <h3 className="text-xs font-semibold text-[var(--color-text-dim)] uppercase tracking-wide">Project Name</h3>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:border-[var(--color-primary)] focus:outline-none transition-colors duration-150"
              placeholder="Untitled Quilt"
            />
          </div>

          <div className="mt-auto pt-4">
            <button
              onClick={handleCommit}
              disabled={committing}
              className="btn-primary w-full transition-colors duration-150 disabled:opacity-50"
            >
              {committing ? 'Creating…' : 'Start Designing'}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  unit,
}: {
  readonly label: string;
  readonly value: number;
  readonly min: number;
  readonly max: number;
  readonly step?: number;
  readonly onChange: (v: number) => void;
  readonly unit?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-[var(--color-text-dim)] w-14 shrink-0">{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 accent-[var(--color-primary)]"
      />
      <span className="text-xs text-[var(--color-text)] w-12 text-right tabular-nums">
        {value}{unit ?? ''}
      </span>
    </div>
  );
}
