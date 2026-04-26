'use client';

import { useEffect } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useCanvasContext } from '@/contexts/CanvasContext';
import { QUILT_TEMPLATES } from '@/lib/templates';

/**
 * useTemplateHydration
 *
 * Watches `pendingTemplateId` on the project store and, once both the id
 * is set AND the Fabric.js canvas is initialized, stamps the template's
 * pre-baked design onto the canvas:
 *
 *   1. Background fabric (from `target: 'background'` assignment) is
 *      applied as the canvas backgroundColor.
 *   2. The pending id is then cleared so the hydration is one-shot.
 *
 * Block placement (drag-stamping the template's `blocks[]` into fence
 * cells) and per-fabric-area fill (sashing, border colors) require a
 * full block library + seeded fabric library to be available — those
 * are intentionally deferred and tracked as TODOs at the call site.
 *
 * This hook should be mounted once at the top of the studio tree, after
 * the CanvasProvider is in scope.
 */
export function useTemplateHydration() {
  const { getCanvas } = useCanvasContext();
  const pendingTemplateId = useProjectStore((s) => s.pendingTemplateId);

  useEffect(() => {
    if (!pendingTemplateId) return;
    const template = QUILT_TEMPLATES.find((t) => t.id === pendingTemplateId);
    if (!template) {
      useProjectStore.getState().setPendingTemplateId(null);
      return;
    }

    // Wait for canvas to be available — the canvas mounts asynchronously
    // via dynamic import + useEffect inside CanvasWorkspace. Poll a few
    // animation frames before giving up.
    let attempts = 0;
    const maxAttempts = 30;
    let rafId: number | null = null;

    const tryHydrate = () => {
      const canvas = getCanvas();
      if (!canvas) {
        attempts += 1;
        if (attempts < maxAttempts) {
          rafId = requestAnimationFrame(tryHydrate);
        }
        return;
      }

      // Apply background fabric color, if any.
      const backgroundAssignment = template.fabricAssignments.find(
        (a) => a.target === 'background',
      );
      if (backgroundAssignment?.fillColor) {
        const fabricCanvas = canvas as {
          backgroundColor?: string;
          renderAll: () => void;
        };
        fabricCanvas.backgroundColor = backgroundAssignment.fillColor;
        fabricCanvas.renderAll();
      }

      // TODO: Stamp template.blocks[] into fence cells — requires seeded
      // block library so block IDs in templates.ts resolve to real blocks.
      // TODO: Apply sashing/border fabric assignments — requires the fence
      // engine to expose a paint-by-role API.

      useProjectStore.getState().setPendingTemplateId(null);
    };

    rafId = requestAnimationFrame(tryHydrate);
    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [pendingTemplateId, getCanvas]);
}
