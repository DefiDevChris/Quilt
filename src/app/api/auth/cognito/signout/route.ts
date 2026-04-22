import { clearAuthCookies, getSession } from '@/lib/cognito-session';
import { cognitoGlobalSignOut } from '@/lib/cognito';

export async function POST() {
  const session = await getSession();
  if (!session) {
    return Response.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }

  // Revoke tokens server-side so stolen tokens can't be reused
  try {
    await cognitoGlobalSignOut(session.accessToken);
  } catch (err) { console.error('[auth/cognito/signout]', err);
    // Best-effort — if Cognito call fails, still clear cookies
  }

  await clearAuthCookies();
  return Response.json({ success: true });
}
