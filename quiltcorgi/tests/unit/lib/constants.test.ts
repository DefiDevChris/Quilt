import { describe, it, expect } from 'vitest';
import {
  ZOOM_MIN,
  ZOOM_MAX,
  FREE_PROJECT_LIMIT,
  FREE_BLOCK_LIMIT,
  PIXELS_PER_INCH,
  PDF_POINTS_PER_INCH,
  DEFAULT_SEAM_ALLOWANCE_INCHES,
  AUTO_SAVE_INTERVAL_MS,
  UNDO_HISTORY_MAX,
  DEFAULT_CANVAS_WIDTH,
  DEFAULT_CANVAS_HEIGHT,
} from '@/lib/constants';

describe('constants', () => {
  it('has valid zoom range', () => {
    expect(ZOOM_MIN).toBeLessThan(ZOOM_MAX);
    expect(ZOOM_MIN).toBeGreaterThan(0);
    expect(ZOOM_MAX).toBe(5.0);
  });

  it('has correct free tier limits', () => {
    expect(FREE_PROJECT_LIMIT).toBe(3);
    expect(FREE_BLOCK_LIMIT).toBe(100);
  });

  it('has correct DPI and point values', () => {
    expect(PIXELS_PER_INCH).toBe(96);
    expect(PDF_POINTS_PER_INCH).toBe(72);
  });

  it('has valid seam allowance default', () => {
    expect(DEFAULT_SEAM_ALLOWANCE_INCHES).toBe(0.25);
  });

  it('has reasonable auto-save interval', () => {
    expect(AUTO_SAVE_INTERVAL_MS).toBe(30_000);
  });

  it('has correct undo history limit', () => {
    expect(UNDO_HISTORY_MAX).toBe(50);
  });

  it('has correct default canvas dimensions', () => {
    expect(DEFAULT_CANVAS_WIDTH).toBe(48);
    expect(DEFAULT_CANVAS_HEIGHT).toBe(48);
  });
});
