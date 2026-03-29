import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  // DEV BYPASS — remove before production deploy
  if (process.env.NODE_ENV === 'development') {
    return <>{children}</>;
  }

  const session = await auth();

  if (!session?.user) {
    redirect('/auth/signin?callbackUrl=/dashboard');
  }

  return <>{children}</>;
}
