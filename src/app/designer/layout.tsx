import { redirect } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import { verifySessionToken } from '@/lib/cognito-session';

export default async function DesignerLayout({ children }: { children: React.ReactNode }) {
  if (process.env.DEV_AUTH_BYPASS === 'true') {
    return <>{children}</>;
  }

  const cookieStore = await cookies();
  const idToken = cookieStore.get('qc_id_token')?.value;
  const user = idToken ? await verifySessionToken(idToken) : null;

  if (!user) {
    const headersList = await headers();
    const pathname =
      headersList.get('x-pathname') || headersList.get('x-invoke-path') || '/dashboard';
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`);
  }

  return <>{children}</>;
}
