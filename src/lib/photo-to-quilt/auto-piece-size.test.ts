import { describe, it, expect } from 'vitest';
import { validQuiltSizes, type ValidQuiltSize } from './auto-piece-size';

const FP_EPSILON = 1e-9;
const QUARTER_INCH = 0.25;
const MAX_CANVAS_INCHES = 200;
const BLOCK_SIZE = 3;

function isEvenQuarter(n: number): boolean {
  return Math.abs(Math.round(n * 4) - n * 4) < FP_EPSILON;
}

function aspectRatio(width: number, height: number): number {
  return width / height;
}

describe('validQuiltSizes() invariants', () => {
  const testCases = [
    { aspect: 1.0, desc: 'square (1:1)' },
    { aspect: 4 / 3, desc: '4:3 landscape' },
    { aspect: 3 / 4, desc: '3:4 portrait' },
    { aspect: 16 / 9, desc: '16:9 wide' },
    { aspect: 9 / 16, desc: '9:16 tall' },
    { aspect: 1.5, desc: '3:2 landscape' },
    { aspect: 2.0, desc: '2:1 panoramic' },
  ];

  for (const { aspect, desc } of testCases) {
    describe(`for ${desc} (aspect=${aspect})`, () => {
      const sizes = validQuiltSizes(aspect);

      it('should return at least one valid size', () => {
        expect(sizes.length).toBeGreaterThan(0);
      });

      for (let i = 0; i < sizes.length; i++) {
        const entry = sizes[i];
        const entryDesc = `${entry.width}x${entry.height} (pieceSize=${entry.pieceSize})`;

        describe(`entry ${i}: ${entryDesc}`, () => {
          it('divisibility invariant: width and height are divisible by pieceSize', () => {
            const widthRem = entry.width % entry.pieceSize;
            const heightRem = entry.height % entry.pieceSize;
            expect(Math.abs(widthRem)).toBeLessThan(FP_EPSILON);
            expect(Math.abs(heightRem)).toBeLessThan(FP_EPSILON);
          });

          it('quarter-inch invariant: pieceSize is multiple of 0.25', () => {
            expect(isEvenQuarter(entry.pieceSize)).toBe(true);
          });

          it('quarter-inch invariant: cols is multiple of BLOCK_SIZE (3)', () => {
            const cols = entry.width / entry.pieceSize;
            expect(cols % BLOCK_SIZE).toBe(0);
          });

          it('quarter-inch invariant: rows is multiple of BLOCK_SIZE (3)', () => {
            const rows = entry.height / entry.pieceSize;
            expect(rows % BLOCK_SIZE).toBe(0);
          });

          it('size limit invariant: width and height <= MAX_CANVAS_INCHES (200)', () => {
            expect(entry.width).toBeLessThanOrEqual(MAX_CANVAS_INCHES);
            expect(entry.height).toBeLessThanOrEqual(MAX_CANVAS_INCHES);
          });

          it('aspect ratio invariant: within ±5% of input or labeled (adj)', () => {
            const entryAspect = aspectRatio(entry.width, entry.height);
            const withinTolerance = Math.abs(entryAspect - aspect) <= aspect * 0.05;
            const isAdjusted = entry.label?.includes('(adj)') ?? false;
            expect(withinTolerance || isAdjusted).toBe(true);
          });

          it('return value structure: has all required fields', () => {
            expect(entry).toHaveProperty('width');
            expect(entry).toHaveProperty('height');
            expect(entry).toHaveProperty('pieceSize');
            expect(entry).toHaveProperty('cols');
            expect(entry).toHaveProperty('rows');
            expect(entry).toHaveProperty('blockCols');
            expect(entry).toHaveProperty('blockRows');
          });

          it('return value structure: cols === width / pieceSize', () => {
            expect(entry.cols).toBe(entry.width / entry.pieceSize);
          });

          it('return value structure: rows === height / pieceSize', () => {
            expect(entry.rows).toBe(entry.height / entry.pieceSize);
          });

          it('return value structure: blockCols === cols / 3', () => {
            expect(entry.blockCols).toBe(entry.cols / BLOCK_SIZE);
          });

          it('return value structure: blockRows === rows / 3', () => {
            expect(entry.blockRows).toBe(entry.rows / BLOCK_SIZE);
          });

          it('even quarter inches: width is even quarter inch', () => {
            expect(isEvenQuarter(entry.width)).toBe(true);
          });

          it('even quarter inches: height is even quarter inch', () => {
            expect(isEvenQuarter(entry.height)).toBe(true);
          });

          it('even quarter inches: pieceSize is even quarter inch', () => {
            expect(isEvenQuarter(entry.pieceSize)).toBe(true);
          });
        });
      }
    });
  }
});
