import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/cognito-session';
import PublicNav from '@/components/landing/PublicNav';
import Footer from '@/components/landing/Footer';

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
        className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/background.png')" }}
      />
      <PublicNav />
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
      <Footer />
    </>
  );
}
