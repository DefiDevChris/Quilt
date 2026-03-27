import { describe, it, expect } from 'vitest';
import { blockSearchSchema } from '@/lib/validation';

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
