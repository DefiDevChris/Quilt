import { describe, it, expect } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { generatePrintListPdf } from './generate';
import { computeCanvasYardage } from '@/lib/yardage-calculator';
import { toMixedNumberString, decimalToFraction } from '@/lib/fraction-math';

// Mock canvas for yardage calculation
const mockCanvas = {
  getObjects: () => [
    {
      type: 'rect',
      left: 0,
      top: 0,
      width: 12,
      height: 12,
      scaleX: 1,
      scaleY: 1,
      fill: '#ff0000',
      fabricId: 'fabric-1',
      id: 'shape-1',
      _fenceElement: false,
      _layoutElement: false,
    },
  ],
};

const mockLookupFabric = (id: string) => ({
  name: `Fabric ${id}`,
  thumbnailUrl: null,
});

describe('generatePrintListPdf', () => {
  it('generates PDF with correct page count and validates cut list content', async () => {
    const yardage = computeCanvasYardage({
      canvas: mockCanvas,
      quiltWidth: 48,
      quiltHeight: 48,
      wof: 42,
      lookupFabric: mockLookupFabric,
      bindingWidth: 0.5,
    });

    const input = {
      projectName: 'Test Quilt',
      finishedSize: { width: 48, height: 48 },
      palette: [{ hex: '#ff0000', name: 'Red' }],
      yardage,
      cutList: yardage.fabrics.map((f) => ({
        fabricName: f.displayName,
        hex: f.fillColor,
        cutInstructions: f.cutInstructions,
        totalYardage: f.yardsRequired,
        strips: f.stripCount || 0,
        wof: 42,
      })),
      blocks: [],
      quiltLayout: { rows: 1, cols: 1 },
      paperSize: 'letter' as const,
    };

    const pdfBytes = await generatePrintListPdf(input);
    const pdf = await PDFDocument.load(pdfBytes);

    // At least 4 pages: cover, cut list, block diagram, assembly
    expect(pdf.getPageCount()).toBeGreaterThanOrEqual(4);

    // Extract text from cut list page and verify it contains fabric name and cut instruction
    const pages = pdf.getPages();
    let cutListText = '';
    for (const page of pages) {
      const content = page.getTextContent();
      cutListText += content.map((item: any) => item.str).join(' ');
    }

    // Verify cut list contains fabric name and at least one cut instruction
    expect(cutListText).toContain('Fabric fabric-1');
    expect(cutListText).toMatch(/Cut \d+ squares at/);
  });

  it('cut list totals match yardage calculator output', async () => {
    const yardage = computeCanvasYardage({
      canvas: mockCanvas,
      quiltWidth: 48,
      quiltHeight: 48,
      wof: 42,
      lookupFabric: mockLookupFabric,
    });

    const input = {
      projectName: 'Test Quilt',
      finishedSize: { width: 48, height: 48 },
      palette: [{ hex: '#ff0000', name: 'Red' }],
      yardage,
      cutList: yardage.fabrics.map((f) => ({
        fabricName: f.displayName,
        hex: f.fillColor,
        cutInstructions: f.cutInstructions,
        totalYardage: f.yardsRequired,
        strips: f.stripCount || 0,
        wof: 42,
      })),
      blocks: [],
      quiltLayout: { rows: 1, cols: 1 },
      paperSize: 'letter' as const,
    };

    const pdfBytes = await generatePrintListPdf(input);
    const pdf = await PDFDocument.load(pdfBytes);

    // Calculate total from cut list
    const cutListTotal = input.cutList.reduce((sum, item) => sum + item.totalYardage, 0);
    const yardageTotal = yardage.totalYards;
    expect(Math.abs(cutListTotal - yardageTotal)).toBeLessThan(0.01);
  });
});
