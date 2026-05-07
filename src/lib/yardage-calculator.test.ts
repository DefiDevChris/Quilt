import { describe, it, expect } from 'vitest';
import { computeYardageEstimates, type CanvasShapeData } from './yardage-utils';
import { PIXELS_PER_INCH, DEFAULT_WASTE_MARGIN } from '@/lib/constants/canvas';

const WOF: 42 = 42;

describe('yardage-calculator HST math', () => {
  it('handles 12 squares (3") and 4 HST pairs (3")', () => {
    const shapes: CanvasShapeData[] = [];

    // 12 plain squares, 3" finished
    for (let i = 0; i < 12; i++) {
      shapes.push({
        id: `sq-${i}`,
        widthPx: 3 * PIXELS_PER_INCH,
        heightPx: 3 * PIXELS_PER_INCH,
        scaleX: 1,
        scaleY: 1,
        fabricId: null,
        fabricName: null,
        fillColor: '#ff0000',
        type: 'rect',
        __sizeInches: 3,
      });
    }

    // 4 HST pairs (4 triangle-a + 4 triangle-b)
    for (let i = 0; i < 4; i++) {
      shapes.push({
        id: `hst-a-${i}`,
        widthPx: 3 * PIXELS_PER_INCH,
        heightPx: 3 * PIXELS_PER_INCH,
        scaleX: 1,
        scaleY: 1,
        fabricId: null,
        fabricName: null,
        fillColor: '#ff0000',
        type: 'triangle',
        __pieceKind: 'triangle-a',
        __sizeInches: 3,
      });
      shapes.push({
        id: `hst-b-${i}`,
        widthPx: 3 * PIXELS_PER_INCH,
        heightPx: 3 * PIXELS_PER_INCH,
        scaleX: 1,
        scaleY: 1,
        fabricId: null,
        fabricName: null,
        fillColor: '#ff0000',
        type: 'triangle',
        __pieceKind: 'triangle-b',
        __sizeInches: 3,
      });
    }

    const results = computeYardageEstimates(shapes, PIXELS_PER_INCH, WOF, DEFAULT_WASTE_MARGIN);
    expect(results.length).toBe(1);
    const row = results[0];

    expect(row.cutInstructions.some(i => /^Cut 12 squares at 3\.5"/.test(i))).toBe(true);
    expect(row.cutInstructions.some(i => /^Cut 4 squares at 3\.875" for 8 HSTs/.test(i))).toBe(true);
    expect(row.extraHSTs).toBe(0);
    expect(row.shapeCount).toBe(20);
  });

  it('aggregates mixed fills into separate color groups', () => {
    const shapes: CanvasShapeData[] = [
      {
        id: 'sq-red',
        widthPx: 3 * PIXELS_PER_INCH,
        heightPx: 3 * PIXELS_PER_INCH,
        scaleX: 1,
        scaleY: 1,
        fabricId: null,
        fabricName: null,
        fillColor: '#ff0000',
        type: 'rect',
        __sizeInches: 3,
      },
      {
        id: 'sq-blue',
        widthPx: 3 * PIXELS_PER_INCH,
        heightPx: 3 * PIXELS_PER_INCH,
        scaleX: 1,
        scaleY: 1,
        fabricId: null,
        fabricName: null,
        fillColor: '#0000ff',
        type: 'rect',
        __sizeInches: 3,
      },
    ];

    const results = computeYardageEstimates(shapes, PIXELS_PER_INCH, WOF, DEFAULT_WASTE_MARGIN);
    expect(results.length).toBe(2);
    const colors = results.map(r => r.fillColor);
    expect(colors).toContain('#ff0000');
    expect(colors).toContain('#0000ff');
  });

  it('single unpaired triangle reports extra HSTs', () => {
    const shapes: CanvasShapeData[] = [
      {
        id: 'hst-a-0',
        widthPx: 3 * PIXELS_PER_INCH,
        heightPx: 3 * PIXELS_PER_INCH,
        scaleX: 1,
        scaleY: 1,
        fabricId: null,
        fabricName: null,
        fillColor: '#ff0000',
        type: 'triangle',
        __pieceKind: 'triangle-a',
        __sizeInches: 3,
      },
    ];

    const results = computeYardageEstimates(shapes, PIXELS_PER_INCH, WOF, DEFAULT_WASTE_MARGIN);
    expect(results.length).toBe(1);
    const row = results[0];

    expect(row.cutInstructions.some(i => /^Cut 1 squares at 3\.875" for 1 HSTs/.test(i))).toBe(true);
    expect(row.extraHSTs).toBe(1);
    expect(row.shapeCount).toBe(1);
  });

  it('single fabric with HSTs only reports one cutInstructions entry', () => {
    const shapes: CanvasShapeData[] = [];

    for (let i = 0; i < 4; i++) {
      shapes.push({
        id: `hst-a-${i}`,
        widthPx: 3 * PIXELS_PER_INCH,
        heightPx: 3 * PIXELS_PER_INCH,
        scaleX: 1,
        scaleY: 1,
        fabricId: null,
        fabricName: null,
        fillColor: '#ff0000',
        type: 'triangle',
        __pieceKind: 'triangle-a',
        __sizeInches: 3,
      });
      shapes.push({
        id: `hst-b-${i}`,
        widthPx: 3 * PIXELS_PER_INCH,
        heightPx: 3 * PIXELS_PER_INCH,
        scaleX: 1,
        scaleY: 1,
        fabricId: null,
        fabricName: null,
        fillColor: '#ff0000',
        type: 'triangle',
        __pieceKind: 'triangle-b',
        __sizeInches: 3,
      });
    }

    const results = computeYardageEstimates(shapes, PIXELS_PER_INCH, WOF, DEFAULT_WASTE_MARGIN);
    expect(results.length).toBe(1);
    const row = results[0];

    expect(row.cutInstructions.length).toBe(1);
    expect(row.cutInstructions[0]).toBe('Cut 4 squares at 3.875" for 8 HSTs (~1 strips × WOF)');
    expect(row.yardsRequired).toBe(0.125);
    expect(row.extraHSTs).toBe(0);
  });

  it('regression: HST yardage is not double-counted', () => {
    const shapes: CanvasShapeData[] = [];

    for (let i = 0; i < 4; i++) {
      shapes.push({
        id: `hst-a-${i}`,
        widthPx: 3 * PIXELS_PER_INCH,
        heightPx: 3 * PIXELS_PER_INCH,
        scaleX: 1,
        scaleY: 1,
        fabricId: null,
        fabricName: null,
        fillColor: '#ff0000',
        type: 'triangle',
        __pieceKind: 'triangle-a',
        __sizeInches: 3,
      });
      shapes.push({
        id: `hst-b-${i}`,
        widthPx: 3 * PIXELS_PER_INCH,
        heightPx: 3 * PIXELS_PER_INCH,
        scaleX: 1,
        scaleY: 1,
        fabricId: null,
        fabricName: null,
        fillColor: '#ff0000',
        type: 'triangle',
        __pieceKind: 'triangle-b',
        __sizeInches: 3,
      });
    }

    const results = computeYardageEstimates(shapes, PIXELS_PER_INCH, WOF, DEFAULT_WASTE_MARGIN);
    expect(results.length).toBe(1);
    const row = results[0];

    const hstMatch = row.cutInstructions.find((instr) => /Cut 4 squares at 3\.875" for 8 HSTs/.test(instr));
    expect(hstMatch).toBeDefined();
    expect(row.cutInstructions.filter((instr) => instr.includes('HSTs')).length).toBe(1);

    const cutSize = 3.875;
    const totalArea = 4 * cutSize * cutSize;
    const expectedYards = Math.ceil((totalArea * 1.10) / 42 / 36 * 8) / 8;
    expect(row.yardsRequired).toBe(expectedYards);
  });
});
