import { describe, it, expect } from 'vitest';
import {
  roundToEighthUp,
  roundToEighthNearest,
  roundToQuarterNearest,
  formatFraction,
  filterContoursByArea,
  extractDominantColor,
  scalePiecesToDimensions,
} from '@/lib/piece-detection-engine';
import type { DetectedPiece } from '@/lib/photo-pattern-types';

// ---------------------------------------------------------------------------
// roundToEighthUp
// ---------------------------------------------------------------------------

describe('roundToEighthUp', () => {
  it('rounds 3.3 up to nearest eighth → 3.375', () => {
    expect(roundToEighthUp(3.3)).toBe(3.375);
  });

  it('keeps exact eighth values unchanged → 3.5', () => {
    expect(roundToEighthUp(3.5)).toBe(3.5);
  });

  it('rounds 0.1 up to nearest eighth → 0.125', () => {
    expect(roundToEighthUp(0.1)).toBe(0.125);
  });
});

// ---------------------------------------------------------------------------
// roundToEighthNearest
// ---------------------------------------------------------------------------

describe('roundToEighthNearest', () => {
  it('rounds 3.3 to nearest eighth → 3.25', () => {
    expect(roundToEighthNearest(3.3)).toBe(3.25);
  });

  it('rounds 3.44 to nearest eighth → 3.5', () => {
    expect(roundToEighthNearest(3.44)).toBe(3.5);
  });
});

// ---------------------------------------------------------------------------
// roundToQuarterNearest
// ---------------------------------------------------------------------------

describe('roundToQuarterNearest', () => {
  it('rounds 3.3 to nearest quarter → 3.25', () => {
    expect(roundToQuarterNearest(3.3)).toBe(3.25);
  });

  it('rounds 3.4 to nearest quarter → 3.5', () => {
    expect(roundToQuarterNearest(3.4)).toBe(3.5);
  });
});

// ---------------------------------------------------------------------------
// formatFraction
// ---------------------------------------------------------------------------

describe('formatFraction', () => {
  it('formats 3.5 → "3 1/2"', () => {
    expect(formatFraction(3.5)).toBe('3 1/2');
  });

  it('formats 4.875 → "4 7/8"', () => {
    expect(formatFraction(4.875)).toBe('4 7/8');
  });

  it('formats whole numbers without fraction → "6"', () => {
    expect(formatFraction(6.0)).toBe('6');
  });

  it('formats 0.25 → "1/4"', () => {
    expect(formatFraction(0.25)).toBe('1/4');
  });

  it('formats 0.125 → "1/8"', () => {
    expect(formatFraction(0.125)).toBe('1/8');
  });

  it('simplifies 2/8 → 1/4', () => {
    // 2/8 = 0.25, which should display as 1/4
    expect(formatFraction(0.25)).toBe('1/4');
  });

  it('simplifies 4/8 → 1/2', () => {
    // 4/8 = 0.5
    expect(formatFraction(0.5)).toBe('1/2');
  });

  it('simplifies 6/8 → 3/4', () => {
    // 6/8 = 0.75
    expect(formatFraction(0.75)).toBe('3/4');
  });
});

// ---------------------------------------------------------------------------
// filterContoursByArea
// ---------------------------------------------------------------------------

describe('filterContoursByArea', () => {
  it('removes areas smaller than minRatio * imageArea', () => {
    const imageArea = 10000;
    const areas = [10, 100, 500, 1000];
    // minRatio 0.005 → threshold = 50
    const result = filterContoursByArea(areas, imageArea, 0.005, 0.25);
    expect(result).toEqual([false, true, true, true]);
  });

  it('removes areas larger than maxRatio * imageArea', () => {
    const imageArea = 10000;
    const areas = [100, 500, 2000, 3000];
    // maxRatio 0.25 → threshold = 2500
    const result = filterContoursByArea(areas, imageArea, 0.005, 0.25);
    expect(result).toEqual([true, true, true, false]);
  });

  it('filters both too-small and too-large areas', () => {
    const imageArea = 10000;
    const areas = [10, 500, 3000];
    const result = filterContoursByArea(areas, imageArea, 0.005, 0.25);
    expect(result).toEqual([false, true, false]);
  });
});

// ---------------------------------------------------------------------------
// extractDominantColor
// ---------------------------------------------------------------------------

describe('extractDominantColor', () => {
  it('returns hex string from RGBA pixel data sampling center 50%', () => {
    // 4x4 image, center 50% is 2x2 (rows 1-2, cols 1-2)
    const width = 4;
    const height = 4;
    const pixels = new Uint8ClampedArray(width * height * 4);

    // Fill entire image with black (0,0,0)
    for (let i = 0; i < pixels.length; i += 4) {
      pixels[i] = 0;
      pixels[i + 1] = 0;
      pixels[i + 2] = 0;
      pixels[i + 3] = 255;
    }

    // Fill center 2x2 (rows 1-2, cols 1-2) with red (255,0,0)
    for (let row = 1; row <= 2; row++) {
      for (let col = 1; col <= 2; col++) {
        const idx = (row * width + col) * 4;
        pixels[idx] = 255;
        pixels[idx + 1] = 0;
        pixels[idx + 2] = 0;
        pixels[idx + 3] = 255;
      }
    }

    const result = extractDominantColor(pixels, width, height);
    // Center 50% is all red
    expect(result).toBe('#ff0000');
  });

  it('averages multiple colors in the center region', () => {
    const width = 4;
    const height = 4;
    const pixels = new Uint8ClampedArray(width * height * 4);

    // Fill center with a mix: 2 red and 2 blue pixels
    for (let row = 1; row <= 2; row++) {
      for (let col = 1; col <= 2; col++) {
        const idx = (row * width + col) * 4;
        if (row === 1) {
          // Red
          pixels[idx] = 255;
          pixels[idx + 1] = 0;
          pixels[idx + 2] = 0;
        } else {
          // Blue
          pixels[idx] = 0;
          pixels[idx + 1] = 0;
          pixels[idx + 2] = 255;
        }
        pixels[idx + 3] = 255;
      }
    }

    const result = extractDominantColor(pixels, width, height);
    // Average of 2 red (255,0,0) + 2 blue (0,0,255) = (128,0,128)
    expect(result).toBe('#800080');
  });
});

// ---------------------------------------------------------------------------
// scalePiecesToDimensions
// ---------------------------------------------------------------------------

describe('scalePiecesToDimensions', () => {
  function makePiece(overrides: Partial<DetectedPiece> = {}): DetectedPiece {
    return {
      id: 'piece-1',
      contour: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ],
      boundingRect: { x: 0, y: 0, width: 100, height: 100 },
      centroid: { x: 50, y: 50 },
      areaPx: 10000,
      dominantColor: '#ff0000',
      ...overrides,
    };
  }

  it('scales a 100x100px piece in a 400x400px image to 40x40" target', () => {
    const pieces = [makePiece()];
    const result = scalePiecesToDimensions(
      pieces,
      400,
      400,
      40,
      40,
      0.25,
    );

    expect(result).toHaveLength(1);
    // 100/400 * 40 = 10" finished
    expect(result[0].finishedWidthNum).toBe(10);
    expect(result[0].finishedHeightNum).toBe(10);
    expect(result[0].finishedWidth).toBe('10');
    expect(result[0].finishedHeight).toBe('10');
    // Cut = finished + 2 * seamAllowance = 10 + 0.5 = 10.5 → "10 1/2"
    expect(result[0].cutWidth).toBe('10 1/2');
    expect(result[0].cutHeight).toBe('10 1/2');
  });

  it('rounds non-exact dimensions to nearest eighth', () => {
    // 300x300 image, 40x40" target, 100x100px piece
    // 100/300 * 40 = 13.333... → roundToEighthNearest → 13.375
    const pieces = [makePiece()];
    const result = scalePiecesToDimensions(
      pieces,
      300,
      300,
      40,
      40,
      0.25,
    );

    expect(result).toHaveLength(1);
    // 13.333... rounded to nearest eighth = 13.375 (13 3/8)
    expect(result[0].finishedWidthNum).toBe(13.375);
    expect(result[0].finishedHeightNum).toBe(13.375);
    expect(result[0].finishedWidth).toBe('13 3/8');
    expect(result[0].finishedHeight).toBe('13 3/8');
    // Cut = 13.375 + 0.5 = 13.875 → "13 7/8"
    expect(result[0].cutWidth).toBe('13 7/8');
    expect(result[0].cutHeight).toBe('13 7/8');
  });

  it('scales contour vertices to inches', () => {
    const pieces = [makePiece()];
    const result = scalePiecesToDimensions(
      pieces,
      400,
      400,
      40,
      40,
      0.25,
    );

    // Scale factor: 40/400 = 0.1 inches per pixel
    // Vertex (100, 0) → (10, 0)
    expect(result[0].contourInches).toEqual([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ]);
  });

  it('carries dominantColor through', () => {
    const pieces = [makePiece({ dominantColor: '#00ff00' })];
    const result = scalePiecesToDimensions(
      pieces,
      400,
      400,
      40,
      40,
      0.25,
    );

    expect(result[0].dominantColor).toBe('#00ff00');
  });
});
