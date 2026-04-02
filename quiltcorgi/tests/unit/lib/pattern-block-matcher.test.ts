import { matchPatternBlock, generateCustomBlockSvg, normalizeBlockName } from '@/lib/pattern-block-matcher';
import type { ParsedBlock } from '@/lib/pattern-parser-types';
import type { BlockLibraryEntry } from '@/lib/pattern-block-matcher';

describe('matchPatternBlock', () => {
  const library: BlockLibraryEntry[] = [
    { id: '1', name: 'Log Cabin', category: 'traditional', tags: ['log', 'cabin', 'strip'], svgData: '<svg/>' },
    { id: '2', name: 'Nine Patch', category: 'traditional', tags: ['nine', 'patch', 'grid'], svgData: '<svg/>' },
    { id: '3', name: 'Star', category: 'traditional', tags: ['star', 'point'], svgData: '<svg/>' },
  ];

  it('returns null for normalized match with empty normalized name', () => {
    const block: ParsedBlock = { name: '  quilt  ', quantity: 1, finishedWidth: 12, finishedHeight: 12, pieces: [] };
    const result = matchPatternBlock(block, library);
    expect(result.matchMethod).toBe('none');
  });

  it('returns null for tag match with no keywords', () => {
    const block: ParsedBlock = { name: 'the of and', quantity: 1, finishedWidth: 12, finishedHeight: 12, pieces: [] };
    const result = matchPatternBlock(block, library);
    expect(result.matchMethod).toBe('none');
  });

  it('returns tag match with single match', () => {
    const block: ParsedBlock = { name: 'Star Point', quantity: 1, finishedWidth: 12, finishedHeight: 12, pieces: [] };
    const result = matchPatternBlock(block, library);
    expect(result.matchMethod).toBe('tag');
    expect(result.confidence).toBe(0.6);
  });

  it('returns tag match with ambiguous match', () => {
    const block: ParsedBlock = { name: 'Grid Log', quantity: 1, finishedWidth: 12, finishedHeight: 12, pieces: [] };
    const result = matchPatternBlock(block, library);
    expect(result.matchMethod).toBe('tag');
    expect(result.confidence).toBe(0.4);
  });
});

describe('generateCustomBlockSvg', () => {
  it('handles zero piece count', () => {
    const svg = generateCustomBlockSvg('Test', 10, 10, 0);
    expect(svg).toContain('<svg');
  });

  it('truncates long names', () => {
    const svg = generateCustomBlockSvg('Very Long Block Name Here', 10, 10, 4);
    expect(svg).toContain('\u2026');
  });

  it('escapes XML characters', () => {
    const svg = generateCustomBlockSvg("A & B 'test", 10, 10, 1);
    expect(svg).toContain('&amp;');
    expect(svg).toContain('&apos;');
  });
});
