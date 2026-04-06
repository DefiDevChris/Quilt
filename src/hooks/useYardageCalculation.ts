'use client';

import { useEffect, useRef } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useYardageStore } from '@/stores/yardageStore';
import { useLayoutStore } from '@/stores/layoutStore';
import { useProjectStore } from '@/stores/projectStore';
import { PIXELS_PER_INCH } from '@/lib/constants';
import {
  computeYardageEstimates,
  calculateBackingYardage,
  calculateBindingYardage,
  type CanvasShapeData,
} from '@/lib/yardage-utils';

function extractShapesFromCanvas(canvas: unknown): CanvasShapeData[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = canvas as any;
  if (!c || typeof c.getObjects !== 'function') return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const objects: any[] = c.getObjects();
  const shapes: CanvasShapeData[] = [];

  for (const obj of objects) {
    // Skip layout engine placeholder objects
    if (obj._layoutElement) continue;
    // Skip grid lines and other non-shape objects
    if (!obj.selectable && !obj.evented) continue;

    const fill = obj.fill;
    let fabricId: string | null = null;
    let fabricName: string | null = null;
    let fillColor = '#000000';

    if (typeof fill === 'object' && fill !== null && fill.source) {
      // Pattern fill — extract fabric info from custom properties
      fabricId = obj._fabricId ?? null;
      fabricName = obj._fabricName ?? null;
      fillColor = obj._fabricColor ?? '#000000';
    } else if (typeof fill === 'string') {
      fillColor = fill;
    }

    shapes.push({
      id: obj.id ?? obj.__uid ?? `obj-${shapes.length}`,
      widthPx: obj.width ?? 0,
      heightPx: obj.height ?? 0,
      scaleX: obj.scaleX ?? 1,
      scaleY: obj.scaleY ?? 1,
      fabricId,
      fabricName,
      fillColor,
      type: obj.type ?? 'unknown',
    });
  }

  return shapes;
}

function extractBorderShapes(
  borders: { width: number; color: string; fabricId: string | null }[],
  canvasWidthPx: number,
  canvasHeightPx: number
): CanvasShapeData[] {
  const shapes: CanvasShapeData[] = [];
  let currentWidth = canvasWidthPx;
  let currentHeight = canvasHeightPx;

  for (let i = 0; i < borders.length; i++) {
    const border = borders[i];
    const borderWidthPx = border.width * PIXELS_PER_INCH;

    // Top strip
    shapes.push({
      id: `border-${i}-top`,
      widthPx: currentWidth + 2 * borderWidthPx,
      heightPx: borderWidthPx,
      scaleX: 1,
      scaleY: 1,
      fabricId: border.fabricId,
      fabricName: null,
      fillColor: border.color,
      type: 'rect',
    });

    // Bottom strip
    shapes.push({
      id: `border-${i}-bottom`,
      widthPx: currentWidth + 2 * borderWidthPx,
      heightPx: borderWidthPx,
      scaleX: 1,
      scaleY: 1,
      fabricId: border.fabricId,
      fabricName: null,
      fillColor: border.color,
      type: 'rect',
    });

    // Left strip
    shapes.push({
      id: `border-${i}-left`,
      widthPx: borderWidthPx,
      heightPx: currentHeight,
      scaleX: 1,
      scaleY: 1,
      fabricId: border.fabricId,
      fabricName: null,
      fillColor: border.color,
      type: 'rect',
    });

    // Right strip
    shapes.push({
      id: `border-${i}-right`,
      widthPx: borderWidthPx,
      heightPx: currentHeight,
      scaleX: 1,
      scaleY: 1,
      fabricId: border.fabricId,
      fabricName: null,
      fillColor: border.color,
      type: 'rect',
    });

    currentWidth += 2 * borderWidthPx;
    currentHeight += 2 * borderWidthPx;
  }

  return shapes;
}

export function useYardageCalculation() {
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);
  const isPanelOpen = useYardageStore((s) => s.isPanelOpen);
  const wof = useYardageStore((s) => s.wof);
  const wasteMargin = useYardageStore((s) => s.wasteMargin);
  const setResults = useYardageStore((s) => s.setResults);
  const setBackingResult = useYardageStore((s) => s.setBackingResult);
  const setBindingResult = useYardageStore((s) => s.setBindingResult);
  const canvasWidth = useProjectStore((s) => s.canvasWidth);
  const canvasHeight = useProjectStore((s) => s.canvasHeight);
  const borders = useLayoutStore((s) => s.borders);
  const recalcTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!fabricCanvas || !isPanelOpen) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const canvas = fabricCanvas as any;

    function recalculate() {
      const canvasShapes = extractShapesFromCanvas(fabricCanvas);

      // Include border fabric in calculations
      const canvasWidth = canvas.width ?? 0;
      const canvasHeight = canvas.height ?? 0;
      const borderShapes = extractBorderShapes(borders, canvasWidth, canvasHeight);

      const allShapes = [...canvasShapes, ...borderShapes];
      const results = computeYardageEstimates(allShapes, PIXELS_PER_INCH, wof, wasteMargin);
      setResults(results);

      // Backing and binding based on finished quilt dimensions
      setBackingResult(calculateBackingYardage(canvasWidth, canvasHeight, wof));
      setBindingResult(calculateBindingYardage(canvasWidth, canvasHeight, wof));
    }

    // Initial calculation
    recalculate();

    // Debounced recalculation on canvas changes
    function debouncedRecalc() {
      if (recalcTimerRef.current) {
        clearTimeout(recalcTimerRef.current);
      }
      recalcTimerRef.current = setTimeout(recalculate, 300);
    }

    canvas.on('object:added', debouncedRecalc);
    canvas.on('object:removed', debouncedRecalc);
    canvas.on('object:modified', debouncedRecalc);

    return () => {
      canvas.off('object:added', debouncedRecalc);
      canvas.off('object:removed', debouncedRecalc);
      canvas.off('object:modified', debouncedRecalc);
      if (recalcTimerRef.current) {
        clearTimeout(recalcTimerRef.current);
      }
    };
  }, [
    fabricCanvas,
    isPanelOpen,
    wof,
    wasteMargin,
    borders,
    canvasWidth,
    canvasHeight,
    setResults,
    setBackingResult,
    setBindingResult,
  ]);
}
