/**
 * Alignment & Distribution Engine
 * Pure math functions for object alignment and distribution.
 * No DOM or Fabric.js dependencies — fully testable.
 */

export interface ObjectBounds {
  id: string;
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface DistributionResult {
  adjustments: Array<{
    id: string;
    deltaLeft: number;
    deltaTop: number;
  }>;
}

/**
 * Calculate even horizontal distribution for 3+ objects.
 * Objects are sorted by their current left position, then spaced evenly
 * between the leftmost and rightmost object bounds.
 */
export function calculateHorizontalDistribution(
  objects: ObjectBounds[]
): DistributionResult | null {
  if (objects.length < 3) return null;

  const sorted = [...objects].sort((a, b) => a.left - b.left);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  const totalWidth = last.left + last.width - first.left;
  const totalObjWidth = sorted.reduce((sum, obj) => sum + obj.width, 0);
  const spacing = (totalWidth - totalObjWidth) / (sorted.length - 1);

  const adjustments: DistributionResult['adjustments'] = [];
  let currentLeft = first.left;

  for (const obj of sorted) {
    const targetLeft = currentLeft;
    adjustments.push({
      id: obj.id,
      deltaLeft: targetLeft - obj.left,
      deltaTop: 0,
    });
    currentLeft += obj.width + spacing;
  }

  return { adjustments };
}

/**
 * Calculate even vertical distribution for 3+ objects.
 * Objects are sorted by their current top position, then spaced evenly
 * between the topmost and bottommost object bounds.
 */
export function calculateVerticalDistribution(objects: ObjectBounds[]): DistributionResult | null {
  if (objects.length < 3) return null;

  const sorted = [...objects].sort((a, b) => a.top - b.top);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  const totalHeight = last.top + last.height - first.top;
  const totalObjHeight = sorted.reduce((sum, obj) => sum + obj.height, 0);
  const spacing = (totalHeight - totalObjHeight) / (sorted.length - 1);

  const adjustments: DistributionResult['adjustments'] = [];
  let currentTop = first.top;

  for (const obj of sorted) {
    const targetTop = currentTop;
    adjustments.push({
      id: obj.id,
      deltaLeft: 0,
      deltaTop: targetTop - obj.top,
    });
    currentTop += obj.height + spacing;
  }

  return { adjustments };
}
