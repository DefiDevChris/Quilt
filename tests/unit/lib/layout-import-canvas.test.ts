import { buildCanvasObjects } from '@/lib/layout-import-canvas';
import type { ParsedPattern } from '@/lib/layout-parser-types';
import type { FabricMatch } from '@/lib/layout-fabric-matcher';
import type { BlockMatchResult } from '@/lib/layout-block-matcher';
import type { GridSettings } from '@/lib/layout-import-types';

describe('buildCanvasObjects', () => {
  const fabricMatches: FabricMatch[] = [];
  const blockMatches: BlockMatchResult[] = [];

  it('handles empty blocks with placeholder', () => {
    const parsed: ParsedPattern = {
      id: 'test-id',
      name: 'Test',
      description: '',
      skillLevel: 'beginner',
      finishedWidth: 60,
      finishedHeight: 80,
      layout: { type: 'grid', borderWidths: [], sashingWidth: 0 },
      blocks: [],
      fabrics: [],
      cuttingDirections: [],
      assemblySteps: [],
      sourceFilename: 'test.pdf',
      pageCount: 1,
      isQuilt: true,
      parseConfidence: 1,
    };
    const gridSettings: GridSettings = { rows: 1, cols: 1, enabled: false, snapToGrid: false, size: 12 };
    const objects = buildCanvasObjects(parsed, fabricMatches, blockMatches, gridSettings);
    expect(objects.length).toBe(1);
    expect(objects[0].metadata!.role).toBe('placeholder');
  });

  it('handles on-point layout', () => {
    const parsed: ParsedPattern = {
      id: 'test-id',
      name: 'Test',
      description: '',
      skillLevel: 'beginner',
      finishedWidth: 60,
      finishedHeight: 80,
      layout: { type: 'on-point', borderWidths: [], sashingWidth: 0 },
      blocks: [{ name: 'Block A', quantity: 1, finishedWidth: 12, finishedHeight: 12, pieces: [] }],
      fabrics: [],
      cuttingDirections: [],
      assemblySteps: [],
      sourceFilename: 'test.pdf',
      pageCount: 1,
      isQuilt: true,
      parseConfidence: 1,
    };
    const gridSettings: GridSettings = { rows: 1, cols: 1, enabled: false, snapToGrid: false, size: 12 };
    const objects = buildCanvasObjects(parsed, fabricMatches, blockMatches, gridSettings);
    expect(objects.length).toBeGreaterThan(0);
  });

  it('skips blocks when blockIndex exceeds placements', () => {
    const parsed: ParsedPattern = {
      id: 'test-id',
      name: 'Test',
      description: '',
      skillLevel: 'beginner',
      finishedWidth: 60,
      finishedHeight: 80,
      layout: { type: 'grid', borderWidths: [], sashingWidth: 0 },
      blocks: [{ name: 'Block A', quantity: 1, finishedWidth: 12, finishedHeight: 12, pieces: [] }],
      fabrics: [],
      cuttingDirections: [],
      assemblySteps: [],
      sourceFilename: 'test.pdf',
      pageCount: 1,
      isQuilt: true,
      parseConfidence: 1,
    };
    const gridSettings: GridSettings = { rows: 3, cols: 3, enabled: false, snapToGrid: false, size: 12 };
    const objects = buildCanvasObjects(parsed, fabricMatches, blockMatches, gridSettings);
    expect(objects.length).toBe(1);
  });
});
