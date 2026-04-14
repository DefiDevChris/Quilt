'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { MobileBottomNav } from '@/components/mobile/MobileBottomNav';
import { MobileDrawer } from '@/components/mobile/MobileDrawer';
import { UploadSheet } from '@/components/mobile/UploadSheet';
import { useAuthStore } from '@/stores/authStore';

export function MobileShell({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [uploadSheetOpen, setUploadSheetOpen] = useState(false);

  const isAuthenticated = !!user;

  const handleFabPress = useCallback(() => {
    setUploadSheetOpen(true);
  }, []);

  return (
    <div className="min-h-screen bg-default pb-24">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-default px-5 py-2 bg-default">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Menu"
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-default transition-colors"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <line x1="4" y1="7" x2="20" y2="7" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="17" x2="16" y2="17" />
          </svg>
        </button>
        <Link
          href="/dashboard"
          className="text-[16px] leading-[24px] font-bold text-default tracking-wide"
        >
          Quilt Studio
        </Link>
        {isAuthenticated ? (
          <div className="w-10 h-10" />
        ) : (
          <Link href="/auth/signin" className="text-sm font-medium text-primary hover:underline">
            Sign In
          </Link>
        )}
      </header>
      <main className="px-0">{children}</main>
      <MobileBottomNav onFabPress={handleFabPress} />
      <MobileDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
      {isAuthenticated && (
        <UploadSheet isOpen={uploadSheetOpen} onClose={() => setUploadSheetOpen(false)} />
      )}
    </div>
  );
}
