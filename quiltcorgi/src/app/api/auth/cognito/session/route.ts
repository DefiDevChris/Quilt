import { getSession } from '@/lib/cognito-session';

/** Return current session info (for client-side session sync). */
export async function GET() {
  const session = await getSession();

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
