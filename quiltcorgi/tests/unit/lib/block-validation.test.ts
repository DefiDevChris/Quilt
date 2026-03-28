import { describe, it, expect } from 'vitest';
import { blockSearchSchema, createBlockSchema } from '@/lib/validation';

describe('blockSearchSchema', () => {
  it('provides defaults', () => {
    const result = blockSearchSchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(50);
    expect(result.scope).toBe('system');
    expect(result.search).toBeUndefined();
    expect(result.category).toBeUndefined();
  });

  it('accepts search string', () => {
    const result = blockSearchSchema.parse({ search: 'star' });
    expect(result.search).toBe('star');
  });

  it('accepts category filter', () => {
    const result = blockSearchSchema.parse({ category: 'Traditional' });
    expect(result.category).toBe('Traditional');
  });

  it('accepts valid scope values', () => {
    expect(blockSearchSchema.parse({ scope: 'system' }).scope).toBe('system');
    expect(blockSearchSchema.parse({ scope: 'user' }).scope).toBe('user');
    expect(blockSearchSchema.parse({ scope: 'all' }).scope).toBe('all');
  });

  it('rejects invalid scope', () => {
    const result = blockSearchSchema.safeParse({ scope: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('coerces string numbers for page and limit', () => {
    const result = blockSearchSchema.parse({ page: '2', limit: '25' });
    expect(result.page).toBe(2);
    expect(result.limit).toBe(25);
  });

  it('rejects page below 1', () => {
    const result = blockSearchSchema.safeParse({ page: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects limit above max (100)', () => {
    const result = blockSearchSchema.safeParse({ limit: 101 });
    expect(result.success).toBe(false);
  });

  it('accepts limit at max (100)', () => {
    const result = blockSearchSchema.parse({ limit: 100 });
    expect(result.limit).toBe(100);
  });
});

describe('createBlockSchema', () => {
  it('validates a valid custom block', () => {
    const result = createBlockSchema.safeParse({
      name: 'My Block',
      category: 'Custom',
      svgData: '<svg></svg>',
      fabricJsData: { type: 'Group', objects: [] },
      tags: ['custom', 'modern'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing name', () => {
    const result = createBlockSchema.safeParse({
      name: '',
      category: 'Custom',
      svgData: '<svg></svg>',
      fabricJsData: { type: 'Group' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing category', () => {
    const result = createBlockSchema.safeParse({
      name: 'My Block',
      category: '',
      svgData: '<svg></svg>',
      fabricJsData: { type: 'Group' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing svgData', () => {
    const result = createBlockSchema.safeParse({
      name: 'My Block',
      category: 'Custom',
      svgData: '',
      fabricJsData: { type: 'Group' },
    });
    expect(result.success).toBe(false);
  });

  it('defaults tags to empty array', () => {
    const result = createBlockSchema.safeParse({
      name: 'My Block',
      category: 'Custom',
      svgData: '<svg></svg>',
      fabricJsData: { type: 'Group' },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tags).toEqual([]);
    }
  });

  it('rejects name over 255 chars', () => {
    const result = createBlockSchema.safeParse({
      name: 'A'.repeat(256),
      category: 'Custom',
      svgData: '<svg></svg>',
      fabricJsData: { type: 'Group' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects category over 100 chars', () => {
    const result = createBlockSchema.safeParse({
      name: 'My Block',
      category: 'C'.repeat(101),
      svgData: '<svg></svg>',
      fabricJsData: { type: 'Group' },
    });
    expect(result.success).toBe(false);
  });
});
