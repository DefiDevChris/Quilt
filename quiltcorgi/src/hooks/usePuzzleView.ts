'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useCanvasStore, type ToolType } from '@/stores/canvasStore';
import { usePieceInspectorStore } from '@/stores/pieceInspectorStore';
import { fabricObjectToSvgData } from '@/lib/fabric-object-to-svg';
import { extractPieceGeometry, computePieceDimensions } from '@/lib/piece-inspector-engine';
import { getPixelsPerUnit } from '@/lib/canvas-utils';

// ── Types ─────────────────────────────────────────────────────────

interface FabricTarget {
  readonly id?: string;
  readonly fabricId?: string;
  readonly left?: number;
  readonly top?: number;
  readonly _layoutElement?: boolean;
  shadow: unknown;
  set: (props: Record<string, unknown>) => void;
  setCoords: () => void;
}

interface FabricMouseEvent {
  readonly e: MouseEvent;
  readonly target?: FabricTarget | null;
}

// ── Constants ─────────────────────────────────────────────────────

const HOVER_SHADOW = {
  color: 'rgba(255, 176, 133, 0.4)',
  blur: 12,
  offsetX: 0,
  offsetY: 0,
};

// ── Helpers ───────────────────────────────────────────────────────

/**
 * Extract a stable ID from a Fabric.js object.
 * Prefers `id`, then `fabricId`, then falls back to a
 * position-based temporary ID.
 */
function extractObjectId(target: FabricTarget): string {
  if (target.id) return String(target.id);
  if (target.fabricId) return String(target.fabricId);
  const x = Math.round(target.left ?? 0);
  const y = Math.round(target.top ?? 0);
  return `piece-${x}-${y}`;
}

// ── Hook ──────────────────────────────────────────────────────────

/**
 * Bridges Fabric.js canvas events to the Piece Inspector store.
 *
 * When puzzle view is active, intercepts mouse:over / mouse:out / mouse:down
 * events on the canvas to highlight pieces, extract geometry, and populate
 * the inspector panel. Cleans up all event listeners and visual state on
 * deactivation and unmount.
 */
export function usePuzzleView() {
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);
  const isPuzzleViewActive = usePieceInspectorStore((s) => s.isPuzzleViewActive);

  const previousToolRef = useRef<ToolType | null>(null);
  const highlightedRef = useRef<FabricTarget | null>(null);
  const layoutElementsRef = useRef<FabricTarget[]>([]);

  // ── Hover handler ─────────────────────────────────────────────

  const handleMouseOver = useCallback(
    (e: FabricMouseEvent) => {
      const canvas = fabricCanvas;
      const target = e.target as FabricTarget | null | undefined;
      if (!canvas || !target) return;

      const objectId = extractObjectId(target);
      usePieceInspectorStore.getState().setHoveredPiece(objectId);

      target.set({ shadow: { ...HOVER_SHADOW } });
      highlightedRef.current = target;
      (canvas as unknown as { requestRenderAll: () => void }).requestRenderAll();
    },
    [fabricCanvas]
  );

  const handleMouseOut = useCallback(
    (e: FabricMouseEvent) => {
      const canvas = fabricCanvas;
      const target = e.target as FabricTarget | null | undefined;
      if (!canvas) return;

      // Clear the previously highlighted object (or the event target)
      const toReset = target ?? highlightedRef.current;
      if (toReset) {
        toReset.set({ shadow: null });
      }
      highlightedRef.current = null;

      usePieceInspectorStore.getState().setHoveredPiece(null);
      (canvas as unknown as { requestRenderAll: () => void }).requestRenderAll();
    },
    [fabricCanvas]
  );

  // ── Click handler ─────────────────────────────────────────────

  const handleMouseDown = useCallback(
    (e: FabricMouseEvent) => {
      const target = e.target as FabricTarget | null | undefined;
      if (!target) return;

      const svgData = fabricObjectToSvgData(target);
      if (!svgData) return;

      const unitSystem = useCanvasStore.getState().unitSystem;
      const pxPerUnit = getPixelsPerUnit(unitSystem);

      const geometry = extractPieceGeometry(svgData, pxPerUnit);
      if (!geometry) return;

      const { seamAllowance } = usePieceInspectorStore.getState();
      const dimensions = computePieceDimensions(geometry, seamAllowance);
      const objectId = extractObjectId(target);

      usePieceInspectorStore.getState().selectPiece(objectId, geometry, dimensions);
    },
    []
  );

  // ── Main effect: wire / unwire canvas events ──────────────────

  useEffect(() => {
    if (!fabricCanvas) return;
    if (!isPuzzleViewActive) return;

    let disposed = false;
    let cleanup: (() => void) | null = null;

    (async () => {
      // Dynamic import for SSR safety
      await import('fabric');
      if (disposed) return;

      const canvas = fabricCanvas as unknown as {
        on: (event: string, handler: unknown) => void;
        off: (event: string, handler: unknown) => void;
        getObjects: () => FabricTarget[];
        requestRenderAll: () => void;
      };

      // Save current tool so we can restore it later
      previousToolRef.current = useCanvasStore.getState().activeTool;
      useCanvasStore.getState().setActiveTool('select');

      // Make layout elements evented so they respond to mouse events
      const objects = canvas.getObjects();
      const layoutElements: FabricTarget[] = [];
      for (const obj of objects) {
        if (obj._layoutElement) {
          layoutElements.push(obj);
          obj.set({ evented: true });
        }
      }
      layoutElementsRef.current = layoutElements;

      // Attach event listeners
      canvas.on('mouse:over', handleMouseOver as unknown);
      canvas.on('mouse:out', handleMouseOut as unknown);
      canvas.on('mouse:down', handleMouseDown as unknown);

      cleanup = () => {
        canvas.off('mouse:over', handleMouseOver as unknown);
        canvas.off('mouse:out', handleMouseOut as unknown);
        canvas.off('mouse:down', handleMouseDown as unknown);

        // Clear any lingering highlight
        const highlighted = highlightedRef.current;
        if (highlighted) {
          highlighted.set({ shadow: null });
          highlightedRef.current = null;
        }

        // Restore layout elements to non-evented
        for (const el of layoutElementsRef.current) {
          el.set({ evented: false });
        }
        layoutElementsRef.current = [];

        canvas.requestRenderAll();

        // Clear hover/selection state in the store
        usePieceInspectorStore.getState().setHoveredPiece(null);

        // Restore previous tool
        const prevTool = previousToolRef.current;
        if (prevTool && prevTool !== 'select') {
          useCanvasStore.getState().setActiveTool(prevTool);
        }
        previousToolRef.current = null;
      };
    })();

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [fabricCanvas, isPuzzleViewActive, handleMouseOver, handleMouseOut, handleMouseDown]);
}
