import { clearAuthCookies } from '@/lib/cognito-session';
import { getSession } from '@/lib/cognito-session';

export async function POST() {
  const session = await getSession();
  if (!session) {
    return Response.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }

  await clearAuthCookies();
  return Response.json({ success: true });
}
