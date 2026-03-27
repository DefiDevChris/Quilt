import { describe, it, expect } from 'vitest';
import {
  getPixelsPerUnit,
  unitsToPixels,
  pixelsToUnits,
  convertUnits,
  snapToGrid,
  snapPointToGrid,
  formatMeasurement,
  getUnitLabel,
  fitToScreenZoom,
} from '@/lib/canvas-utils';
import { PIXELS_PER_INCH, PIXELS_PER_CM } from '@/lib/constants';

describe('getPixelsPerUnit', () => {
  it('returns 96 for imperial', () => {
    expect(getPixelsPerUnit('imperial')).toBe(PIXELS_PER_INCH);
  });

  it('returns PIXELS_PER_CM for metric', () => {
    expect(getPixelsPerUnit('metric')).toBe(PIXELS_PER_CM);
  });
});

describe('unitsToPixels', () => {
  it('converts inches to pixels', () => {
    expect(unitsToPixels(1, 'imperial')).toBe(96);
    expect(unitsToPixels(2, 'imperial')).toBe(192);
  });

  it('converts cm to pixels', () => {
    expect(unitsToPixels(2.54, 'metric')).toBeCloseTo(96, 0);
  });
});

describe('pixelsToUnits', () => {
  it('converts pixels to inches', () => {
    expect(pixelsToUnits(96, 'imperial')).toBe(1);
  });

  it('converts pixels to cm', () => {
    expect(pixelsToUnits(96, 'metric')).toBeCloseTo(2.54, 1);
  });
});

describe('convertUnits', () => {
  it('returns same value for same unit', () => {
    expect(convertUnits(5, 'imperial', 'imperial')).toBe(5);
  });

  it('converts inches to cm', () => {
    expect(convertUnits(1, 'imperial', 'metric')).toBeCloseTo(2.54, 1);
  });

  it('converts cm to inches', () => {
    expect(convertUnits(2.54, 'metric', 'imperial')).toBeCloseTo(1, 1);
  });
});

describe('snapToGrid', () => {
  it('snaps to nearest grid point', () => {
    expect(snapToGrid(47, 48)).toBe(48);
    expect(snapToGrid(25, 48)).toBe(48);
    expect(snapToGrid(23, 48)).toBe(0);
  });

  it('handles exact grid values', () => {
    expect(snapToGrid(96, 96)).toBe(96);
  });

  it('returns value unchanged for zero grid size', () => {
    expect(snapToGrid(50, 0)).toBe(50);
  });
});

describe('snapPointToGrid', () => {
  it('snaps both x and y', () => {
    const result = snapPointToGrid({ x: 47, y: 95 }, 48);
    expect(result).toEqual({ x: 48, y: 96 });
  });
});

describe('formatMeasurement', () => {
  it('formats imperial measurements', () => {
    expect(formatMeasurement(5.5, 'imperial')).toBe('5.50"');
  });

  it('formats metric measurements', () => {
    expect(formatMeasurement(5.5, 'metric')).toBe('5.50cm');
  });

  it('respects precision', () => {
    expect(formatMeasurement(5.123, 'imperial', 1)).toBe('5.1"');
  });
});

describe('getUnitLabel', () => {
  it('returns correct labels', () => {
    expect(getUnitLabel('imperial')).toBe('in');
    expect(getUnitLabel('metric')).toBe('cm');
  });
});

describe('fitToScreenZoom', () => {
  it('calculates zoom to fit quilt in container', () => {
    const zoom = fitToScreenZoom(1200, 800, 48, 48, 'imperial');
    expect(zoom).toBeGreaterThan(0);
    expect(zoom).toBeLessThanOrEqual(1);
  });

  it('does not exceed 1.0 (100%)', () => {
    const zoom = fitToScreenZoom(10000, 10000, 1, 1, 'imperial');
    expect(zoom).toBe(1);
  });

  it('scales smaller for larger quilts', () => {
    const zoomSmall = fitToScreenZoom(1200, 800, 12, 12, 'imperial');
    const zoomLarge = fitToScreenZoom(1200, 800, 96, 96, 'imperial');
    expect(zoomSmall).toBeGreaterThan(zoomLarge);
  });
});
