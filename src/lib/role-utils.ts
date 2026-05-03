export type UserRole = 'free' | 'admin';

/**
 * Check if a user has admin access.
 * This is the canonical implementation to ensure consistency across all admin routes.
 */
export function isAdmin(role: UserRole | string | null): boolean {
  return role === 'admin';
}

