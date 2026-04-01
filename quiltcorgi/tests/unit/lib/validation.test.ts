import { describe, it, expect } from 'vitest';
import { createProjectSchema, updateProjectSchema, paginationSchema, notificationQuerySchema, updateProfileSchema } from '@/lib/validation';

describe('createProjectSchema', () => {
  it('accepts valid input with defaults', () => {
    const result = createProjectSchema.parse({});
    expect(result).toEqual({
      name: 'Untitled Quilt',
      unitSystem: 'imperial',
      canvasWidth: 48,
      canvasHeight: 48,
      gridSettings: { enabled: true, size: 1, snapToGrid: true },
    });
  });

  it('accepts custom values', () => {
    const result = createProjectSchema.parse({
      name: 'My Quilt',
      unitSystem: 'metric',
      canvasWidth: 100,
      canvasHeight: 80,
      gridSettings: { enabled: false, size: 2, snapToGrid: false },
    });
    expect(result.name).toBe('My Quilt');
    expect(result.unitSystem).toBe('metric');
    expect(result.canvasWidth).toBe(100);
    expect(result.canvasHeight).toBe(80);
    expect(result.gridSettings.enabled).toBe(false);
  });

  it('rejects canvas width below minimum', () => {
    const result = createProjectSchema.safeParse({ canvasWidth: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects canvas width above maximum', () => {
    const result = createProjectSchema.safeParse({ canvasWidth: 201 });
    expect(result.success).toBe(false);
  });

  it('rejects invalid unit system', () => {
    const result = createProjectSchema.safeParse({ unitSystem: 'metric2' });
    expect(result.success).toBe(false);
  });

  it('rejects name exceeding max length', () => {
    const result = createProjectSchema.safeParse({ name: 'a'.repeat(256) });
    expect(result.success).toBe(false);
  });

  it('rejects empty name', () => {
    const result = createProjectSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });
});

describe('updateProjectSchema', () => {
  it('accepts empty update (all optional)', () => {
    const result = updateProjectSchema.parse({});
    expect(result).toEqual({});
  });

  it('accepts partial update with name only', () => {
    const result = updateProjectSchema.parse({ name: 'New Name' });
    expect(result.name).toBe('New Name');
  });

  it('accepts canvasData as record', () => {
    const result = updateProjectSchema.parse({
      canvasData: { objects: [], version: '6.0' },
    });
    expect(result.canvasData).toBeDefined();
  });

  it('rejects invalid thumbnailUrl', () => {
    const result = updateProjectSchema.safeParse({ thumbnailUrl: 'not-a-url' });
    expect(result.success).toBe(false);
  });
});

describe('paginationSchema', () => {
  it('provides defaults', () => {
    const result = paginationSchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.order).toBe('desc');
  });

  it('coerces string numbers', () => {
    const result = paginationSchema.parse({ page: '3', limit: '10' });
    expect(result.page).toBe(3);
    expect(result.limit).toBe(10);
  });

  it('rejects page below 1', () => {
    const result = paginationSchema.safeParse({ page: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects limit above max', () => {
    const result = paginationSchema.safeParse({ limit: 51 });
    expect(result.success).toBe(false);
  });
});

describe('notificationQuerySchema', () => {
  it('transforms string "true" to boolean true', () => {
    const result = notificationQuerySchema.parse({ unreadOnly: 'true' });
    expect(result.unreadOnly).toBe(true);
  });

  it('transforms undefined unreadOnly to false', () => {
    const result = notificationQuerySchema.parse({});
    expect(result.unreadOnly).toBe(false);
  });

  it('provides default limit', () => {
    const result = notificationQuerySchema.parse({});
    expect(result.limit).toBe(20);
  });

  it('accepts valid limit', () => {
    const result = notificationQuerySchema.parse({ limit: 10 });
    expect(result.limit).toBe(10);
  });

  it('rejects limit below minimum', () => {
    const result = notificationQuerySchema.safeParse({ limit: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects limit above maximum', () => {
    const result = notificationQuerySchema.safeParse({ limit: 51 });
    expect(result.success).toBe(false);
  });
});

describe('updateProfileSchema', () => {
  it('accepts valid websiteUrl with https', () => {
    const result = updateProfileSchema.safeParse({
      displayName: 'Test User',
      websiteUrl: 'https://example.com'
    });
    expect(result.success).toBe(true);
  });

  it('rejects websiteUrl without https', () => {
    const result = updateProfileSchema.safeParse({
      displayName: 'Test User',
      websiteUrl: 'http://example.com'
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('Website URL must use https.');
  });

  it('rejects invalid websiteUrl', () => {
    const result = updateProfileSchema.safeParse({
      displayName: 'Test User',
      websiteUrl: 'not-a-url'
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('Website URL must use https.');
  });

  it('accepts undefined websiteUrl', () => {
    const result = updateProfileSchema.safeParse({
      displayName: 'Test User'
    });
    expect(result.success).toBe(true);
  });

  it('accepts valid username', () => {
    const result = updateProfileSchema.safeParse({
      displayName: 'Test User',
      username: 'testuser123'
    });
    expect(result.success).toBe(true);
  });

  it('rejects username too short', () => {
    const result = updateProfileSchema.safeParse({
      displayName: 'Test User',
      username: 'ab'
    });
    expect(result.success).toBe(false);
  });

  it('rejects username with uppercase', () => {
    const result = updateProfileSchema.safeParse({
      displayName: 'Test User',
      username: 'TestUser'
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('Username must be lowercase alphanumeric with hyphens only');
  });

  it('rejects username with invalid characters', () => {
    const result = updateProfileSchema.safeParse({
      displayName: 'Test User',
      username: 'test_user'
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('Username must be lowercase alphanumeric with hyphens only');
  });

  it('accepts username with hyphens', () => {
    const result = updateProfileSchema.safeParse({
      displayName: 'Test User',
      username: 'test-user'
    });
    expect(result.success).toBe(true);
  });
});
