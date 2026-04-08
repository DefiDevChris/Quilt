import { redirect } from 'next/navigation';
import { getSession } from '@/lib/cognito-session';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect('/auth/signin');
  }

  if (session.user.role !== 'admin') {
    redirect('/dashboard');
  }

  return <>{children}</>;
}
