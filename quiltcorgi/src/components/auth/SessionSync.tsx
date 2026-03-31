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
          const user = {
            id: data.data.user.id,
            name: data.data.user.name ?? '',
            email: data.data.user.email ?? '',
            image: null as string | null,
            role: data.data.user.role ?? 'free',
            privacyMode: 'public' as 'public' | 'private',
          };

          // Fetch profile to get privacyMode
          try {
            const profileRes = await fetch('/api/profile');
            const profileData = await profileRes.json();
            if (profileData.success && profileData.data) {
              user.privacyMode = profileData.data.privacyMode ?? 'public';
              user.image = profileData.data.avatarUrl ?? null;
            }
          } catch {
            // profile fetch failed — default to public
          }

          setUser(user);
        } else {
          setUser(null);
        }
      } catch {
        if (!cancelled) setUser(null);
      }
    }

    fetchSession();
    return () => { cancelled = true; };
  }, [setUser]);

  return <>{children}</>;
}
