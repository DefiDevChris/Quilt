import { fitLayoutToQuilt, renderLayoutTemplate } from '@/lib/layout-renderer';
import type { LayoutTemplate } from '@/types/layout';

const PX_PER_INCH = 96;

function makeStraightTemplate(rows: number, cols: number, blockSize: number): LayoutTemplate {
  return {
    id: 'test',
    name: 'Test',
    category: 'straight',
    gridRows: rows,
    gridCols: cols,
    defaultBlockSize: blockSize,
    sashingWidth: 0,
    hasCornerstones: false,
    borders: [],
    bindingWidth: 0,
    thumbnailSvg: '',
  };
}

function makeSashingTemplate(
  rows: number,
  cols: number,
  blockSize: number,
  sashingWidth: number
): LayoutTemplate {
  return {
    id: 'test',
    name: 'Test',
    category: 'sashing',
    gridRows: rows,
    gridCols: cols,
    defaultBlockSize: blockSize,
    sashingWidth,
    hasCornerstones: true,
    borders: [],
    bindingWidth: 0,
    thumbnailSvg: '',
  };
}

describe('fitLayoutToQuilt', () => {
  it('produces no areas for zero-dimension quilts', () => {
    const t = makeStraightTemplate(3, 3, 12);
    expect(fitLayoutToQuilt(t, 0, 0, PX_PER_INCH)).toEqual([]);
  });

  it('scales layout to fill entire quilt dimensions exactly', () => {
    // Template natural footprint: 5*12=60" square. Quilt: 30×30.
    // Layout must fill entire 30×30 grid → scale 0.5
    const t = makeStraightTemplate(5, 5, 12);
    const areas = fitLayoutToQuilt(t, 30, 30, PX_PER_INCH);
    const cells = areas.filter((a) => a.role === 'block-cell');
    expect(cells.length).toBe(25);
    // Each cell should be 6" * 96 = 576 px
    for (const cell of cells) {
      expect(cell.width).toBeCloseTo(6 * PX_PER_INCH, 0);
      expect(cell.height).toBeCloseTo(6 * PX_PER_INCH, 0);
    }
  });

  it('upscales layout to fill entire quilt dimensions', () => {
    // Template natural footprint: 3*4=12". Quilt: 60×60.
    // Layout must fill entire 60×60 grid → scale 5
    const t = makeStraightTemplate(3, 3, 4);
    const areas = fitLayoutToQuilt(t, 60, 60, PX_PER_INCH);
    const cells = areas.filter((a) => a.role === 'block-cell');
    for (const cell of cells) {
      expect(cell.width).toBeCloseTo(20 * PX_PER_INCH, 0);
    }
  });

  it('stretches layout to fill non-square quilts exactly', () => {
    // Template natural footprint: 4*10=40" square. Quilt: 60×80.
    // Layout must fill entire 60×80 grid → non-uniform scaling
    const t = makeStraightTemplate(4, 4, 10);
    const areas = fitLayoutToQuilt(t, 60, 80, PX_PER_INCH);
    const cells = areas.filter((a) => a.role === 'block-cell');
    
    // Total layout should span full quilt dimensions
    const minX = Math.min(...cells.map(c => c.x));
    const maxX = Math.max(...cells.map(c => c.x + c.width));
    const minY = Math.min(...cells.map(c => c.y));
    const maxY = Math.max(...cells.map(c => c.y + c.height));
    
    expect(minX).toBeCloseTo(0, 0);
    expect(maxX).toBeCloseTo(60 * PX_PER_INCH, 0);
    expect(minY).toBeCloseTo(0, 0);
    expect(maxY).toBeCloseTo(80 * PX_PER_INCH, 0);
  });

  it('layout always starts at origin (0,0) and fills entire grid', () => {
    // Layout must always match grid dimensions - no centering
    const t = makeStraightTemplate(3, 3, 4);
    const areas = fitLayoutToQuilt(t, 60, 80, PX_PER_INCH);
    const firstCell = areas.find((a) => a.role === 'block-cell' && a.row === 0 && a.col === 0);
    expect(firstCell).toBeDefined();
    
    // Top-left cell should start at (0, 0)
    expect(firstCell?.x).toBeCloseTo(0, 0);
    expect(firstCell?.y).toBeCloseTo(0, 0);
  });

  it('handles sashing layouts and scales to fill entire grid', () => {
    // 3×3 sashing, 6" blocks, 1" sashing → footprint = 3*6 + 2*1 = 20"
    // Quilt 40×40 → layout fills entire 40×40 grid
    const t = makeSashingTemplate(3, 3, 6, 1);
    const areas = fitLayoutToQuilt(t, 40, 40, PX_PER_INCH);
    const cells = areas.filter((a) => a.role === 'block-cell');
    expect(cells.length).toBe(9);
    
    // Verify layout fills entire grid
    const allAreas = areas;
    const minX = Math.min(...allAreas.map(a => a.x));
    const maxX = Math.max(...allAreas.map(a => a.x + a.width));
    const minY = Math.min(...allAreas.map(a => a.y));
    const maxY = Math.max(...allAreas.map(a => a.y + a.height));
    
    expect(minX).toBeCloseTo(0, 0);
    expect(maxX).toBeCloseTo(40 * PX_PER_INCH, 0);
    expect(minY).toBeCloseTo(0, 0);
    expect(maxY).toBeCloseTo(40 * PX_PER_INCH, 0);
  });

  it('falls back to renderLayoutTemplate for medallion category', () => {
    const t: LayoutTemplate = {
      id: 'med',
      name: 'Medallion',
      category: 'medallion',
      gridRows: 1,
      gridCols: 1,
      defaultBlockSize: 12,
      sashingWidth: 0,
      hasCornerstones: false,
      borders: [],
      bindingWidth: 0,
      thumbnailSvg: '',
    };
    const fitted = fitLayoutToQuilt(t, 60, 60, PX_PER_INCH);
    const direct = renderLayoutTemplate(t, PX_PER_INCH);
    expect(fitted).toEqual(direct);
  });

  it('produces equal cell sizes for all cells in a uniform grid', () => {
    const t = makeStraightTemplate(4, 4, 10);
    const areas = fitLayoutToQuilt(t, 50, 50, PX_PER_INCH);
    const cells = areas.filter((a) => a.role === 'block-cell');
    const firstW = cells[0].width;
    for (const cell of cells) {
      expect(cell.width).toBeCloseTo(firstW, 5);
      expect(cell.height).toBeCloseTo(firstW, 5);
    }
  });
});
