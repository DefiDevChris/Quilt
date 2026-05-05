import { describe, it, expect } from 'vitest';
import {
  autoPieceSize,
  validQuiltSizes,
} from '@/lib/photo-to-quilt/auto-piece-size';

describe('autoPieceSize', () => {
  it('returns a piece size that evenly divides both dimensions', () => {
    const ps = autoPieceSize(36, 52);
    expect(36 % ps).toBeLessThan(1e-9);
    expect(52 % ps).toBeLessThan(1e-9);
  });

  it('handles FP drift for 52 % 3.5 (was 0.4999... instead of 0)', () => {
    const ps = autoPieceSize(52, 52);
    const remainder = 52 % ps;
    expect(
      Math.abs(remainder) < 1e-9 || Math.abs(remainder - ps) < 1e-9,
    ).toBe(true);
  });

  it('returns even-quarter-inch value', () => {
    const ps = autoPieceSize(50, 65);
    expect(Math.round(ps * 4) / 4).toBe(ps);
  });

  it('returns MIN_PIECE_SIZE (2) for dimensions with no clean divisor', () => {
    const ps = autoPieceSize(7, 11);
    expect(ps).toBe(2);
  });

  it('works with default dimensions (48x48)', () => {
    const ps = autoPieceSize();
    expect(ps).toBeGreaterThanOrEqual(2);
    expect(48 % ps).toBeLessThan(1e-9);
  });
});

describe('validQuiltSizes', () => {
  it('produces sizes where width and height are even-quarter-inch', () => {
    const sizes = validQuiltSizes(1);
    for (const s of sizes) {
      expect(
        Math.abs(Math.round(s.width * 4) - s.width * 4),
      ).toBeLessThan(1e-9);
      expect(
        Math.abs(Math.round(s.height * 4) - s.height * 4),
      ).toBeLessThan(1e-9);
    }
  });

  it('produces sizes where cols and rows are integers', () => {
    const sizes = validQuiltSizes(1.3);
    for (const s of sizes) {
      expect(Math.abs(s.cols - Math.round(s.cols))).toBeLessThan(1e-9);
      expect(Math.abs(s.rows - Math.round(s.rows))).toBeLessThan(1e-9);
    }
  });

  it('returns valid sizes for a non-square aspect ratio', () => {
    const sizes = validQuiltSizes(36 / 52);
    expect(sizes.length).toBeGreaterThan(0);
    const first = sizes[0];
    expect(first.pieceSize).toBeGreaterThan(0);
    expect(first.cols).toBeGreaterThan(0);
    expect(first.rows).toBeGreaterThan(0);
  });
});
