import { describe, it, expect } from 'vitest';
import { communitySearchSchema, createCommunityPostExtendedSchema } from '@/lib/validation';

describe('communitySearchSchema', () => {
  it('provides defaults when no params given', () => {
    const result = communitySearchSchema.parse({});
    expect(result.sort).toBe('newest');
    expect(result.page).toBe(1);
    expect(result.limit).toBe(24);
    expect(result.search).toBeUndefined();
  });

  it('accepts valid sort values', () => {
    expect(communitySearchSchema.parse({ sort: 'newest' }).sort).toBe('newest');
    expect(communitySearchSchema.parse({ sort: 'popular' }).sort).toBe('popular');
  });

  it('rejects invalid sort value', () => {
    const result = communitySearchSchema.safeParse({ sort: 'oldest' });
    expect(result.success).toBe(false);
  });

  it('coerces string page and limit to numbers', () => {
    const result = communitySearchSchema.parse({ page: '3', limit: '12' });
    expect(result.page).toBe(3);
    expect(result.limit).toBe(12);
  });

  it('rejects page below 1', () => {
    const result = communitySearchSchema.safeParse({ page: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects limit above 48', () => {
    const result = communitySearchSchema.safeParse({ limit: 49 });
    expect(result.success).toBe(false);
  });

  it('rejects limit below 1', () => {
    const result = communitySearchSchema.safeParse({ limit: 0 });
    expect(result.success).toBe(false);
  });

  it('accepts search string', () => {
    const result = communitySearchSchema.parse({ search: 'star quilt' });
    expect(result.search).toBe('star quilt');
  });
});

describe('createCommunityPostExtendedSchema', () => {
  it('parses valid input', () => {
    const result = createCommunityPostExtendedSchema.parse({
      projectId: '550e8400-e29b-41d4-a716-446655440000',
      title: 'My Beautiful Quilt',
      description: 'A lovely star quilt design.',
    });
    expect(result.projectId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.title).toBe('My Beautiful Quilt');
    expect(result.description).toBe('A lovely star quilt design.');
  });

  it('accepts input without optional description', () => {
    const result = createCommunityPostExtendedSchema.parse({
      projectId: '550e8400-e29b-41d4-a716-446655440000',
      title: 'My Quilt',
    });
    expect(result.description).toBeUndefined();
  });

  it('rejects missing projectId', () => {
    const result = createCommunityPostExtendedSchema.safeParse({
      title: 'My Quilt',
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-uuid projectId', () => {
    const result = createCommunityPostExtendedSchema.safeParse({
      projectId: 'not-a-uuid',
      title: 'My Quilt',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty title', () => {
    const result = createCommunityPostExtendedSchema.safeParse({
      projectId: '550e8400-e29b-41d4-a716-446655440000',
      title: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects title exceeding 100 characters', () => {
    const result = createCommunityPostExtendedSchema.safeParse({
      projectId: '550e8400-e29b-41d4-a716-446655440000',
      title: 'a'.repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it('accepts title at exactly 100 characters', () => {
    const result = createCommunityPostExtendedSchema.safeParse({
      projectId: '550e8400-e29b-41d4-a716-446655440000',
      title: 'a'.repeat(100),
    });
    expect(result.success).toBe(true);
  });

  it('rejects description exceeding 2000 characters', () => {
    const result = createCommunityPostExtendedSchema.safeParse({
      projectId: '550e8400-e29b-41d4-a716-446655440000',
      title: 'My Quilt',
      description: 'a'.repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it('accepts description at exactly 2000 characters', () => {
    const result = createCommunityPostExtendedSchema.safeParse({
      projectId: '550e8400-e29b-41d4-a716-446655440000',
      title: 'My Quilt',
      description: 'a'.repeat(2000),
    });
    expect(result.success).toBe(true);
  });
});
