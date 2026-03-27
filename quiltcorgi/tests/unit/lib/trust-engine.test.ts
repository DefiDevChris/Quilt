import { describe, it, expect } from 'vitest';
import {
  calculateTrustLevel,
  getTrustPermissions,
  getRateLimit,
  shouldModerateContent,
  type TrustLevel,
  type TrustUserInput,
} from '@/lib/trust-engine';

function makeUser(overrides: Partial<TrustUserInput> = {}): TrustUserInput {
  return {
    id: 'user-1',
    role: 'free',
    emailVerified: new Date('2025-01-01'),
    createdAt: new Date('2025-01-01'),
    isSubscriptionActive: false,
    approvedCommentCount: 0,
    approvedPostCount: 0,
    ...overrides,
  };
}

describe('calculateTrustLevel', () => {
  it('returns "visitor" when user is null', () => {
    expect(calculateTrustLevel(null)).toBe('visitor');
  });

  it('returns "admin" when role is admin', () => {
    const user = makeUser({ role: 'admin' });
    expect(calculateTrustLevel(user)).toBe('admin');
  });

  it('returns "pro" when subscription is active', () => {
    const user = makeUser({ isSubscriptionActive: true, role: 'pro' });
    expect(calculateTrustLevel(user)).toBe('pro');
  });

  it('returns "verified" when email is verified but account is < 24 hours old', () => {
    const user = makeUser({
      emailVerified: new Date(),
      createdAt: new Date(), // just created
    });
    expect(calculateTrustLevel(user)).toBe('verified');
  });

  it('returns "visitor" when email is not verified', () => {
    const user = makeUser({ emailVerified: null });
    expect(calculateTrustLevel(user)).toBe('visitor');
  });

  it('returns "commenter" when account is 24+ hours old with 0 approved comments', () => {
    const dayAgo = new Date(Date.now() - 25 * 60 * 60 * 1000);
    const user = makeUser({
      createdAt: dayAgo,
      approvedCommentCount: 0,
    });
    expect(calculateTrustLevel(user)).toBe('commenter');
  });

  it('returns "poster" when user has 3+ approved comments', () => {
    const dayAgo = new Date(Date.now() - 25 * 60 * 60 * 1000);
    const user = makeUser({
      createdAt: dayAgo,
      approvedCommentCount: 3,
    });
    expect(calculateTrustLevel(user)).toBe('poster');
  });

  it('returns "trusted" when user has 5+ approved posts', () => {
    const dayAgo = new Date(Date.now() - 25 * 60 * 60 * 1000);
    const user = makeUser({
      createdAt: dayAgo,
      approvedCommentCount: 10,
      approvedPostCount: 5,
    });
    expect(calculateTrustLevel(user)).toBe('trusted');
  });

  it('pro takes precedence over trusted', () => {
    const dayAgo = new Date(Date.now() - 25 * 60 * 60 * 1000);
    const user = makeUser({
      role: 'pro',
      isSubscriptionActive: true,
      createdAt: dayAgo,
      approvedCommentCount: 100,
      approvedPostCount: 50,
    });
    expect(calculateTrustLevel(user)).toBe('pro');
  });

  it('admin takes precedence over everything', () => {
    const user = makeUser({
      role: 'admin',
      isSubscriptionActive: true,
      approvedCommentCount: 100,
      approvedPostCount: 50,
    });
    expect(calculateTrustLevel(user)).toBe('admin');
  });
});

describe('getTrustPermissions', () => {
  it('visitor can only browse', () => {
    const perms = getTrustPermissions('visitor');
    expect(perms.canLike).toBe(false);
    expect(perms.canFollow).toBe(false);
    expect(perms.canComment).toBe(false);
    expect(perms.canPost).toBe(false);
    expect(perms.canModerate).toBe(false);
  });

  it('verified can like, follow, save but not comment', () => {
    const perms = getTrustPermissions('verified');
    expect(perms.canLike).toBe(true);
    expect(perms.canFollow).toBe(true);
    expect(perms.canSave).toBe(true);
    expect(perms.canComment).toBe(false);
    expect(perms.canPost).toBe(false);
  });

  it('commenter can comment but not post', () => {
    const perms = getTrustPermissions('commenter');
    expect(perms.canComment).toBe(true);
    expect(perms.canPost).toBe(false);
  });

  it('poster can post and comment', () => {
    const perms = getTrustPermissions('poster');
    expect(perms.canComment).toBe(true);
    expect(perms.canPost).toBe(true);
  });

  it('admin can moderate', () => {
    const perms = getTrustPermissions('admin');
    expect(perms.canModerate).toBe(true);
    expect(perms.canPost).toBe(true);
    expect(perms.canComment).toBe(true);
  });
});

describe('getRateLimit', () => {
  it('returns free rate limits for free trust levels', () => {
    expect(getRateLimit('commenter', 'comments')).toBe(20);
    expect(getRateLimit('poster', 'posts')).toBe(3);
    expect(getRateLimit('verified', 'follows')).toBe(50);
  });

  it('returns pro rate limits for pro', () => {
    expect(getRateLimit('pro', 'comments')).toBe(100);
    expect(getRateLimit('pro', 'posts')).toBe(20);
    expect(getRateLimit('pro', 'follows')).toBe(200);
  });

  it('returns Infinity for admin', () => {
    expect(getRateLimit('admin', 'comments')).toBe(Infinity);
    expect(getRateLimit('admin', 'posts')).toBe(Infinity);
    expect(getRateLimit('admin', 'follows')).toBe(Infinity);
  });

  it('returns 10 reports for all levels', () => {
    expect(getRateLimit('verified', 'reports')).toBe(10);
    expect(getRateLimit('pro', 'reports')).toBe(10);
    expect(getRateLimit('admin', 'reports')).toBe(10);
  });
});

describe('shouldModerateContent', () => {
  it('returns true for commenter with fewer than 3 approved comments posting a comment', () => {
    expect(shouldModerateContent('commenter', 'comment', 2)).toBe(true);
  });

  it('returns false for commenter with 3+ approved comments posting a comment', () => {
    expect(shouldModerateContent('commenter', 'comment', 3)).toBe(false);
  });

  it('returns true for poster with fewer than 2 approved posts posting', () => {
    expect(shouldModerateContent('poster', 'post', 1)).toBe(true);
  });

  it('returns false for poster with 2+ approved posts posting', () => {
    expect(shouldModerateContent('poster', 'post', 2)).toBe(false);
  });

  it('returns false for trusted level', () => {
    expect(shouldModerateContent('trusted', 'post', 0)).toBe(false);
    expect(shouldModerateContent('trusted', 'comment', 0)).toBe(false);
  });

  it('returns false for pro level', () => {
    expect(shouldModerateContent('pro', 'post', 0)).toBe(false);
  });

  it('returns false for admin level', () => {
    expect(shouldModerateContent('admin', 'comment', 0)).toBe(false);
  });
});
