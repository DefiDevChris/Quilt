import { eq, and, count, gte } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users, comments, communityPosts, subscriptions } from '@/db/schema';
import {
  calculateTrustLevel,
  getTrustPermissions,
  getRateLimit,
  type TrustLevel,
  type TrustUserInput,
} from '@/lib/trust-engine';
import { errorResponse } from '@/lib/api-responses';

type RequiredPermission =
  | 'canLike'
  | 'canFollow'
  | 'canSave'
  | 'canComment'
  | 'canPost'
  | 'canModerate'
  | 'canReport';

interface TrustCheckResult {
  allowed: boolean;
  trustLevel: TrustLevel;
  userId: string;
  response?: Response;
}

const TRUST_LEVEL_DESCRIPTIONS: Record<TrustLevel, string> = {
  visitor: 'You must be logged in and verify your email to perform this action.',
  verified: 'Your account must be at least 24 hours old to perform this action.',
  commenter: 'You need 3 approved comments before you can create posts.',
  poster: 'You need 5 approved posts to skip the moderation queue.',
  trusted: 'This action requires a Pro subscription.',
  pro: 'This action requires admin privileges.',
  admin: '',
};

export async function buildTrustUserInput(userId: string): Promise<TrustUserInput | null> {
  const [user] = await db
    .select({
      id: users.id,
      role: users.role,
      emailVerified: users.emailVerified,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return null;

  const [[approvedCommentsRow], [approvedPostsRow], [activeSubRow]] = await Promise.all([
    db
      .select({ count: count() })
      .from(comments)
      .where(and(eq(comments.authorId, userId), eq(comments.status, 'visible'))),
    db
      .select({ count: count() })
      .from(communityPosts)
      .where(and(eq(communityPosts.userId, userId), eq(communityPosts.status, 'approved'))),
    db
      .select({ count: count() })
      .from(subscriptions)
      .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, 'active'))),
  ]);

  return {
    id: userId,
    role: user.role,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
    isSubscriptionActive: (activeSubRow?.count ?? 0) > 0,
    approvedCommentCount: approvedCommentsRow?.count ?? 0,
    approvedPostCount: approvedPostsRow?.count ?? 0,
  };
}

export async function checkTrustLevel(
  userId: string | null,
  requiredPermission: RequiredPermission
): Promise<TrustCheckResult> {
  if (!userId) {
    return {
      allowed: false,
      trustLevel: 'visitor',
      userId: '',
      response: errorResponse(TRUST_LEVEL_DESCRIPTIONS.visitor, 'TRUST_INSUFFICIENT', 403),
    };
  }

  const trustUser = await buildTrustUserInput(userId);
  if (!trustUser) {
    return {
      allowed: false,
      trustLevel: 'visitor',
      userId,
      response: errorResponse('User not found.', 'NOT_FOUND', 404),
    };
  }

  const trustLevel = calculateTrustLevel(trustUser);
  const permissions = getTrustPermissions(trustLevel);

  if (!permissions[requiredPermission]) {
    return {
      allowed: false,
      trustLevel,
      userId,
      response: errorResponse(TRUST_LEVEL_DESCRIPTIONS[trustLevel], 'TRUST_INSUFFICIENT', 403),
    };
  }

  return {
    allowed: true,
    trustLevel,
    userId,
  };
}

export async function checkRateLimit(
  userId: string,
  trustLevel: TrustLevel,
  action: 'comments' | 'posts' | 'follows' | 'reports'
): Promise<{ allowed: boolean; response?: Response }> {
  const limit = getRateLimit(trustLevel, action);
  if (limit === Infinity) return { allowed: true };

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  let currentCount = 0;

  if (action === 'comments') {
    const [row] = await db
      .select({ count: count() })
      .from(comments)
      .where(and(eq(comments.authorId, userId), gte(comments.createdAt, oneDayAgo)));
    currentCount = row?.count ?? 0;
  } else if (action === 'posts') {
    const [row] = await db
      .select({ count: count() })
      .from(communityPosts)
      .where(and(eq(communityPosts.userId, userId), gte(communityPosts.createdAt, oneDayAgo)));
    currentCount = row?.count ?? 0;
  } else if (action === 'reports') {
    const { reports } = await import('@/db/schema');
    const [row] = await db
      .select({ count: count() })
      .from(reports)
      .where(and(eq(reports.reporterId, userId), gte(reports.createdAt, oneDayAgo)));
    currentCount = row?.count ?? 0;
  }

  if (currentCount >= limit) {
    return {
      allowed: false,
      response: errorResponse(
        `Rate limit exceeded. You can make ${limit} ${action} per 24 hours.`,
        'RATE_LIMITED',
        429
      ),
    };
  }

  return { allowed: true };
}
