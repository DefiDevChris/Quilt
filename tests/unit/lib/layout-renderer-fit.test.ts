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

  it('downscales a layout that is larger than the quilt', () => {
    // Template natural footprint: 5*12=60" wide. Quilt: 30".
    // Expected scale: 30/60 = 0.5 → block becomes 6", footprint 30"
    const t = makeStraightTemplate(5, 5, 12);
    const areas = fitLayoutToQuilt(t, 30, 30, PX_PER_INCH);
    const cells = areas.filter((a) => a.role === 'block-cell');
    expect(cells.length).toBe(25);
    // Each cell should now be 6" * 96 = 576 px wide
    for (const cell of cells) {
      expect(cell.width).toBeCloseTo(6 * PX_PER_INCH, 0);
      expect(cell.height).toBeCloseTo(6 * PX_PER_INCH, 0);
    }
  });

  it('upscales a layout that is smaller than the quilt', () => {
    // Template natural footprint: 3*4=12". Quilt: 60".
    // Expected scale: 60/12 = 5 → block becomes 20"
    const t = makeStraightTemplate(3, 3, 4);
    const areas = fitLayoutToQuilt(t, 60, 60, PX_PER_INCH);
    const cells = areas.filter((a) => a.role === 'block-cell');
    for (const cell of cells) {
      expect(cell.width).toBeCloseTo(20 * PX_PER_INCH, 0);
    }
  });

  it('preserves aspect ratio with non-square quilts (uniform scale)', () => {
    // Template natural footprint: 4*10=40" square. Quilt: 60×80.
    // Should fit by the SHORTER side: 60/40 = 1.5 → block 15"
    const t = makeStraightTemplate(4, 4, 10);
    const areas = fitLayoutToQuilt(t, 60, 80, PX_PER_INCH);
    const cells = areas.filter((a) => a.role === 'block-cell');
    for (const cell of cells) {
      expect(cell.width).toBeCloseTo(15 * PX_PER_INCH, 0);
      expect(cell.height).toBeCloseTo(15 * PX_PER_INCH, 0);
    }
  });

  it('centers the layout inside the quilt when there is leftover space', () => {
    // 3×3 template at 4" = 12" footprint. Quilt: 60×80. Scale: min(60/12, 80/12)=5
    // Fitted footprint: 60×60. Quilt is 60×80.
    // Vertical leftover: (80 - 60)/2 = 10" → cells should be offset by 10*96=960px
    const t = makeStraightTemplate(3, 3, 4);
    const areas = fitLayoutToQuilt(t, 60, 80, PX_PER_INCH);
    const firstCell = areas.find((a) => a.role === 'block-cell' && a.row === 0 && a.col === 0);
    expect(firstCell).toBeDefined();
    // Top-left cell should sit at y = 960 (vertical centering offset)
    expect(firstCell?.y).toBeCloseTo(10 * PX_PER_INCH, 0);
    // And x = 0 (no horizontal leftover)
    expect(firstCell?.x).toBeCloseTo(0, 0);
  });

  it('handles sashing layouts and scales sashing width too', () => {
    // 3×3 sashing, 6" blocks, 1" sashing → footprint = 3*6 + 2*1 = 20"
    // Quilt 40" → scale 2 → blocks become 12", sashing 2"
    const t = makeSashingTemplate(3, 3, 6, 1);
    const areas = fitLayoutToQuilt(t, 40, 40, PX_PER_INCH);
    const cells = areas.filter((a) => a.role === 'block-cell');
    expect(cells.length).toBe(9);
    for (const cell of cells) {
      expect(cell.width).toBeCloseTo(12 * PX_PER_INCH, 0);
    }
    const sashingStrips = areas.filter((a) => a.role === 'sashing');
    expect(sashingStrips.length).toBeGreaterThan(0);
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
