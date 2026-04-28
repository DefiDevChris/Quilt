'use client';

import { redirect } from 'next/navigation';
import { useEffect } from 'react';
import { ResponsiveShell } from '@/components/layout/ResponsiveShell';
import { BrandedPage } from '@/components/layout/BrandedPage';
import { useAuthStore } from '@/stores/authStore';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    if (!isLoading && !user) {
      redirect('/auth/signin');
    }
  }, [isLoading, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)]">
        <ResponsiveShell>
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-pulse text-[var(--color-text-dim)]">Loading...</div>
          </div>
        </ResponsiveShell>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <ResponsiveShell>
        <BrandedPage showMascots mascotCount={1}>
          <div className="max-w-7xl mx-auto px-6 py-8">
            <main className="min-w-0">{children}</main>
          </div>
        </BrandedPage>
      </ResponsiveShell>
    </div>
  );
}
