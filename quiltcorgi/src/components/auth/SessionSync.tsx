'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

export function SessionSync({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);

  useEffect(() => {
    if (status === 'loading') {
      setLoading(true);
      return;
    }

    if (session?.user) {
      setUser({
        id: session.user.id,
        name: session.user.name ?? '',
        email: session.user.email ?? '',
        image: session.user.image ?? null,
        role: session.user.role ?? 'free',
      });
    } else {
      setUser(null);
    }
  }, [session, status, setUser, setLoading]);

  return <>{children}</>;
}
