/**
 * Post-F: Neighbor detection.
 *
 * Walk the label map. For every pixel, if (x+1, y) or (x, y+1) has a different
 * ID, record the pair. Build a neighbors array per patch.
 *
 * This produces a symmetric adjacency list: if patch A neighbors patch B,
 * then patch B also neighbors patch A.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Point } from '@/types/photo-to-design';

interface ContourData {
  patchId: number;
  points: Point[];
  pixelPoints: Point[];
  centroid: Point;
  area: number;
}

/**
 * Detect neighbor relationships from a label map.
 *
 * @param labelMat — label map (CV_32S, h×w)
 * @param width    — image width
 * @param height   — image height
 * @returns Map<patchId, neighborIds[]>
 */
export function detectNeighbors(
  labelMat: any,
  width: number,
  height: number
): Map<number, number[]> {
  const neighborSets = new Map<number, Set<number>>();

  // Walk the label map, checking right and down neighbors
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const id = labelMat.data32S[idx];
      if (id === 0) continue; // background

      // Check right neighbor (x+1, y)
      if (x < width - 1) {
        const rightId = labelMat.data32S[idx + 1];
        if (rightId !== id && rightId !== 0) {
          addNeighbor(neighborSets, id, rightId);
          addNeighbor(neighborSets, rightId, id);
        }
      }

      // Check down neighbor (x, y+1)
      if (y < height - 1) {
        const downId = labelMat.data32S[idx + width];
        if (downId !== id && downId !== 0) {
          addNeighbor(neighborSets, id, downId);
          addNeighbor(neighborSets, downId, id);
        }
      }
    }
  }

  // Convert sets to sorted arrays
  const result = new Map<number, number[]>();
  for (const [id, neighbors] of neighborSets) {
    result.set(id, Array.from(neighbors).sort((a, b) => a - b));
  }

  return result;
}

function addNeighbor(
  neighborSets: Map<number, Set<number>>,
  id: number,
  neighborId: number
): void {
  if (!neighborSets.has(id)) {
    neighborSets.set(id, new Set());
  }
  neighborSets.get(id)!.add(neighborId);
}
