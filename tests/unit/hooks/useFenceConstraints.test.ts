import { describe, it, expect } from 'vitest';
import {
  pointInPolygon,
  pointInRect,
  isPointInArea,
  isPointInFenceAreaPure,
  getContainingFenceAreaPure,
  bboxOverlapsFenceArea,
} from '@/hooks/useFenceConstraints';
import type { FenceArea } from '@/types/fence';

describe('pointInPolygon', () => {
  const triangle = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 50, y: 100 },
  ];

  it('returns true for a point inside the triangle', () => {
    expect(pointInPolygon(50, 30, triangle)).toBe(true);
  });

  it('returns false for a point outside the triangle', () => {
    expect(pointInPolygon(0, 100, triangle)).toBe(false);
  });

  it('returns false for a point far away', () => {
    expect(pointInPolygon(200, 200, triangle)).toBe(false);
  });

  const square = [
    { x: 10, y: 10 },
    { x: 110, y: 10 },
    { x: 110, y: 110 },
    { x: 10, y: 110 },
  ];

  it('returns true for a point inside a square polygon', () => {
    expect(pointInPolygon(50, 50, square)).toBe(true);
  });

  it('returns false for a point outside a square polygon', () => {
    expect(pointInPolygon(5, 5, square)).toBe(false);
  });
});

describe('pointInRect', () => {
  const rect = { x: 10, y: 20, width: 100, height: 50 };

  it('returns true for a point inside the rect', () => {
    expect(pointInRect(50, 40, rect)).toBe(true);
  });

  it('returns true for a point on the edge', () => {
    expect(pointInRect(10, 20, rect)).toBe(true);
    expect(pointInRect(110, 70, rect)).toBe(true);
  });

  it('returns false for a point outside the rect', () => {
    expect(pointInRect(5, 40, rect)).toBe(false);
    expect(pointInRect(50, 75, rect)).toBe(false);
  });
});

describe('isPointInArea', () => {
  it('uses polygon check when area has points', () => {
    const area: FenceArea = {
      id: 'tri-1',
      role: 'setting-triangle',
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      points: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 50, y: 100 },
      ],
    };
    expect(isPointInArea(50, 30, area)).toBe(true);
    expect(isPointInArea(0, 100, area)).toBe(false);
  });

  it('uses rect check when area has no points', () => {
    const area: FenceArea = {
      id: 'cell-0-0',
      role: 'block-cell',
      x: 10,
      y: 10,
      width: 80,
      height: 80,
    };
    expect(isPointInArea(50, 50, area)).toBe(true);
    expect(isPointInArea(5, 5, area)).toBe(false);
  });
});

describe('isPointInFenceAreaPure', () => {
  const areas: FenceArea[] = [
    { id: 'cell-0-0', role: 'block-cell', x: 0, y: 0, width: 100, height: 100 },
    { id: 'cell-0-1', role: 'block-cell', x: 110, y: 0, width: 100, height: 100 },
    { id: 'sash-0', role: 'sashing', x: 100, y: 0, width: 10, height: 100 },
  ];

  it('returns true when point is inside a block-cell', () => {
    expect(isPointInFenceAreaPure(50, 50, areas)).toBe(true);
  });

  it('returns false when point is in sashing (wrong role)', () => {
    expect(isPointInFenceAreaPure(105, 50, areas)).toBe(false);
  });

  it('returns true when point is in sashing with role=sashing', () => {
    expect(isPointInFenceAreaPure(105, 50, areas, 'sashing')).toBe(true);
  });

  it('returns false when point is outside all areas', () => {
    expect(isPointInFenceAreaPure(300, 300, areas)).toBe(false);
  });
});

describe('getContainingFenceAreaPure', () => {
  const areas: FenceArea[] = [
    { id: 'cell-0-0', role: 'block-cell', x: 0, y: 0, width: 100, height: 100 },
    { id: 'sash-0', role: 'sashing', x: 100, y: 0, width: 10, height: 100 },
  ];

  it('returns the containing area', () => {
    const result = getContainingFenceAreaPure(50, 50, areas);
    expect(result).not.toBeNull();
    expect(result!.id).toBe('cell-0-0');
  });

  it('returns sashing area when point is in sashing', () => {
    const result = getContainingFenceAreaPure(105, 50, areas);
    expect(result).not.toBeNull();
    expect(result!.id).toBe('sash-0');
  });

  it('returns null when point is outside all areas', () => {
    expect(getContainingFenceAreaPure(300, 300, areas)).toBeNull();
  });
});

describe('bboxOverlapsFenceArea', () => {
  const areas: FenceArea[] = [
    { id: 'cell-0-0', role: 'block-cell', x: 0, y: 0, width: 100, height: 100 },
    { id: 'cell-0-1', role: 'block-cell', x: 120, y: 0, width: 100, height: 100 },
    { id: 'sash-0', role: 'sashing', x: 100, y: 0, width: 20, height: 100 },
  ];

  it('returns true when bbox overlaps a block-cell', () => {
    expect(bboxOverlapsFenceArea(10, 10, 50, 50, areas)).toBe(true);
  });

  it('returns true when bbox partially overlaps a block-cell', () => {
    expect(bboxOverlapsFenceArea(80, 50, 30, 30, areas)).toBe(true);
  });

  it('returns false when bbox only overlaps sashing (default role=block-cell)', () => {
    expect(bboxOverlapsFenceArea(102, 10, 16, 20, areas)).toBe(false);
  });

  it('returns true when checking sashing role', () => {
    expect(bboxOverlapsFenceArea(102, 10, 16, 20, areas, 'sashing')).toBe(true);
  });

  it('returns false when bbox is outside all areas', () => {
    expect(bboxOverlapsFenceArea(300, 300, 50, 50, areas)).toBe(false);
  });
});
