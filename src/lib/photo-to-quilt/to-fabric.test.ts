import { describe, it, expect } from 'vitest';
import { patternResultToFabricJson } from './to-fabric';
import { PIXELS_PER_INCH } from '@/lib/constants/canvas';

function createAllSquaresPattern(cols: number, rows: number, blockSize: number, pieceSizeInches: number) {
  const palette = ['#FF0000', '#00FF00', '#0000FF'];
  const cells: Array<{ x: number; y: number; pieces: Array<{ colorIndex: number; kind: 'square' | 'triangle-a' | 'triangle-b'; isBackground?: boolean }>; blockId?: number }> = [];

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      cells.push({
        x,
        y,
        pieces: [{ colorIndex: (x + y) % palette.length, kind: 'square' }],
        blockId: Math.floor(y / blockSize) * Math.floor(cols / blockSize) + Math.floor(x / blockSize),
      });
    }
  }

  return {
    cols,
    rows,
    blockSize,
    pieceSizeInches,
    palette,
    cells,
    backgroundFabric: '#FFFFFF',
  };
}

function createAllHSTsPattern(cols: number, rows: number, blockSize: number, pieceSizeInches: number) {
  const palette = ['#FF0000', '#00FF00', '#0000FF'];
  const cells: Array<{ x: number; y: number; pieces: Array<{ colorIndex: number; kind: 'square' | 'triangle-a' | 'triangle-b'; isBackground?: boolean }>; blockId?: number }> = [];

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      cells.push({
        x,
        y,
        pieces: [
          { colorIndex: (x + y) % palette.length, kind: 'triangle-a' as const },
          { colorIndex: (x + y + 1) % palette.length, kind: 'triangle-b' as const },
        ],
        blockId: Math.floor(y / blockSize) * Math.floor(cols / blockSize) + Math.floor(x / blockSize),
      });
    }
  }

  return {
    cols,
    rows,
    blockSize,
    pieceSizeInches,
    palette,
    cells,
    backgroundFabric: '#FFFFFF',
  };
}

function createMixedPattern(cols: number, rows: number, blockSize: number, pieceSizeInches: number) {
  const palette = ['#FF0000', '#00FF00', '#0000FF'];
  const cells: Array<{ x: number; y: number; pieces: Array<{ colorIndex: number; kind: 'square' | 'triangle-a' | 'triangle-b'; isBackground?: boolean }>; blockId?: number }> = [];

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const isSquare = (x + y) % 2 === 0;
      cells.push({
        x,
        y,
        pieces: isSquare
          ? [{ colorIndex: (x + y) % palette.length, kind: 'square' as const }]
          : [
              { colorIndex: (x + y) % palette.length, kind: 'triangle-a' as const },
              { colorIndex: (x + y + 1) % palette.length, kind: 'triangle-b' as const },
            ],
        blockId: Math.floor(y / blockSize) * Math.floor(cols / blockSize) + Math.floor(x / blockSize),
      });
    }
  }

  return {
    cols,
    rows,
    blockSize,
    pieceSizeInches,
    palette,
    cells,
    backgroundFabric: '#FFFFFF',
  };
}

function createPatternWithEmptyBlocks(cols: number, rows: number, blockSize: number, pieceSizeInches: number) {
  const palette = ['#FF0000', '#00FF00', '#0000FF'];
  const cells: Array<{ x: number; y: number; pieces: Array<{ colorIndex: number; kind: 'square' | 'triangle-a' | 'triangle-b'; isBackground?: boolean }>; blockId?: number }> = [];

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const blockX = Math.floor(x / blockSize);
      const blockY = Math.floor(y / blockSize);
      const isEmptyBlock = (blockX + blockY) % 2 === 0;

      cells.push({
        x,
        y,
        pieces: isEmptyBlock
          ? [{ colorIndex: 0, kind: 'square' as const, isBackground: true }]
          : [{ colorIndex: (x + y) % palette.length, kind: 'square' as const }],
        blockId: blockY * Math.floor(cols / blockSize) + blockX,
      });
    }
  }

  return {
    cols,
    rows,
    blockSize,
    pieceSizeInches,
    palette,
    cells,
    backgroundFabric: '#FFFFFF',
  };
}

describe('patternResultToFabricJson', () => {
  const blockSize = 3;
  const pieceSizeInches = 2;
  const ppi = PIXELS_PER_INCH;

  describe('All squares pattern', () => {
    it('should export 3x3 blocks (9x9 cells) with all squares and correct invariants', () => {
      const pattern = createAllSquaresPattern(9, 9, blockSize, pieceSizeInches);
      const json = patternResultToFabricJson(pattern);
      const parsed = JSON.parse(JSON.stringify(json));

      expect(parsed.objects).toBeInstanceOf(Array);
      expect(parsed.objects.length).toBe(9); // 3x3 blocks

      const allIds = new Set<string>();

      for (const group of parsed.objects) {
        expect(group.__isBlockGroup).toBe(true);
        expect(group.type).toBe('group');
        expect(group.objects).toBeInstanceOf(Array);

        for (const child of group.objects) {
          expect(child.__pieceRole).toBe('patch');
          expect(child.__pieceKind).toBe('square');
          expect(child.__sizeInches).toEqual({ w: pieceSizeInches, h: pieceSizeInches });
          expect(typeof child.id).toBe('string');
          expect(allIds.has(child.id)).toBe(false);
          allIds.add(child.id);
        }
      }

      expect(allIds.size).toBe(81); // 9x9 cells
    });
  });

  describe('All HSTs pattern', () => {
    it('should export 3x3 blocks with triangle-a and triangle-b pieces', () => {
      const pattern = createAllHSTsPattern(9, 9, blockSize, pieceSizeInches);
      const json = patternResultToFabricJson(pattern);
      const parsed = JSON.parse(JSON.stringify(json));

      expect(parsed.objects).toBeInstanceOf(Array);
      expect(parsed.objects.length).toBe(9);

      const cellPx = Math.round(pieceSizeInches * ppi);

      for (const group of parsed.objects) {
        expect(group.__isBlockGroup).toBe(true);

        for (const child of group.objects) {
          expect(child.__pieceRole).toBe('patch');
          expect(['triangle-a', 'triangle-b']).toContain(child.__pieceKind);
          expect(child.type).toBe('polygon');

          if (child.__pieceKind === 'triangle-a') {
            expect(child.points).toEqual([
              { x: 0, y: 0 },
              { x: cellPx, y: 0 },
              { x: 0, y: cellPx },
            ]);
          } else {
            expect(child.points).toEqual([
              { x: cellPx, y: 0 },
              { x: cellPx, y: cellPx },
              { x: 0, y: cellPx },
            ]);
          }
        }
      }
    });
  });

  describe('Mixed pattern', () => {
    it('should handle mix of squares and HSTs with all invariants', () => {
      const pattern = createMixedPattern(6, 6, blockSize, pieceSizeInches);
      const json = patternResultToFabricJson(pattern);
      const parsed = JSON.parse(JSON.stringify(json));

      const allIds = new Set<string>();

      for (const group of parsed.objects) {
        expect(group.__isBlockGroup).toBe(true);

        for (const child of group.objects) {
          expect(child.__pieceRole).toBe('patch');
          expect(['square', 'triangle-a', 'triangle-b']).toContain(child.__pieceKind);
          expect(child.__sizeInches).toEqual({ w: pieceSizeInches, h: pieceSizeInches });
          expect(typeof child.id).toBe('string');
          expect(allIds.has(child.id)).toBe(false);
          allIds.add(child.id);
        }
      }
    });
  });

  describe('Geometry tests', () => {
    it('should position patches at correct pixel coordinates based on cell position', () => {
      const pattern = createAllSquaresPattern(9, 9, blockSize, pieceSizeInches);
      const json = patternResultToFabricJson(pattern);
      const parsed = JSON.parse(JSON.stringify(json));

      const cellPx = Math.round(pieceSizeInches * ppi);

      for (const group of parsed.objects) {
        const { bx, by } = group.__photoQuiltBlock;

        for (const child of group.objects) {
          const { x: cellX, y: cellY } = child.__photoQuiltCell;
          const expectedLeft = (cellX - bx * blockSize) * cellPx;
          const expectedTop = (cellY - by * blockSize) * cellPx;

          expect(child.left).toBeCloseTo(expectedLeft, 0);
          expect(child.top).toBeCloseTo(expectedTop, 0);
        }
      }
    });

    it('should have total bounding box equal to cols * pieceSizeInches * PIXELS_PER_INCH by rows * pieceSizeInches * PIXELS_PER_INCH', () => {
      const cols = 9;
      const rows = 9;
      const pattern = createAllSquaresPattern(cols, rows, blockSize, pieceSizeInches);
      const json = patternResultToFabricJson(pattern);
      const parsed = JSON.parse(JSON.stringify(json));

      const expectedWidth = cols * pieceSizeInches * ppi;
      const expectedHeight = rows * pieceSizeInches * ppi;

      let maxRight = 0;
      let maxBottom = 0;

      for (const group of parsed.objects) {
        const groupLeft = group.left as number;
        const groupTop = group.top as number;

        for (const child of group.objects) {
          const right = groupLeft + (child.left as number) + (child.width || 0);
          const bottom = groupTop + (child.top as number) + (child.height || 0);
          if (right > maxRight) maxRight = right;
          if (bottom > maxBottom) maxBottom = bottom;
        }
      }

      expect(maxRight).toBeCloseTo(expectedWidth, 0);
      expect(maxBottom).toBeCloseTo(expectedHeight, 0);
    });
  });

  describe('Empty block handling', () => {
    it('should not emit blocks that are all background', () => {
      const pattern = createPatternWithEmptyBlocks(6, 6, blockSize, pieceSizeInches);
      const json = patternResultToFabricJson(pattern);
      const parsed = JSON.parse(JSON.stringify(json));

      // With 2x2 blocks (6x6 cells, blockSize=3), half should be empty
      // So we expect ~2 blocks instead of 4
      expect(parsed.objects.length).toBeLessThan(4);

      // Verify no group contains background pieces
      for (const group of parsed.objects) {
        expect(group.__isBlockGroup).toBe(true);
        expect(group.objects.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Top-level JSON structure', () => {
    it('should have correct version and structure', () => {
      const pattern = createAllSquaresPattern(3, 3, blockSize, pieceSizeInches);
      const json = patternResultToFabricJson(pattern);
      const parsed = JSON.parse(JSON.stringify(json));

      expect(parsed.version).toBe('7.2.0');
      expect(parsed.objects).toBeInstanceOf(Array);
      expect(parsed.backgroundColor).toBeUndefined();
    });
  });
});
