export type UserRole = 'free' | 'pro' | 'admin';

/**
 * Check if a user has Pro access (either pro or admin role).
 * This is the canonical implementation to ensure consistency across the app.
 */
export function isPro(role: UserRole): boolean {
  return role === 'pro' || role === 'admin';
}

/**
 * Check if a user has admin access.
 */
export function isAdmin(role: UserRole): boolean {
  return role === 'admin';
}
