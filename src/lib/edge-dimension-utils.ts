/**
 * Edge Dimension Utilities
 * Calculate per-edge dimensions for cutting template labels.
 *
 * Pure computation — no React or Fabric.js dependency.
 */

import { formatFraction } from '@/lib/fraction-utils';

// ── Types ──────────────────────────────────────────────────────────

export interface EdgeDimension {
  startVertex: { x: number; y: number };
  endVertex: { x: number; y: number };
  /** Edge length in inches or millimeters */
  length: number;
  /** Human-readable length (e.g., "3 1/2"" or "89mm") */
  formattedLength: string;
  /** Midpoint of the edge — for positioning the label */
  midpoint: { x: number; y: number };
  /** Angle of the edge in radians — for label rotation */
  angle: number;
}

// ── Core Function ──────────────────────────────────────────────────

/**
 * Calculate per-edge dimensions from a polygon's vertices.
 *
 * @param vertices — Polygon vertices in inches (or raw units)
 * @param unitSystem — 'imperial' for fractional inches, 'metric' for mm
 * @returns Array of edge dimensions, one per edge
 */
export function calculateEdgeDimensions(
  vertices: { x: number; y: number }[],
  unitSystem: 'imperial' | 'metric'
): EdgeDimension[] {
  if (vertices.length < 2) return [];

  const edges: EdgeDimension[] = [];

  for (let i = 0; i < vertices.length; i++) {
    const start = vertices[i];
    const end = vertices[(i + 1) % vertices.length];

    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    const formattedLength = formatEdgeLength(length, unitSystem);

    edges.push({
      startVertex: { x: start.x, y: start.y },
      endVertex: { x: end.x, y: end.y },
      length,
      formattedLength,
      midpoint: {
        x: (start.x + end.x) / 2,
        y: (start.y + end.y) / 2,
      },
      angle,
    });
  }

  return edges;
}

// ── Formatting ─────────────────────────────────────────────────────

/**
 * Format an edge length for display.
 * Imperial: fractional inches with " suffix (e.g., "3 1/2"")
 * Metric: rounded mm (e.g., "89mm")
 */
function formatEdgeLength(lengthInUnits: number, unitSystem: 'imperial' | 'metric'): string {
  if (unitSystem === 'metric') {
    // Assume input is in mm
    return `${Math.round(lengthInUnits)}mm`;
  }

  // Imperial — input is in inches, format as fractions
  return `${formatFraction(lengthInUnits)}"`;
}

/**
 * Deduplicate edges by length — for cutting templates where
 * opposite edges of a rectangle share the same dimension.
 * Returns unique edge lengths with count.
 */
export function uniqueEdgeLengths(
  edges: EdgeDimension[]
): Array<{ formattedLength: string; length: number; count: number }> {
  const map = new Map<string, { formattedLength: string; length: number; count: number }>();

  for (const edge of edges) {
    const key = edge.formattedLength;
    const existing = map.get(key);
    if (existing) {
      map.set(key, { ...existing, count: existing.count + 1 });
    } else {
      map.set(key, {
        formattedLength: edge.formattedLength,
        length: edge.length,
        count: 1,
      });
    }
  }

  return Array.from(map.values());
}
