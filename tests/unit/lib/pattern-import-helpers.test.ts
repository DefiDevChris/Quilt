import { describe, it, expect } from 'vitest';
import {
  resolveBlockColor,
  inferFabricGroup,
  classifyHexToFamily,
  collectCustomBlocks,
} from '@/lib/pattern-import-helpers';
import type { ParsedBlock } from '@/lib/pattern-parser-types';
import type { FabricMatch } from '@/lib/pattern-fabric-matcher';
import type { BlockMatchResult } from '@/lib/pattern-block-matcher';

describe('resolveBlockColor', () => {
  it('returns fallback color when block has no pieces', () => {
    const block: ParsedBlock = {
      name: 'Test Block',
      quantity: 1,
      pieces: [],
      finishedWidth: 6,
      finishedHeight: 6,
    };
    const fabricMatches: FabricMatch[] = [];

    expect(resolveBlockColor(block, fabricMatches)).toBe('#888888');
  });

  it('returns fabric color when match found', () => {
    const block: ParsedBlock = {
      name: 'Test Block',
      quantity: 1,
      pieces: [{
        fabricLabel: 'fabric1',
        shape: 'square',
        cutWidth: 6,
        cutHeight: 6,
        quantity: 1,
      }],
      finishedWidth: 6,
      finishedHeight: 6,
    };
    const fabricMatches: FabricMatch[] = [{
      patternLabel: 'fabric1',
      patternName: 'Fabric 1',
      patternSku: null,
      matchedFabricId: '1',
      confidence: 1.0,
      colorHex: '#ff0000',
      matchMethod: 'name',
    }];

    expect(resolveBlockColor(block, fabricMatches)).toBe('#ff0000');
  });

  it('returns fallback color when no match found', () => {
    const block: ParsedBlock = {
      name: 'Test Block',
      quantity: 1,
      pieces: [{
        fabricLabel: 'fabric1',
        shape: 'square',
        cutWidth: 6,
        cutHeight: 6,
        quantity: 1,
      }],
      finishedWidth: 6,
      finishedHeight: 6,
    };
    const fabricMatches: FabricMatch[] = [];

    expect(resolveBlockColor(block, fabricMatches)).toBe('#888888');
  });
});

describe('inferFabricGroup', () => {
  it('returns capitalized color name from label', () => {
    expect(inferFabricGroup('red fabric', '#ff0000')).toBe('Red');
    expect(inferFabricGroup('BLUE cotton', '#0000ff')).toBe('Blue');
  });

  it('handles grey/grey variants', () => {
    expect(inferFabricGroup('grey wool', '#888888')).toBe('Gray');
    expect(inferFabricGroup('GREY wool', '#888888')).toBe('Gray');
  });

  it('returns capitalized neutral', () => {
    expect(inferFabricGroup('neutral background', '#ffffff')).toBe('Neutral');
  });

  it('falls back to hex classification when no keywords found', () => {
    expect(inferFabricGroup('unknown fabric', '#ff0000')).toBe('Red');
    expect(inferFabricGroup('mystery cloth', '#00ff00')).toBe('Green');
  });
});

describe('classifyHexToFamily', () => {
  it('returns Other for short hex', () => {
    expect(classifyHexToFamily('#abc')).toBe('Other');
  });

  it('returns Black for very dark colors', () => {
    expect(classifyHexToFamily('#000000')).toBe('Black');
    expect(classifyHexToFamily('#1a1a1a')).toBe('Black');
  });

  it('returns White for very light colors', () => {
    expect(classifyHexToFamily('#ffffff')).toBe('White');
    expect(classifyHexToFamily('#fefefe')).toBe('White');
  });

  it('returns Gray for low saturation colors', () => {
    expect(classifyHexToFamily('#888888')).toBe('Gray');
    expect(classifyHexToFamily('#cccccc')).toBe('Gray');
  });

  it('classifies red hues', () => {
    expect(classifyHexToFamily('#ff0000')).toBe('Red');
    expect(classifyHexToFamily('#800000')).toBe('Red');
  });

  it('classifies orange hues', () => {
    expect(classifyHexToFamily('#ff8000')).toBe('Orange');
  });

  it('classifies yellow hues', () => {
    expect(classifyHexToFamily('#ffff00')).toBe('Yellow');
  });

  it('classifies green hues', () => {
    expect(classifyHexToFamily('#00ff00')).toBe('Green');
  });

  it('classifies blue hues', () => {
    expect(classifyHexToFamily('#0000ff')).toBe('Blue');
  });

  it('classifies purple hues', () => {
    expect(classifyHexToFamily('#8000ff')).toBe('Purple');
  });

  it('classifies pink hues', () => {
    expect(classifyHexToFamily('#ff00ff')).toBe('Pink');
  });
});

describe('collectCustomBlocks', () => {
  it('returns empty array when no blocks', () => {
    const blocks: ParsedBlock[] = [];
    const blockMatches: BlockMatchResult[] = [];

    expect(collectCustomBlocks(blocks, blockMatches)).toEqual([]);
  });

  it('collects blocks that need custom definition', () => {
    const blocks: ParsedBlock[] = [
      {
        name: 'Block A',
        quantity: 1,
        pieces: [{ fabricLabel: 'f1', shape: 'square', cutWidth: 4, cutHeight: 4, quantity: 2 }],
        finishedWidth: 4,
        finishedHeight: 4,
      },
      {
        name: 'Block B',
        quantity: 1,
        pieces: [{ fabricLabel: 'f1', shape: 'square', cutWidth: 6, cutHeight: 6, quantity: 1 }],
        finishedWidth: 6,
        finishedHeight: 6,
      },
    ];
    const blockMatches: BlockMatchResult[] = [
      { patternBlockName: 'Block A', matchedBlockId: null, matchedBlockName: null, confidence: 0, matchMethod: 'none', needsCustomBlock: true },
      { patternBlockName: 'Block B', matchedBlockId: '123', matchedBlockName: 'Block B', confidence: 1.0, matchMethod: 'exact-name', needsCustomBlock: false },
    ];

    const result = collectCustomBlocks(blocks, blockMatches);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Block A');
    expect(result[0].category).toBe('imported');
  });

  it('deduplicates by normalized name', () => {
    const blocks: ParsedBlock[] = [
      {
        name: 'Block A',
        quantity: 1,
        pieces: [{ fabricLabel: 'f1', shape: 'square', cutWidth: 4, cutHeight: 4, quantity: 1 }],
        finishedWidth: 4,
        finishedHeight: 4,
      },
      {
        name: 'block a',
        quantity: 1,
        pieces: [{ fabricLabel: 'f1', shape: 'square', cutWidth: 4, cutHeight: 4, quantity: 1 }],
        finishedWidth: 4,
        finishedHeight: 4,
      },
    ];
    const blockMatches: BlockMatchResult[] = [
      { patternBlockName: 'Block A', matchedBlockId: null, matchedBlockName: null, confidence: 0, matchMethod: 'none', needsCustomBlock: true },
      { patternBlockName: 'block a', matchedBlockId: null, matchedBlockName: null, confidence: 0, matchMethod: 'none', needsCustomBlock: true },
    ];

    const result = collectCustomBlocks(blocks, blockMatches);
    expect(result).toHaveLength(1);
  });
});