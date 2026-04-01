import { buildCanvasObjects } from '@/lib/pattern-import-canvas';
import type { ParsedPattern } from '@/lib/pattern-parser-types';
import type { FabricMatch } from '@/lib/pattern-fabric-matcher';
import type { BlockMatchResult } from '@/lib/pattern-block-matcher';
import type { GridSettings } from '@/lib/pattern-import-types';

describe('buildCanvasObjects', () => {
  const fabricMatches: FabricMatch[] = [];
  const blockMatches: BlockMatchResult[] = [];

  it('handles empty blocks with placeholder', () => {
    const parsed: ParsedPattern = {
      name: 'Test',
      finishedWidth: 60,
      finishedHeight: 80,
      layout: { type: 'straight', borderWidths: [], sashingWidth: 0 },
      blocks: [],
      fabrics: [],
    };
    const gridSettings: GridSettings = { rows: 1, cols: 1 };
    const objects = buildCanvasObjects(parsed, fabricMatches, blockMatches, gridSettings);
    expect(objects.length).toBe(1);
    expect(objects[0].metadata.role).toBe('placeholder');
  });

  it('handles on-point layout', () => {
    const parsed: ParsedPattern = {
      name: 'Test',
      finishedWidth: 60,
      finishedHeight: 80,
      layout: { type: 'on-point', borderWidths: [], sashingWidth: 0 },
      blocks: [{ name: 'Block A', quantity: 1, finishedWidth: 12, finishedHeight: 12, pieces: [] }],
      fabrics: [],
    };
    const gridSettings: GridSettings = { rows: 1, cols: 1 };
    const objects = buildCanvasObjects(parsed, fabricMatches, blockMatches, gridSettings);
    expect(objects.length).toBeGreaterThan(0);
  });

  it('skips blocks when blockIndex exceeds placements', () => {
    const parsed: ParsedPattern = {
      name: 'Test',
      finishedWidth: 60,
      finishedHeight: 80,
      layout: { type: 'straight', borderWidths: [], sashingWidth: 0 },
      blocks: [{ name: 'Block A', quantity: 1, finishedWidth: 12, finishedHeight: 12, pieces: [] }],
      fabrics: [],
    };
    const gridSettings: GridSettings = { rows: 3, cols: 3 };
    const objects = buildCanvasObjects(parsed, fabricMatches, blockMatches, gridSettings);
    expect(objects.length).toBe(1);
  });
});
