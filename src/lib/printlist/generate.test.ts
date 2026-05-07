import { describe, it, expect } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import {
  generatePrintListPdf,
  ulTrianglePath,
  lrTrianglePath,
  assemblySizeLabel,
  coverFinishedSizeLine,
} from './generate';
import { patternResultToFabricJson } from '@/lib/photo-to-quilt/to-fabric';
import { extractBlocksFromFabricObjects, computeQuiltLayout } from '@/lib/photo-to-quilt/fabric-to-blocks';
import { PIXELS_PER_INCH } from '@/lib/constants/canvas';
import { computeYardageEstimates, type CanvasShapeData } from '@/lib/yardage-utils';

function makePatternResult() {
  const palette = ['#d44', '#4a4', '#44a'];
  const cells: Array<{
    x: number;
    y: number;
    pieces: Array<{
      colorIndex: number;
      kind: 'square' | 'triangle-a' | 'triangle-b';
      isBackground?: boolean;
    }>;
    blockId?: number;
  }> = [];

  for (let y = 0; y < 6; y++) {
    for (let x = 0; x < 6; x++) {
      const pieces: Array<{
        colorIndex: number;
        kind: 'square' | 'triangle-a' | 'triangle-b';
        isBackground?: boolean;
      }> = [];

      const colorIdx = (x + y) % 3;
      const isHst = (x + y) % 2 === 0;

      if (isHst) {
        pieces.push({ colorIndex: colorIdx, kind: 'triangle-a' });
        pieces.push({ colorIndex: (colorIdx + 1) % 3, kind: 'triangle-b' });
      } else {
        pieces.push({ colorIndex: colorIdx, kind: 'square' });
      }

      cells.push({ x, y, pieces });
    }
  }

  return {
    cols: 6,
    rows: 6,
    blockSize: 3,
    pieceSizeInches: 2.5,
    palette,
    cells,
    blockCols: 2,
    blockRows: 2,
    pieceSize: 2.5,
  };
}

describe('generatePrintListPdf', () => {
  it('generates valid PDF with correct structure', async () => {
    const patternResult = makePatternResult();
    const fabricJson = patternResultToFabricJson(patternResult as never);

    const objects = (fabricJson.objects as unknown[]) ?? [];
    const blocks = extractBlocksFromFabricObjects(objects);
    const quiltLayout = computeQuiltLayout(blocks);

    const shapes: CanvasShapeData[] = [];
    for (const obj of objects) {
      const meta = obj as Record<string, unknown>;
      if (meta.__isBlockGroup) {
        const children = (meta.objects as unknown[]) ?? [];
        for (const child of children) {
          const childMeta = child as Record<string, unknown>;
          shapes.push({
            id: childMeta.id as string,
            widthPx: 100,
            heightPx: 100,
            scaleX: 1,
            scaleY: 1,
            fabricId: null,
            fabricName: null,
            fillColor: childMeta.fill as string,
            type: childMeta.type as string,
            __pieceKind: childMeta.__pieceKind as CanvasShapeData['__pieceKind'],
            __sizeInches: patternResult.pieceSizeInches,
          });
        }
      }
    }

    const yardageResults = computeYardageEstimates(shapes, PIXELS_PER_INCH, 42, 0.1);

    const pdfBytes = await generatePrintListPdf({
      projectName: 'Test Quilt',
      finishedSize: { width: 6 * 2.5, height: 6 * 2.5 },
      palette: [
        { hex: '#d44', name: 'Red' },
        { hex: '#4a4', name: 'Green' },
        { hex: '#44a', name: 'Blue' },
      ],
      yardage: {
        fabrics: yardageResults.map((r) => ({
          ...r,
          thumbnailUrl: null,
        })),
        backing: null,
        binding: null,
        totalYards: yardageResults.reduce((sum, r) => sum + r.yardsRequired, 0),
      },
      cutList: yardageResults.map((r) => ({
        fabricName: r.displayName,
        hex: r.fillColor,
        cutInstructions: r.cutInstructions,
        totalYardage: r.yardsRequired,
        wof: 42,
      })),
      blocks,
      quiltLayout,
      pieceSizeInches: patternResult.pieceSizeInches,
      paperSize: 'letter',
    });

    const doc = await PDFDocument.load(pdfBytes);
    expect(doc.getPageCount()).toBeGreaterThanOrEqual(4);
  });

  it('regression: assembly-diagram size label matches piece dimensions', () => {
    expect(assemblySizeLabel(15, 15)).toBe('15" × 15"');
    expect(coverFinishedSizeLine(15, 15)).toBe('Finished size: 15 × 15');
    expect(assemblySizeLabel(15.5, 15.5)).toBe('15 1/2" × 15 1/2"');
  });

  it('regression: HST diagonals are not mirrored', () => {
    // pdf-lib y grows up; cell at (x=10, y=20) with cellSize=30:
    //   visual TL = (10, 50), TR = (40, 50), BL = (10, 20), BR = (40, 20)
    expect(ulTrianglePath(10, 20, 30)).toBe('M 10 50 L 40 50 L 10 20 Z');  // TL,TR,BL
    expect(lrTrianglePath(10, 20, 30)).toBe('M 40 50 L 40 20 L 10 20 Z');  // TR,BR,BL
  });
});
