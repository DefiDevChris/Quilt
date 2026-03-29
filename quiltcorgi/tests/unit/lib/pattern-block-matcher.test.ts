import { describe, it, expect } from 'vitest';
import {
  normalizeBlockName,
  matchPatternBlock,
  matchAllBlocks,
  generateCustomBlockSvg,
} from '@/lib/pattern-block-matcher';
import type { BlockLibraryEntry } from '@/lib/pattern-block-matcher';
import type { ParsedBlock } from '@/lib/pattern-parser-types';

// ── Test Fixtures ─────────────────────────────────────────────────

function makeLibraryEntry(
  overrides: Partial<BlockLibraryEntry> & { id: string; name: string }
): BlockLibraryEntry {
  return {
    category: 'traditional',
    tags: [],
    svgData: '<svg></svg>',
    ...overrides,
  };
}

function makeParsedBlock(overrides: Partial<ParsedBlock> & { name: string }): ParsedBlock {
  return {
    finishedWidth: 6,
    finishedHeight: 6,
    quantity: 1,
    pieces: [],
    ...overrides,
  };
}

describe('pattern-block-matcher', () => {
  describe('normalizeBlockName', () => {
    it('strips "Block" suffix and lowercases', () => {
      expect(normalizeBlockName('Rose Block')).toBe('rose');
    });

    it('strips "Quilt" suffix and lowercases', () => {
      expect(normalizeBlockName('Nine Patch Quilt')).toBe('nine patch');
    });

    it('trims whitespace and strips "Unit" suffix', () => {
      expect(normalizeBlockName('  Log Cabin Unit  ')).toBe('log cabin');
    });

    it('returns already normalized names unchanged', () => {
      expect(normalizeBlockName('flying geese')).toBe('flying geese');
    });

    it('collapses multiple internal spaces', () => {
      expect(normalizeBlockName('Bear   Paw   Block')).toBe('bear paw');
    });
  });

  describe('matchPatternBlock', () => {
    const library: BlockLibraryEntry[] = [
      makeLibraryEntry({
        id: 'blk-1',
        name: 'Log Cabin',
        tags: ['log', 'cabin', 'traditional'],
      }),
      makeLibraryEntry({
        id: 'blk-2',
        name: 'Nine Patch',
        tags: ['nine', 'patch', 'beginner'],
      }),
      makeLibraryEntry({
        id: 'blk-3',
        name: 'Flying Geese',
        tags: ['flying', 'geese', 'hst'],
      }),
    ];

    it('returns confidence 1.0 and method "exact-name" for exact match', () => {
      const block = makeParsedBlock({ name: 'Log Cabin' });
      const result = matchPatternBlock(block, library);

      expect(result.confidence).toBe(1.0);
      expect(result.matchMethod).toBe('exact-name');
      expect(result.matchedBlockId).toBe('blk-1');
      expect(result.matchedBlockName).toBe('Log Cabin');
      expect(result.needsCustomBlock).toBe(false);
    });

    it('returns confidence 0.85 for normalized match (suffix difference)', () => {
      const block = makeParsedBlock({ name: 'Log Cabin Block' });
      const result = matchPatternBlock(block, library);

      expect(result.confidence).toBe(0.85);
      expect(result.matchMethod).toBe('normalized-name');
      expect(result.matchedBlockId).toBe('blk-1');
      expect(result.needsCustomBlock).toBe(false);
    });

    it('returns confidence 0.85 for normalized match (case difference)', () => {
      const block = makeParsedBlock({ name: 'NINE PATCH QUILT' });
      const result = matchPatternBlock(block, library);

      expect(result.confidence).toBe(0.85);
      expect(result.matchMethod).toBe('normalized-name');
      expect(result.matchedBlockId).toBe('blk-2');
      expect(result.needsCustomBlock).toBe(false);
    });

    it('returns confidence 0.6 for tag match', () => {
      const block = makeParsedBlock({ name: 'Traditional Cabin' });
      const result = matchPatternBlock(block, library);

      expect(result.matchMethod).toBe('tag');
      expect(result.confidence).toBeGreaterThanOrEqual(0.4);
      expect(result.confidence).toBeLessThanOrEqual(0.6);
      expect(result.matchedBlockId).toBe('blk-1');
      expect(result.needsCustomBlock).toBe(false);
    });

    it('returns confidence 0.0 and needsCustomBlock true for no match', () => {
      const block = makeParsedBlock({ name: 'Zyxwvutsrqp' });
      const result = matchPatternBlock(block, library);

      expect(result.confidence).toBe(0.0);
      expect(result.matchMethod).toBe('none');
      expect(result.matchedBlockId).toBeNull();
      expect(result.matchedBlockName).toBeNull();
      expect(result.needsCustomBlock).toBe(true);
    });
  });

  describe('matchAllBlocks', () => {
    const library: BlockLibraryEntry[] = [
      makeLibraryEntry({
        id: 'blk-1',
        name: 'Log Cabin',
        tags: ['log', 'cabin'],
      }),
      makeLibraryEntry({
        id: 'blk-2',
        name: 'Nine Patch',
        tags: ['nine', 'patch'],
      }),
    ];

    it('returns results in the same order as input', () => {
      const blocks: ParsedBlock[] = [
        makeParsedBlock({ name: 'Nine Patch' }),
        makeParsedBlock({ name: 'Log Cabin' }),
        makeParsedBlock({ name: 'Unknown Block' }),
      ];

      const results = matchAllBlocks(blocks, library);

      expect(results).toHaveLength(3);
      expect(results[0].patternBlockName).toBe('Nine Patch');
      expect(results[0].matchedBlockId).toBe('blk-2');
      expect(results[1].patternBlockName).toBe('Log Cabin');
      expect(results[1].matchedBlockId).toBe('blk-1');
      expect(results[2].patternBlockName).toBe('Unknown Block');
      expect(results[2].matchMethod).toBe('none');
    });

    it('handles empty array', () => {
      const results = matchAllBlocks([], library);
      expect(results).toEqual([]);
    });
  });

  describe('generateCustomBlockSvg', () => {
    it('returns a valid SVG string', () => {
      const svg = generateCustomBlockSvg('Test Block', 6, 6, 4);
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
      expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    });

    it('uses 100x100 viewBox', () => {
      const svg = generateCustomBlockSvg('Test Block', 6, 6, 4);
      expect(svg).toContain('viewBox="0 0 100 100"');
    });

    it('contains the block name as text content', () => {
      const svg = generateCustomBlockSvg('Rose Block', 6, 6, 9);
      expect(svg).toContain('Rose Block');
    });

    it('has stroke="#333" on grid elements', () => {
      const svg = generateCustomBlockSvg('Test Block', 6, 6, 4);
      expect(svg).toContain('stroke="#333"');
    });

    it('generates grid lines for multi-piece blocks', () => {
      const svg = generateCustomBlockSvg('Grid Test', 6, 6, 9);
      // 9 pieces = 3x3 grid, so 2 vertical + 2 horizontal internal lines
      expect(svg).toContain('<line');
    });

    it('truncates long names with ellipsis', () => {
      const longName = 'A Very Long Block Name That Exceeds Limits';
      const svg = generateCustomBlockSvg(longName, 6, 6, 4);
      // truncateForSvg keeps first 13 chars + ellipsis for names > 14
      expect(svg).toContain('\u2026');
      expect(svg).not.toContain(longName);
    });

    it('escapes XML special characters in block name', () => {
      const svg = generateCustomBlockSvg('A & B <Block>', 6, 6, 4);
      expect(svg).toContain('&amp;');
      expect(svg).toContain('&lt;');
    });
  });
});
