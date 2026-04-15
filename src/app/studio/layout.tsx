import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/cognito-session';

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  if (process.env.DEV_AUTH_BYPASS === 'true') {
    return <>{children}</>;
  }

  const cookieStore = await cookies();
  const idToken = cookieStore.get('qc_id_token')?.value;
  const user = idToken ? await verifySessionToken(idToken) : null;

  if (!user) {
    redirect('/design-studio');
  }

  return <>{children}</>;
}
