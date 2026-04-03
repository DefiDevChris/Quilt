import { PIXELS_PER_INCH, PIXELS_PER_CM } from '@/lib/constants';
import type { UnitSystem } from '@/types/canvas';
import type { GridSettings } from '@/types/grid';

export function getPixelsPerUnit(unitSystem: UnitSystem): number {
  return unitSystem === 'imperial' ? PIXELS_PER_INCH : PIXELS_PER_CM;
}

export function unitsToPixels(value: number, unitSystem: UnitSystem): number {
  return value * getPixelsPerUnit(unitSystem);
}

export function pixelsToUnits(pixels: number, unitSystem: UnitSystem): number {
  return pixels / getPixelsPerUnit(unitSystem);
}

export function convertUnits(value: number, from: UnitSystem, to: UnitSystem): number {
  if (from === to) return value;
  const px = unitsToPixels(value, from);
  return pixelsToUnits(px, to);
}

export function snapToGrid(value: number, gridSizePx: number): number {
  if (gridSizePx <= 0) return value;
  return Math.round(value / gridSizePx) * gridSizePx;
}

export function snapPointToGrid(
  point: { x: number; y: number },
  gridSizePx: number
): { x: number; y: number } {
  return {
    x: snapToGrid(point.x, gridSizePx),
    y: snapToGrid(point.y, gridSizePx),
  };
}

export function formatMeasurement(
  value: number,
  unitSystem: UnitSystem,
  precision: number = 2
): string {
  const suffix = unitSystem === 'imperial' ? '"' : 'cm';
  return `${value.toFixed(precision)}${suffix}`;
}

export function getUnitLabel(unitSystem: UnitSystem): string {
  return unitSystem === 'imperial' ? 'in' : 'cm';
}

export function fitToScreenZoom(
  containerWidth: number,
  containerHeight: number,
  quiltWidth: number,
  quiltHeight: number,
  unitSystem: UnitSystem
): number {
  const pxPerUnit = getPixelsPerUnit(unitSystem);
  const quiltWidthPx = quiltWidth * pxPerUnit;
  const quiltHeightPx = quiltHeight * pxPerUnit;
  const padding = 40;
  return Math.min(
    (containerWidth - padding) / quiltWidthPx,
    (containerHeight - padding) / quiltHeightPx,
    1
  );
}

/**
 * Conditionally snap a value to grid based on current grid settings.
 * Used by drawing tools for snap-to-grid functionality.
 */
export function maybeSnap(val: number, gridSettings: GridSettings, unitSystem: UnitSystem): number {
  if (!gridSettings.snapToGrid) return val;
  const gridPx = gridSettings.size * getPixelsPerUnit(unitSystem);
  return snapToGrid(val, gridPx);
}
