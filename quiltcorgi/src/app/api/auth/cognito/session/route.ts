import { getSession } from '@/lib/cognito-session';
import { getRequiredSession } from '@/lib/auth-helpers';

/** Return current session info (for client-side session sync). */
export async function GET() {
  // DEV BYPASS — return hardcoded pro session in development
  const session =
    process.env.NODE_ENV === 'development' ? await getRequiredSession() : await getSession();

  if (!session) {
    return Response.json({ success: true, data: null });
  }

  return Response.json({
    success: true,
    data: {
      user: session.user,
    },
  });
}
