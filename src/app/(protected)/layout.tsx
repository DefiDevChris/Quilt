import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/cognito-session';
import { ResponsiveShell } from '@/components/layout/ResponsiveShell';


export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  if (process.env.DEV_AUTH_BYPASS !== 'true') {
    const cookieStore = await cookies();
    const idToken = cookieStore.get('qc_id_token')?.value;
    const user = idToken ? await verifySessionToken(idToken) : null;

    if (!user) {
      redirect('/auth/signin');
    }
  }

  return (
    <ResponsiveShell>
      {children}
    </ResponsiveShell>
  );
}
