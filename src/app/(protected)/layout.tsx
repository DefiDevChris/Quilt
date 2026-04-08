import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/cognito-session';
import { ResponsiveShell } from '@/components/layout/ResponsiveShell';
import { ProtectedPageShell } from '@/components/layout/ProtectedPageShell';

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
    <>
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat opacity-20"
        style={{ backgroundImage: "url('/background.png')" }}
      />
      <ResponsiveShell>
        <ProtectedPageShell>{children}</ProtectedPageShell>
      </ResponsiveShell>
    </>
  );
}
