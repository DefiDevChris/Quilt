export type UserRole = 'free' | 'pro' | 'admin';

/**
 * Check if a user has admin access.
 * This is the canonical implementation to ensure consistency across all admin routes.
 */
export function isAdmin(role: UserRole | string | null): boolean {
  return role === 'admin';
}

/**
 * Check if a user has Pro access (either pro or admin role).
 * This is the canonical implementation to ensure consistency across the app.
 */
export function isPro(role: UserRole): boolean {
  return role === 'pro' || role === 'admin';
}
