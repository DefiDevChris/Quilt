import { describe, it, expect } from 'vitest';
import { classifyShapes } from '../cv/shape-classify';
import type { Point } from '@/types/photo-to-design';

function contour(
  id: number,
  points: Point[]
): {
  patchId: number;
  points: Point[];
  pixelPoints: Point[];
  centroid: Point;
  area: number;
} {
  const cx = points.reduce((s, p) => s + p.x, 0) / points.length;
  const cy = points.reduce((s, p) => s + p.y, 0) / points.length;
  return {
    patchId: id,
    points,
    pixelPoints: points,
    centroid: { x: cx, y: cy },
    // Shoelace area
    area: Math.abs(
      points.reduce((sum, p, i) => {
        const q = points[(i + 1) % points.length];
        return sum + (p.x * q.y - q.x * p.y);
      }, 0) / 2
    ),
  };
}

const noColors = new Map<
  number,
  { dominantColor: string; colorPalette: [string, string, string]; fabricSwatch: string }
>();

describe('classifyShapes', () => {
  it('returns empty templates when there are no contours', () => {
    const r = classifyShapes([], noColors);
    expect(r.templates).toEqual([]);
    expect(r.patchesWithTemplates).toEqual([]);
  });

  it('groups two identical unit squares into a single template', () => {
    const square = (ox: number, oy: number) => [
      { x: ox, y: oy },
      { x: ox + 2, y: oy },
      { x: ox + 2, y: oy + 2 },
      { x: ox, y: oy + 2 },
    ];
    const r = classifyShapes([contour(1, square(0, 0)), contour(2, square(10, 10))], noColors);
    expect(r.templates.length).toBe(1);
    expect(r.templates[0].instanceCount).toBe(2);
    expect(r.templates[0].instanceIds.sort()).toEqual([1, 2]);
  });

  it('produces one template per distinct vertex count', () => {
    const square = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
    ];
    const triangle = [
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      { x: 1, y: 2 },
    ];
    const r = classifyShapes([contour(1, square), contour(2, triangle)], noColors);
    expect(r.templates.length).toBe(2);
    const vertexCounts = r.templates.map((t) => t.normalizedPolygon.length).sort();
    expect(vertexCounts).toEqual([3, 4]);
  });

  it('assigns each classified patch to a template id', () => {
    const poly = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
    ];
    const r = classifyShapes([contour(42, poly)], noColors);
    expect(r.patchesWithTemplates).toHaveLength(1);
    expect(r.patchesWithTemplates[0].patchId).toBe(42);
    expect(r.patchesWithTemplates[0].templateId).toBeTruthy();
    expect(r.patchesWithTemplates[0].templateId).not.toMatch(/^unknown-/);
  });
});
