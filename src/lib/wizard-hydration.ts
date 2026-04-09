/**
 * Hydration helpers for the New Project wizard's `initialSetup` payload.
 *
 * When a project is created via the wizard, the API stores the user's
 * choices in `project.canvasData.initialSetup`. The studio reads that
 * payload exactly once on first load, mutates the relevant Zustand stores,
 * and then strips the field so it never fires again.
 *
 * Pure helper for unit testing — no React, no Fabric. The caller is
 * responsible for actually invoking the store setters.
 */
import type { InitialSetupConfig, Project } from '@/types/project';
import type { LayoutPreset } from '@/lib/layout-library';
import type { LayoutType, SashingConfig, BorderConfig } from '@/lib/layout-utils';
import { LAYOUT_PRESETS } from '@/lib/layout-library';

/**
 * Minimal subset of `useLayoutStore` setters that the hydrator needs.
 * Defining the dependency this way keeps the helper testable in isolation.
 */
export interface LayoutStoreSetters {
  setLayoutType: (type: LayoutType) => void;
  setSelectedPreset: (presetId: string | null) => void;
  setRows: (rows: number) => void;
  setCols: (cols: number) => void;
  setBlockSize: (size: number) => void;
  setSashing: (updates: Partial<SashingConfig>) => void;
  addBorder: () => void;
  updateBorder: (index: number, updates: Partial<BorderConfig>) => void;
}

export interface ProjectStoreSetters {
  setCanvasDimensions: (width: number, height: number) => void;
}

export interface HydrationResult {
  /** True iff a layout was applied. */
  hydrated: boolean;
  /** Final canvas dimensions in inches (after sizing the layout). */
  canvasWidth: number;
  canvasHeight: number;
}

/**
 * Hydrate the layout store from a layout-path setup payload. Returns the
 * computed canvas dimensions so the caller can keep canvas/grid in sync.
 */
function hydrateLayout(
  preset: LayoutPreset,
  setup: Extract<InitialSetupConfig, { kind: 'layout' }>,
  layout: LayoutStoreSetters
): { width: number; height: number } {
  const { rows: presetRows, cols: presetCols, sashing, borders } = preset.config;
  const rows = setup.rotated ? presetCols : presetRows;
  const cols = setup.rotated ? presetRows : presetCols;

  layout.setLayoutType(preset.config.type as LayoutType);
  layout.setSelectedPreset(preset.id);
  layout.setRows(rows);
  layout.setCols(cols);
  layout.setBlockSize(setup.blockSize);
  layout.setSashing(sashing);

  // Borders are recreated one at a time so each gets a fresh id from the
  // store's internal `createBorder()` factory.
  for (let i = 0; i < borders.length; i++) {
    layout.addBorder();
    layout.updateBorder(i, borders[i]);
  }

  const sashingWidth = sashing?.width ?? 0;
  const totalBorder = borders.reduce((acc, b) => acc + (b.width ?? 0), 0) * 2;
  const width = cols * setup.blockSize + Math.max(0, cols - 1) * sashingWidth + totalBorder;
  const height = rows * setup.blockSize + Math.max(0, rows - 1) * sashingWidth + totalBorder;
  return { width, height };
}

/**
 * Top-level entrypoint. Reads `project.canvasData.initialSetup`, hydrates
 * the relevant stores, and reports the final canvas dimensions. Safe to
 * call on any project — returns `{ hydrated: false, ... }` and leaves
 * stores untouched if there's no setup payload.
 *
 * Side effect: mutates `project.canvasData` to remove the `initialSetup`
 * field so subsequent re-renders or re-fetches don't re-process it.
 */
export function applyInitialSetup(
  project: Project,
  layout: LayoutStoreSetters,
  projectStore: ProjectStoreSetters
): HydrationResult {
  const setup = project.canvasData?.initialSetup;
  if (!setup) {
    return { hydrated: false, canvasWidth: project.canvasWidth, canvasHeight: project.canvasHeight };
  }

  let result: { width: number; height: number } | null = null;

  if (setup.kind === 'layout') {
    const preset = LAYOUT_PRESETS.find((p) => p.id === setup.presetId);
    if (preset) {
      result = hydrateLayout(preset, setup, layout);
    }
  }

  // Strip the setup field so we never re-process it for this in-memory copy.
  if ('initialSetup' in project.canvasData) {
    const { initialSetup: _consumed, ...rest } = project.canvasData;
    void _consumed;
    project.canvasData = rest;
  }

  if (result) {
    // If the project already has dimensions (e.g. from the wizard), respect them.
    // Otherwise, use the natural dimensions computed from the layout.
    const finalWidth = project.canvasWidth > 0 ? project.canvasWidth : result.width;
    const finalHeight = project.canvasHeight > 0 ? project.canvasHeight : result.height;

    projectStore.setCanvasDimensions(finalWidth, finalHeight);
    project.canvasWidth = finalWidth;
    project.canvasHeight = finalHeight;

    return { hydrated: true, canvasWidth: finalWidth, canvasHeight: finalHeight };
  }

  return { hydrated: false, canvasWidth: project.canvasWidth, canvasHeight: project.canvasHeight };
}

/**
 * Mark the in-studio first-visit setup modal as already shown for this
 * project. Call this whenever the wizard hydration runs so the legacy
 * modal doesn't fire on top of an already-configured canvas.
 */
export function markSetupModalDismissed(projectId: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(`qc-quilt-setup-shown-${projectId}`, '1');
  } catch {
    /* sessionStorage may be blocked; the modal will simply re-fire once */
  }
}
