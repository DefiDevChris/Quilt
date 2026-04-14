import { describe, it, expect } from 'vitest';
import { computeDesignerFenceAreas } from '@/lib/designer-fence-engine';

const PX_PER_UNIT = 96; // imperial

describe('computeDesignerFenceAreas', () => {
  it('computes block cells for a 2x2 grid with no sashing or borders', () => {
    const areas = computeDesignerFenceAreas(
      2, // rows
      2, // cols
      12, // blockSize (inches)
      0, // sashingWidth
      [], // borders
      24, // quiltWidthIn
      24, // quiltHeightIn
      PX_PER_UNIT
    );

    // Should have exactly 4 block cells
    const blockCells = areas.filter((a) => a.role === 'block-cell');
    expect(blockCells.length).toBe(4);

    // All should have the role 'block-cell'
    blockCells.forEach((cell) => {
      expect(cell.role).toBe('block-cell');
      expect(cell.id).toMatch(/^cell-\d+-\d+$/);
      expect(cell.width).toBeGreaterThan(0);
      expect(cell.height).toBeGreaterThan(0);
    });
  });

  it('computes sashing strips between rows and columns', () => {
    const areas = computeDesignerFenceAreas(
      3, // rows
      3, // cols
      10, // blockSize
      2, // sashingWidth
      [], // borders
      36, // quiltWidthIn
      36, // quiltHeightIn
      PX_PER_UNIT
    );

    const blockCells = areas.filter((a) => a.role === 'block-cell');
    const sashing = areas.filter((a) => a.role === 'sashing');

    // 9 block cells
    expect(blockCells.length).toBe(9);

    // 2 horizontal + 2 vertical sashing strips = 4
    expect(sashing.length).toBe(4);

    // All sashing should have positive dimensions
    sashing.forEach((s) => {
      expect(s.width).toBeGreaterThan(0);
      expect(s.height).toBeGreaterThan(0);
      expect(s.role).toBe('sashing');
    });
  });

  it('computes border areas around the content', () => {
    const areas = computeDesignerFenceAreas(
      2, // rows
      2, // cols
      12, // blockSize
      0, // sashingWidth
      [{ width: 3, fabricId: 'fabric-1', fabricUrl: null }], // 1 border layer
      30, // quiltWidthIn
      30, // quiltHeightIn
      PX_PER_UNIT
    );

    const borders = areas.filter((a) => a.role === 'border');

    // 4 sides for 1 border layer
    expect(borders.length).toBe(4);

    // Should have top, bottom, left, right
    const sides = borders.map((b) => b.id.split('-').pop());
    expect(sides).toContain('top');
    expect(sides).toContain('bottom');
    expect(sides).toContain('left');
    expect(sides).toContain('right');

    // All borders should have positive dimensions
    borders.forEach((b) => {
      expect(b.width).toBeGreaterThan(0);
      expect(b.height).toBeGreaterThan(0);
    });
  });

  it('computes multiple border layers', () => {
    const areas = computeDesignerFenceAreas(
      2,
      2,
      10,
      0,
      [
        { width: 2, fabricId: 'f1', fabricUrl: null },
        { width: 3, fabricId: 'f2', fabricUrl: null },
      ],
      30,
      30,
      PX_PER_UNIT
    );

    const borders = areas.filter((a) => a.role === 'border');

    // 4 sides × 2 layers = 8
    expect(borders.length).toBe(8);
  });

  it('scales areas to fit quilt dimensions', () => {
    const quiltWidthIn = 60;
    const quiltHeightIn = 80;
    const blockSize = 12;

    const areas = computeDesignerFenceAreas(
      3,
      3,
      blockSize,
      0,
      [],
      quiltWidthIn,
      quiltHeightIn,
      PX_PER_UNIT
    );

    const quiltWidthPx = quiltWidthIn * PX_PER_UNIT;
    const quiltHeightPx = quiltHeightIn * PX_PER_UNIT;

    // Block cells should be positioned within quilt bounds
    areas.forEach((a) => {
      expect(a.x + a.width).toBeLessThanOrEqual(quiltWidthPx + 1); // allow floating point tolerance
      expect(a.y + a.height).toBeLessThanOrEqual(quiltHeightPx + 1);
      expect(a.x).toBeGreaterThanOrEqual(-1);
      expect(a.y).toBeGreaterThanOrEqual(-1);
    });
  });

  it('computes correct pixel dimensions for blocks', () => {
    const rows = 2;
    const cols = 2;
    const blockSize = 12;
    const quiltWidthIn = 24;
    const quiltHeightIn = 24;

    const areas = computeDesignerFenceAreas(
      rows,
      cols,
      blockSize,
      0,
      [],
      quiltWidthIn,
      quiltHeightIn,
      PX_PER_UNIT
    );

    const expectedBlockPx = (blockSize / (cols * blockSize)) * quiltWidthIn * PX_PER_UNIT;

    areas.forEach((a) => {
      if (a.role === 'block-cell') {
        expect(a.width).toBeCloseTo(expectedBlockPx, 0);
        expect(a.height).toBeCloseTo(expectedBlockPx, 0);
      }
    });
  });

  it('assigns fabricId to border areas from config', () => {
    const areas = computeDesignerFenceAreas(
      2,
      2,
      10,
      0,
      [{ width: 2, fabricId: 'my-fabric-id', fabricUrl: 'https://example.com/fabric.jpg' }],
      24,
      24,
      PX_PER_UNIT
    );

    const borders = areas.filter((a) => a.role === 'border');
    borders.forEach((b) => {
      expect(b.assignedFabricId).toBe('my-fabric-id');
    });
  });

  it('returns only block cells when no sashing or borders', () => {
    const areas = computeDesignerFenceAreas(1, 1, 12, 0, [], 12, 12, PX_PER_UNIT);

    expect(areas.length).toBe(1);
    expect(areas[0].role).toBe('block-cell');
    expect(areas[0].row).toBe(0);
    expect(areas[0].col).toBe(0);
  });

  it('handles single row with vertical sashing only', () => {
    const areas = computeDesignerFenceAreas(1, 3, 10, 2, [], 34, 10, PX_PER_UNIT);

    const blockCells = areas.filter((a) => a.role === 'block-cell');
    const sashing = areas.filter((a) => a.role === 'sashing');

    expect(blockCells.length).toBe(3);
    // 2 vertical sashing strips between 3 columns
    expect(sashing.length).toBe(2);
  });

  it('handles single column with horizontal sashing only', () => {
    const areas = computeDesignerFenceAreas(3, 1, 10, 2, [], 10, 34, PX_PER_UNIT);

    const blockCells = areas.filter((a) => a.role === 'block-cell');
    const sashing = areas.filter((a) => a.role === 'sashing');

    expect(blockCells.length).toBe(3);
    // 2 horizontal sashing strips between 3 rows
    expect(sashing.length).toBe(2);
  });
});
