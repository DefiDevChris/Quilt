import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/cognito-session';
import PublicNav from '@/components/landing/PublicNav';
import Footer from '@/components/landing/Footer';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const idToken = cookieStore.get('qc_id_token')?.value;
  const user = idToken ? await verifySessionToken(idToken) : null;
  
  if (!user) {
    redirect('/auth/signin');
  }

  return (
    <>
      <PublicNav />
      <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
      <Footer />
    </>
  );
}
