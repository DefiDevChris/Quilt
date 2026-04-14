import { describe, it, expect } from 'vitest';
import {
  hexToRgb,
  rgbToHex,
  rgbToLab,
  rgbToHsl,
  labDistance,
  findClosestColor,
  type RGB,
  type LAB,
} from '@/lib/color-math';

// ---------------------------------------------------------------------------
// hexToRgb
// ---------------------------------------------------------------------------

describe('hexToRgb', () => {
  it('parses 6-digit hex with hash', () => {
    expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('parses 6-digit hex without hash', () => {
    expect(hexToRgb('00ff00')).toEqual({ r: 0, g: 255, b: 0 });
  });

  it('parses 3-digit hex with hash', () => {
    expect(hexToRgb('#000')).toEqual({ r: 0, g: 0, b: 0 });
  });

  it('expands 3-digit hex correctly', () => {
    expect(hexToRgb('#abc')).toEqual({ r: 170, g: 187, b: 204 });
  });

  it('is case-insensitive', () => {
    expect(hexToRgb('#FF0000')).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('parses black', () => {
    expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
  });

  it('parses white', () => {
    expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('returns black for empty string', () => {
    expect(hexToRgb('')).toEqual({ r: 0, g: 0, b: 0 });
  });

  it('returns black for non-string', () => {
    expect(hexToRgb(null as unknown as string)).toEqual({ r: 0, g: 0, b: 0 });
    expect(hexToRgb(undefined as unknown as string)).toEqual({ r: 0, g: 0, b: 0 });
  });

  it('returns black for invalid hex characters', () => {
    expect(hexToRgb('#gg0000')).toEqual({ r: 0, g: 0, b: 0 });
    expect(hexToRgb('xyz123')).toEqual({ r: 0, g: 0, b: 0 });
  });

  it('returns black for wrong length', () => {
    expect(hexToRgb('#12')).toEqual({ r: 0, g: 0, b: 0 });
    expect(hexToRgb('#12345')).toEqual({ r: 0, g: 0, b: 0 });
    expect(hexToRgb('#1234567')).toEqual({ r: 0, g: 0, b: 0 });
  });

  it('handles 3-digit hex with invalid characters', () => {
    expect(hexToRgb('#ggg')).toEqual({ r: 0, g: 0, b: 0 });
  });
});

// ---------------------------------------------------------------------------
// rgbToHex
// ---------------------------------------------------------------------------

describe('rgbToHex', () => {
  it('converts red', () => {
    expect(rgbToHex({ r: 255, g: 0, b: 0 })).toBe('#ff0000');
  });

  it('converts green', () => {
    expect(rgbToHex({ r: 0, g: 255, b: 0 })).toBe('#00ff00');
  });

  it('converts black', () => {
    expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe('#000000');
  });

  it('pads single-digit hex values', () => {
    expect(rgbToHex({ r: 1, g: 2, b: 3 })).toBe('#010203');
  });

  it('roundtrips with hexToRgb', () => {
    const hex = '#8d4f00';
    expect(rgbToHex(hexToRgb(hex))).toBe(hex);
  });

  it('roundtrips common colors', () => {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffffff', '#000000', '#abcdef'];
    for (const hex of colors) {
      expect(rgbToHex(hexToRgb(hex))).toBe(hex);
    }
  });

  it('clamps out-of-range values', () => {
    expect(rgbToHex({ r: 300, g: -10, b: 128 })).toBe('#ff0080');
  });
});

// ---------------------------------------------------------------------------
// rgbToHsl
// ---------------------------------------------------------------------------

describe('rgbToHsl', () => {
  it('converts black', () => {
    const hsl = rgbToHsl({ r: 0, g: 0, b: 0 });
    expect(hsl.h).toBe(0);
    expect(hsl.s).toBe(0);
    expect(hsl.l).toBe(0);
  });

  it('converts white', () => {
    const hsl = rgbToHsl({ r: 255, g: 255, b: 255 });
    expect(hsl.h).toBe(0);
    expect(hsl.s).toBe(0);
    expect(hsl.l).toBe(1);
  });

  it('converts pure red', () => {
    const hsl = rgbToHsl({ r: 255, g: 0, b: 0 });
    expect(hsl.h).toBe(0);
    expect(hsl.s).toBe(1);
    expect(hsl.l).toBe(0.5);
  });

  it('converts pure green', () => {
    const hsl = rgbToHsl({ r: 0, g: 255, b: 0 });
    expect(hsl.h).toBe(120);
    expect(hsl.s).toBe(1);
    expect(hsl.l).toBe(0.5);
  });

  it('converts pure blue', () => {
    const hsl = rgbToHsl({ r: 0, g: 0, b: 255 });
    expect(hsl.h).toBe(240);
    expect(hsl.s).toBe(1);
    expect(hsl.l).toBe(0.5);
  });
});

// ---------------------------------------------------------------------------
// rgbToLab
// ---------------------------------------------------------------------------

describe('rgbToLab', () => {
  it('converts black to L ~0', () => {
    const lab = rgbToLab({ r: 0, g: 0, b: 0 });
    expect(lab.l).toBeCloseTo(0, 1);
  });

  it('converts white to L ~100', () => {
    const lab = rgbToLab({ r: 255, g: 255, b: 255 });
    expect(lab.l).toBeCloseTo(100, 0);
  });

  it('produces known values for red', () => {
    const lab = rgbToLab({ r: 255, g: 0, b: 0 });
    // sRGB red: L ~53.23, a ~80.11, b ~67.22
    expect(lab.l).toBeCloseTo(53.23, 0);
    expect(lab.a).toBeCloseTo(80.11, 0);
    expect(lab.b).toBeCloseTo(67.22, 0);
  });

  it('produces known values for green', () => {
    const lab = rgbToLab({ r: 0, g: 128, b: 0 });
    // sRGB green (0,128,0): L ~46.23, a ~-51.70, b ~49.90
    expect(lab.l).toBeCloseTo(46.23, 0);
    expect(lab.a).toBeLessThan(0);
    expect(lab.b).toBeGreaterThan(0);
  });

  it('produces known values for blue', () => {
    const lab = rgbToLab({ r: 0, g: 0, b: 255 });
    // sRGB blue: L ~32.30, a ~79.20, b ~-107.86
    expect(lab.l).toBeCloseTo(32.3, 0);
    expect(lab.a).toBeGreaterThan(0);
    expect(lab.b).toBeLessThan(-100);
  });

  it('neutral gray has a ~0, b ~0', () => {
    const lab = rgbToLab({ r: 128, g: 128, b: 128 });
    expect(lab.a).toBeCloseTo(0, 0);
    expect(lab.b).toBeCloseTo(0, 0);
  });
});

// ---------------------------------------------------------------------------
// labDistance
// ---------------------------------------------------------------------------

describe('labDistance', () => {
  it('returns 0 for identical colors', () => {
    const lab: LAB = { l: 50, a: 20, b: -30 };
    expect(labDistance(lab, lab)).toBe(0);
  });

  it('is symmetric', () => {
    const a: LAB = { l: 50, a: 20, b: -30 };
    const b: LAB = { l: 60, a: 10, b: -20 };
    expect(labDistance(a, b)).toBeCloseTo(labDistance(b, a), 10);
  });

  it('computes correct Euclidean distance', () => {
    const a: LAB = { l: 0, a: 0, b: 0 };
    const b: LAB = { l: 3, a: 4, b: 0 };
    expect(labDistance(a, b)).toBeCloseTo(5, 10);
  });

  it('reports larger distance for more different colors', () => {
    const black = rgbToLab({ r: 0, g: 0, b: 0 });
    const white = rgbToLab({ r: 255, g: 255, b: 255 });
    const gray = rgbToLab({ r: 128, g: 128, b: 128 });

    expect(labDistance(black, white)).toBeGreaterThan(labDistance(black, gray));
  });
});

// ---------------------------------------------------------------------------
// findClosestColor
// ---------------------------------------------------------------------------

describe('findClosestColor', () => {
  it('finds exact match at index 0', () => {
    const target: RGB = { r: 255, g: 0, b: 0 };
    const palette: RGB[] = [
      { r: 255, g: 0, b: 0 },
      { r: 0, g: 255, b: 0 },
      { r: 0, g: 0, b: 255 },
    ];
    const result = findClosestColor(target, palette);
    expect(result.index).toBe(0);
    expect(result.distance).toBeCloseTo(0, 5);
    expect(result.color).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('finds nearest color in palette', () => {
    const target: RGB = { r: 200, g: 10, b: 10 };
    const palette: RGB[] = [
      { r: 0, g: 0, b: 255 }, // blue - far
      { r: 255, g: 0, b: 0 }, // red - closest
      { r: 0, g: 255, b: 0 }, // green - far
    ];
    const result = findClosestColor(target, palette);
    expect(result.index).toBe(1);
  });

  it('returns distance 0 for exact match', () => {
    const target: RGB = { r: 128, g: 128, b: 128 };
    const palette: RGB[] = [{ r: 128, g: 128, b: 128 }];
    const result = findClosestColor(target, palette);
    expect(result.distance).toBeCloseTo(0, 5);
  });

  it('throws for empty palette', () => {
    expect(() => findClosestColor({ r: 0, g: 0, b: 0 }, [])).toThrow(
      'Palette must contain at least one color'
    );
  });
});
