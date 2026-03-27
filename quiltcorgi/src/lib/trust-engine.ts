import {
  TRUST_ACCOUNT_AGE_HOURS,
  TRUST_COMMENTER_APPROVED_COMMENTS,
  TRUST_POSTER_APPROVED_POSTS,
  TRUST_MOD_QUEUE_COMMENTS,
  TRUST_MOD_QUEUE_POSTS,
  RATE_LIMITS,
} from '@/lib/constants';

export type TrustLevel =
  | 'visitor'
  | 'verified'
  | 'commenter'
  | 'poster'
  | 'trusted'
  | 'pro'
  | 'admin';

export interface TrustUserInput {
  id: string;
  role: 'free' | 'pro' | 'admin';
  emailVerified: Date | null;
  createdAt: Date;
  isSubscriptionActive: boolean;
  approvedCommentCount: number;
  approvedPostCount: number;
}

export interface TrustPermissions {
  canLike: boolean;
  canFollow: boolean;
  canSave: boolean;
  canComment: boolean;
  canPost: boolean;
  canModerate: boolean;
  canReport: boolean;
}

type RateLimitAction = 'comments' | 'posts' | 'follows' | 'reports';

const TRUST_HIERARCHY: readonly TrustLevel[] = [
  'visitor',
  'verified',
  'commenter',
  'poster',
  'trusted',
  'pro',
  'admin',
] as const;

function trustRank(level: TrustLevel): number {
  return TRUST_HIERARCHY.indexOf(level);
}

function isAccountOldEnough(createdAt: Date): boolean {
  const ageMs = Date.now() - createdAt.getTime();
  const ageHours = ageMs / (1000 * 60 * 60);
  return ageHours >= TRUST_ACCOUNT_AGE_HOURS;
}

export function calculateTrustLevel(user: TrustUserInput | null): TrustLevel {
  if (!user) return 'visitor';

  if (user.role === 'admin') return 'admin';

  if (user.role === 'pro' && user.isSubscriptionActive) return 'pro';

  if (!user.emailVerified) return 'visitor';

  if (!isAccountOldEnough(user.createdAt)) return 'verified';

  if (user.approvedPostCount >= TRUST_POSTER_APPROVED_POSTS) return 'trusted';

  if (user.approvedCommentCount >= TRUST_COMMENTER_APPROVED_COMMENTS) return 'poster';

  return 'commenter';
}

export function getTrustPermissions(level: TrustLevel): TrustPermissions {
  const rank = trustRank(level);

  return {
    canLike: rank >= trustRank('verified'),
    canFollow: rank >= trustRank('verified'),
    canSave: rank >= trustRank('verified'),
    canComment: rank >= trustRank('commenter'),
    canPost: rank >= trustRank('poster'),
    canModerate: level === 'admin',
    canReport: rank >= trustRank('verified'),
  };
}

export function getRateLimit(level: TrustLevel, action: RateLimitAction): number {
  if (action === 'reports') return RATE_LIMITS.reports.all;

  if (level === 'admin') return Infinity;

  const tier = level === 'pro' ? 'pro' : 'free';
  const limits = RATE_LIMITS[action];

  return limits[tier];
}

export function shouldModerateContent(
  level: TrustLevel,
  contentType: 'comment' | 'post',
  approvedCount: number
): boolean {
  if (trustRank(level) >= trustRank('trusted')) return false;

  if (contentType === 'comment') {
    return approvedCount < TRUST_MOD_QUEUE_COMMENTS;
  }

  return approvedCount < TRUST_MOD_QUEUE_POSTS;
}
