'use client';

import { useCallback, useRef } from 'react';
import { findPatchAtPoint } from '@/lib/blockbuilder-utils';
import type { Patch, MinimalCanvas } from './types';

/**
 * Select tool — on mouse-down, converts the pixel pointer into grid
 * coordinates and asks the patch index (findPatchAtPoint) which patch
 * the user clicked. Patch vertices are stored in grid coords, so the
 * pointer must be converted to grid coords before the lookup; passing
 * pixels there would miss every patch at non-unit grid sizes.
 *
 * The hit patch id is pushed into the segments store via
 * `setSelectedPatchId` — the canvas effect subscribes to it and
 * renders a highlight polygon over the selected patch on the next
 * render.
 *
 * Clicking outside any patch clears the selection.
 */
interface UseSelectToolOptions {
  patches: readonly Patch[];
  gridSize: number;
  setSelectedPatchId: (id: string | null) => void;
}

export function useSelectTool({ patches, gridSize, setSelectedPatchId }: UseSelectToolOptions) {
  // We keep the latest patches/gridSize in refs so the event handlers don't
  // need to be re-registered on the fabric canvas every time a segment is
  // drawn — otherwise we'd thrash canvas listeners during active drawing.
  const patchesRef = useRef(patches);
  patchesRef.current = patches;
  const gridSizeRef = useRef(gridSize);
  gridSizeRef.current = gridSize;

  const onMouseDown = useCallback(
    (pointer: { x: number; y: number }, _c: MinimalCanvas) => {
      const gs = gridSizeRef.current;
      if (!gs || gs <= 0) return;
      // Convert pixel → grid coordinates. Patch vertices live in grid space.
      const gridX = pointer.x / gs;
      const gridY = pointer.y / gs;
      const hit = findPatchAtPoint(gridX, gridY, patchesRef.current);
      setSelectedPatchId(hit);
    },
    [setSelectedPatchId]
  );

  const onEscape = useCallback(() => {
    setSelectedPatchId(null);
  }, [setSelectedPatchId]);

  const reset = useCallback(() => {
    setSelectedPatchId(null);
  }, [setSelectedPatchId]);

  return { onMouseDown, onEscape, reset };
}
