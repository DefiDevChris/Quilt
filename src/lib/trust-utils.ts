import type { UserRole } from './role-utils';
export type { UserRole };

export function isAdmin(role: UserRole | string | null): boolean {
  return role === 'admin';
}

export interface RolePermissions {
  canLike: boolean;
  canComment: boolean;
  canPost: boolean;
  canModerate: boolean;
}

export function getRolePermissions(role: UserRole | null): RolePermissions {
  if (!role) {
    return { canLike: false, canComment: false, canPost: false, canModerate: false };
  }

  switch (role) {
    case 'admin':
      return { canLike: true, canComment: true, canPost: true, canModerate: true };
    case 'pro':
      return { canLike: true, canComment: true, canPost: true, canModerate: false };
    case 'free':
    default:
      return { canLike: true, canComment: true, canPost: false, canModerate: false };
  }
}

type RateLimitAction = 'comments' | 'posts';

export function getRateLimit(role: UserRole, action: RateLimitAction): number {
  if (role === 'admin') return Infinity;
  if (role === 'pro') return action === 'comments' ? 100 : 20;
  return action === 'comments' ? 20 : 3;
}
