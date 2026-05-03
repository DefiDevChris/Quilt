import { getSession } from '@/lib/cognito-session';
import { unauthorizedResponse, forbiddenResponse } from '@/lib/api-responses';

type UserRole = 'free' | 'admin';

function isAdmin(role: UserRole | string | null): boolean {
  return role === 'admin';
}

export async function getRequiredSession() {
  const session = await getSession();
  if (!session?.user) {
    return null;
  }
  return session;
}

/**
 * Require an authenticated admin session. Returns the session if valid,
 * or an appropriate error response (401/403) if not.
 */
export async function requireAdminSession(): Promise<
  { session: NonNullable<Awaited<ReturnType<typeof getRequiredSession>>> } | Response
> {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();
  if (!isAdmin(session.user.role)) return forbiddenResponse();
  return { session };
}

