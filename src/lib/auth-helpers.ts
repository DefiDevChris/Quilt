import { getSession } from '@/lib/cognito-session';
import { unauthorizedResponse } from '@/lib/api-responses';

export async function getRequiredSession() {
  const session = await getSession();
  if (!session?.user) {
    return null;
  }
  return session;
}

export function requireAdmin(role: string | null): Response | true {
  if (!role || role !== 'admin') {
    return new Response('Forbidden', { status: 403 });
  }
  return true;
}
