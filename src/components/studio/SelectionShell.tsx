'use client';

import { useCallback, useMemo, useState } from 'react';
import { useLayoutStore } from '@/stores/layoutStore';
import { useProjectStore } from '@/stores/projectStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { useCanvasContext } from '@/contexts/CanvasContext';
import { LAYOUT_TYPE_CARDS } from '@/lib/layout-type-cards';
import { LAYOUT_PRESETS, getLayoutPreset } from '@/lib/layout-library';
import { LayoutThumbnail, getPresetThumbnail } from '@/lib/layout-thumbnail';
import { computeLayoutSize } from '@/lib/layout-size-utils';
import { QUILT_TEMPLATES } from '@/lib/templates';
import { TemplateThumbnail } from '@/lib/template-thumbnail';
import type { LayoutType } from '@/lib/layout-utils';
import type { QuiltTemplate, TemplateCategory } from '@/lib/templates';

interface SelectionShellProps {
  mode: 'template' | 'layout';
}

type LayoutBrowserView = 'families' | 'presets';
type TemplateCategoryFilter = TemplateCategory | 'all';

const CATEGORIES: { id: TemplateCategoryFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'traditional', label: 'Traditional' },
  { id: 'modern', label: 'Modern' },
  { id: 'baby', label: 'Baby' },
  { id: 'seasonal', label: 'Seasonal' },
];

function getFamilyPresets(family: LayoutType) {
  return LAYOUT_PRESETS.filter((p) => p.category === family);
}

function getDefaultPreset(family: LayoutType): string {
  const presets = getFamilyPresets(family);
  return presets[0]?.id ?? '';
}

export function SelectionShell({ mode }: SelectionShellProps) {
  const { getCanvas } = useCanvasContext();
  const layoutLocked = useLayoutStore((s) => s.layoutLocked);

  const [selectedFamily, setSelectedFamily] = useState<LayoutType | null>(null);
  const [browserView, setBrowserView] = useState<LayoutBrowserView>('families');
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);

  const [templateCategory, setTemplateCategory] = useState<TemplateCategoryFilter>('all');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  if (layoutLocked) return null;

  const handleFamilyClick = useCallback((family: LayoutType) => {
    setSelectedFamily(family);
    setBrowserView('presets');
    const defaultId = getDefaultPreset(family);
    if (defaultId) {
      setSelectedPresetId(defaultId);
    }
  }, []);

  const handlePresetClick = useCallback((presetId: string) => {
    setSelectedPresetId(presetId);
    setShowConfig(true);
    const preset = getLayoutPreset(presetId);
    if (preset) {
      const store = useLayoutStore.getState();
      store.setLayoutType(preset.category);
      store.setRows(preset.config.rows ?? 3);
      store.setCols(preset.config.cols ?? 3);
      store.setBlockSize(preset.config.blockSize ?? 6);
      if (preset.config.sashing != null) {
        store.setSashing({ ...store.sashing, width: preset.config.sashing });
      }
      if (preset.config.borders) {
        store.setBorders(preset.config.borders);
      }
      if (preset.config.bindingWidth != null) {
        store.setBindingWidth(preset.config.bindingWidth);
      }
      if (preset.config.hasCornerstones != null) {
        store.setHasCornerstones(preset.config.hasCornerstones);
      }
      store.setPreviewMode(true);
    }
  }, []);

  const handleTemplateClick = useCallback((template: QuiltTemplate) => {
    setSelectedTemplateId(template.id);
  }, []);

  const visibleTemplates = useMemo(() => {
    if (templateCategory === 'all') return QUILT_TEMPLATES;
    return QUILT_TEMPLATES.filter((t) => t.category === templateCategory);
  }, [templateCategory]);

  const handleCommit = useCallback(() => {
    const store = useLayoutStore.getState();
    const ps = useProjectStore.getState();

    const size = computeLayoutSize({
      type: store.layoutType as LayoutType,
      rows: store.rows,
      cols: store.cols,
      blockSize: store.blockSize,
      sashingWidth: store.sashing.width,
      borders: store.borders,
      bindingWidth: store.bindingWidth,
    });

    store.applyLayoutAndLock();
    ps.setCanvasDimensions(size.width, size.height);

    const canvas = getCanvas();
    if (canvas) {
      requestAnimationFrame(() => {
        useCanvasStore.getState().centerAndFitViewport(canvas, size.width, size.height);
      });
    }

  }, [getCanvas]);

  return (
    <div className="absolute inset-0 z-30 flex">
      {/* LEFT: Catalog */}
      <div className="w-[280px] h-full flex-shrink-0 bg-[var(--color-surface)] border-r border-[var(--color-border)] flex flex-col overflow-hidden">
        {mode === 'layout' ? (
          browserView === 'families' ? (
            <LayoutFamiliesCatalog onFamilyClick={handleFamilyClick} />
          ) : (
            <LayoutPresetsCatalog
              family={selectedFamily}
              selectedPresetId={selectedPresetId}
              onPresetClick={handlePresetClick}
              onBack={() => { setBrowserView('families'); setSelectedFamily(null); setSelectedPresetId(null); }}
            />
          )
        ) : (
          <TemplateCatalog
            category={templateCategory}
            onCategoryChange={setTemplateCategory}
            templates={visibleTemplates}
            selectedId={selectedTemplateId}
            onSelect={handleTemplateClick}
          />
        )}
      </div>

      {/* CENTER: Canvas preview (transparent - canvas renders behind) */}
      <div className="flex-1" />

      {/* RIGHT: Config */}
      <div className="w-[320px] h-full flex-shrink-0 bg-[var(--color-bg)] border-l border-[var(--color-border)] flex flex-col overflow-hidden">
        {mode === 'layout' && showConfig && selectedPresetId ? (
          <LayoutConfigPanel presetId={selectedPresetId} onCommit={handleCommit} />
        ) : mode === 'template' && selectedTemplateId ? (
          <TemplateConfigPanel templateId={selectedTemplateId} onCommit={handleCommit} />
        ) : (
          <div className="flex-1 flex items-center justify-center p-6">
            <p className="text-[13px] text-[var(--color-text-dim)] text-center">
              {mode === 'layout'
                ? 'Select a layout preset to configure settings'
                : 'Choose a template to get started'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Layout Families Catalog                                            */
/* ------------------------------------------------------------------ */

function LayoutFamiliesCatalog({ onFamilyClick }: { onFamilyClick: (family: LayoutType) => void }) {
  const layoutFamilies: Array<{ type: LayoutType; card: typeof LAYOUT_TYPE_CARDS[0] }> = [
    { type: 'grid', card: LAYOUT_TYPE_CARDS[0] },
    { type: 'sashing', card: LAYOUT_TYPE_CARDS[1] },
    { type: 'on-point', card: LAYOUT_TYPE_CARDS[2] },
    { type: 'medallion', card: LAYOUT_TYPE_CARDS[4] },
    { type: 'strippy', card: LAYOUT_TYPE_CARDS[3] },
  ];

  return (
    <>
      <div className="flex items-center px-4 py-3 border-b border-[var(--color-border)]/50 flex-shrink-0">
        <h2 className="text-[16px] font-semibold text-[var(--color-text)]">Layout Families</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-1 gap-3">
          {layoutFamilies.map(({ type, card }) => (
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

/* ------------------------------------------------------------------ */
/* Layout Presets Catalog                                              */
/* ------------------------------------------------------------------ */

function LayoutPresetsCatalog({
  family,
  selectedPresetId,
  onPresetClick,
  onBack,
}: {
  family: LayoutType | null;
  selectedPresetId: string | null;
  onPresetClick: (presetId: string) => void;
  onBack: () => void;
}) {
  if (!family) return null;

  const presets = getFamilyPresets(family);
  const card = LAYOUT_TYPE_CARDS.find((c) => c.id === family);

  return (
    <>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--color-border)]/50 flex-shrink-0">
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
        <h2 className="text-[16px] font-semibold text-[var(--color-text)] flex-1">{card?.name ?? 'Presets'}</h2>
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

/* ------------------------------------------------------------------ */
/* Layout Config Panel (right rail)                                    */
/* ------------------------------------------------------------------ */

function LayoutConfigPanel({ presetId, onCommit }: { presetId: string; onCommit: () => void }) {
  const preset = getLayoutPreset(presetId);
  if (!preset) return null;

  const card = LAYOUT_TYPE_CARDS.find((c) => c.id === preset.category);

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

  const size = computeLayoutSize({
    type: preset.category,
    rows,
    cols,
    blockSize,
    sashingWidth: sashing.width,
    borders,
    bindingWidth,
  });

  return (
    <>
      <div className="flex items-center px-4 py-3 border-b border-[var(--color-border)]/50 flex-shrink-0">
        <div>
          <h2 className="text-[14px] font-semibold text-[var(--color-text)]">{preset.name}</h2>
          <p className="text-[11px] text-[var(--color-text-dim)]">Adjust your layout</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {card?.hasGridConfig && (
          <section className="space-y-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-dim)]">Grid</h3>
            <SliderRow label="Rows" value={rows} min={1} max={20} step={1} onChange={setRows} format={(v) => String(v)} />
            <SliderRow label="Columns" value={cols} min={1} max={20} step={1} onChange={setCols} format={(v) => String(v)} />
            <SliderRow label="Block Size" value={blockSize} min={2} max={24} step={0.5} onChange={setBlockSize} format={(v) => `${v}″`} />
          </section>
        )}

        {card?.hasSashing && (
          <section className="space-y-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-dim)]">Sashing</h3>
            <SliderRow label="Width" value={sashing.width} min={0} max={6} step={0.25} onChange={(v) => setSashing({ ...sashing, width: v })} format={(v) => `${v}″`} />
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={hasCornerstones} onChange={(e) => setHasCornerstones(e.target.checked)} className="accent-[var(--color-primary)] h-3.5 w-3.5" />
              <span className="text-[11px] text-[var(--color-text)]">Cornerstones</span>
            </label>
          </section>
        )}

        {card?.hasBorders && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-dim)]">Borders</h3>
              {borders.length < 5 && (
                <button type="button" onClick={addBorder} className="text-[10px] font-medium px-2 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] transition-colors duration-150">+ Add</button>
              )}
            </div>
            {borders.map((border, i) => (
              <div key={border.id ?? i} className="flex items-center gap-2">
                <input type="range" min={0.5} max={8} step={0.5} value={border.width} onChange={(e) => updateBorder(i, { width: parseFloat(e.target.value) })} className="flex-1 accent-[var(--color-primary)] h-1" />
                <span className="text-[11px] font-mono w-8 text-[var(--color-text-dim)] text-right">{border.width}″</span>
                <button type="button" onClick={() => removeBorder(i)} className="text-[var(--color-error)] text-xs font-bold px-1">×</button>
              </div>
            ))}
            {borders.length === 0 && (
              <p className="text-[10px] text-[var(--color-text-dim)]/70">No borders added yet.</p>
            )}
          </section>
        )}

        {card?.hasBinding && (
          <section className="space-y-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-dim)]">Binding</h3>
            <SliderRow label="Width" value={bindingWidth} min={0} max={2} step={0.125} onChange={setBindingWidth} format={(v) => `${v}″`} />
          </section>
        )}

        <div className="rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]/30 p-3">
          <div className="text-[10px] uppercase tracking-[0.1em] text-[var(--color-text-dim)] mb-0.5">Finished Size</div>
          <div className="text-[14px] font-semibold text-[var(--color-text)] font-mono">{size.width}″ × {size.height}″</div>
        </div>
      </div>

      <div className="p-4 border-t border-[var(--color-border)]/50 flex-shrink-0">
        <button type="button" onClick={onCommit} className="btn-primary w-full">
          Start Designing
        </button>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Template Catalog                                                    */
/* ------------------------------------------------------------------ */

function TemplateCatalog({
  category,
  onCategoryChange,
  templates,
  selectedId,
  onSelect,
}: {
  category: TemplateCategoryFilter;
  onCategoryChange: (c: TemplateCategoryFilter) => void;
  templates: QuiltTemplate[];
  selectedId: string | null;
  onSelect: (t: QuiltTemplate) => void;
}) {
  return (
    <>
      <div className="flex items-center px-4 py-3 border-b border-[var(--color-border)]/50 flex-shrink-0">
        <h2 className="text-[16px] font-semibold text-[var(--color-text)]">Templates</h2>
      </div>

      <div className="flex gap-2 px-4 py-2 border-b border-[var(--color-border)]/30 overflow-x-auto flex-shrink-0">
        {CATEGORIES.map((cat) => {
          const isActive = category === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onCategoryChange(cat.id)}
              aria-pressed={isActive}
              className={`px-3 py-1 text-[12px] font-medium rounded-full transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/30'
                  : 'text-[var(--color-text-dim)] bg-[var(--color-bg)] hover:bg-[var(--color-border)]/30'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {templates.length === 0 ? (
          <p className="text-[12px] text-[var(--color-text-dim)] text-center py-8">No templates in this category yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {templates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => onSelect(template)}
                className={`flex flex-col items-center p-2 rounded-lg border transition-colors ${
                  selectedId === template.id
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                    : 'border-[var(--color-border)]/30 hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-bg)]'
                }`}
              >
                <div className="w-full aspect-square rounded-md overflow-hidden bg-[var(--color-bg)] mb-2">
                  <TemplateThumbnail template={template} className="w-full h-full" />
                </div>
                <span className="text-[12px] font-medium text-[var(--color-text)] text-center truncate w-full">
                  {template.name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Template Config Panel                                               */
/* ------------------------------------------------------------------ */

function TemplateConfigPanel({ templateId, onCommit }: { templateId: string; onCommit: () => void }) {
  const template = QUILT_TEMPLATES.find((t) => t.id === templateId);
  if (!template) return null;

  const bindingWidth = useLayoutStore((s) => s.bindingWidth);
  const setBindingWidth = useLayoutStore((s) => s.setBindingWidth);

  return (
    <>
      <div className="flex items-center px-4 py-3 border-b border-[var(--color-border)]/50 flex-shrink-0">
        <div>
          <h2 className="text-[14px] font-semibold text-[var(--color-text)]">{template.name}</h2>
          <p className="text-[11px] text-[var(--color-text-dim)]">{template.description}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <section className="space-y-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-dim)]">Settings</h3>
          <SliderRow label="Binding Width" value={bindingWidth} min={0} max={2} step={0.125} onChange={setBindingWidth} format={(v) => `${v}″`} />
        </section>

        <div className="rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]/30 p-3">
          <div className="text-[10px] uppercase tracking-[0.1em] text-[var(--color-text-dim)] mb-0.5">Template Size</div>
          <div className="text-[14px] font-semibold text-[var(--color-text)] font-mono">
            {template.defaultWidth ?? 60}″ × {template.defaultHeight ?? 72}″
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-[var(--color-border)]/50 flex-shrink-0">
        <button type="button" onClick={onCommit} className="btn-primary w-full">
          Start Designing
        </button>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Shared Slider Row                                                   */
/* ------------------------------------------------------------------ */

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-[var(--color-text)]">{label}</span>
        <span className="text-[10px] font-mono text-[var(--color-text-dim)] bg-[var(--color-bg)] border border-[var(--color-border)]/30 rounded px-1.5 py-0.5">
          {format(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-[var(--color-primary)] h-1"
      />
    </div>
  );
}
