'use client';

import { useCallback, useRef, useEffect } from 'react';
import { useLayoutStore } from '@/stores/layoutStore';
import { useProjectStore } from '@/stores/projectStore';
import type { FenceArea } from '@/types/fence';

/**
 * Point-in-polygon test using ray casting algorithm.
 * Returns true if the point (px, py) is inside the polygon defined by `points`.
 */
export function pointInPolygon(
  px: number,
  py: number,
  points: Array<{ x: number; y: number }>
): boolean {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i].x,
      yi = points[i].y;
    const xj = points[j].x,
      yj = points[j].y;
    const intersect = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Check if a point (px, py) is inside a rectangular fence area.
 */
export function pointInRect(
  px: number,
  py: number,
  area: { x: number; y: number; width: number; height: number }
): boolean {
  return px >= area.x && px <= area.x + area.width && py >= area.y && py <= area.y + area.height;
}

/**
 * Check if a point falls within a specific fence area (handles both
 * rectangular and polygon areas).
 */
export function isPointInArea(px: number, py: number, area: FenceArea): boolean {
  if (area.points && area.points.length >= 3) {
    return pointInPolygon(px, py, area.points);
  }
  return pointInRect(px, py, area);
}

/**
 * Check if a bounding box overlaps any fence area of the given role.
 */
export function bboxOverlapsFenceArea(
  bx: number,
  by: number,
  bw: number,
  bh: number,
  areas: FenceArea[],
  role: FenceArea['role'] = 'block-cell'
): boolean {
  for (const area of areas) {
    if (area.role !== role) continue;
    // Simple AABB overlap for rectangular areas
    const ax = area.x;
    const ay = area.y;
    const aw = area.width;
    const ah = area.height;
    if (bx < ax + aw && bx + bw > ax && by < ay + ah && by + bh > ay) {
      return true;
    }
  }
  return false;
}

/**
 * Pure function: check if a point is inside any fence area with a matching role.
 */
export function isPointInFenceAreaPure(
  px: number,
  py: number,
  areas: FenceArea[],
  role?: FenceArea['role']
): boolean {
  const targetRole = role ?? 'block-cell';
  for (const area of areas) {
    if (area.role !== targetRole) continue;
    if (isPointInArea(px, py, area)) return true;
  }
  return false;
}

/**
 * Pure function: get the containing fence area for a point.
 */
export function getContainingFenceAreaPure(
  px: number,
  py: number,
  areas: FenceArea[]
): FenceArea | null {
  for (const area of areas) {
    if (isPointInArea(px, py, area)) return area;
  }
  return null;
}

/**
 * Hook that provides fence constraint functions for drawing tools.
 *
 * When `hasAppliedLayout` is true, drawing tools should only allow
 * operations within valid fence areas. When false, everything is allowed.
 *
 * @param getFenceAreas - Function that returns the current fence areas
 *   (typically from useFenceRenderer's return value)
 */
export function useFenceConstraints(getFenceAreas?: () => FenceArea[]) {
  const { mode } = useProjectStore.getState();
  const areasRef = useRef<FenceArea[]>([]);

  // Keep areasRef in sync with the fence areas source
  useEffect(() => {
    if (getFenceAreas) {
      areasRef.current = getFenceAreas();
    }
  });

  /**
   * Check if a canvas scene point falls within any fence area of the given role.
   * In free-form mode, always returns true (unrestricted).
   */
  const isPointInFenceArea = useCallback(
    (x: number, y: number, role?: FenceArea['role']): boolean => {
      if (mode === 'free-form') return true;
      const areas = getFenceAreas ? getFenceAreas() : areasRef.current;
      return isPointInFenceAreaPure(x, y, areas, role);
    },
    [mode, getFenceAreas]
  );

  /**
   * Get the fence area that contains the given point.
   * In free-form mode, returns a synthetic full-canvas area.
   */
  const getContainingFenceArea = useCallback(
    (x: number, y: number): FenceArea | null => {
      if (mode === 'free-form') {
        // Return a synthetic area representing the entire canvas
        return {
          id: 'freeform',
          role: 'block-cell',
          x: 0,
          y: 0,
          width: Infinity,
          height: Infinity,
        };
      }
      const areas = getFenceAreas ? getFenceAreas() : areasRef.current;
      return getContainingFenceAreaPure(x, y, areas);
    },
    [mode, getFenceAreas]
  );

  /**
   * Check if a bounding box overlaps any block-cell fence area.
   * Used for validating EasyDraw paths after creation.
   */
  const doesBboxOverlapFence = useCallback(
    (bx: number, by: number, bw: number, bh: number): boolean => {
      if (mode === 'free-form') return true;
      const areas = getFenceAreas ? getFenceAreas() : areasRef.current;
      return bboxOverlapsFenceArea(bx, by, bw, bh, areas);
    },
    [mode, getFenceAreas]
  );

  return {
    mode,
    isPointInFenceArea,
    getContainingFenceArea,
    doesBboxOverlapFence,
  };
}
