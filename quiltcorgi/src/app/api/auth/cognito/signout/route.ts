import { clearAuthCookies } from '@/lib/cognito-session';

export async function POST() {
  await clearAuthCookies();
  return Response.json({ success: true });
}
