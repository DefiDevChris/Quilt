import { describe, it, expect } from 'vitest';
import {
  notificationQuerySchema,
  markNotificationsReadSchema,
} from '@/lib/validation';

describe('notificationQuerySchema', () => {
  it('provides defaults when no params given', () => {
    const result = notificationQuerySchema.parse({});
    expect(result.unreadOnly).toBe(false);
    expect(result.limit).toBe(20);
  });

  it('transforms unreadOnly "true" string to boolean true', () => {
    const result = notificationQuerySchema.parse({ unreadOnly: 'true' });
    expect(result.unreadOnly).toBe(true);
  });

  it('transforms unreadOnly "false" string to boolean false', () => {
    const result = notificationQuerySchema.parse({ unreadOnly: 'false' });
    expect(result.unreadOnly).toBe(false);
  });

  it('transforms undefined unreadOnly to false', () => {
    const result = notificationQuerySchema.parse({});
    expect(result.unreadOnly).toBe(false);
  });

  it('transforms arbitrary string unreadOnly to false', () => {
    const result = notificationQuerySchema.parse({ unreadOnly: 'yes' });
    expect(result.unreadOnly).toBe(false);
  });

  it('coerces string limit to number', () => {
    const result = notificationQuerySchema.parse({ limit: '10' });
    expect(result.limit).toBe(10);
  });

  it('accepts limit of 1', () => {
    const result = notificationQuerySchema.parse({ limit: 1 });
    expect(result.limit).toBe(1);
  });

  it('accepts limit of 50', () => {
    const result = notificationQuerySchema.parse({ limit: 50 });
    expect(result.limit).toBe(50);
  });

  it('rejects limit below 1', () => {
    const result = notificationQuerySchema.safeParse({ limit: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects limit above 50', () => {
    const result = notificationQuerySchema.safeParse({ limit: 51 });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer limit', () => {
    const result = notificationQuerySchema.safeParse({ limit: 10.5 });
    expect(result.success).toBe(false);
  });
});

describe('markNotificationsReadSchema', () => {
  it('accepts "all" as notificationIds', () => {
    const result = markNotificationsReadSchema.parse({
      notificationIds: 'all',
    });
    expect(result.notificationIds).toBe('all');
  });

  it('accepts an array of UUIDs as notificationIds', () => {
    const ids = [
      '550e8400-e29b-41d4-a716-446655440000',
      '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    ];
    const result = markNotificationsReadSchema.parse({
      notificationIds: ids,
    });
    expect(result.notificationIds).toEqual(ids);
  });

  it('accepts an empty array of notificationIds', () => {
    const result = markNotificationsReadSchema.parse({
      notificationIds: [],
    });
    expect(result.notificationIds).toEqual([]);
  });

  it('rejects non-uuid strings in array', () => {
    const result = markNotificationsReadSchema.safeParse({
      notificationIds: ['not-a-uuid'],
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing notificationIds', () => {
    const result = markNotificationsReadSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects numeric notificationIds', () => {
    const result = markNotificationsReadSchema.safeParse({
      notificationIds: 123,
    });
    expect(result.success).toBe(false);
  });

  it('rejects object notificationIds', () => {
    const result = markNotificationsReadSchema.safeParse({
      notificationIds: { id: '550e8400-e29b-41d4-a716-446655440000' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-"all" string for literal', () => {
    const result = markNotificationsReadSchema.safeParse({
      notificationIds: 'none',
    });
    expect(result.success).toBe(false);
  });

  it('accepts single UUID in array', () => {
    const result = markNotificationsReadSchema.parse({
      notificationIds: ['550e8400-e29b-41d4-a716-446655440000'],
    });
    expect(result.notificationIds).toHaveLength(1);
  });
});
