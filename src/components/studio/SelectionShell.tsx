'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useLayoutStore } from '@/stores/layoutStore';
import { useProjectStore } from '@/stores/projectStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { useCanvasContext } from '@/contexts/CanvasContext';
import { useLeftPanelStore } from '@/stores/leftPanelStore';
import { LAYOUT_TYPE_CARDS } from '@/lib/layout-type-cards';
import { LAYOUT_PRESETS, getLayoutPreset } from '@/lib/layout-library';
import { LayoutThumbnail, getPresetThumbnail } from '@/lib/layout-thumbnail';
import { computeLayoutSize } from '@/lib/layout-size-utils';
import { QUILT_TEMPLATES } from '@/lib/templates';
import { TemplateThumbnail } from '@/lib/template-thumbnail';
import type { LayoutType } from '@/lib/layout-utils';
import type { QuiltTemplate, TemplateCategory } from '@/lib/templates';
import type { UserLayoutTemplate } from '@/types/layoutTemplate';

interface SelectionShellProps {
  /**
   * Project mode chosen by the user. The shell renders a different Phase 1
   * UI for each mode:
   *
   *   - 'template'  → catalog of pre-built quilts (Library + My Templates)
   *   - 'layout'    → layout-family browser + grid/sashing/border sliders
   *   - 'free-form' → quilt-size preset cards + W×H sliders (size only)
   *
   * Block Builder is hidden in template mode (handled in StudioLayout, not
   * here). Free-form Phase 1 has NO binding-width slider — binding is a
   * Phase 2 concern in free-form, deferred to a later iteration.
   */
  mode: 'template' | 'layout' | 'free-form';
}

type LayoutBrowserView = 'families' | 'presets';
type TemplateCategoryFilter = TemplateCategory | 'all';
type TemplateSubTab = 'library' | 'my-templates';

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

/* ── Free-form size presets ── */
interface FreeformSizePreset {
  id: string;
  name: string;
  width: number;
  height: number;
  description: string;
}

const FREEFORM_SIZE_PRESETS: FreeformSizePreset[] = [
  { id: 'mini', name: 'Mini', width: 24, height: 24, description: 'Small wall hanging' },
  { id: 'lap', name: 'Lap', width: 50, height: 60, description: 'Classic lap quilt' },
  { id: 'twin', name: 'Twin', width: 65, height: 95, description: 'Twin bed' },
  { id: 'queen', name: 'Queen', width: 90, height: 100, description: 'Queen bed' },
  { id: 'king', name: 'King', width: 108, height: 100, description: 'King bed' },
];

const FREEFORM_DIM_MIN = 12;
const FREEFORM_DIM_MAX = 144;

export function SelectionShell({ mode }: SelectionShellProps) {
  const { getCanvas } = useCanvasContext();

  // Layout-mode state
  const [selectedFamily, setSelectedFamily] = useState<LayoutType | null>(null);
  const [browserView, setBrowserView] = useState<LayoutBrowserView>('families');
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);

  // Template-mode state
  const [templateSubTab, setTemplateSubTab] = useState<TemplateSubTab>('library');
  const [templateCategory, setTemplateCategory] = useState<TemplateCategoryFilter>('all');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedUserTemplate, setSelectedUserTemplate] = useState<UserLayoutTemplate | null>(null);
  const [libraryUserTemplates, setLibraryUserTemplates] = useState<UserLayoutTemplate[]>([]);
  const [myTemplates, setMyTemplates] = useState<UserLayoutTemplate[]>([]);
  const [templatesLoaded, setTemplatesLoaded] = useState(false);
  const [templatesError, setTemplatesError] = useState<string | null>(null);

  // Freeform-mode state
  const projectStoreCanvasWidth = useProjectStore((s) => s.canvasWidth);
  const projectStoreCanvasHeight = useProjectStore((s) => s.canvasHeight);
  const [freeformWidth, setFreeformWidth] = useState<number>(projectStoreCanvasWidth || 50);
  const [freeformHeight, setFreeformHeight] = useState<number>(projectStoreCanvasHeight || 60);
  const [freeformPresetId, setFreeformPresetId] = useState<string | null>('lap');

  // Fetch user templates on mount when in template mode
  useEffect(() => {
    if (mode !== 'template' || templatesLoaded) return;
    let cancelled = false;
    (async () => {
      try {
        const [libRes, mineRes] = await Promise.all([
          fetch('/api/templates?published=true', { credentials: 'include', cache: 'no-store' }),
          fetch('/api/templates?mine=true', { credentials: 'include', cache: 'no-store' }),
        ]);
        if (cancelled) return;
        const lib = libRes.ok ? await libRes.json() : { data: [] };
        const mine = mineRes.ok ? await mineRes.json() : { data: [] };
        setLibraryUserTemplates(Array.isArray(lib?.data) ? lib.data : []);
        setMyTemplates(Array.isArray(mine?.data) ? mine.data : []);
        setTemplatesLoaded(true);
      } catch (err) {
        if (cancelled) return;
        setTemplatesError(err instanceof Error ? err.message : 'Failed to load templates');
        setTemplatesLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, templatesLoaded]);

  // Note: we intentionally do NOT short-circuit on `layoutLocked` here.
  // The parent (StudioClient) renders this component only while the phase
  // is 'configuring', and wraps it in AnimatePresence so the rails can
  // play their exit animation when the user clicks "Start Designing".
  // Returning null mid-exit would tear the motion subtree out of the DOM
  // before the slide-and-fade transition completed.

  /* ── Layout handlers ── */
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
        store.setSashing({ ...store.sashing, ...preset.config.sashing });
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

  /* ── Template handlers ── */
  const handleSystemTemplateClick = useCallback((template: QuiltTemplate) => {
    setSelectedTemplateId(template.id);
    setSelectedUserTemplate(null);
    // Push template into leftPanelStore for the post-Phase-1 hydration step.
    useLeftPanelStore.getState().startPreview(JSON.stringify(template), template.name);
  }, []);

  const handleUserTemplateClick = useCallback((tpl: UserLayoutTemplate) => {
    setSelectedUserTemplate(tpl);
    setSelectedTemplateId(null);
    useLeftPanelStore.getState().startPreview(JSON.stringify(tpl), tpl.name);
  }, []);

  const visibleSystemTemplates = useMemo(() => {
    if (templateCategory === 'all') return QUILT_TEMPLATES;
    return QUILT_TEMPLATES.filter((t) => t.category === templateCategory);
  }, [templateCategory]);

  /* ── Freeform handlers ── */
  const handleFreeformPresetClick = useCallback((preset: FreeformSizePreset) => {
    setFreeformPresetId(preset.id);
    setFreeformWidth(preset.width);
    setFreeformHeight(preset.height);
  }, []);

  /* ── Commit (Start Designing) ── */
  const handleCommit = useCallback(() => {
    const store = useLayoutStore.getState();
    const ps = useProjectStore.getState();

    if (mode === 'free-form') {
      store.setLayoutType('free-form');
      store.applyLayoutAndLock();
      ps.setCanvasDimensions(freeformWidth, freeformHeight);
      // Anchor proportional ¼″-aligned scaling to the size the user just
      // committed. Subsequent post-lock scale options derive from this base.
      ps.lockBaseQuiltSize(freeformWidth, freeformHeight);
      const canvas = getCanvas();
      if (canvas) {
        requestAnimationFrame(() => {
          useCanvasStore.getState().centerAndFitViewport(canvas, freeformWidth, freeformHeight);
        });
      }
      return;
    }

    // template / layout — derive size from layout store and lock
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
    // Layout/template modes also record the base — the size dropdown only
    // shows a read-only callout for these, but other consumers (#10 future
    // hooks) may want the same anchor.
    ps.lockBaseQuiltSize(size.width, size.height);

    const canvas = getCanvas();
    if (canvas) {
      requestAnimationFrame(() => {
        useCanvasStore.getState().centerAndFitViewport(canvas, size.width, size.height);
      });
    }
  }, [mode, freeformWidth, freeformHeight, getCanvas]);

  /* ── Render ──
   *
   * The two side rails animate independently so the canvas underneath
   * (rendered by StudioLayout's center main column) stays visually fixed.
   * On exit, the left rail slides off to the left, the right rail slides
   * off to the right, and both fade — revealing the studio chrome that
   * was already mounted behind them. AnimatePresence in StudioClient
   * holds this component mounted long enough for the exit to play.
   *
   * `pointer-events-none` on the wrapper + `pointer-events-auto` on the
   * rails lets the canvas behind receive zoom/pan events through the
   * empty center column even during Phase 1, so previewing a layout
   * choice on the canvas (selecting different presets) feels live.
   */
  const railTransition = {
    duration: 0.35,
    ease: [0.32, 0.72, 0, 1] as const,
  };

  return (
    <div className="absolute inset-0 z-30 flex pointer-events-none">
      {/* LEFT: Catalog */}
      <motion.div
        initial={{ x: -300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -300, opacity: 0 }}
        transition={railTransition}
        className="w-[280px] h-full flex-shrink-0 bg-[var(--color-surface)] border-r border-[var(--color-border)] flex flex-col overflow-hidden pointer-events-auto"
      >
        {mode === 'layout' &&
          (browserView === 'families' ? (
            <LayoutFamiliesCatalog onFamilyClick={handleFamilyClick} />
          ) : (
            <LayoutPresetsCatalog
              family={selectedFamily}
              selectedPresetId={selectedPresetId}
              onPresetClick={handlePresetClick}
              onBack={() => {
                setBrowserView('families');
                setSelectedFamily(null);
                setSelectedPresetId(null);
              }}
            />
          ))}

        {mode === 'template' && (
          <TemplateCatalog
            subTab={templateSubTab}
            onSubTabChange={setTemplateSubTab}
            category={templateCategory}
            onCategoryChange={setTemplateCategory}
            systemTemplates={visibleSystemTemplates}
            libraryUserTemplates={libraryUserTemplates}
            myTemplates={myTemplates}
            templatesError={templatesError}
            templatesLoaded={templatesLoaded}
            selectedSystemId={selectedTemplateId}
            selectedUserId={selectedUserTemplate?.id ?? null}
            onSelectSystem={handleSystemTemplateClick}
            onSelectUser={handleUserTemplateClick}
          />
        )}

        {mode === 'free-form' && (
          <FreeformSizePresetsCatalog
            selectedId={freeformPresetId}
            onSelect={handleFreeformPresetClick}
          />
        )}
      </motion.div>

      {/* CENTER: pass-through column (transparent — canvas renders behind) */}
      <div className="flex-1" />

      {/* RIGHT: Config */}
      <motion.div
        initial={{ x: 320, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 320, opacity: 0 }}
        transition={railTransition}
        className="w-[320px] h-full flex-shrink-0 bg-[var(--color-bg)] border-l border-[var(--color-border)] flex flex-col overflow-hidden pointer-events-auto"
      >
        {mode === 'layout' && showConfig && selectedPresetId ? (
          <LayoutConfigPanel presetId={selectedPresetId} onCommit={handleCommit} />
        ) : mode === 'template' && selectedTemplateId ? (
          <TemplateConfigPanel templateId={selectedTemplateId} onCommit={handleCommit} />
        ) : mode === 'template' && selectedUserTemplate ? (
          <UserTemplateConfigPanel template={selectedUserTemplate} onCommit={handleCommit} />
        ) : mode === 'free-form' ? (
          <FreeformConfigPanel
            width={freeformWidth}
            height={freeformHeight}
            onWidthChange={(v) => {
              setFreeformWidth(v);
              setFreeformPresetId(null);
            }}
            onHeightChange={(v) => {
              setFreeformHeight(v);
              setFreeformPresetId(null);
            }}
            onCommit={handleCommit}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center p-6">
            <p className="text-[13px] text-[var(--color-text-dim)] text-center">
              {mode === 'layout'
                ? 'Select a layout preset to configure settings'
                : 'Choose a template to get started'}
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/* Layout Families Catalog                                            */
/* ────────────────────────────────────────────────────────────────── */

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
                <h3 className="text-[14px] font-semibold text-[var(--color-text)] truncate">
                  {card.name}
                </h3>
                <p className="text-[12px] text-[var(--color-text-dim)] line-clamp-2 mt-0.5">
                  {card.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/* Layout Presets Catalog                                              */
/* ────────────────────────────────────────────────────────────────── */

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
            <path
              d="M10 12L6 8L10 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <h2 className="text-[16px] font-semibold text-[var(--color-text)] flex-1">
          {card?.name ?? 'Presets'}
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-2 gap-3">
          {presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onPresetClick(preset.id)}
              className={`flex flex-col items-center p-2 rounded-lg border transition-colors duration-150 ${
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
              <span
                className={`text-[12px] font-medium ${
                  selectedPresetId === preset.id
                    ? 'text-[var(--color-primary)]'
                    : 'text-[var(--color-text)]'
                }`}
              >
                {preset.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/* Layout Config Panel (right rail)                                    */
/* ────────────────────────────────────────────────────────────────── */

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
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-dim)]">
              Grid
            </h3>
            <SliderRow label="Rows" value={rows} min={1} max={20} step={1} onChange={setRows} format={(v) => String(v)} />
            <SliderRow label="Columns" value={cols} min={1} max={20} step={1} onChange={setCols} format={(v) => String(v)} />
            <SliderRow label="Block Size" value={blockSize} min={2} max={24} step={0.5} onChange={setBlockSize} format={(v) => `${v}″`} />
          </section>
        )}

        {card?.hasSashing && (
          <section className="space-y-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-dim)]">
              Sashing
            </h3>
            <SliderRow
              label="Width"
              value={sashing.width}
              min={0}
              max={6}
              step={0.25}
              onChange={(v) => setSashing({ ...sashing, width: v })}
              format={(v) => `${v}″`}
            />
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hasCornerstones}
                onChange={(e) => setHasCornerstones(e.target.checked)}
                className="accent-[var(--color-primary)] h-3.5 w-3.5"
              />
              <span className="text-[11px] text-[var(--color-text)]">Cornerstones</span>
            </label>
          </section>
        )}

        {card?.hasBorders && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-dim)]">
                Borders
              </h3>
              {borders.length < 5 && (
                <button
                  type="button"
                  onClick={addBorder}
                  className="text-[10px] font-medium px-2 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] transition-colors duration-150"
                >
                  + Add
                </button>
              )}
            </div>
            {borders.map((border, i) => (
              <div key={border.id ?? i} className="flex items-center gap-2">
                <input
                  type="range"
                  min={0.5}
                  max={8}
                  step={0.5}
                  value={border.width}
                  onChange={(e) => updateBorder(i, { width: parseFloat(e.target.value) })}
                  className="flex-1 accent-[var(--color-primary)] h-1"
                />
                <span className="text-[11px] font-mono w-8 text-[var(--color-text-dim)] text-right">
                  {border.width}″
                </span>
                <button
                  type="button"
                  onClick={() => removeBorder(i)}
                  className="text-[var(--color-error)] text-xs font-bold px-1"
                >
                  ×
                </button>
              </div>
            ))}
            {borders.length === 0 && (
              <p className="text-[10px] text-[var(--color-text-dim)]/70">No borders added yet.</p>
            )}
          </section>
        )}

        {card?.hasBinding && (
          <section className="space-y-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-dim)]">
              Binding
            </h3>
            <SliderRow
              label="Width"
              value={bindingWidth}
              min={0}
              max={2}
              step={0.125}
              onChange={setBindingWidth}
              format={(v) => `${v}″`}
            />
          </section>
        )}

        <div className="rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]/30 p-3">
          <div className="text-[10px] uppercase tracking-[0.1em] text-[var(--color-text-dim)] mb-0.5">
            Finished Size
          </div>
          <div className="text-[14px] font-semibold text-[var(--color-text)] font-mono">
            {size.width}″ × {size.height}″
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

/* ────────────────────────────────────────────────────────────────── */
/* Template Catalog                                                    */
/* ────────────────────────────────────────────────────────────────── */

function TemplateCatalog({
  subTab,
  onSubTabChange,
  category,
  onCategoryChange,
  systemTemplates,
  libraryUserTemplates,
  myTemplates,
  templatesError,
  templatesLoaded,
  selectedSystemId,
  selectedUserId,
  onSelectSystem,
  onSelectUser,
}: {
  subTab: TemplateSubTab;
  onSubTabChange: (s: TemplateSubTab) => void;
  category: TemplateCategoryFilter;
  onCategoryChange: (c: TemplateCategoryFilter) => void;
  systemTemplates: QuiltTemplate[];
  libraryUserTemplates: UserLayoutTemplate[];
  myTemplates: UserLayoutTemplate[];
  templatesError: string | null;
  templatesLoaded: boolean;
  selectedSystemId: string | null;
  selectedUserId: string | null;
  onSelectSystem: (t: QuiltTemplate) => void;
  onSelectUser: (t: UserLayoutTemplate) => void;
}) {
  const showCategoryPills = subTab === 'library';

  const visibleUserLibrary = useMemo(() => {
    if (category === 'all') return libraryUserTemplates;
    return libraryUserTemplates.filter((t) => t.category === category);
  }, [category, libraryUserTemplates]);

  return (
    <>
      <div className="flex items-center px-4 py-3 border-b border-[var(--color-border)]/50 flex-shrink-0">
        <h2 className="text-[16px] font-semibold text-[var(--color-text)]">Templates</h2>
      </div>

      {/* Sub-tabs: Library | My Templates */}
      <div
        role="tablist"
        aria-label="Template source"
        className="flex border-b border-[var(--color-border)]/40 flex-shrink-0"
      >
        <SubTabButton
          label="Library"
          active={subTab === 'library'}
          onClick={() => onSubTabChange('library')}
        />
        <SubTabButton
          label="My Templates"
          active={subTab === 'my-templates'}
          onClick={() => onSubTabChange('my-templates')}
        />
      </div>

      {showCategoryPills && (
        <div className="flex gap-2 px-4 py-2 border-b border-[var(--color-border)]/30 overflow-x-auto flex-shrink-0">
          {CATEGORIES.map((cat) => {
            const isActive = category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onCategoryChange(cat.id)}
                aria-pressed={isActive}
                className={`px-3 py-1 text-[12px] font-medium rounded-full transition-colors duration-150 whitespace-nowrap ${
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
      )}

      <div className="flex-1 overflow-y-auto p-3">
        {subTab === 'library' && (
          <LibraryGrid
            systemTemplates={systemTemplates}
            userTemplates={visibleUserLibrary}
            selectedSystemId={selectedSystemId}
            selectedUserId={selectedUserId}
            onSelectSystem={onSelectSystem}
            onSelectUser={onSelectUser}
          />
        )}

        {subTab === 'my-templates' && (
          <MyTemplatesGrid
            templates={myTemplates}
            selectedId={selectedUserId}
            loaded={templatesLoaded}
            error={templatesError}
            onSelect={onSelectUser}
          />
        )}
      </div>
    </>
  );
}

function SubTabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex-1 py-2 text-[13px] leading-[18px] font-semibold transition-colors duration-150 ${
        active
          ? 'border-b-2 border-[var(--color-primary)] text-[var(--color-primary)]'
          : 'text-[var(--color-text)]/60 hover:text-[var(--color-text)]'
      }`}
    >
      {label}
    </button>
  );
}

function LibraryGrid({
  systemTemplates,
  userTemplates,
  selectedSystemId,
  selectedUserId,
  onSelectSystem,
  onSelectUser,
}: {
  systemTemplates: QuiltTemplate[];
  userTemplates: UserLayoutTemplate[];
  selectedSystemId: string | null;
  selectedUserId: string | null;
  onSelectSystem: (t: QuiltTemplate) => void;
  onSelectUser: (t: UserLayoutTemplate) => void;
}) {
  if (systemTemplates.length === 0 && userTemplates.length === 0) {
    return (
      <p className="text-[12px] text-[var(--color-text-dim)] text-center py-8">
        No templates in this category yet.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {systemTemplates.map((template) => (
        <SystemTemplateCard
          key={template.id}
          template={template}
          isSelected={selectedSystemId === template.id}
          onClick={() => onSelectSystem(template)}
        />
      ))}
      {userTemplates.map((tpl) => (
        <UserTemplateCard
          key={tpl.id}
          template={tpl}
          isSelected={selectedUserId === tpl.id}
          onClick={() => onSelectUser(tpl)}
        />
      ))}
    </div>
  );
}

function MyTemplatesGrid({
  templates,
  selectedId,
  loaded,
  error,
  onSelect,
}: {
  templates: UserLayoutTemplate[];
  selectedId: string | null;
  loaded: boolean;
  error: string | null;
  onSelect: (t: UserLayoutTemplate) => void;
}) {
  if (!loaded) {
    return (
      <p className="text-[12px] text-[var(--color-text-dim)] text-center py-8">
        Loading your templates…
      </p>
    );
  }

  if (error) {
    return (
      <p className="text-[12px] text-[var(--color-error)] text-center py-8">
        {error}
      </p>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-8 px-4 space-y-2">
        <p className="text-[13px] font-semibold text-[var(--color-text)]">
          No saved templates yet
        </p>
        <p className="text-[11px] text-[var(--color-text-dim)] leading-relaxed">
          Save any quilt design as a template from the Studio top bar to reuse it later.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {templates.map((tpl) => (
        <UserTemplateCard
          key={tpl.id}
          template={tpl}
          isSelected={selectedId === tpl.id}
          onClick={() => onSelect(tpl)}
        />
      ))}
    </div>
  );
}

function SystemTemplateCard({
  template,
  isSelected,
  onClick,
}: {
  template: QuiltTemplate;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center p-2 rounded-lg border transition-colors duration-150 ${
        isSelected
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
  );
}

function UserTemplateCard({
  template,
  isSelected,
  onClick,
}: {
  template: UserLayoutTemplate;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center p-2 rounded-lg border transition-colors duration-150 ${
        isSelected
          ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
          : 'border-[var(--color-border)]/30 hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-bg)]'
      }`}
    >
      <div className="w-full aspect-square rounded-md overflow-hidden bg-[var(--color-bg)] mb-2 flex items-center justify-center">
        {template.thumbnailSvg ? (
          <div
            className="w-full h-full"
            dangerouslySetInnerHTML={{ __html: template.thumbnailSvg }}
          />
        ) : (
          <span className="text-[10px] text-[var(--color-text-dim)]">No preview</span>
        )}
      </div>
      <span className="text-[12px] font-medium text-[var(--color-text)] text-center truncate w-full">
        {template.name}
      </span>
    </button>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/* Template Config Panel (system templates)                           */
/* ────────────────────────────────────────────────────────────────── */

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
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-dim)]">
            Settings
          </h3>
          <SliderRow
            label="Binding Width"
            value={bindingWidth}
            min={0}
            max={2}
            step={0.125}
            onChange={setBindingWidth}
            format={(v) => `${v}″`}
          />
        </section>

        <div className="rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]/30 p-3">
          <div className="text-[10px] uppercase tracking-[0.1em] text-[var(--color-text-dim)] mb-0.5">
            Template Size
          </div>
          <div className="text-[14px] font-semibold text-[var(--color-text)] font-mono">
            {template.canvasWidth}″ × {template.canvasHeight}″
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

/* ────────────────────────────────────────────────────────────────── */
/* User-saved Template Config Panel                                   */
/* ────────────────────────────────────────────────────────────────── */

function UserTemplateConfigPanel({
  template,
  onCommit,
}: {
  template: UserLayoutTemplate;
  onCommit: () => void;
}) {
  return (
    <>
      <div className="flex items-center px-4 py-3 border-b border-[var(--color-border)]/50 flex-shrink-0">
        <div>
          <h2 className="text-[14px] font-semibold text-[var(--color-text)]">{template.name}</h2>
          {template.description && (
            <p className="text-[11px] text-[var(--color-text-dim)]">{template.description}</p>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <div className="rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]/30 p-3">
          <div className="text-[10px] uppercase tracking-[0.1em] text-[var(--color-text-dim)] mb-0.5">
            Template Size
          </div>
          <div className="text-[14px] font-semibold text-[var(--color-text)] font-mono">
            {template.canvasWidth}″ × {template.canvasHeight}″
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

/* ────────────────────────────────────────────────────────────────── */
/* Free-form Size Presets Catalog                                      */
/* ────────────────────────────────────────────────────────────────── */

function FreeformSizePresetsCatalog({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (preset: FreeformSizePreset) => void;
}) {
  return (
    <>
      <div className="flex items-center px-4 py-3 border-b border-[var(--color-border)]/50 flex-shrink-0">
        <h2 className="text-[16px] font-semibold text-[var(--color-text)]">Quilt Size</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-1 gap-3">
          {FREEFORM_SIZE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelect(preset)}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-colors duration-150 text-left ${
                selectedId === preset.id
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                  : 'bg-[var(--color-bg)] border-[var(--color-border)]/30 hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-surface)]'
              }`}
            >
              <div className="flex-1 min-w-0">
                <h3 className="text-[14px] font-semibold text-[var(--color-text)]">{preset.name}</h3>
                <p className="text-[12px] text-[var(--color-text-dim)] mt-0.5">
                  {preset.description}
                </p>
                <p className="text-[11px] font-mono text-[var(--color-text-dim)] mt-1">
                  {preset.width}″ × {preset.height}″
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/* Free-form Config Panel (right rail)                                 */
/* ────────────────────────────────────────────────────────────────── */

function FreeformConfigPanel({
  width,
  height,
  onWidthChange,
  onHeightChange,
  onCommit,
}: {
  width: number;
  height: number;
  onWidthChange: (v: number) => void;
  onHeightChange: (v: number) => void;
  onCommit: () => void;
}) {
  return (
    <>
      <div className="flex items-center px-4 py-3 border-b border-[var(--color-border)]/50 flex-shrink-0">
        <div>
          <h2 className="text-[14px] font-semibold text-[var(--color-text)]">Custom Size</h2>
          <p className="text-[11px] text-[var(--color-text-dim)]">
            Pick a preset or set width &amp; height directly.
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <section className="space-y-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-dim)]">
            Dimensions
          </h3>
          <SliderRow
            label="Width"
            value={width}
            min={FREEFORM_DIM_MIN}
            max={FREEFORM_DIM_MAX}
            step={1}
            onChange={onWidthChange}
            format={(v) => `${v}″`}
          />
          <SliderRow
            label="Height"
            value={height}
            min={FREEFORM_DIM_MIN}
            max={FREEFORM_DIM_MAX}
            step={1}
            onChange={onHeightChange}
            format={(v) => `${v}″`}
          />
        </section>

        <div className="rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]/30 p-3">
          <div className="text-[10px] uppercase tracking-[0.1em] text-[var(--color-text-dim)] mb-0.5">
            Finished Size
          </div>
          <div className="text-[14px] font-semibold text-[var(--color-text)] font-mono">
            {width}″ × {height}″
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

/* ────────────────────────────────────────────────────────────────── */
/* Shared Slider Row                                                   */
/* ────────────────────────────────────────────────────────────────── */

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
