import { describe, it, expect } from 'vitest';
import { generateSlug, appendSlugSuffix } from '@/lib/blog-slug';

describe('generateSlug', () => {
  it('converts to lowercase', () => {
    expect(generateSlug('Hello World')).toBe('hello-world');
  });

  it('replaces spaces with hyphens', () => {
    expect(generateSlug('my blog post')).toBe('my-blog-post');
  });

  it('removes special characters', () => {
    expect(generateSlug('Hello, World! How are you?')).toBe('hello-world-how-are-you');
  });

  it('collapses multiple hyphens', () => {
    expect(generateSlug('hello   --  world')).toBe('hello-world');
  });

  it('strips leading and trailing hyphens', () => {
    expect(generateSlug('  -hello world-  ')).toBe('hello-world');
  });

  it('handles empty string', () => {
    expect(generateSlug('')).toBe('');
  });

  it('handles string with only special characters', () => {
    expect(generateSlug('!!!@@@###')).toBe('');
  });

  it('truncates to max 200 characters', () => {
    const longTitle = 'a'.repeat(250);
    const slug = generateSlug(longTitle);
    expect(slug.length).toBeLessThanOrEqual(200);
  });

  it('preserves numbers', () => {
    expect(generateSlug('Top 10 Quilts of 2026')).toBe('top-10-quilts-of-2026');
  });

  it('handles unicode characters by removing them', () => {
    expect(generateSlug('Caf\u00e9 Quilt Design')).toBe('caf-quilt-design');
  });
});

describe('appendSlugSuffix', () => {
  it('appends a 4-character suffix after a hyphen', () => {
    const result = appendSlugSuffix('hello-world');
    expect(result).toMatch(/^hello-world-[a-z0-9]{4}$/);
  });

  it('produces different suffixes on subsequent calls', () => {
    const results = new Set<string>();
    for (let i = 0; i < 20; i++) {
      results.add(appendSlugSuffix('test'));
    }
    expect(results.size).toBeGreaterThan(1);
  });

  it('truncates base to 195 chars before appending suffix', () => {
    const longSlug = 'a'.repeat(200);
    const result = appendSlugSuffix(longSlug);
    // 195 base + 1 hyphen + 4 suffix = 200
    expect(result.length).toBe(200);
  });
});
