import { getPixelsPerUnit } from '@/lib/canvas-utils';
import type { UnitSystem } from '@/types/canvas';

/**
 * Snap utilities for two-mode snapping behavior.
 *
 * Layout/Template mode: snap to cells
 * Free-form mode: snap to configurable grid corners/lines
 */

/**
 * Snap a point to the nearest cell in a fence area.
 * Used in Layout/Template modes for block and fabric drops.
 *
 * @param point - The point to snap
 * @param fenceCells - Array of cell objects with {x, y, width, height, id}
 * @param toleranceIn - Tolerance in inches for considering a point "near" a cell
 * @returns The cell object if found, null otherwise
 */
export function snapToCell(
  point: { x: number; y: number },
  fenceCells: Array<{ x: number; y: number; width: number; height: number; id: string }>,
  toleranceIn: number = 0.25
): { x: number; y: number; width: number; height: number; id: string } | null {
  const tolerancePx = toleranceIn * getPixelsPerUnit('imperial'); // Using imperial for consistency

  for (const cell of fenceCells) {
    if (
      point.x >= cell.x - tolerancePx &&
      point.x <= cell.x + cell.width + tolerancePx &&
      point.y >= cell.y - tolerancePx &&
      point.y <= cell.y + cell.height + tolerancePx
    ) {
      return cell;
    }
  }

  return null;
}

/**
 * Snap a point to the nearest grid corner.
 * Used in Free-form mode for block drops and shape drawing.
 *
 * @param point - The point to snap (in pixels)
 * @param gridSizeIn - Grid size in inches
 * @param zoom - Current zoom level
 * @returns Snapped point coordinates
 */
export function snapToGridCorner(
  point: { x: number; y: number },
  gridSizeIn: number,
  zoom: number
): { x: number; y: number } {
  const gridSizePx = gridSizeIn * getPixelsPerUnit('imperial') * zoom;

  return {
    x: Math.round(point.x / gridSizePx) * gridSizePx,
    y: Math.round(point.y / gridSizePx) * gridSizePx,
  };
}

/**
 * Snap a point to the nearest grid line on a specific axis.
 * Used for bend tool interactions.
 *
 * @param point - The point to snap
 * @param gridSizeIn - Grid size in inches
 * @param axis - 'x' or 'y' axis to snap
 * @param zoom - Current zoom level
 * @returns Snapped point coordinates
 */
export function snapToGridLine(
  point: { x: number; y: number },
  gridSizeIn: number,
  axis: 'x' | 'y',
  zoom: number
): { x: number; y: number } {
  const gridSizePx = gridSizeIn * getPixelsPerUnit('imperial') * zoom;
  const result = { ...point };

  if (axis === 'x') {
    result.x = Math.round(point.x / gridSizePx) * gridSizePx;
  } else {
    result.y = Math.round(point.y / gridSizePx) * gridSizePx;
  }

  return result;
}

/**
 * Snap a line segment's endpoints to grid corners.
 * Used for EasyDraw tool.
 *
 * @param start - Start point of the segment
 * @param end - End point of the segment
 * @param gridSizeIn - Grid size in inches
 * @param zoom - Current zoom level
 * @returns Object with snapped start and end points
 */
export function snapSegment(
  start: { x: number; y: number },
  end: { x: number; y: number },
  gridSizeIn: number,
  zoom: number
): { start: { x: number; y: number }; end: { x: number; y: number } } {
  return {
    start: snapToGridCorner(start, gridSizeIn, zoom),
    end: snapToGridCorner(end, gridSizeIn, zoom),
  };
}
