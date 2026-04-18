/**
 * Layouts Panel Component
 *
 * Contextual left panel for Layout mode projects.
 * Two views: families (initial) and presets (drill-in).
 * Each view is dismissible with X.
 */

import { useCallback, useState } from 'react';
import { useLeftPanelStore, type LeftPanelMode } from '@/stores/leftPanelStore';
import { useLayoutStore } from '@/stores/layoutStore';
import { useProjectStore } from '@/stores/projectStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { useCanvasContext } from '@/contexts/CanvasContext';
import { LAYOUT_TYPE_CARDS } from '@/lib/layout-type-cards';
import { LAYOUT_PRESETS, getLayoutPreset } from '@/lib/layout-library';
import { LayoutThumbnail, getPresetThumbnail } from '@/lib/layout-thumbnail';
import { computeLayoutSize } from '@/lib/layout-size-utils';
import type { LayoutType, BorderConfig, SashingConfig } from '@/lib/layout-utils';

interface LayoutsPanelProps {
  onDismiss: () => void;
}

const LAYOUT_FAMILIES: Array<{ type: LayoutType; card: typeof LAYOUT_TYPE_CARDS[0] }> = [
  { type: 'grid', card: LAYOUT_TYPE_CARDS[0] },
  { type: 'sashing', card: LAYOUT_TYPE_CARDS[1] },
  { type: 'on-point', card: LAYOUT_TYPE_CARDS[2] },
  { type: 'medallion', card: LAYOUT_TYPE_CARDS[4] },
  { type: 'strippy', card: LAYOUT_TYPE_CARDS[3] },
];

function getFamilyPresets(family: LayoutType) {
  return LAYOUT_PRESETS.filter((p) => p.category === family);
}

function getDefaultPreset(family: LayoutType): string {
  const presets = getFamilyPresets(family);
  return presets[0]?.id ?? '';
}

export function LayoutsPanel({ onDismiss }: LayoutsPanelProps) {
  const layoutBrowserView = useLeftPanelStore((s) => s.layoutBrowserView);
  const selectedFamily = useLeftPanelStore((s) => s.selectedFamily);
  const selectedPresetId = useLeftPanelStore((s) => s.selectedPresetId);
  const drillIntoFamily = useLeftPanelStore((s) => s.drillIntoFamily);
  const backToFamilies = useLeftPanelStore((s) => s.backToFamilies);
  const selectPreset = useLeftPanelStore((s) => s.selectPreset);
  const startPreview = useLeftPanelStore((s) => s.startPreview);

  const [showConfig, setShowConfig] = useState(false);

  const handleFamilyClick = useCallback((family: LayoutType) => {
    drillIntoFamily(family);
    const defaultPreset = getDefaultPreset(family);
    if (defaultPreset) {
      selectPreset(defaultPreset);
    }
  }, [drillIntoFamily, selectPreset]);

  const handlePresetClick = useCallback((presetId: string) => {
    selectPreset(presetId);
    setShowConfig(true);
  }, [selectPreset]);

  const handleBackToPresets = useCallback(() => {
    setShowConfig(false);
  }, []);

  return (
    <div className="w-[280px] h-full bg-[var(--color-surface)] border-r border-[var(--color-border)] flex flex-col overflow-hidden">
      {layoutBrowserView === 'families' ? (
        <FamiliesView onFamilyClick={handleFamilyClick} onDismiss={onDismiss} />
      ) : showConfig && selectedPresetId ? (
        <ConfigView
          presetId={selectedPresetId}
          onBack={handleBackToPresets}
          onDismiss={onDismiss}
        />
      ) : (
        <PresetsView
          family={selectedFamily}
          selectedPresetId={selectedPresetId}
          onPresetClick={handlePresetClick}
          onBack={backToFamilies}
          onDismiss={onDismiss}
        />
      )}
    </div>
  );
}

interface FamiliesViewProps {
  onFamilyClick: (family: LayoutType) => void;
  onDismiss: () => void;
}

function FamiliesView({ onFamilyClick, onDismiss }: FamiliesViewProps) {
  return (
    <>
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]/50">
        <h2 className="text-[16px] font-semibold text-[var(--color-text)]">Pick a layout</h2>
        <button
          type="button"
          onClick={onDismiss}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-border)]/30 transition-colors"
          aria-label="Close"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-1 gap-3">
          {LAYOUT_FAMILIES.map(({ type, card }) => (
            <button
              key={type}
              type="button"
              onClick={() => onFamilyClick(type)}
              className="flex items-start gap-3 p-3 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)]/30 hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-surface)] transition-colors text-left"
            >
              <div className="w-14 h-14 flex-shrink-0 rounded-md overflow-hidden bg-[var(--color-bg)]">
                <LayoutThumbnail type={type} rows={3} cols={3} className="w-full h-full" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[14px] font-semibold text-[var(--color-text)] truncate">{card.name}</h3>
                <p className="text-[12px] text-[var(--color-text-dim)] line-clamp-2 mt-0.5">{card.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

interface PresetsViewProps {
  family: LayoutType | null;
  selectedPresetId: string | null;
  onPresetClick: (presetId: string) => void;
  onBack: () => void;
  onDismiss: () => void;
}

function PresetsView({ family, selectedPresetId, onPresetClick, onBack, onDismiss }: PresetsViewProps) {
  if (!family) return null;
  
  const presets = getFamilyPresets(family);
  const card = LAYOUT_TYPE_CARDS.find((c) => c.id === family);

  return (
    <>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--color-border)]/50">
        <button
          type="button"
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center rounded-full text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-border)]/30 transition-colors"
          aria-label="Back to families"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h2 className="text-[16px] font-semibold text-[var(--color-text)] flex-1">{card?.name ?? 'Layout'}</h2>
        <button
          type="button"
          onClick={onDismiss}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-border)]/30 transition-colors"
          aria-label="Close"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-2 gap-3">
          {presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onPresetClick(preset.id)}
              className={`flex flex-col items-center p-2 rounded-lg border transition-colors ${
                selectedPresetId === preset.id
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                  : 'border-[var(--color-border)]/30 hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-bg)]'
              }`}
            >
              <div className="w-full aspect-square rounded-md overflow-hidden bg-[var(--color-bg)] mb-2">
                <div
                  className="w-full h-full"
                  dangerouslySetInnerHTML={{ __html: getPresetThumbnail(preset.id) }}
                />
              </div>
              <span className={`text-[12px] font-medium ${
                selectedPresetId === preset.id ? 'text-[var(--color-primary)]' : 'text-[var(--color-text)]'
              }`}>
                {preset.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}


interface ConfigViewProps {
  presetId: string;
  onBack: () => void;
  onDismiss: () => void;
}

function ConfigView({ presetId, onBack, onDismiss }: ConfigViewProps) {
  const { getCanvas } = useCanvasContext();
  const preset = getLayoutPreset(presetId);
  if (!preset) return null;

  const card = LAYOUT_TYPE_CARDS.find((c) => c.id === preset.category);
  if (!card) return null;

  const rows = useLayoutStore((s) => s.rows);
  const cols = useLayoutStore((s) => s.cols);
  const blockSize = useLayoutStore((s) => s.blockSize);
  const sashing = useLayoutStore((s) => s.sashing);
  const borders = useLayoutStore((s) => s.borders);
  const hasCornerstones = useLayoutStore((s) => s.hasCornerstones);
  const bindingWidth = useLayoutStore((s) => s.bindingWidth);

  const setRows = useLayoutStore((s) => s.setRows);
  const setCols = useLayoutStore((s) => s.setCols);
  const setBlockSize = useLayoutStore((s) => s.setBlockSize);
  const setSashing = useLayoutStore((s) => s.setSashing);
  const setHasCornerstones = useLayoutStore((s) => s.setHasCornerstones);
  const setBindingWidth = useLayoutStore((s) => s.setBindingWidth);
  const addBorder = useLayoutStore((s) => s.addBorder);
  const updateBorder = useLayoutStore((s) => s.updateBorder);
  const removeBorder = useLayoutStore((s) => s.removeBorder);
  const applyLayout = useLayoutStore((s) => s.applyLayout);

  const size = computeLayoutSize({
    type: preset.config.type as LayoutType,
    rows,
    cols,
    blockSize,
    sashingWidth: sashing.width,
    borders,
    bindingWidth,
  });

  const handleApply = () => {
    applyLayout();
    useProjectStore.getState().setCanvasDimensions(size.width, size.height);
    requestAnimationFrame(() => {
      useCanvasStore.getState().centerAndFitViewport(getCanvas(), size.width, size.height);
    });
    onDismiss();
  };

  return (
    <>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--color-border)]/50">
        <button
          type="button"
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center rounded-full text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-border)]/30 transition-colors"
          aria-label="Back"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h2 className="text-[14px] font-semibold text-[var(--color-text)] flex-1">{preset.name}</h2>
        <button
          type="button"
          onClick={onDismiss}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-border)]/30 transition-colors"
          aria-label="Close"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {card.hasGridConfig && (
          <>
            <SliderRow label="Rows" value={rows} min={1} max={20} step={1} onChange={setRows} />
            <SliderRow label="Cols" value={cols} min={1} max={20} step={1} onChange={setCols} />
            <SliderRow label="Block" value={blockSize} min={2} max={24} step={0.5} onChange={setBlockSize} suffix="″" />
          </>
        )}
        {card.hasSashing && (
          <SliderRow label="Sashing" value={sashing.width} min={0} max={6} step={0.25} onChange={(v) => setSashing({ ...sashing, width: v })} suffix="″" />
        )}
        {card.hasCornerstones && (
          <label className="flex items-center gap-2 p-2 rounded-lg border border-[var(--color-border)]/30">
            <input type="checkbox" checked={hasCornerstones} onChange={(e) => setHasCornerstones(e.target.checked)} className="rounded accent-primary" />
            <span className="text-[12px] text-[var(--color-text)]">Cornerstones</span>
          </label>
        )}
        {card.hasBorders && (
          <div className="space-y-2 p-2 rounded-lg border border-[var(--color-border)]/30">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-[var(--color-text)]">Borders</span>
              {borders.length < 5 && (
                <button type="button" onClick={addBorder} className="text-[10px] px-2 py-1 rounded-full bg-primary/10 text-primary">Add</button>
              )}
            </div>
            {borders.map((border, i) => (
              <div key={border.id ?? i} className="flex items-center gap-2">
                <input type="range" min={0.5} max={8} step={0.5} value={border.width} onChange={(e) => updateBorder(i, { width: parseFloat(e.target.value) })} className="flex-1 accent-primary" />
                <span className="text-[10px] font-mono w-8">{border.width}″</span>
                <button type="button" onClick={() => removeBorder(i)} className="text-[10px] text-accent">×</button>
              </div>
            ))}
          </div>
        )}
        {card.hasBinding && (
          <SliderRow label="Binding" value={bindingWidth} min={0} max={2} step={0.125} onChange={setBindingWidth} suffix="″" />
        )}
        <div className="p-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)]/30">
          <div className="text-[11px] text-[var(--color-text-dim)]">Size</div>
          <div className="text-[13px] font-mono font-semibold text-[var(--color-text)]">{size.width}″ × {size.height}″</div>
        </div>
      </div>
      <div className="p-3 border-t border-[var(--color-border)]/50">
        <button type="button" onClick={handleApply} className="w-full py-2 rounded-full bg-primary text-white text-[14px] font-semibold hover:opacity-90">
          Apply Layout
        </button>
      </div>
    </>
  );
}

function SliderRow({ label, value, min, max, step, onChange, suffix }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; suffix?: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-[var(--color-text-dim)]">{label}</span>
        <span className="text-[11px] font-mono text-[var(--color-text)]">{value}{suffix}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} className="w-full accent-primary" />
    </div>
  );
}
