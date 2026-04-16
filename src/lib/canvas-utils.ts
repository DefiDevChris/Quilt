import { PIXELS_PER_INCH, PIXELS_PER_CM, ZOOM_MAX } from '@/lib/constants';
import type { UnitSystem } from '@/types/canvas';
import type { GridSettings } from '@/types/grid';

const _PENCIL_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><path d="M11 1L15 5L4 15L0 11Z" fill="lightyellow" stroke="black" stroke-width="0.8"/><path d="M11 1L15 5L13 7L9 3Z" fill="lightpink"/><path d="M0 11L4 15L0 15Z" fill="dimgray"/></svg>';
const _PENCIL_CURSOR = `url("data:image/svg+xml,${encodeURIComponent(_PENCIL_SVG)}") 0 15, crosshair`;

const _WAND_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><path d="M2 14L11 5" stroke="black" stroke-width="2" stroke-linecap="round"/><circle cx="13" cy="3" r="2" fill="black"/><circle cx="15" cy="7" r="1" fill="black"/><circle cx="10" cy="1" r="1" fill="black"/></svg>';
const _WAND_CURSOR = `url("data:image/svg+xml,${encodeURIComponent(_WAND_SVG)}") 2 14, crosshair`;

const _CROSSHAIR_PLUS_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><line x1="8" y1="1" x2="8" y2="15" stroke="black" stroke-width="1.2"/><line x1="1" y1="8" x2="15" y2="8" stroke="black" stroke-width="1.2"/></svg>';
const _CROSSHAIR_PLUS_CURSOR = `url("data:image/svg+xml,${encodeURIComponent(_CROSSHAIR_PLUS_SVG)}") 8 8, crosshair`;

/**
 * Returns the CSS cursor string for a given tool type.
 * Centralises cursor management so all hooks stay consistent.
 */
export function cursorForTool(tool: string): string {
  switch (tool) {
    case 'select':
      return 'default';
    case 'pan':
      return 'grab';
    case 'easydraw':
      return _PENCIL_CURSOR;
    case 'bend':
      return _WAND_CURSOR;
    case 'rectangle':
    case 'triangle':
    case 'polygon':
    case 'circle':
      return _CROSSHAIR_PLUS_CURSOR;
    default:
      return 'default';
  }
}

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
 * Unified canvas geometry — single source of truth for both the HTML5 grid
 * canvas and the Fabric.js object canvas.
 *
 * Both layers MUST use these values to stay aligned. Eliminates the drift
 * between independent coordinate calculations in canvas-grid.ts and
 * fence-engine.ts.
 */
export interface CanvasGeometry {
  /** Pixels-per-unit for the active unit system (96 for imperial, ~37.8 for metric) */
  pxPerUnit: number;
  /** Quilt width in pixels (quiltWidth * pxPerUnit) */
  quiltWidthPx: number;
  /** Quilt height in pixels (quiltHeight * pxPerUnit) */
  quiltHeightPx: number;
  /** Current zoom level */
  zoom: number;
  /** Horizontal pan offset in screen pixels */
  panX: number;
  /** Vertical pan offset in screen pixels */
  panY: number;
  /** The 6-element affine transform: [zoom, 0, 0, zoom, panX, panY] */
  viewportTransform: [number, number, number, number, number, number];
}

/**
 * Compute the canonical canvas geometry from quilt dimensions + viewport state.
 *
 * This is the **single source of truth** for coordinate mapping. Both
 * `renderGrid` (HTML5 Canvas) and `useFenceRenderer` (Fabric.js) should
 * derive pixel positions from this output rather than computing pxPerUnit
 * and quilt pixel sizes independently.
 *
 * Pure function — no store, DOM, or Fabric.js dependencies.
 */
export function computeCanvasGeometry(
  quiltWidth: number,
  quiltHeight: number,
  unitSystem: UnitSystem,
  zoom: number,
  panX: number,
  panY: number
): CanvasGeometry {
  const pxPerUnit = getPixelsPerUnit(unitSystem);
  return {
    pxPerUnit,
    quiltWidthPx: quiltWidth * pxPerUnit,
    quiltHeightPx: quiltHeight * pxPerUnit,
    zoom,
    panX,
    panY,
    viewportTransform: [zoom, 0, 0, zoom, panX, panY],
  };
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
