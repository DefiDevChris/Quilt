'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useLayoutStore } from '@/stores/layoutStore';
import { useProjectStore } from '@/stores/projectStore';
import type { ProjectMode } from '@/types/project';
import { useCanvasStore } from '@/stores/canvasStore';
import { useLeftPanelStore } from '@/stores/leftPanelStore';
import { getLayoutPreset } from '@/lib/layout-library';
import { computeLayoutDimensions, type LayoutType } from '@/lib/layout-utils';
import { QUILT_TEMPLATES, type QuiltTemplate } from '@/lib/templates';
import type { UserLayoutTemplate } from '@/types/layoutTemplate';
import { LayoutFamiliesCatalog } from './selection/LayoutFamiliesCatalog';
import { LayoutConfigPanel } from './selection/LayoutConfigPanel';
import { TemplateCatalog } from './selection/TemplateCatalog';
import { TemplateConfigPanel } from './selection/TemplateConfigPanel';
import { UserTemplateConfigPanel } from './selection/UserTemplateConfigPanel';
import { FreeformSizePresetsCatalog } from './selection/FreeformSizePresetsCatalog';
import { FreeformConfigPanel } from './selection/FreeformConfigPanel';
import {
  type FreeformSizePreset,
  type TemplateCategoryFilter,
  type TemplateSubTab,
  DEFAULT_LAYOUT_FAMILY,
  getDefaultPreset,
} from './selection/layout-helpers';

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
   * here). Free-form Phase 1 includes the binding-width slider alongside
   * quilt size presets.
   */
  mode: ProjectMode;
}


export function SelectionShell({ mode }: SelectionShellProps) {
  const getCanvas = () => useCanvasStore.getState().fabricCanvas;

  // Layout-mode state
  //
  // The left rail now shows a flat list of all layout families with the
  // selected one highlighted (no drill-down into a preset grid). A family
  // is always selected so the right rail can render layout settings from
  // the moment the shell mounts — hence `selectedFamily` defaults to
  // `'grid'` and `selectedPresetId` follows from the family's curated
  // default preset.
  const [selectedFamily, setSelectedFamily] = useState<LayoutType>(DEFAULT_LAYOUT_FAMILY);
  const [selectedPresetId, setSelectedPresetId] = useState<string>(() =>
    getDefaultPreset(DEFAULT_LAYOUT_FAMILY)
  );

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
  const freeformBindingWidth = useLayoutStore((s) => s.bindingWidth);
  const setFreeformBindingWidth = useLayoutStore((s) => s.setBindingWidth);

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

  /**
   * Apply a preset's seed config into the layout store so the right panel
   * sliders + the canvas fence renderer pick it up. Called whenever the
   * user changes layout family.
   */
  const applyPreset = useCallback((presetId: string) => {
    const preset = getLayoutPreset(presetId);
    if (!preset) return;
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
  }, []);

  const handleFamilyClick = useCallback(
    (family: LayoutType) => {
      if (family === selectedFamily) return;
      const defaultId = getDefaultPreset(family);
      setSelectedFamily(family);
      setSelectedPresetId(defaultId);
      applyPreset(defaultId);
    },
    [applyPreset, selectedFamily]
  );

  // Seed the layout store on first mount so the right panel sliders and
  // the canvas fence reflect the default-selected family immediately
  // — instead of waiting for the user to click anything.
  useEffect(() => {
    if (mode !== 'layout') return;
    applyPreset(selectedPresetId);
    // Intentionally only on mount / mode-switch — subsequent applies are
    // driven by `handleFamilyClick`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // ── Live canvas-size sync (layout mode) ──
  //
  // "The layout IS the grid": while the user is dragging rows/cols/sashing
  // sliders we keep the project's canvas dimensions glued to the layout's
  // computed finished size, so the gridded backdrop never exceeds the
  // fence and re-fits to screen as the layout grows or shrinks. This
  // subscribes directly to `useLayoutStore` so we don't trigger a re-render
  // of SelectionShell on every slider tick — only the canvas updates.
  useEffect(() => {
    if (mode !== 'layout') return;
    const unsub = useLayoutStore.subscribe((state) => {
    const size = computeLayoutDimensions({
      type: state.layoutType as LayoutType,
      rows: state.rows,
      cols: state.cols,
      blockSize: state.blockSize,
      sashingWidth: state.sashing.width,
      borders: state.borders,
      bindingWidth: state.bindingWidth,
    });
      const ps = useProjectStore.getState();
      if (ps.canvasWidth === size.width && ps.canvasHeight === size.height) return;
      ps.setCanvasDimensions(size.width, size.height);
      const canvas = getCanvas();
      if (canvas) {
        useCanvasStore.getState().centerAndFitViewport(canvas, size.width, size.height);
      }
    });
    return unsub;
  }, [mode, getCanvas]);

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
  const size = computeLayoutDimensions({
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

  // Freeform: just sets the canvas dimensions and locks. No fence is drawn.
  const handleFreeformCommit = useCallback(() => {
    const ps = useProjectStore.getState();
    const store = useLayoutStore.getState();

    ps.setCanvasDimensions(freeformWidth, freeformHeight);
    store.applyFreeformAndLock();

    const canvas = getCanvas();
    if (canvas) {
      requestAnimationFrame(() => {
        useCanvasStore
          .getState()
          .centerAndFitViewport(canvas, freeformWidth, freeformHeight);
      });
    }
  }, [freeformWidth, freeformHeight, getCanvas]);

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
        {mode === 'layout' && (
          <LayoutFamiliesCatalog
            selectedFamily={selectedFamily}
            onFamilyClick={handleFamilyClick}
          />
        )}

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
        {mode === 'layout' ? (
          /* Right rail is always populated in layout mode now: a default
           * family is selected on mount, so the user sees layout settings
           * (sliders, finished size, Start Designing) immediately instead
           * of an empty "select a preset" placeholder. */
          <LayoutConfigPanel presetId={selectedPresetId} onCommit={handleCommit} />
        ) : mode === 'template' && selectedTemplateId ? (
          <TemplateConfigPanel templateId={selectedTemplateId} onCommit={handleCommit} />
        ) : mode === 'template' && selectedUserTemplate ? (
          <UserTemplateConfigPanel template={selectedUserTemplate} onCommit={handleCommit} />
        ) : mode === 'free-form' ? (
          <FreeformConfigPanel
            width={freeformWidth}
            height={freeformHeight}
            bindingWidth={freeformBindingWidth}
            onWidthChange={(v) => {
              setFreeformWidth(v);
              setFreeformPresetId(null);
            }}
            onHeightChange={(v) => {
              setFreeformHeight(v);
              setFreeformPresetId(null);
            }}
            onBindingWidthChange={setFreeformBindingWidth}
            onCommit={handleCommit}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center p-6">
            <p className="text-[13px] text-[var(--color-text-dim)] text-center">
              Choose a template to get started
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

