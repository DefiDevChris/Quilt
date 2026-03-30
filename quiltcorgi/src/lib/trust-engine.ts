export type UserRole = 'free' | 'pro' | 'admin';

export interface RolePermissions {
  canLike: boolean;
  canSave: boolean;
  canComment: boolean;
  canPost: boolean;
  canModerate: boolean;
}

export function getRolePermissions(role: UserRole | null): RolePermissions {
  if (!role) {
    return { canLike: false, canSave: false, canComment: false, canPost: false, canModerate: false };
  }

  switch (role) {
    case 'admin':
      return { canLike: true, canSave: true, canComment: true, canPost: true, canModerate: true };
    case 'pro':
      return { canLike: true, canSave: true, canComment: true, canPost: true, canModerate: false };
    case 'free':
    default:
      return { canLike: true, canSave: true, canComment: true, canPost: false, canModerate: false };
  }
}

type RateLimitAction = 'comments' | 'posts';

export function getRateLimit(role: UserRole, action: RateLimitAction): number {
  if (role === 'admin') return Infinity;
  if (role === 'pro') return action === 'comments' ? 100 : 20;
  return action === 'comments' ? 20 : 3;
}
