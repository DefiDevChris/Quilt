import { describe, it, expect } from 'vitest';
import { computeLayoutDimensions } from './layout-utils';

describe('computeLayoutDimensions', () => {
  it('computes 4x4 grid with 12" blocks, 2" sashing, 4" borders', () => {
    const dims = computeLayoutDimensions({
      type: 'grid',
      rows: 4,
      cols: 4,
      blockSize: 12,
      sashingWidth: 2,
      borders: [{ width: 4, color: '', fabricId: null }],
      bindingWidth: 0.25,
    });

    expect(dims.innerWidth).toBe(48);
    expect(dims.innerHeight).toBe(48);
    expect(dims.borderTotal).toBe(8);
    expect(dims.width).toBe(56.5);
    expect(dims.height).toBe(56.5);
    expect(dims.perimeter).toBe(226);
    expect(dims.bindingYardage).toBe(6.5);
    expect(dims.rows).toBe(4);
    expect(dims.cols).toBe(4);
    expect(dims.cellWidth).toBe(12);
    expect(dims.cellHeight).toBe(12);
  });

  it('computes sashing layout', () => {
    const dims = computeLayoutDimensions({
      type: 'sashing',
      rows: 3,
      cols: 3,
      blockSize: 10,
      sashingWidth: 2,
      borders: [],
      bindingWidth: 0,
    });

    expect(dims.innerWidth).toBe(34);
    expect(dims.innerHeight).toBe(34);
    expect(dims.borderTotal).toBe(0);
    expect(dims.width).toBe(34);
    expect(dims.height).toBe(34);
  });

  it('computes on-point layout', () => {
    const dims = computeLayoutDimensions({
      type: 'on-point',
      rows: 2,
      cols: 2,
      blockSize: 10,
      sashingWidth: 0,
      borders: [],
      bindingWidth: 0,
    });

    const diagonal = 10 * Math.SQRT2;
    expect(dims.innerWidth).toBeCloseTo(2 * diagonal, 2);
    expect(dims.innerHeight).toBeCloseTo(2 * diagonal, 2);
    expect(dims.cellWidth).toBeCloseTo(diagonal, 2);
    expect(dims.cellHeight).toBeCloseTo(diagonal, 2);
  });

  it('computes free-form as grid fallback', () => {
    const dims = computeLayoutDimensions({
      type: 'free-form',
      rows: 2,
      cols: 3,
      blockSize: 8,
      sashingWidth: 0,
      borders: [],
      bindingWidth: 0,
    });

    expect(dims.innerWidth).toBe(24);
    expect(dims.innerHeight).toBe(16);
  });

  it('computes strippy layout', () => {
    const dims = computeLayoutDimensions({
      type: 'strippy',
      rows: 4,
      cols: 5,
      blockSize: 10,
      sashingWidth: 2,
      borders: [],
      bindingWidth: 0,
    });

    expect(dims.innerWidth).toBe(34);
    expect(dims.innerHeight).toBe(40);
  });

  it('computes medallion layout', () => {
    const dims = computeLayoutDimensions({
      type: 'medallion',
      rows: 1,
      cols: 1,
      blockSize: 12,
      sashingWidth: 0,
      borders: [{ width: 3, color: '', fabricId: null }],
      bindingWidth: 0.25,
    });

    expect(dims.innerWidth).toBe(12);
    expect(dims.innerHeight).toBe(12);
    expect(dims.borderTotal).toBe(6);
    expect(dims.width).toBe(18.5);
    expect(dims.height).toBe(18.5);
  });

  it('includes binding in perimeter and bindingYardage', () => {
    const dims = computeLayoutDimensions({
      type: 'grid',
      rows: 1,
      cols: 1,
      blockSize: 10,
      sashingWidth: 0,
      borders: [],
      bindingWidth: 0.5,
    });

    expect(dims.width).toBe(11);
    expect(dims.height).toBe(11);
    expect(dims.perimeter).toBe(44);
    expect(dims.bindingYardage).toBe(1.5);
  });

  it('handles multiple borders', () => {
    const dims = computeLayoutDimensions({
      type: 'grid',
      rows: 2,
      cols: 2,
      blockSize: 6,
      sashingWidth: 0,
      borders: [
        { width: 2, color: '', fabricId: null },
        { width: 3, color: '', fabricId: null },
      ],
      bindingWidth: 0,
    });

    expect(dims.borderTotal).toBe(10);
    expect(dims.width).toBe(22);
    expect(dims.height).toBe(22);
  });
});
