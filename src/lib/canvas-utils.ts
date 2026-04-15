import { PIXELS_PER_INCH, PIXELS_PER_CM, ZOOM_MAX } from '@/lib/constants';
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
    ZOOM_MAX
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

/**
 * Compute the viewport transform (zoom + pan) to center a quilt in a container.
 * Pure function — no store or DOM dependencies.
 */
export function computeViewportTransform(
  containerWidth: number,
  containerHeight: number,
  canvasWidth: number,
  canvasHeight: number,
  zoom: number,
  unitSystem: UnitSystem
): { zoom: number; panX: number; panY: number } {
  const pxPerUnit = getPixelsPerUnit(unitSystem);
  const quiltWPx = canvasWidth * pxPerUnit;
  const quiltHPx = canvasHeight * pxPerUnit;
  const panX = (containerWidth - quiltWPx * zoom) / 2;
  const panY = (containerHeight - quiltHPx * zoom) / 2;
  return { zoom, panX, panY };
}

/**
 * Clamp pan offsets so the quilt can't be dragged off-screen.
 * If the quilt is smaller than the viewport on an axis, it stays centered.
 * Otherwise the quilt edges cannot cross the opposite viewport edges.
 */
export function clampPan(
  panX: number,
  panY: number,
  zoom: number,
  containerWidth: number,
  containerHeight: number,
  canvasWidth: number,
  canvasHeight: number,
  unitSystem: UnitSystem
): { panX: number; panY: number } {
  const pxPerUnit = getPixelsPerUnit(unitSystem);
  const quiltWPx = canvasWidth * pxPerUnit * zoom;
  const quiltHPx = canvasHeight * pxPerUnit * zoom;

  let clampedX: number;
  if (quiltWPx <= containerWidth) {
    clampedX = (containerWidth - quiltWPx) / 2;
  } else {
    const minX = containerWidth - quiltWPx;
    clampedX = Math.min(0, Math.max(minX, panX));
  }

  let clampedY: number;
  if (quiltHPx <= containerHeight) {
    clampedY = (containerHeight - quiltHPx) / 2;
  } else {
    const minY = containerHeight - quiltHPx;
    clampedY = Math.min(0, Math.max(minY, panY));
  }

  return { panX: clampedX, panY: clampedY };
}
