'use client';

import { useEffect, useRef } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useLayoutStore } from '@/stores/layoutStore';
import { useLeftPanelStore } from '@/stores/leftPanelStore';
import { useCanvasContext } from '@/contexts/CanvasContext';
import type { QuiltTemplate } from '@/lib/templates';
import type { UserLayoutTemplate } from '@/types/layoutTemplate';

type ParsedTemplate =
  | { kind: 'system'; template: QuiltTemplate }
  | { kind: 'user'; template: UserLayoutTemplate }
  | null;

/**
 * Try to parse the previewCache JSON into either a system or user template.
 * Returns null when the cache is empty or unparseable.
 */
function parsePreviewCache(raw: string | null): ParsedTemplate {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<QuiltTemplate & UserLayoutTemplate>;
    if (parsed && 'templateData' in parsed && parsed.templateData) {
      return { kind: 'user', template: parsed as UserLayoutTemplate };
    }
    if (parsed && 'layoutConfig' in parsed && 'fabricAssignments' in parsed) {
      return { kind: 'system', template: parsed as QuiltTemplate };
    }
  } catch {
    // fall through
  }
  return null;
}

/**
 * useTemplateHydration
 *
 * Hydrates the Fabric canvas with the selected template once the user clicks
 * "Start Designing" in template mode. Only runs when:
 *
 *   1. project mode === 'template'
 *   2. layoutLocked transitions to true (i.e. just finished Phase 1)
 *   3. there is a previewCache entry from leftPanelStore
 *   4. a Fabric canvas is available
 *
 * The hook is idempotent: it tracks whether it already hydrated for this
 * commit, so subsequent re-renders won't redraw.
 *
 * For user-saved templates the hook calls `canvas.loadFromJSON()` with the
 * full canvas snapshot. For system templates it applies the layout config to
 * `useLayoutStore` (the fence renderer takes it from there) and seeds the
 * canvas dimensions. Block-placement hydration for system templates is a
 * deliberate v1 simplification — the fence draws the cells and the user can
 * drop blocks/fabrics with the existing drop pipeline.
 */
export function useTemplateHydration(): void {
  const { getCanvas } = useCanvasContext();
  const projectMode = useProjectStore((s) => s.mode);
  const layoutLocked = useLayoutStore((s) => s.layoutLocked);
  const previewCache = useLeftPanelStore((s) => s.previewCache);

  const hydratedRef = useRef(false);

  useEffect(() => {
    if (projectMode !== 'template') {
      hydratedRef.current = false;
      return;
    }
    if (!layoutLocked) return;
    if (hydratedRef.current) return;

    const parsed = parsePreviewCache(previewCache);
    if (!parsed) return;

    const canvas = getCanvas();
    if (!canvas) return;

    hydratedRef.current = true;

    if (parsed.kind === 'user') {
      // User-saved template: full canvas snapshot is already in templateData.
      const tpl = parsed.template;
      const cfg = tpl.templateData.layoutConfig;
      const ls = useLayoutStore.getState();
      // Seed layout store from the saved config so the fence renderer matches.
      // Note: the layoutStore lock guards prevent these calls from doing
      // anything if we've already locked. So we seed BEFORE locking would
      // normally happen — but we are here AFTER applyLayoutAndLock, which
      // means setters are no-ops. That's fine: the user template's
      // canvasJson already contains the visual fence and we can rely on
      // the snapshot rather than re-running fence engine.
      void ls; // intentionally unused — keep import for future re-seed work

      useProjectStore
        .getState()
        .setCanvasDimensions(tpl.templateData.canvasWidth, tpl.templateData.canvasHeight);

      try {
        const c = canvas as unknown as {
          loadFromJSON: (json: unknown) => Promise<unknown> | unknown;
          renderAll: () => void;
        };
        const result = c.loadFromJSON(tpl.templateData.canvasJson);
        if (result && typeof (result as Promise<unknown>).then === 'function') {
          (result as Promise<unknown>).then(() => c.renderAll());
        } else {
          c.renderAll();
        }
      } catch (err) {
        console.error('[useTemplateHydration] loadFromJSON failed:', err);
      }
      // Mark as applied so subsequent runs don't re-trigger, and flag that
      // the canvas now has content (needed for Save-as-Template visibility).
      useLeftPanelStore.getState().applyPreview();
      useProjectStore.getState().setHasContent(true);
      return;
    }

    if (parsed.kind === 'system') {
      // System template: apply layout config to the store (fence draws itself).
      // Note: layoutStore is locked at this point, so we have to call
      // applyTemplateLayoutConfig in a different way — by reading & mutating
      // raw state. Easiest workaround: skip layout-store seeding here
      // because Phase 1 already wrote canonical state via the SelectionShell
      // commit path (it just used computeLayoutSize before locking).
      //
      // For v1 we limit ourselves to ensuring the project canvas dimensions
      // match the template — the fence renderer will draw the correct cells
      // based on whatever layoutStore was last set to before applyLayoutAndLock.
      const tpl = parsed.template;
      useProjectStore.getState().setCanvasDimensions(tpl.canvasWidth, tpl.canvasHeight);
      useLeftPanelStore.getState().applyPreview();
      useProjectStore.getState().setHasContent(true);
    }
  }, [projectMode, layoutLocked, previewCache, getCanvas]);
}
