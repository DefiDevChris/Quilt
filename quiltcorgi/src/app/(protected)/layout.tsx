import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import PublicNav from '@/components/landing/PublicNav';
import Footer from '@/components/landing/Footer';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  // DEV BYPASS — remove before production deploy
  if (process.env.NODE_ENV !== 'development') {
    const session = await auth();
    if (!session?.user) {
      redirect('/auth/signin');
    }
  }

  return (
    <>
      <PublicNav />
      <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
      <Footer />
    </>
  );
}
