import { describe, it, expect } from 'vitest';
import { patternResultToFabricJson } from '@/lib/photo-to-quilt/to-fabric';
import { PIXELS_PER_INCH } from '@/lib/constants/canvas';

function makeResult(overrides: Partial<{
  cols: number;
  rows: number;
  blockSize: number;
  pieceSizeInches: number;
  palette: string[];
  cells: Array<{
    x: number;
    y: number;
    pieces: Array<{
      colorIndex: number;
      kind: 'square' | 'triangle-a' | 'triangle-b';
      spanW?: number;
      spanH?: number;
      isBackground?: boolean;
    }>;
    blockId?: number;
  }>;
  backgroundFabric: string;
}> = {}) {
  return {
    cols: 4,
    rows: 4,
    blockSize: 3,
    pieceSizeInches: 3.5,
    palette: ['#ff0000', '#00ff00', '#0000ff'],
    cells: [
      {
        x: 0, y: 0,
        pieces: [{ colorIndex: 0, kind: 'square' as const, spanW: 1, spanH: 1 }],
      },
      {
        x: 1, y: 0,
        pieces: [{ colorIndex: 1, kind: 'triangle-a' as const, spanW: 1, spanH: 1 }],
      },
      {
        x: 2, y: 0,
        pieces: [{ colorIndex: 2, kind: 'triangle-b' as const, spanW: 1, spanH: 1 }],
      },
    ],
    backgroundFabric: '#ffffff',
    ...overrides,
  };
}

describe('patternResultToFabricJson', () => {
  it('snaps cellPx to integer pixels (3.5 * 96 = 336, not 336.00000000000006)', () => {
    const json = patternResultToFabricJson(makeResult());
    const objects = json.objects as Array<Record<string, unknown>>;
    const firstObj = objects[0];
    const cellPx = Math.round(3.5 * PIXELS_PER_INCH);
    expect(firstObj.left).toBe(0);
    expect(firstObj.top).toBe(0);
    expect(firstObj.width).toBe(cellPx);
    expect(firstObj.height).toBe(cellPx);
    expect(Number.isInteger(firstObj.left as number)).toBe(true);
    expect(Number.isInteger(firstObj.top as number)).toBe(true);
    expect(Number.isInteger(firstObj.width as number)).toBe(true);
    expect(Number.isInteger(firstObj.height as number)).toBe(true);
  });

  it('produces integer pixel positions for all objects', () => {
    const json = patternResultToFabricJson(
      makeResult({
        cols: 15,
        rows: 15,
        pieceSizeInches: 3.5,
        cells: Array.from({ length: 15 }, (_, y) =>
          Array.from({ length: 15 }, (_, x) => ({
            x,
            y,
            pieces: [
              {
                colorIndex: (x + y) % 3,
                kind: 'square' as const,
                spanW: 1,
                spanH: 1,
              },
            ],
          })),
        ).flat(),
      }),
    );
    const objects = json.objects as Array<Record<string, unknown>>;
    for (const obj of objects) {
      expect(Number.isInteger(obj.left as number)).toBe(true);
      expect(Number.isInteger(obj.top as number)).toBe(true);
      expect(Number.isInteger(obj.width as number)).toBe(true);
      expect(Number.isInteger(obj.height as number)).toBe(true);
    }
  });

  it('rounds triangle vertex coordinates to integers', () => {
    const json = patternResultToFabricJson(
      makeResult({
        cells: [
          {
            x: 1, y: 1,
            pieces: [
              { colorIndex: 0, kind: 'triangle-a', spanW: 1, spanH: 1 },
            ],
          },
          {
            x: 2, y: 1,
            pieces: [
              { colorIndex: 1, kind: 'triangle-b', spanW: 1, spanH: 1 },
            ],
          },
        ],
      }),
    );
    const objects = json.objects as Array<Record<string, unknown>>;
    for (const obj of objects) {
      if (obj.type === 'polygon') {
        const points = obj.points as Array<{ x: number; y: number }>;
        for (const p of points) {
          expect(Number.isInteger(p.x)).toBe(true);
          expect(Number.isInteger(p.y)).toBe(true);
        }
      }
    }
  });

  it('skips background pieces', () => {
    const json = patternResultToFabricJson(
      makeResult({
        cells: [
          {
            x: 0, y: 0,
            pieces: [
              { colorIndex: 0, kind: 'square', isBackground: true },
              { colorIndex: 1, kind: 'square', spanW: 1, spanH: 1 },
            ],
          },
        ],
      }),
    );
    const objects = json.objects as Array<Record<string, unknown>>;
    expect(objects).toHaveLength(1);
    expect(objects[0].fill).toBe('#00ff00');
  });

  it('uses correct Fabric JSON structure', () => {
    const json = patternResultToFabricJson(makeResult());
    expect(json.version).toBe('7.2.0');
    expect(json.backgroundColor).toBe('#ffffff');
    expect(Array.isArray(json.objects)).toBe(true);
  });
});
