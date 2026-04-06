import { redirect } from 'next/navigation';
import { getSession } from '@/lib/cognito-session';
import PublicNav from '@/components/landing/PublicNav';
import Footer from '@/components/landing/Footer';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect('/auth/signin');
  }

  if (session.user.role !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <>
      <PublicNav />
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
      <Footer />
    </>
  );
}
