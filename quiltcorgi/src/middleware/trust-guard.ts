import { eq, and, count, gte } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users, comments, communityPosts } from '@/db/schema';
import {
  getRolePermissions,
  getRateLimit,
  type UserRole,
} from '@/lib/trust-engine';
import { errorResponse } from '@/lib/api-responses';

type RequiredPermission =
  | 'canLike'
  | 'canSave'
  | 'canComment'
  | 'canPost'
  | 'canModerate';

interface TrustCheckResult {
  allowed: boolean;
  role: UserRole;
  userId: string;
  response?: Response;
}

const PERMISSION_MESSAGES: Record<RequiredPermission, string> = {
  canLike: 'You must be logged in to like content.',
  canSave: 'You must be logged in to save content.',
  canComment: 'You must be logged in to comment.',
  canPost: 'A Pro subscription is required to create community posts.',
  canModerate: 'This action requires admin privileges.',
};

export async function checkTrustLevel(
  userId: string | null,
  requiredPermission: RequiredPermission
): Promise<TrustCheckResult> {
  if (!userId) {
    return {
      allowed: false,
      role: 'free',
      userId: '',
      response: errorResponse('You must be logged in to perform this action.', 'TRUST_INSUFFICIENT', 403),
    };
  }

  const [user] = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return {
      allowed: false,
      role: 'free',
      userId,
      response: errorResponse('User not found.', 'NOT_FOUND', 404),
    };
  }

  const role = user.role;
  const permissions = getRolePermissions(role);

  if (!permissions[requiredPermission]) {
    return {
      allowed: false,
      role,
      userId,
      response: errorResponse(PERMISSION_MESSAGES[requiredPermission], 'TRUST_INSUFFICIENT', 403),
    };
  }

  return {
    allowed: true,
    role,
    userId,
  };
}

export async function checkRateLimit(
  userId: string,
  role: UserRole,
  action: 'comments' | 'posts'
): Promise<{ allowed: boolean; response?: Response }> {
  const limit = getRateLimit(role, action);
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
