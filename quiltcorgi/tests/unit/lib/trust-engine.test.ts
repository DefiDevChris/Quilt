import { describe, it, expect } from 'vitest';
import {
  getRolePermissions,
  getRateLimit,
  type UserRole,
} from '@/lib/trust-engine';

describe('getRolePermissions', () => {
  it('returns all false when role is null', () => {
    const perms = getRolePermissions(null);
    expect(perms.canLike).toBe(false);
    expect(perms.canSave).toBe(false);
    expect(perms.canComment).toBe(false);
    expect(perms.canPost).toBe(false);
    expect(perms.canModerate).toBe(false);
  });

  it('free users can like, save, and comment but not post or moderate', () => {
    const perms = getRolePermissions('free');
    expect(perms.canLike).toBe(true);
    expect(perms.canSave).toBe(true);
    expect(perms.canComment).toBe(true);
    expect(perms.canPost).toBe(false);
    expect(perms.canModerate).toBe(false);
  });

  it('pro users can like, save, comment, and post but not moderate', () => {
    const perms = getRolePermissions('pro');
    expect(perms.canLike).toBe(true);
    expect(perms.canSave).toBe(true);
    expect(perms.canComment).toBe(true);
    expect(perms.canPost).toBe(true);
    expect(perms.canModerate).toBe(false);
  });

  it('admin users can do everything', () => {
    const perms = getRolePermissions('admin');
    expect(perms.canLike).toBe(true);
    expect(perms.canSave).toBe(true);
    expect(perms.canComment).toBe(true);
    expect(perms.canPost).toBe(true);
    expect(perms.canModerate).toBe(true);
  });
});

describe('getRateLimit', () => {
  it('returns correct free rate limits for comments', () => {
    expect(getRateLimit('free', 'comments')).toBe(20);
  });

  it('returns correct free rate limits for posts', () => {
    expect(getRateLimit('free', 'posts')).toBe(3);
  });

  it('returns correct pro rate limits for comments', () => {
    expect(getRateLimit('pro', 'comments')).toBe(100);
  });

  it('returns correct pro rate limits for posts', () => {
    expect(getRateLimit('pro', 'posts')).toBe(20);
  });

  it('returns Infinity for admin comments', () => {
    expect(getRateLimit('admin', 'comments')).toBe(Infinity);
  });

  it('returns Infinity for admin posts', () => {
    expect(getRateLimit('admin', 'posts')).toBe(Infinity);
  });
});
