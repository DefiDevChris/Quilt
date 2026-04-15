'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

export function SessionSync({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    let cancelled = false;

    async function fetchSession() {
      try {
        const res = await fetch('/api/auth/cognito/session');
        const data = await res.json();
        if (cancelled) return;

        if (data.success && data.data?.user) {
          setUser({
            id: data.data.user.id,
            name: data.data.user.name ?? '',
            email: data.data.user.email ?? '',
            image: null,
            role: data.data.user.role ?? 'free',
          });
        } else {
          setUser(null);
        }
      } catch {
        if (!cancelled) setUser(null);
      }
    }

    fetchSession();
    return () => {
      cancelled = true;
    };
  }, [setUser]);

  return <>{children}</>;
}
