import { describe, it, expect } from 'vitest';
import { getGeneratedBlocks } from '@/db/seed/block-generators';
import { getAllBlockDefinitions } from '@/db/seed/blockDefinitions';

describe('block-generators', () => {
  it('generates at least 400 blocks', () => {
    const blocks = getGeneratedBlocks();
    expect(blocks.length).toBeGreaterThanOrEqual(400);
  });

  it('every block has required fields', () => {
    const blocks = getGeneratedBlocks();
    for (const block of blocks) {
      expect(block.name).toBeTruthy();
      expect(block.name.length).toBeLessThanOrEqual(255);
      expect(block.category).toBeTruthy();
      expect(block.svgData).toBeTruthy();
      expect(Array.isArray(block.tags)).toBe(true);
    }
  });

  it('every block has valid SVG data', () => {
    const blocks = getGeneratedBlocks();
    for (const block of blocks) {
      expect(block.svgData).toContain('<svg');
      expect(block.svgData).toContain('viewBox="0 0 100 100"');
    }
  });

  it('has no duplicate names', () => {
    const blocks = getGeneratedBlocks();
    const names = new Set<string>();
    const duplicates: string[] = [];
    for (const block of blocks) {
      if (names.has(block.name)) {
        duplicates.push(block.name);
      }
      names.add(block.name);
    }
    expect(duplicates).toEqual([]);
  });

  it('includes multiple categories', () => {
    const blocks = getGeneratedBlocks();
    const categories = new Set(blocks.map((b) => b.category));
    expect(categories.size).toBeGreaterThanOrEqual(5);
  });

  it('each category has at least 10 blocks', () => {
    const blocks = getGeneratedBlocks();
    const categoryMap = new Map<string, number>();
    for (const block of blocks) {
      categoryMap.set(block.category, (categoryMap.get(block.category) ?? 0) + 1);
    }
    for (const [category, count] of categoryMap) {
      expect(count, `Category "${category}" has only ${count} blocks`).toBeGreaterThanOrEqual(10);
    }
  });
});

describe('getAllBlockDefinitions', () => {
  it('returns at least 600 total blocks (original + generated)', () => {
    const all = getAllBlockDefinitions();
    expect(all.length).toBeGreaterThanOrEqual(600);
  });

  it('includes both original and generated categories', () => {
    const all = getAllBlockDefinitions();
    const categories = new Set(all.map((b) => b.category));
    // Original categories
    expect(categories.has('Traditional')).toBe(true);
    expect(categories.has('Stars')).toBe(true);
    // Generated categories
    expect(categories.has('Pictorial')).toBe(true);
    expect(categories.has('Holiday')).toBe(true);
  });
});
