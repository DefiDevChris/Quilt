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
    <>
      {/* Background at 20% opacity */}
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/background.png')", opacity: 0.2 }}
      />
      <ResponsiveShell>
        <div className="max-w-5xl mx-auto md:pt-10 md:pb-12 relative z-10 w-full">{children}</div>
      </ResponsiveShell>
    </>
  );
}
